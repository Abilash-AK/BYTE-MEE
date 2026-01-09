import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCookie, setCookie } from "hono/cookie";
import { MiddlewareHandler } from "hono";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  given_name?: string;
};

const SESSION_COOKIE_NAME = "colearn_session";
const GOOGLE_OAUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

const sessionCookieOptions = (url: string) => ({
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: url.startsWith("https://"),
  maxAge: 60 * 60 * 24 * 60, // 60 days
});

const getRedirectUri = (c: any) =>
  c.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/callback";

const getSessionUser = (c: any): SessionUser | null => {
  const raw = getCookie(c, SESSION_COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { user: SessionUser } }> = async (c, next) => {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);
  await next();
};

const app = new Hono<{ Bindings: Env; Variables: { user: SessionUser } }>();

// Google OAuth: provide redirect URL
app.get("/api/oauth/google/redirect_url", async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: "Missing GOOGLE_CLIENT_ID" }, 500);
  }

  const redirectUri = getRedirectUri(c);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return c.json({ redirectUrl: `${GOOGLE_OAUTH_ENDPOINT}?${params.toString()}` });
});

// Exchange authorization code for session
app.post("/api/auth/google/callback", async (c) => {
  const body = await c.req.json();
  const code = (body.code as string | undefined)?.trim();

  if (!code) {
    return c.json({ error: "Missing authorization code" }, 400);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return c.json({ error: "Missing Google OAuth credentials" }, 500);
  }

  const redirectUri = getRedirectUri(c);

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return c.json({ error: "Failed to exchange code", detail: errText }, 400);
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string | undefined;

  if (!accessToken) {
    return c.json({ error: "No access token returned" }, 400);
  }

  // Fetch user profile
  const profileRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileRes.ok) {
    const errText = await profileRes.text();
    return c.json({ error: "Failed to fetch user info", detail: errText }, 400);
  }

  const profile = await profileRes.json();

  const user: SessionUser = {
    id: profile.sub || profile.email,
    email: profile.email,
    name: profile.name || profile.email,
    picture: profile.picture || null,
    given_name: profile.given_name || profile.name?.split(" ")[0],
  };

  setCookie(c, SESSION_COOKIE_NAME, JSON.stringify(user), sessionCookieOptions(c.req.url));

  return c.json({ user }, 200);
});

// Logout and clear session cookie
app.post("/api/auth/logout", async (c) => {
  setCookie(c, SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(c.req.url),
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get the current user object for the frontend
app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  // Check if user has completed onboarding
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user.id)
    .first();

  return c.json({
    ...user,
    onboarding_completed: profile?.onboarding_completed === 1,
    tech_stack: profile?.tech_stack || null,
  });
});

// Get user profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user.id)
    .first();

  return c.json(profile || { onboarding_completed: 0 });
});

// MCQ answers for validation
const MCQ_CORRECT_ANSWERS: Record<number, string> = {
  1: '510',
  2: '[1] then [1, 1]',
  3: 'true',
  4: '0',
  5: 'Prints [1, 2, 3, 4]',
  6: 'float then int',
  7: 'Compilation Error',
  8: 'object then undefined',
  9: '4',
  10: 'true',
  11: '6 6',
  12: 'undefined',
  13: '3',
  14: '0',
  15: 'Undefined behavior',
};

// Validate MCQ answers
const validateMcqSchema = z.object({
  answers: z.record(z.string()),
  questionIds: z.array(z.number()),
});

app.post(
  "/api/profile/validate-mcq",
  authMiddleware,
  zValidator("json", validateMcqSchema),
  async (c) => {
    const body = c.req.valid("json");
    const { answers, questionIds } = body;

    let correctCount = 0;
    const totalQuestions = questionIds.length;

    // Only check the questions that were presented to the user
    for (const questionId of questionIds) {
      const userAnswer = answers[questionId.toString()];
      const correctAnswer = MCQ_CORRECT_ANSWERS[questionId];
      
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    }

    const requiredCorrect = Math.ceil(totalQuestions * 0.7); // Need 70% correct
    const passed = correctCount >= requiredCorrect;

    return c.json({
      success: passed,
      score: correctCount,
      total: totalQuestions,
      message: passed
        ? `Excellent! You got ${correctCount} out of ${totalQuestions} correct. You're ready to start collaborating!`
        : `You scored ${correctCount} out of ${totalQuestions}. You need at least ${requiredCorrect} correct answers to pass. Review the questions and try again!`,
    });
  }
);

// Test code for onboarding (deprecated - kept for backwards compatibility)
const testCodeSchema = z.object({
  code: z.string().min(1),
  language: z.string().optional(),
});

app.post(
  "/api/profile/test-code",
  authMiddleware,
  zValidator("json", testCodeSchema),
  async (c) => {
    const body = c.req.valid("json");
    const code = body.code;
    const language = body.language || 'javascript';

    try {
      // Test case: sumEvenNumbers([1, 2, 3, 4, 5, 6]) should return 12
      const testCases = [
        { input: [1, 2, 3, 4, 5, 6], expected: 12 },
        { input: [2, 4, 6], expected: 12 },
        { input: [1, 3, 5], expected: 0 },
        { input: [10, 15, 20, 25], expected: 30 },
        { input: [], expected: 0 },
      ];

      let results: any[] = [];

      if (language === 'javascript') {
        // JavaScript evaluation with strict validation
        const wrappedCode = `
          ${code}
          return sumEvenNumbers;
        `;

        let sumEvenNumbers;
        try {
          sumEvenNumbers = Function(wrappedCode)();
        } catch (error) {
          return c.json({
            success: false,
            message: `Syntax error in your code: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }

        // Verify the function exists and is callable
        if (typeof sumEvenNumbers !== 'function') {
          return c.json({
            success: false,
            message: "Your code must define a function named 'sumEvenNumbers' that can be called.",
          });
        }

        // Run all test cases
        results = testCases.map((testCase) => {
          try {
            const result = sumEvenNumbers(testCase.input);
            
            // Strict type checking - result must be a number
            if (typeof result !== 'number') {
              return {
                input: testCase.input,
                expected: testCase.expected,
                actual: result,
                passed: false,
                error: `Expected a number but got ${typeof result}`,
              };
            }
            
            // Check if result matches expected value exactly
            const passed = result === testCase.expected;
            
            return {
              input: testCase.input,
              expected: testCase.expected,
              actual: result,
              passed,
            };
          } catch (err) {
            return {
              input: testCase.input,
              expected: testCase.expected,
              actual: null,
              passed: false,
              error: String(err),
            };
          }
        });
      } else if (language === 'python') {
        // Python: Strict validation
        const hasFunctionDef = code.includes('def sum_even_numbers') || code.includes('def sumEvenNumbers');
        const hasLoop = code.includes('for ') || code.includes('while ');
        const hasModuloCheck = code.includes('% 2') || code.includes('%2');
        const hasSum = code.includes('sum') || code.includes('+=') || code.includes('= ') && code.includes('+');
        const hasReturn = code.includes('return');
        
        // Check for lazy solutions
        const returnsZero = /return\s+0(?!\d)/.test(code);
        const returnsHardcoded = /return\s+1[0-9]/.test(code);
        
        if (returnsZero || returnsHardcoded) {
          return c.json({
            success: false,
            message: "Your code appears to return a hardcoded value instead of calculating the sum. Please implement the actual logic.",
          });
        }
        
        if (!hasFunctionDef) {
          return c.json({
            success: false,
            message: "Python code must define a function named 'sum_even_numbers' or 'sumEvenNumbers'.",
          });
        }

        if (!hasLoop) {
          return c.json({
            success: false,
            message: "Your code must iterate through the array using a loop (for or while).",
          });
        }

        if (!hasModuloCheck) {
          return c.json({
            success: false,
            message: "Your code must check if numbers are even using the modulo operator (% 2).",
          });
        }

        if (!hasSum) {
          return c.json({
            success: false,
            message: "Your code must accumulate a sum of the even numbers.",
          });
        }

        if (!hasReturn) {
          return c.json({
            success: false,
            message: "Your function must return the calculated sum.",
          });
        }

        return c.json({
          success: true,
          message: "✅ Code structure looks correct! Python code validated successfully. Your solution implements the required logic.",
          validated: true,
        });
      } else if (language === 'java') {
        // Java: Strict validation
        const hasClassDef = code.includes('class ') || code.includes('public class');
        const hasMethod = code.includes('sumEvenNumbers') || code.includes('int sumEvenNumbers');
        const hasLoop = code.includes('for ') || code.includes('for(') || code.includes('while ');
        const hasModuloCheck = code.includes('% 2') || code.includes('%2');
        const hasSum = code.includes('sum') || code.includes('+=');
        const hasReturn = code.includes('return');
        
        // Check for lazy solutions
        const returnsZero = /return\s+0\s*;/.test(code);
        const returnsHardcoded = /return\s+1[0-9]/.test(code);
        
        if (returnsZero || returnsHardcoded) {
          return c.json({
            success: false,
            message: "Your code appears to return a hardcoded value instead of calculating the sum. Please implement the actual logic.",
          });
        }
        
        if (!hasClassDef || !hasMethod) {
          return c.json({
            success: false,
            message: "Java code must define a class with a 'sumEvenNumbers' method.",
          });
        }

        if (!hasLoop) {
          return c.json({
            success: false,
            message: "Your code must iterate through the array using a loop (for or while).",
          });
        }

        if (!hasModuloCheck) {
          return c.json({
            success: false,
            message: "Your code must check if numbers are even using the modulo operator (% 2).",
          });
        }

        if (!hasSum) {
          return c.json({
            success: false,
            message: "Your code must accumulate a sum of the even numbers.",
          });
        }

        if (!hasReturn) {
          return c.json({
            success: false,
            message: "Your function must return the calculated sum.",
          });
        }

        return c.json({
          success: true,
          message: "✅ Code structure looks correct! Java code validated successfully. Your solution implements the required logic.",
          validated: true,
        });
      } else if (language === 'cpp') {
        // C++: Strict validation
        const hasFunction = code.includes('sumEvenNumbers') || code.includes('int sumEvenNumbers');
        const hasLoop = code.includes('for ') || code.includes('for(') || code.includes('while ');
        const hasModuloCheck = code.includes('% 2') || code.includes('%2');
        const hasSum = code.includes('sum') || code.includes('+=');
        const hasReturn = code.includes('return');
        
        // Check for lazy solutions
        const returnsZero = /return\s+0\s*;/.test(code);
        const returnsHardcoded = /return\s+1[0-9]/.test(code);
        
        if (returnsZero || returnsHardcoded) {
          return c.json({
            success: false,
            message: "Your code appears to return a hardcoded value instead of calculating the sum. Please implement the actual logic.",
          });
        }
        
        if (!hasFunction) {
          return c.json({
            success: false,
            message: "C++ code must define a 'sumEvenNumbers' function.",
          });
        }

        if (!hasLoop) {
          return c.json({
            success: false,
            message: "Your code must iterate through the array using a loop (for or while).",
          });
        }

        if (!hasModuloCheck) {
          return c.json({
            success: false,
            message: "Your code must check if numbers are even using the modulo operator (% 2).",
          });
        }

        if (!hasSum) {
          return c.json({
            success: false,
            message: "Your code must accumulate a sum of the even numbers.",
          });
        }

        if (!hasReturn) {
          return c.json({
            success: false,
            message: "Your function must return the calculated sum.",
          });
        }

        return c.json({
          success: true,
          message: "✅ Code structure looks correct! C++ code validated successfully. Your solution implements the required logic.",
          validated: true,
        });
      } else if (language === 'go') {
        // Go: Strict validation
        const hasFunction = code.includes('func sumEvenNumbers') || code.includes('func ');
        const hasLoop = code.includes('for ') || code.includes('range');
        const hasModuloCheck = code.includes('% 2') || code.includes('%2');
        const hasSum = code.includes('sum') || code.includes('+=');
        const hasReturn = code.includes('return');
        
        // Check for lazy solutions
        const returnsZero = /return\s+0(?!\d)/.test(code);
        const returnsHardcoded = /return\s+1[0-9]/.test(code);
        
        if (returnsZero || returnsHardcoded) {
          return c.json({
            success: false,
            message: "Your code appears to return a hardcoded value instead of calculating the sum. Please implement the actual logic.",
          });
        }
        
        if (!hasFunction) {
          return c.json({
            success: false,
            message: "Go code must define a 'sumEvenNumbers' function.",
          });
        }

        if (!hasLoop) {
          return c.json({
            success: false,
            message: "Your code must iterate through the array using a loop (for or range).",
          });
        }

        if (!hasModuloCheck) {
          return c.json({
            success: false,
            message: "Your code must check if numbers are even using the modulo operator (% 2).",
          });
        }

        if (!hasSum) {
          return c.json({
            success: false,
            message: "Your code must accumulate a sum of the even numbers.",
          });
        }

        if (!hasReturn) {
          return c.json({
            success: false,
            message: "Your function must return the calculated sum.",
          });
        }

        return c.json({
          success: true,
          message: "✅ Code structure looks correct! Go code validated successfully. Your solution implements the required logic.",
          validated: true,
        });
      } else if (language === 'rust') {
        // Rust: Strict validation
        const hasFunction = code.includes('fn sum_even_numbers') || code.includes('fn ');
        const hasLoop = code.includes('for ') || code.includes('.iter()') || code.includes('.filter');
        const hasModuloCheck = code.includes('% 2') || code.includes('%2');
        const hasSum = code.includes('sum') || code.includes('+=') || code.includes('.sum()');
        
        // Check for lazy solutions
        const returnsZero = /return\s+0(?!\d)/.test(code) || /^\s*0\s*$/.test(code.split('\n').slice(-2)[0]);
        const returnsHardcoded = /return\s+1[0-9]/.test(code) || /^\s*1[0-9]\s*$/.test(code.split('\n').slice(-2)[0]);
        
        if (returnsZero || returnsHardcoded) {
          return c.json({
            success: false,
            message: "Your code appears to return a hardcoded value instead of calculating the sum. Please implement the actual logic.",
          });
        }
        
        if (!hasFunction) {
          return c.json({
            success: false,
            message: "Rust code must define a 'sum_even_numbers' function.",
          });
        }

        if (!hasLoop) {
          return c.json({
            success: false,
            message: "Your code must iterate through the array using a loop (for, iter, or filter).",
          });
        }

        if (!hasModuloCheck) {
          return c.json({
            success: false,
            message: "Your code must check if numbers are even using the modulo operator (% 2).",
          });
        }

        if (!hasSum) {
          return c.json({
            success: false,
            message: "Your code must accumulate a sum of the even numbers.",
          });
        }

        return c.json({
          success: true,
          message: "✅ Code structure looks correct! Rust code validated successfully. Your solution implements the required logic.",
          validated: true,
        });
      }

      // JavaScript execution results
      if (language === 'javascript' && results.length > 0) {
        const allPassed = results.every((r) => r.passed);

        if (allPassed) {
          return c.json({
            success: true,
            message: "✅ All test cases passed! Your function correctly sums even numbers. Great work! 🎉",
            results,
          });
        } else {
          const failedTests = results.filter((r) => !r.passed);
          const failedCount = failedTests.length;
          
          // Show details about the first failed test
          const firstFailed = failedTests[0];
          let detailMessage = `${failedCount} test case${failedCount > 1 ? 's' : ''} failed. `;
          
          if (firstFailed.error) {
            detailMessage += `Error: ${firstFailed.error}`;
          } else {
            detailMessage += `For input [${firstFailed.input}], expected ${firstFailed.expected} but got ${firstFailed.actual}.`;
          }
          
          return c.json({
            success: false,
            message: detailMessage,
            results,
          });
        }
      }

      // Fallback
      return c.json({
        success: false,
        message: "Unable to validate code. Please check your syntax and try again.",
      });

    } catch (error) {
      return c.json({
        success: false,
        message: `Error validating code: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your syntax.`,
      });
    }
  }
);

// Complete onboarding
const completeOnboardingSchema = z.object({
  tech_stack: z.string().min(1),
  coding_task_answer: z.string().min(1),
});

app.post(
  "/api/profile/onboarding",
  authMiddleware,
  zValidator("json", completeOnboardingSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check if profile already exists
    const existingProfile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    if (existingProfile) {
      return c.json({ error: "Onboarding already completed" }, 400);
    }

    const name = user.name || user.email.split('@')[0];
    const email = user.email;

    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, name, email, tech_stack, coding_task_answer, onboarding_completed)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(user.id, name, email, body.tech_stack, body.coding_task_answer)
      .run();

    return c.json({ success: true }, 201);
  }
);

// Update user profile (tech stack)
const updateProfileSchema = z.object({
  tech_stack: z.string().min(1),
});

app.put(
  "/api/profile",
  authMiddleware,
  zValidator("json", updateProfileSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    await c.env.DB.prepare(
      "UPDATE user_profiles SET tech_stack = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    )
      .bind(body.tech_stack, user.id)
      .run();

    const updatedProfile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    return c.json(updatedProfile);
  }
);

// Legacy logout alias
app.get("/api/logout", async (c) => {
  setCookie(c, SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(c.req.url),
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Pod API endpoints

// Get all active pods
app.get("/api/pods", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, 
     (SELECT COUNT(*) FROM pod_members WHERE pod_id = p.id) as member_count
     FROM pods p
     WHERE p.is_active = 1
     ORDER BY p.created_at DESC`
  ).all();

  return c.json(results);
});

// Get user's pods (where they are creator or member)
app.get("/api/pods/mine", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT p.*,
     (SELECT COUNT(*) FROM pod_members WHERE pod_id = p.id) as member_count
     FROM pods p
     LEFT JOIN pod_members pm ON p.id = pm.pod_id
     WHERE p.creator_id = ? OR pm.user_id = ?
     ORDER BY p.created_at DESC`
  )
    .bind(user.id, user.id)
    .all();

  return c.json(results);
});

// Get a single pod with members
app.get("/api/pods/:id", authMiddleware, async (c) => {
  const podId = c.req.param("id");

  const pod = await c.env.DB.prepare("SELECT * FROM pods WHERE id = ?")
    .bind(podId)
    .first();

  if (!pod) {
    return c.json({ error: "Pod not found" }, 404);
  }

  const { results: members } = await c.env.DB.prepare(
    "SELECT * FROM pod_members WHERE pod_id = ? ORDER BY joined_at ASC"
  )
    .bind(podId)
    .all();

  const { results: applications } = await c.env.DB.prepare(
    "SELECT * FROM pod_applications WHERE pod_id = ? AND status = 'pending' ORDER BY created_at ASC"
  )
    .bind(podId)
    .all();

  return c.json({ ...pod, members, applications });
});

// Create a new pod
const createPodSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  skills_needed: z.string(),
  team_size: z.number().min(1).max(20),
  duration: z.string(),
});

app.post(
  "/api/pods",
  authMiddleware,
  zValidator("json", createPodSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    const result = await c.env.DB.prepare(
      `INSERT INTO pods (name, description, creator_id, creator_name, skills_needed, team_size, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.name,
        body.description,
        user.id,
        user.name || user.email,
        body.skills_needed,
        body.team_size,
        body.duration
      )
      .run();

    // Add creator as first member
    await c.env.DB.prepare(
      `INSERT INTO pod_members (pod_id, user_id, user_name, user_email, user_picture)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        result.meta.last_row_id,
        user.id,
        user.name || user.email,
        user.email,
        user.picture || null
      )
      .run();

    const pod = await c.env.DB.prepare("SELECT * FROM pods WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return c.json(pod, 201);
  }
);

// Apply to join a pod
const applyToPodSchema = z.object({
  why_interested: z.string().min(1),
  skills: z.string(),
});

app.post(
  "/api/pods/:id/apply",
  authMiddleware,
  zValidator("json", applyToPodSchema),
  async (c) => {
    const user = c.get("user")!;
    const podId = c.req.param("id");
    const body = c.req.valid("json");

    // Check if pod exists
    const pod = await c.env.DB.prepare("SELECT * FROM pods WHERE id = ?")
      .bind(podId)
      .first();

    if (!pod) {
      return c.json({ error: "Pod not found" }, 404);
    }

    // Check if user is already a member
    const existingMember = await c.env.DB.prepare(
      "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (existingMember) {
      return c.json({ error: "You are already a member of this pod" }, 400);
    }

    // Check if user has already applied
    const existingApplication = await c.env.DB.prepare(
      "SELECT * FROM pod_applications WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (existingApplication) {
      return c.json({ error: "You have already applied to this pod" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO pod_applications (pod_id, user_id, user_name, user_email, user_picture, why_interested, skills)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        podId,
        user.id,
        user.name || user.email,
        user.email,
        user.picture || null,
        body.why_interested,
        body.skills
      )
      .run();

    const application = await c.env.DB.prepare(
      "SELECT * FROM pod_applications WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(application, 201);
  }
);

// Accept application
app.post("/api/pods/:id/applications/:applicationId/accept", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const podId = c.req.param("id");
  const applicationId = c.req.param("applicationId");

  // Check if user is the creator
  const pod = await c.env.DB.prepare(
    "SELECT * FROM pods WHERE id = ? AND creator_id = ?"
  )
    .bind(podId, user.id)
    .first();

  if (!pod) {
    return c.json({ error: "Only the pod creator can accept applications" }, 403);
  }

  const application = await c.env.DB.prepare(
    "SELECT * FROM pod_applications WHERE id = ? AND pod_id = ?"
  )
    .bind(applicationId, podId)
    .first();

  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

  // Add user as member
  await c.env.DB.prepare(
    `INSERT INTO pod_members (pod_id, user_id, user_name, user_email, user_picture)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      podId,
      application.user_id,
      application.user_name,
      application.user_email,
      application.user_picture
    )
    .run();

  // Update application status
  await c.env.DB.prepare(
    "UPDATE pod_applications SET status = 'accepted' WHERE id = ?"
  )
    .bind(applicationId)
    .run();

  return c.json({ success: true });
});

// Reject application
app.post("/api/pods/:id/applications/:applicationId/reject", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const podId = c.req.param("id");
  const applicationId = c.req.param("applicationId");

  // Check if user is the creator
  const pod = await c.env.DB.prepare(
    "SELECT * FROM pods WHERE id = ? AND creator_id = ?"
  )
    .bind(podId, user.id)
    .first();

  if (!pod) {
    return c.json({ error: "Only the pod creator can reject applications" }, 403);
  }

  await c.env.DB.prepare(
    "UPDATE pod_applications SET status = 'rejected' WHERE id = ?"
  )
    .bind(applicationId)
    .run();

  return c.json({ success: true });
});

// Community API endpoints

// Get all communities
app.get("/api/communities", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB.prepare(
    `SELECT c.*,
     CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member,
     (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
     FROM communities c
     LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
     ORDER BY c.name ASC`
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

// Get user's communities
app.get("/api/communities/mine", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB.prepare(
    `SELECT c.*,
     (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
     FROM communities c
     INNER JOIN community_members cm ON c.id = cm.community_id
     WHERE cm.user_id = ?
     ORDER BY c.name ASC`
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

// Get a single community with members
app.get("/api/communities/:id", authMiddleware, async (c) => {
  const communityId = c.req.param("id");
  const user = c.get("user")!;

  const community = await c.env.DB.prepare(
    `SELECT c.*,
     CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member,
     (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
     FROM communities c
     LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
     WHERE c.id = ?`
  )
    .bind(user.id, communityId)
    .first();

  if (!community) {
    return c.json({ error: "Community not found" }, 404);
  }

  const { results: members } = await c.env.DB.prepare(
    "SELECT * FROM community_members WHERE community_id = ? ORDER BY joined_at DESC LIMIT 50"
  )
    .bind(communityId)
    .all();

  return c.json({ ...community, members });
});

// Join a community
app.post("/api/communities/:id/join", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const communityId = c.req.param("id");

  // Check if community exists
  const community = await c.env.DB.prepare(
    "SELECT * FROM communities WHERE id = ?"
  )
    .bind(communityId)
    .first();

  if (!community) {
    return c.json({ error: "Community not found" }, 404);
  }

  // Check if user is already a member
  const existingMember = await c.env.DB.prepare(
    "SELECT * FROM community_members WHERE community_id = ? AND user_id = ?"
  )
    .bind(communityId, user.id)
    .first();

  if (existingMember) {
    return c.json({ error: "You are already a member of this community" }, 400);
  }

  // Add user as member
  await c.env.DB.prepare(
    `INSERT INTO community_members (community_id, user_id, user_name, user_email, user_picture)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      communityId,
      user.id,
      user.name || user.email,
      user.email,
      user.picture || null
    )
    .run();

  return c.json({ success: true });
});

// Leave a community
app.post("/api/communities/:id/leave", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const communityId = c.req.param("id");

  await c.env.DB.prepare(
    "DELETE FROM community_members WHERE community_id = ? AND user_id = ?"
  )
    .bind(communityId, user.id)
    .run();

  return c.json({ success: true });
});

// Get messages for a community
app.get("/api/communities/:id/messages", authMiddleware, async (c) => {
  const communityId = c.req.param("id");
  const user = c.get("user")!;

  // Check if user is a member
  const membership = await c.env.DB.prepare(
    "SELECT * FROM community_members WHERE community_id = ? AND user_id = ?"
  )
    .bind(communityId, user.id)
    .first();

  if (!membership) {
    return c.json({ error: "You must be a member to view messages" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM community_messages WHERE community_id = ? ORDER BY created_at DESC LIMIT 100"
  )
    .bind(communityId)
    .all();

  return c.json(results);
});

// Post a message to a community
const postMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

app.post(
  "/api/communities/:id/messages",
  authMiddleware,
  zValidator("json", postMessageSchema),
  async (c) => {
    const communityId = c.req.param("id");
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      "SELECT * FROM community_members WHERE community_id = ? AND user_id = ?"
    )
      .bind(communityId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: "You must be a member to post messages" }, 403);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO community_messages (community_id, user_id, user_name, user_picture, message)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        communityId,
        user.id,
        user.name || user.email,
        user.picture || null,
        body.message
      )
      .run();

    const message = await c.env.DB.prepare(
      "SELECT * FROM community_messages WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(message, 201);
  }
);

export default app;
