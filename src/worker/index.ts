import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCookie, setCookie } from "hono/cookie";
import { MiddlewareHandler } from "hono";
import { findChallengeById } from "@/shared/codingChallenges";
import type { CodingChallenge } from "@/shared/codingChallenges";

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

// Get user's overall contribution statistics across all pods
app.get("/api/profile/contributions", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get all work files uploaded by this user across all pods
  const files = await c.env.DB.prepare(
    `SELECT 
      ai_contribution_percent, 
      human_contribution_percent 
    FROM pod_work_files 
    WHERE user_id = ?`
  )
    .bind(user.id)
    .all();

  const results = files.results || [];
  const fileCount = results.length;

  if (fileCount === 0) {
    return c.json({
      total_files: 0,
      average_ai_contribution: 0,
      average_human_contribution: 100,
    });
  }

  // Calculate overall statistics
  let totalAi = 0;
  let totalHuman = 0;

  results.forEach((file: { ai_contribution_percent?: number | null; human_contribution_percent?: number | null }) => {
    totalAi += Number(file.ai_contribution_percent) || 0;
    totalHuman += Number(file.human_contribution_percent) || 0;
  });

  const avgAi = Math.round(totalAi / fileCount);
  const avgHuman = Math.round(totalHuman / fileCount);

  return c.json({
    total_files: fileCount,
    average_ai_contribution: avgAi,
    average_human_contribution: avgHuman,
  });
});

// Get another user's contribution statistics (for pod creators viewing applicants)
app.get("/api/users/:userId/contributions", authMiddleware, async (c) => {
  const targetUserId = c.req.param("userId");

  // Get all work files uploaded by the target user across all pods
  const files = await c.env.DB.prepare(
    `SELECT 
      ai_contribution_percent, 
      human_contribution_percent 
    FROM pod_work_files 
    WHERE user_id = ?`
  )
    .bind(targetUserId)
    .all();

  const results = files.results || [];
  const fileCount = results.length;

  if (fileCount === 0) {
    return c.json({
      total_files: 0,
      average_ai_contribution: 0,
      average_human_contribution: 100,
    });
  }

  // Calculate overall statistics
  let totalAi = 0;
  let totalHuman = 0;

  results.forEach((file: { ai_contribution_percent?: number | null; human_contribution_percent?: number | null }) => {
    totalAi += Number(file.ai_contribution_percent) || 0;
    totalHuman += Number(file.human_contribution_percent) || 0;
  });

  const avgAi = Math.round(totalAi / fileCount);
  const avgHuman = Math.round(totalHuman / fileCount);

  return c.json({
    total_files: fileCount,
    average_ai_contribution: avgAi,
    average_human_contribution: avgHuman,
  });
});

// Get another user's profile (for viewing applicant profiles)
app.get("/api/users/:userId/profile", authMiddleware, async (c) => {
  const userId = c.req.param("userId");

  try {
    console.log('Fetching profile for userId:', userId);
    
    // Get user profile from user_profiles table - this is the main source of all profile data
    // Note: There is no 'users' table - user data comes from session cookies
    const profileData = await c.env.DB.prepare(
      "SELECT user_id, name, email, tech_stack, onboarding_completed, created_at, updated_at, coding_task_answer FROM user_profiles WHERE user_id = ?"
    )
      .bind(userId)
      .first();

    if (!profileData) {
      console.log('Profile not found for userId:', userId);
      return c.json({ error: "Profile not found" }, 404);
    }

    console.log('Profile data found for userId:', userId);

    // Safely extract values with proper type handling
    const profileName = (profileData.name as string | null) || null;
    const profileEmail = (profileData.email as string | null) || null;
    const techStack = (profileData.tech_stack as string | null) || null;
    const onboardingCompleted = Number(profileData.onboarding_completed) || 0;
    const createdAt = (profileData.created_at as string | null) || null;
    const updatedAt = (profileData.updated_at as string | null) || null;
    const codingTaskAnswer = (profileData.coding_task_answer as string | null) || null;
    const profileUserId = (profileData.user_id as string) || userId;

    // Return data - all from user_profiles table
    const response = {
      user: {
        id: profileUserId,
        email: profileEmail,
        name: profileName,
        picture: null, // Picture is not stored in user_profiles, would need to get from session or other source
      },
      profile: {
        name: profileName,
        email: profileEmail,
        tech_stack: techStack,
        onboarding_completed: onboardingCompleted,
        created_at: createdAt,
        updated_at: updatedAt,
        coding_task_answer: codingTaskAnswer,
      },
    };

    console.log('Returning response for userId:', userId);
    return c.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Work Environment - Upload file to pod
const uploadWorkFileSchema = z.object({
  file_name: z.string().min(1),
  file_url: z.string().url(),
  file_size: z.number().optional(),
  file_type: z.string().optional(),
  description: z.string().optional(),
  file_content: z.string().optional(), // For text-based files
  ai_contribution_percent: z.number().min(0).max(100).optional(),
  human_contribution_percent: z.number().min(0).max(100).optional(),
});

// Function to analyze file content and determine AI vs Human contribution
const analyzeFileContributions = async (
  apiKey: string,
  fileName: string,
  fileContent: string | null,
  description: string | null,
  fileType: string | null
): Promise<{ ai_contribution_percent: number; human_contribution_percent: number }> => {
  const model = DEFAULT_GROQ_MODEL;
  
  // Handle edge cases first
  if (!fileContent || fileContent.trim().length === 0) {
    // Empty file - cannot determine, default to human (they created it)
    return { ai_contribution_percent: 0, human_contribution_percent: 100 };
  }
  
  // Build prompt for analysis with more context
  let contentToAnalyze = '';
  let contentLength = 0;
  let hasComments = false;
  let hasPersonalStyle = false;
  let hasIterationTraces = false;
  let hasStyleInconsistencies = false;
  
  const trimmedContent = fileContent.trim();
  contentLength = trimmedContent.length;
  
  // For code files, analyze structure
  if (fileType?.includes('javascript') || fileType?.includes('typescript') || 
      fileType?.includes('python') || fileType?.includes('java') ||
      fileName.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|h)$/i)) {
    // Check for comments
    hasComments = /\/\/|\/\*|\*\/|#/.test(trimmedContent);
    // Check for personal style indicators
    hasPersonalStyle = /TODO|FIXME|HACK|NOTE|XXX|XXX|BUG/.test(trimmedContent) ||
                      /console\.(log|error|warn|debug)/.test(trimmedContent) ||
                      /debugger/.test(trimmedContent) ||
                      /print\(/.test(trimmedContent);
    
    // Check for iteration traces
    hasIterationTraces = /\/\/.*old|\/\/.*previous|\/\/.*removed|\/\/.*commented/.test(trimmedContent) ||
                         /\/\*.*old.*\*\//.test(trimmedContent) ||
                         trimmedContent.includes('// TODO') ||
                         trimmedContent.includes('// FIXME');
    
    // Check for style inconsistencies (different indentation, spacing patterns)
    const lines = trimmedContent.split('\n');
    if (lines.length > 10) {
      const indentPatterns = lines.slice(0, 50).map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }).filter(len => len > 0);
      
      if (indentPatterns.length > 0) {
        const uniqueIndents = new Set(indentPatterns);
        hasStyleInconsistencies = uniqueIndents.size > 2; // Multiple indentation styles
      }
    }
  }
  
  // Limit content length to avoid token limits, but keep more context
  const maxLength = 8000;
  if (trimmedContent.length > maxLength) {
    // Take first 60% and last 20% to preserve context
    const firstPart = trimmedContent.substring(0, Math.floor(maxLength * 0.6));
    const lastPart = trimmedContent.substring(trimmedContent.length - Math.floor(maxLength * 0.2));
    contentToAnalyze = `${firstPart}\n\n[... ${trimmedContent.length - maxLength} characters truncated ...]\n\n${lastPart}`;
  } else {
    contentToAnalyze = trimmedContent;
  }
  
  const prompt = `You are an expert code and content analyst. Your task is to objectively analyze the following file and determine the percentage of AI contribution vs Human contribution. Be ACCURATE, BALANCED, and OBJECTIVE - analyze based on evidence, not assumptions.

CRITICAL: You must actually READ and ANALYZE the code objectively. Look for REAL evidence of both AI and Human indicators. Do not favor either side - be neutral and analytical.

FILE INFORMATION:
- File Name: ${fileName}
- File Type: ${fileType || 'unknown'}
- Content Length: ${contentLength} characters
${description ? `- Description: ${description}` : '- No description provided'}
${hasComments ? '✓ Contains comments/documentation' : '✗ No comments found'}
${hasPersonalStyle ? '✓ Contains personal style markers (TODO, console.log, debugger, etc.)' : '✗ No personal style markers'}
${hasIterationTraces ? '✓ Shows signs of iteration/refactoring' : '✗ No iteration traces visible'}
${hasStyleInconsistencies ? '✓ Has style inconsistencies (human trait)' : '✗ Style is consistent'}

FILE CONTENT:
\`\`\`${fileType || 'text'}
${contentToAnalyze}
\`\`\`

ANALYSIS CRITERIA - Analyze carefully:

STRONG AI INDICATORS (increase AI %):
1. **Version History & Iteration Pattern:**
   - Large, complete code blocks (300+ lines) appearing instantly
   - Zero intermediate states or partial solutions
   - No evidence of incremental development
   - No commented-out old code or refactoring traces
   - Sudden appearance of fully-formed, complex logic
   - No mistakes or corrections visible

2. **Code Patterns:**
   - Generic variable names (data, result, temp, item)
   - Perfectly formatted code without inconsistencies
   - Repetitive patterns or boilerplate code
   - Common AI-generated patterns (try-catch blocks, async/await patterns typical of AI)
   - Overly verbose or explanatory code
   - Standard library usage without customization
   - Textbook patterns and over-abstraction

3. **Structure:**
   - Template-like structure
   - Consistent indentation and formatting throughout entire file
   - No personal coding quirks or style variations
   - Generic function/class names
   - Standard design patterns without variation
   - Perfect consistency in a potentially messy codebase context

4. **Comment Quality:**
   - Comments explain WHAT the code does (obvious restatements)
   - Perfect grammar and spelling in comments
   - Generic documentation without project-specific reasoning
   - Comments restate obvious logic
   - No shorthand or personal notes
   - Example: "// This function processes the input and returns the output"

5. **Error Handling Style:**
   - Generic try/catch blocks everywhere
   - Console.log statements instead of recovery logic
   - Uniform, boilerplate error handling
   - No handling of known failure cases specific to the project
   - Generic error messages

6. **Content:**
   - No personal notes or TODOs
   - No debugging code or console statements (or only generic ones)
   - Perfect grammar and spelling (for text files)
   - Generic examples or templates
   - No context-specific shortcuts

7. **Testing Patterns (if tests present):**
   - Happy-path focused tests
   - Shallow coverage
   - Tests don't reflect real bugs or failure history
   - Generic test cases

8. **Style Consistency:**
   - Perfect formatting consistency throughout entire file
   - No style drift or mixing of patterns
   - Consistent approach even in complex files

9. **Context Clues:**
   - Description mentions AI tools (ChatGPT, Copilot, Claude, etc.)
   - Description indicates AI assistance
   - File appears to be generated or templated

STRONG HUMAN INDICATORS (increase Human %):
1. **Version History & Iteration Pattern:**
   - Evidence of incremental development
   - Mistakes visible (commented out, corrected)
   - Partial solutions or work-in-progress code
   - Refactoring traces (old code commented, multiple approaches)
   - Gradual complexity increase
   - Iterative improvements visible

2. **Code Patterns:**
   - Unique variable/function names with personal meaning
   - Inconsistent formatting or personal style
   - Creative problem-solving approaches
   - Custom implementations rather than standard patterns
   - Personal coding quirks or shortcuts
   - Non-standard but functional code structure
   - Context-specific shortcuts

3. **Comments & Documentation:**
   - Comments explain WHY, not just what
   - Personal comments explaining thought process
   - TODO/FIXME/HACK notes with context
   - Shorthand or personal notes
   - Business logic mentioned in comments
   - Project-specific reasoning
   - Example: "// Hack: backend returns null here for legacy users"
   - Comments reflect actual decision-making process

4. **Error Handling Style:**
   - Handles known failure cases specific to the project
   - Inconsistent error handling (human trait)
   - Recovery logic tailored to actual problems
   - Error messages reflect real issues encountered
   - Not just generic try/catch everywhere

5. **Code Quality Indicators:**
   - Console.log statements for debugging (with context)
   - Commented-out code showing evolution
   - Multiple approaches tried (commented alternatives)
   - Personal error handling patterns
   - Custom utility functions
   - Evidence of learning or experimentation

6. **Edge-Case Awareness:**
   - Handles specific edge cases that suggest real experience
   - Code reflects understanding of actual failure modes
   - Tradeoffs visible in implementation choices
   - Not just happy-path solutions

7. **Testing Patterns (if tests present):**
   - Tests reflect bugs that actually happened
   - Specific edge cases tested
   - Example: "it('should handle weird input from legacy API', ...)"
   - Tests show understanding of real-world problems

8. **Style Drift:**
   - Style changes mid-file
   - Mixing of patterns
   - Inconsistent formatting (human trait)
   - Different approaches in different parts
   - Evidence of code written at different times

9. **Content Analysis:**
   - Personal writing style (for text files)
   - Unique ideas or creative solutions
   - Manual work evident in structure
   - Personal annotations or notes
   - Original problem-solving approach
   - Imperfections that show human authorship

10. **Context Clues:**
   - Description mentions manual work or personal effort
   - Description indicates original creation
   - File shows iterative development (multiple versions/approaches)
   - Evidence of understanding and decision-making

ANALYSIS INSTRUCTIONS - READ CAREFULLY:

1. **ACTUALLY READ THE CODE** - Don't make assumptions. Look at what's actually there.

2. **Be OBJECTIVE and NEUTRAL** - Start with no bias. Analyze the evidence for both AI and Human indicators equally. Many human developers write clean code, but AI can also generate clean code. Look for the distinguishing factors.

3. **Look for CONCRETE Evidence**:
   - **Iteration patterns**: Are there commented-out old code? Multiple approaches tried? Refactoring traces?
   - **Comment quality**: Do comments explain WHY (human) or just WHAT (AI)? Are they project-specific?
   - **Style consistency**: Perfect consistency throughout (AI) OR style variations/mixing (human)?
   - **Error handling**: Generic boilerplate (AI) OR project-specific handling of known issues (human)?
   - **Code complexity**: Is it appropriate for the task, or over-engineered (AI tendency)?

4. **Size Matters**:
   - Small files (< 100 lines): Likely human unless it's a perfect template
   - Medium files (100-500 lines): Need careful analysis
   - Large files (500+ lines): Check if it appeared instantly (AI) or shows evolution (human)

5. **Be Realistic and Objective**:
   - Professional developers write clean code - this is NOT an AI indicator by itself
   - Good formatting is NOT an AI indicator by itself
   - Using standard patterns is NOT an AI indicator by itself
   - BUT: If you see MULTIPLE AI indicators together (perfect consistency + generic patterns + no iteration traces + generic comments), that's evidence
   - Similarly, if you see MULTIPLE human indicators (style drift + personal comments + iteration traces + context-specific code), that's evidence
   - Weigh the evidence objectively

6. **Scoring Guidelines** (apply objectively based on evidence):
   - 0-20% AI: Strong human indicators, minimal AI patterns
   - 20-40% AI: Mostly human with AI assistance (like Copilot suggestions)
   - 40-60% AI: Hybrid - balanced mix of AI and human work
   - 60-80% AI: Mostly AI-generated with human modifications
   - 80-100% AI: Strong AI indicators, minimal human input

7. **File Size Consideration**:
   - Very short files (< 50 chars): Likely human-typed, but still analyze for AI patterns
   - Small files (< 200 chars): Consider context - if it's a simple function, could be either
   - Don't automatically assume small = human, but also don't over-penalize
   - Look at the actual patterns, not just size

For hybrid work (AI-assisted):
- If AI generated base but human significantly modified: 30-50% AI, 50-70% Human
- If human wrote base but AI helped optimize: 10-30% AI, 70-90% Human
- If mostly AI with minor human edits: 70-90% AI, 10-30% Human
- If mostly human with AI suggestions: 10-20% AI, 80-90% Human

Respond ONLY with a valid JSON object in this exact format:
{
  "ai_contribution_percent": <number between 0 and 100>,
  "human_contribution_percent": <number between 0 and 100>,
  "reasoning": "<detailed explanation (3-5 sentences) of your analysis. Mention SPECIFIC code patterns, comments, or structures you observed. Explain WHY you assigned these percentages based on actual evidence in the code, not assumptions.>",
  "confidence": <number between 0 and 100 indicating how confident you are in this analysis>
}

CRITICAL REMINDERS:
- The two percentages MUST add up to exactly 100
- Be PRECISE, ANALYTICAL, and OBJECTIVE - cite specific evidence
- Don't assume clean code = AI code, but also don't assume clean code = human code
- Analyze the actual patterns and indicators present
- Weigh evidence for BOTH AI and Human indicators equally
- If you see strong AI indicators, assign higher AI %. If you see strong human indicators, assign higher human %
- Be neutral - let the evidence guide your assessment`;

  try {
    const rawText = await callGroq(apiKey, prompt, model);
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = parseGroqJson(rawText);
    }

    if (result && typeof result === 'object') {
      let aiPercent = Math.round(Number(result.ai_contribution_percent) || 0);
      let humanPercent = Math.round(Number(result.human_contribution_percent) || 100);
      
      // Ensure they add up to 100
      if (aiPercent + humanPercent !== 100) {
        const total = aiPercent + humanPercent;
        if (total > 0) {
          aiPercent = Math.round((aiPercent / total) * 100);
          humanPercent = 100 - aiPercent;
        } else {
          aiPercent = 0;
          humanPercent = 100;
        }
      }
      
      // Clamp values
      aiPercent = Math.max(0, Math.min(100, aiPercent));
      humanPercent = Math.max(0, Math.min(100, humanPercent));
      
      // Only adjust for truly empty or minimal content
      // For actual code, trust the AI analysis
      if (contentLength < 20) {
        // Very minimal content - likely human created
        console.warn('Minimal content detected - defaulting to human');
        aiPercent = 0;
        humanPercent = 100;
      }
      
      console.log('AI Analysis Result:', {
        fileName,
        contentLength,
        aiPercent,
        humanPercent,
        hasComments,
        hasPersonalStyle,
        hasIterationTraces,
        hasStyleInconsistencies,
        reasoning: result.reasoning,
        confidence: result.confidence,
      });
      
      return { ai_contribution_percent: aiPercent, human_contribution_percent: humanPercent };
    }
  } catch (error) {
    console.error('Error analyzing file contributions:', error);
  }
  
  // Default fallback if analysis fails
  return { ai_contribution_percent: 0, human_contribution_percent: 100 };
};

app.post(
  "/api/pods/:id/work-files",
  authMiddleware,
  zValidator("json", uploadWorkFileSchema),
  async (c) => {
    const podId = c.req.param("id");
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: "Only pod members can upload files" }, 403);
    }

    // Analyze file content to determine contributions if not provided
    let aiPercent = body.ai_contribution_percent;
    let humanPercent = body.human_contribution_percent;
    
    if (aiPercent === undefined || humanPercent === undefined) {
      // Use AI to analyze the file
      const apiKey = c.env.GROQ_API_KEY;
      if (apiKey) {
        try {
          const analysis = await analyzeFileContributions(
            apiKey,
            body.file_name,
            body.file_content || null,
            body.description || null,
            body.file_type || null
          );
          aiPercent = analysis.ai_contribution_percent;
          humanPercent = analysis.human_contribution_percent;
        } catch (error) {
          console.error('Error analyzing file contributions:', error);
          // Fallback to default if analysis fails
          aiPercent = 0;
          humanPercent = 100;
        }
      } else {
        // No API key, use defaults
        aiPercent = 0;
        humanPercent = 100;
      }
    } else {
      // Ensure contributions add up to 100
      const total = aiPercent + humanPercent;
      if (total !== 100) {
        // Normalize to 100%
        const normalizedAi = Math.round((aiPercent / total) * 100);
        const normalizedHuman = 100 - normalizedAi;
        aiPercent = normalizedAi;
        humanPercent = normalizedHuman;
      }
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO pod_work_files (
        pod_id, user_id, user_name, file_name, file_url, file_size, file_type, 
        description, ai_contribution_percent, human_contribution_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        podId,
        user.id,
        user.name || user.email,
        body.file_name,
        body.file_url,
        body.file_size || null,
        body.file_type || null,
        body.description || null,
        aiPercent,
        humanPercent
      )
      .run();

    const file = await c.env.DB.prepare(
      "SELECT * FROM pod_work_files WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(file, 201);
  }
);

// Get work files for a pod
app.get("/api/pods/:id/work-files", authMiddleware, async (c) => {
  const podId = c.req.param("id");
  const user = c.get("user")!;

  // Check if user is a member
  const membership = await c.env.DB.prepare(
    "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
  )
    .bind(podId, user.id)
    .first();

  if (!membership) {
    return c.json({ error: "Only pod members can view work files" }, 403);
  }

  const files = await c.env.DB.prepare(
    "SELECT * FROM pod_work_files WHERE pod_id = ? ORDER BY created_at DESC"
  )
    .bind(podId)
    .all();

  return c.json({ files: files.results || [] });
});

// Update work file
const updateWorkFileSchema = z.object({
  file_name: z.string().min(1).optional(),
  file_url: z.string().url().optional(),
  file_size: z.number().optional(),
  file_type: z.string().optional(),
  description: z.string().optional(),
  file_content: z.string().optional(),
});

app.put(
  "/api/pods/:id/work-files/:fileId",
  authMiddleware,
  zValidator("json", updateWorkFileSchema),
  async (c) => {
    const podId = c.req.param("id");
    const fileId = parseInt(c.req.param("fileId"));
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: "Only pod members can update files" }, 403);
    }

    // Check if file exists and user owns it or is creator
    const file = await c.env.DB.prepare(
      "SELECT * FROM pod_work_files WHERE id = ? AND pod_id = ?"
    )
      .bind(fileId, podId)
      .first();

    if (!file) {
      return c.json({ error: "File not found" }, 404);
    }

    // Check if user is the file owner or pod creator
    const pod = await c.env.DB.prepare(
      "SELECT creator_id FROM pods WHERE id = ?"
    )
      .bind(podId)
      .first();

    if (file.user_id !== user.id && pod?.creator_id !== user.id) {
      return c.json({ error: "You can only edit your own files or be the pod creator" }, 403);
    }

    // If file_content is provided, re-analyze contributions
    let aiPercent = file.ai_contribution_percent;
    let humanPercent = file.human_contribution_percent;

    if (body.file_content !== undefined) {
      const apiKey = c.env.GROQ_API_KEY;
      if (apiKey) {
        try {
          const analysis = await analyzeFileContributions(
            apiKey,
            body.file_name || file.file_name,
            body.file_content || null,
            body.description || file.description || null,
            body.file_type || file.file_type || null
          );
          aiPercent = analysis.ai_contribution_percent;
          humanPercent = analysis.human_contribution_percent;
        } catch (error) {
          console.error('Error re-analyzing file contributions:', error);
          // Keep existing percentages if re-analysis fails
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.file_name !== undefined) {
      updates.push("file_name = ?");
      values.push(body.file_name);
    }
    if (body.file_url !== undefined) {
      updates.push("file_url = ?");
      values.push(body.file_url);
    }
    if (body.file_size !== undefined) {
      updates.push("file_size = ?");
      values.push(body.file_size);
    }
    if (body.file_type !== undefined) {
      updates.push("file_type = ?");
      values.push(body.file_type);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(body.description);
    }
    if (aiPercent !== undefined) {
      updates.push("ai_contribution_percent = ?");
      values.push(aiPercent);
    }
    if (humanPercent !== undefined) {
      updates.push("human_contribution_percent = ?");
      values.push(humanPercent);
    }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(fileId, podId);

    await c.env.DB.prepare(
      `UPDATE pod_work_files SET ${updates.join(", ")} WHERE id = ? AND pod_id = ?`
    )
      .bind(...values)
      .run();

    const updatedFile = await c.env.DB.prepare(
      "SELECT * FROM pod_work_files WHERE id = ?"
    )
      .bind(fileId)
      .first();

    return c.json(updatedFile);
  }
);

// Delete work file
app.delete(
  "/api/pods/:id/work-files/:fileId",
  authMiddleware,
  async (c) => {
    const podId = c.req.param("id");
    const fileId = parseInt(c.req.param("fileId"));
    const user = c.get("user")!;

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: "Only pod members can delete files" }, 403);
    }

    // Check if file exists
    const file = await c.env.DB.prepare(
      "SELECT * FROM pod_work_files WHERE id = ? AND pod_id = ?"
    )
      .bind(fileId, podId)
      .first();

    if (!file) {
      return c.json({ error: "File not found" }, 404);
    }

    // Check if user is the file owner or pod creator
    const pod = await c.env.DB.prepare(
      "SELECT creator_id FROM pods WHERE id = ?"
    )
      .bind(podId)
      .first();

    if (file.user_id !== user.id && pod?.creator_id !== user.id) {
      return c.json({ error: "You can only delete your own files or be the pod creator" }, 403);
    }

    await c.env.DB.prepare(
      "DELETE FROM pod_work_files WHERE id = ? AND pod_id = ?"
    )
      .bind(fileId, podId)
      .run();

    return c.json({ success: true });
  }
);

// Get contribution statistics for a pod
app.get("/api/pods/:id/contributions", authMiddleware, async (c) => {
  const podId = c.req.param("id");
  const user = c.get("user")!;

  // Check if user is a member
  const membership = await c.env.DB.prepare(
    "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
  )
    .bind(podId, user.id)
    .first();

  if (!membership) {
    return c.json({ error: "Only pod members can view contributions" }, 403);
  }

  // Get all files with user information
  // Note: pod_work_files doesn't have user_picture, so we'll set it to null
  const files = await c.env.DB.prepare(
    `SELECT 
      user_id, 
      user_name, 
      ai_contribution_percent, 
      human_contribution_percent 
    FROM pod_work_files 
    WHERE pod_id = ?`
  )
    .bind(podId)
    .all();

  const results = files.results || [];
  const fileCount = results.length;

  // Calculate overall statistics
  let totalAi = 0;
  let totalHuman = 0;

  results.forEach((file: { ai_contribution_percent?: number | null; human_contribution_percent?: number | null }) => {
    totalAi += Number(file.ai_contribution_percent) || 0;
    totalHuman += Number(file.human_contribution_percent) || 0;
  });

  const avgAi = fileCount > 0 ? Math.round(totalAi / fileCount) : 0;
  const avgHuman = fileCount > 0 ? Math.round(totalHuman / fileCount) : 100;

  // Calculate per-user statistics
  const userStatsMap = new Map<string, {
    user_id: string;
    user_name: string;
    user_picture: string | null;
    total_files: number;
    total_ai: number;
    total_human: number;
    average_ai: number;
    average_human: number;
  }>();

  results.forEach((file: { 
    user_id?: string; 
    user_name?: string; 
    ai_contribution_percent?: number | null; 
    human_contribution_percent?: number | null;
  }) => {
    const userId = file.user_id || 'unknown';
    const userName = file.user_name || 'Unknown';
    // user_picture is not stored in pod_work_files, will be null
    const userPicture = null;
    const aiPercent = Number(file.ai_contribution_percent) || 0;
    const humanPercent = Number(file.human_contribution_percent) || 0;

    if (!userStatsMap.has(userId)) {
      userStatsMap.set(userId, {
        user_id: userId,
        user_name: userName,
        user_picture: userPicture,
        total_files: 0,
        total_ai: 0,
        total_human: 0,
        average_ai: 0,
        average_human: 0,
      });
    }

    const userStats = userStatsMap.get(userId)!;
    userStats.total_files += 1;
    userStats.total_ai += aiPercent;
    userStats.total_human += humanPercent;
  });

  // Calculate averages for each user
  const perUserStats = Array.from(userStatsMap.values()).map(stats => ({
    ...stats,
    average_ai: stats.total_files > 0 ? Math.round(stats.total_ai / stats.total_files) : 0,
    average_human: stats.total_files > 0 ? Math.round(stats.total_human / stats.total_files) : 100,
  }));

  // Sort by total files (descending)
  perUserStats.sort((a, b) => b.total_files - a.total_files);

  return c.json({
    total_files: fileCount,
    average_ai_contribution: avgAi,
    average_human_contribution: avgHuman,
    total_ai_contribution: totalAi,
    total_human_contribution: totalHuman,
    per_user: perUserStats,
  });
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

// Verify certificate
const verifyCertificateSchema = z.object({
  image: z.string().min(1).optional(),
  textDescription: z.string().optional(),
  filename: z.string().optional(),
  tech_stack: z.array(z.string()).optional(),
});

app.post(
  "/api/profile/verify-certificate",
  authMiddleware,
  zValidator("json", verifyCertificateSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");
    
    // Get user's selected tech stack from request or profile
    let selectedTech: string[] = [];
    if (body.tech_stack && Array.isArray(body.tech_stack)) {
      selectedTech = body.tech_stack;
    } else {
      const profile = await c.env.DB.prepare(
        "SELECT tech_stack FROM user_profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first();
      
      if (profile?.tech_stack) {
        selectedTech = (profile.tech_stack as string).split(', ').filter(Boolean);
      }
    }

    if (selectedTech.length === 0) {
      return c.json({ error: "No tech stack provided. Please select technologies first." }, 400);
    }

    const apiKey = c.env.GROQ_API_KEY;
    const model = c.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    if (!apiKey) {
      return c.json({ error: "Groq API key missing. Ask an admin to configure GROQ_API_KEY." }, 500);
    }

    // Check if we have image
    if (!body.image) {
      return c.json({
        success: false,
        message: "Please provide a certificate image to verify.",
      }, 400);
    }

    try {
      const prompt = buildCertificatePrompt(selectedTech);
      
      let rawText: string;
      if (body.image) {
        // Use Groq vision model to analyze the image
        try {
          rawText = await callGroqWithImage(apiKey, prompt, body.image);
        } catch (error) {
          console.error('Certificate verification error:', error);
          const errorMessage = error instanceof Error ? error.message : "Failed to analyze certificate image. Please ensure the image is clear and try again.";
          return c.json({
            success: false,
            message: errorMessage,
            error: errorMessage, // Also include in error field for frontend
          }, 400);
        }
      } else if (body.textDescription) {
        // Use text description directly as fallback
        rawText = await callGroq(apiKey, prompt, model);
      } else {
        return c.json({
          success: false,
          message: "Please provide a certificate image to verify.",
        }, 400);
      }
      
      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        // If JSON parsing fails, try to extract JSON from markdown
        result = parseGroqJson(rawText);
      }

      if (!result || typeof result !== 'object') {
        return c.json({
          success: false,
          message: "Could not analyze certificate. Please provide a text description of the certificate content if image analysis is not available.",
        });
      }

      if (result.isValid && result.skills && Array.isArray(result.skills) && result.skills.length > 0) {
        return c.json({
          success: true,
          message: `Certificate verified! Detected skills: ${result.skills.join(', ')}`,
          skills: result.skills,
          certificateName: result.certificateName || 'Unknown',
          issuingOrganization: result.issuingOrganization || 'Unknown',
        });
      } else {
        return c.json({
          success: false,
          message: result.message || "Certificate could not be verified. Please ensure the certificate clearly shows the skills or provide a text description.",
        });
      }
    } catch (error) {
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Certificate verification failed. Please try providing a text description of the certificate content.",
        },
        500
      );
    }
  }
);

// Complete onboarding
const completeOnboardingSchema = z.object({
  tech_stack: z.string().min(1),
  coding_task_answer: z.string().optional(),
  certificate_verified: z.boolean().optional(),
  certificate_skills: z.array(z.string()).optional(),
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

    // Validate that either quiz or certificate verification is provided
    if (!body.coding_task_answer && !body.certificate_verified) {
      return c.json({ error: "Either quiz answers or certificate verification is required" }, 400);
    }

    const name = user.name || user.email.split('@')[0];
    const email = user.email;

    // Store verification method - if certificate_verified is true, store that, otherwise store quiz answers
    const verificationData = body.certificate_verified 
      ? JSON.stringify({ type: 'certificate', skills: body.certificate_skills || [] })
      : body.coding_task_answer;

    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, name, email, tech_stack, coding_task_answer, onboarding_completed)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(user.id, name, email, body.tech_stack, verificationData)
      .run();

    return c.json({ success: true }, 201);
  }
);

// Update user profile (tech stack)
const updateProfileSchema = z.object({
  tech_stack: z.string().min(1),
  coding_task_answer: z.string().optional(),
  certificate_verified: z.boolean().optional(),
  certificate_skills: z.array(z.string()).optional(),
});

app.put(
  "/api/profile",
  authMiddleware,
  zValidator("json", updateProfileSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Get current profile to check for new skills
    const currentProfile = await c.env.DB.prepare(
      "SELECT tech_stack, coding_task_answer FROM user_profiles WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    if (!currentProfile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const currentTech = ((currentProfile.tech_stack as string) || '').split(', ').filter(Boolean);
    const newTech = body.tech_stack.split(', ').filter(Boolean);
    const currentSet = new Set(currentTech);
    const newSkills = newTech.filter(tech => !currentSet.has(tech));

    // If new skills are added, require verification
    if (newSkills.length > 0 && !body.coding_task_answer && !body.certificate_verified) {
      return c.json({ 
        error: "Verification required. Please complete the quiz or upload a certificate for new skills before updating your profile." 
      }, 400);
    }

    // Update profile - store verification data
    let verificationData = currentProfile.coding_task_answer as string || null;
    
    if (newSkills.length > 0) {
      if (body.certificate_verified) {
        // Store certificate verification
        verificationData = JSON.stringify({ 
          type: 'certificate', 
          skills: body.certificate_skills || [],
          verifiedAt: new Date().toISOString()
        });
      } else if (body.coding_task_answer) {
        // Store quiz answers
        verificationData = body.coding_task_answer;
      }
    }
    
    await c.env.DB.prepare(
      "UPDATE user_profiles SET tech_stack = ?, coding_task_answer = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    )
      .bind(
        body.tech_stack,
        verificationData,
        user.id
      )
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
  const user = c.get("user")!;
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, 
     (SELECT COUNT(*) FROM pod_members WHERE pod_id = p.id) as member_count
     FROM pods p
     WHERE p.is_active = 1
     ORDER BY p.created_at DESC`
  ).all();

  // Get user's location and tech stack for matchmaking
  // Get from user_profiles for tech_stack
  const userProfile = await c.env.DB.prepare(
    "SELECT tech_stack FROM user_profiles WHERE user_id = ?"
  )
    .bind(user.id)
    .first<{ tech_stack?: string | null } | undefined>();

  return c.json({
    pods: results,
    userLocation: {
      city: null, // Users don't have city stored yet - can be added later
      location_lat: null, // Users don't have location stored yet - can be added later
      location_lng: null, // Users don't have location stored yet - can be added later
      tech_stack: userProfile?.tech_stack || null,
    },
  });
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

  // Get applications with user profile data
  const { results: applications } = await c.env.DB.prepare(
    `SELECT pa.*, up.tech_stack as user_tech_stack
     FROM pod_applications pa
     LEFT JOIN user_profiles up ON pa.user_id = up.user_id
     WHERE pa.pod_id = ? AND pa.status = 'pending'
     ORDER BY pa.created_at ASC`
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
  deadline: z.string().min(1),
  location_name: z.string().min(1),
  location_lat: z.number().nullable(),
  location_lng: z.number().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
});

app.post(
  "/api/pods",
  authMiddleware,
  zValidator("json", createPodSchema),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    const result = await c.env.DB.prepare(
      `INSERT INTO pods (name, description, creator_id, creator_name, skills_needed, team_size, duration, deadline, location_name, city, district, location_lat, location_lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.name,
        body.description,
        user.id,
        user.name || user.email,
        body.skills_needed,
        body.team_size,
        body.duration,
        body.deadline,
        body.location_name,
        body.city || null,
        body.district || null,
        body.location_lat,
        body.location_lng
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
  skills: z.string().optional(),
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

    // Get user's skills from profile if not provided
    let userSkills = body.skills;
    if (!userSkills) {
      const profile = await c.env.DB.prepare(
        "SELECT tech_stack FROM user_profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ tech_stack?: string | null } | undefined>();
      
      userSkills = profile?.tech_stack || '';
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
        userSkills
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

// Pod message schema
const podMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  attachment_type: z.enum(['file', 'link']).optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
  attachment_size: z.number().optional(),
});

// Get messages for a pod
app.get("/api/pods/:id/messages", authMiddleware, async (c) => {
  const podId = c.req.param("id");
  const user = c.get("user")!;

  // Check if user is a member
  const membership = await c.env.DB.prepare(
    "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
  )
    .bind(podId, user.id)
    .first();

  if (!membership) {
    return c.json({ error: "You must be a member to view messages" }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM pod_messages WHERE pod_id = ? ORDER BY created_at DESC LIMIT 100"
    )
      .bind(podId)
      .all();

    return c.json(results);
  } catch (error) {
    console.error("Error fetching pod messages:", error);
    return c.json(
      { 
        error: error instanceof Error 
          ? `Database error: ${error.message}. Make sure migration 13 has been run.` 
          : "Failed to fetch messages. Please check if pod_messages table exists." 
      }, 
      500
    );
  }
});

// Post a message to a pod
app.post(
  "/api/pods/:id/messages",
  authMiddleware,
  zValidator("json", podMessageSchema),
  async (c) => {
    const podId = c.req.param("id");
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      "SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ?"
    )
      .bind(podId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: "You must be a member to post messages" }, 403);
    }

    try {
    const result = await c.env.DB.prepare(
      `INSERT INTO pod_messages (pod_id, user_id, user_name, user_picture, message, attachment_type, attachment_url, attachment_name, attachment_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        podId,
        user.id,
        user.name || user.email,
        user.picture || null,
        body.message,
        body.attachment_type || null,
        body.attachment_url || null,
        body.attachment_name || null,
        body.attachment_size || null
      )
      .run();

      const message = await c.env.DB.prepare(
        "SELECT * FROM pod_messages WHERE id = ?"
      )
        .bind(result.meta.last_row_id)
        .first();

      return c.json(message, 201);
    } catch (error) {
      console.error("Error inserting pod message:", error);
      return c.json(
        { 
          error: error instanceof Error 
            ? `Database error: ${error.message}. Make sure migration 13 has been run.` 
            : "Failed to save message. Please check if pod_messages table exists." 
        }, 
        500
      );
    }
  }
);

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
  attachment_type: z.enum(['file', 'link']).optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
  attachment_size: z.number().optional(),
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
      `INSERT INTO community_messages (community_id, user_id, user_name, user_picture, message, attachment_type, attachment_url, attachment_name, attachment_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        communityId,
        user.id,
        user.name || user.email,
        user.picture || null,
        body.message,
        body.attachment_type || null,
        body.attachment_url || null,
        body.attachment_name || null,
        body.attachment_size || null
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

// Dashboard API endpoints

// Get dashboard stats (challenges completed, coding buddies, streak)
app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get challenges completed count
  const challengesResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM challenge_completions WHERE user_id = ?"
  )
    .bind(user.id)
    .first();

  const challengesCompleted = challengesResult?.count || 0;

  // Get coding buddies count (unique users the current user has worked with in pods)
  const buddiesResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT pm2.user_id) as count
     FROM pod_members pm1
     INNER JOIN pod_members pm2 ON pm1.pod_id = pm2.pod_id
     WHERE pm1.user_id = ? AND pm2.user_id != ?`
  )
    .bind(user.id, user.id)
    .first();

  const codingBuddies = buddiesResult?.count || 0;

  // Calculate streak: count consecutive days from today backwards
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const hasCompletion = await c.env.DB.prepare(
      `SELECT 1 FROM challenge_completions 
       WHERE user_id = ? AND DATE(completed_at) = ? 
       LIMIT 1`
    )
      .bind(user.id, dateStr)
      .first();
    
    if (hasCompletion) {
      streak++;
    } else {
      break;
    }
  }

  return c.json({
    challengesCompleted,
    codingBuddies,
    streakDays: streak,
  });
});

// Get daily pod based on user skills
app.get("/api/dashboard/daily-pod", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get user's tech stack
  const profile = await c.env.DB.prepare(
    "SELECT tech_stack FROM user_profiles WHERE user_id = ?"
  )
    .bind(user.id)
    .first();

  const techStack = profile?.tech_stack || "";
  const skills = techStack.split(",").map((s: string) => s.trim()).filter(Boolean);

  // Find a pod that matches user's skills or get a random active pod
  let pod;
  if (skills.length > 0) {
    // Build query with OR conditions for each skill
    const skillConditions = skills.map(() => "skills_needed LIKE ?").join(" OR ");
    const skillParams = skills.map((skill: string) => `%${skill}%`);
    
    pod = await c.env.DB.prepare(
      `SELECT * FROM pods 
       WHERE is_active = 1 
       AND (${skillConditions})
       AND (deadline IS NULL OR deadline > datetime('now'))
       ORDER BY created_at DESC
       LIMIT 1`
    )
      .bind(...skillParams)
      .first();
  }

  // If no matching pod, get any active pod
  if (!pod) {
    pod = await c.env.DB.prepare(
      `SELECT * FROM pods 
       WHERE is_active = 1 
       AND (deadline IS NULL OR deadline > datetime('now'))
       ORDER BY created_at DESC
       LIMIT 1`
    )
      .first();
  }

  if (!pod) {
    return c.json({ 
      hasPod: false,
      message: "No active pods available at the moment. Create one to get started!" 
    });
  }

  // Check if user is already a member
  const isMember = await c.env.DB.prepare(
    "SELECT 1 FROM pod_members WHERE pod_id = ? AND user_id = ?"
  )
    .bind(pod.id, user.id)
    .first();

  // Calculate time remaining until deadline
  let hoursRemaining = 24;
  let minutesRemaining = 0;
  if (pod.deadline) {
    const deadline = new Date(pod.deadline);
    const now = new Date();
    const timeRemaining = deadline.getTime() - now.getTime();
    hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
    minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
  }

  return c.json({
    hasPod: true,
    pod: {
      ...pod,
      isMember: !!isMember,
      hoursRemaining,
      minutesRemaining,
      timeRemaining: `${hoursRemaining}:${minutesRemaining.toString().padStart(2, '0')}`,
    },
  });
});

// AI Coding Challenges
// Using Groq API (OpenAI-compatible, free tier with high limits)
// Can be overridden with GROQ_MODEL env var
// Popular models: llama-3.3-70b-versatile, mixtral-8x7b-32768, llama-3.1-8b-instant
// Note: llama-3.1-70b-versatile has been decommissioned
// Using llama-3.1-8b-instant as default (fast and reliable)
// Alternative: llama-3.3-70b-versatile, mixtral-8x7b-32768
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_API_BASE = "https://api.groq.com/openai/v1";

const extractGroqText = (payload: Record<string, any>) => {
  const choices = payload?.choices;
  if (!choices?.length) {
    return "";
  }

  return choices[0]?.message?.content?.trim() || "";
};

const stripJsonFence = (value: string) =>
  value.replace(/```json/gi, "").replace(/```/g, "").trim();

const parseGroqJson = (text: string) => {
  try {
    return JSON.parse(stripJsonFence(text));
  } catch {
    return null;
  }
};

const buildEvaluationPrompt = (challenge: CodingChallenge, code: string, language: string) => {
  const criteria = challenge.acceptanceCriteria.map((item) => `- ${item}`).join('\n');
  const tests = challenge.testCases
    .map((test, index) => `${index + 1}. ${test.description} | input: ${test.input} | expected: ${test.expected}`)
    .join('\n');

  return `You are an expert code reviewer helping a learner practice ${challenge.skill}.
Challenge title: ${challenge.title}
Prompt: ${challenge.prompt}
Acceptance criteria:\n${criteria}
Representative tests:\n${tests}

Learner submission (language: ${language}):\n\n\`\`\`${language}\n${code}\n\`\`\`

Respond ONLY with strict JSON following this shape:
{
  "verdict": string, // short headline verdict
  "score": number, // 0-100, reward clarity + rubric coverage
  "feedback": string, // actionable bullet-style advice in plain text
  "passedTests": string[], // mention which sample scenarios look correct
  "failedTests": string[] // mention potential failures or missing coverage
}

If the code is unsafe or empty, explain why in feedback and set score to 0.`;
};

const buildAssistPrompt = (challenge: CodingChallenge, code: string) => {
  return `You are a friendly AI pair-programming mentor.
The learner is practicing ${challenge.skill}.
Challenge summary: ${challenge.summary}
Prompt: ${challenge.prompt}
Acceptance criteria: ${challenge.acceptanceCriteria.join(' | ')}

Current draft (may be incomplete):\n\n${code || '[no code provided yet]'}

Provide step-by-step reasoning and highlight the next actionable improvement.
Offer hints or annotated pseudocode but avoid dumping the entire final solution unless absolutely necessary.
Respond in concise markdown paragraphs.`;
};

const callGroq = async (apiKey: string, prompt: string, model = DEFAULT_GROQ_MODEL, attempt = 1) => {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    // Handle rate limiting (429) with retry
    if (response.status === 429 && attempt < 3) {
      const retryAfter = attempt * 2; // Exponential backoff: 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return callGroq(apiKey, prompt, model, attempt + 1);
    }
    
    // Handle service unavailable (503) with retry
    if (response.status === 503 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      return callGroq(apiKey, prompt, model, attempt + 1);
    }

    const detail = await response.text();
    let errorMessage = `Groq request failed: ${detail}`;
    
    // Parse and provide user-friendly error for rate limits
    try {
      const errorJson = JSON.parse(detail);
      if (errorJson.error?.code === 429 || errorJson.error?.status === 429) {
        errorMessage = `API quota exceeded. Please try again later or upgrade your plan. Details: ${errorJson.error.message || 'Rate limit exceeded'}`;
      }
    } catch {
      // If parsing fails, use the original error message
    }
    
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  const text = extractGroqText(payload);

  if (!text) {
    throw new Error("Groq returned an empty response");
  }

  return text;
};

// Note: Groq API doesn't support image inputs in the same way as Gemini
// For certificate verification, we'll use text-only analysis
// Groq vision model for image analysis
// Try llama-3.2-90b-vision-preview first, fallback to meta-llama/llama-4-scout-17b-16e-instruct
const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview";
const GROQ_VISION_MODEL_FALLBACK = "meta-llama/llama-4-scout-17b-16e-instruct";

const callGroqWithImage = async (apiKey: string, prompt: string, imageBase64: string, attempt = 1, useFallback = false) => {
  // Use Groq's vision-capable model for image analysis
  const modelToUse = useFallback ? GROQ_VISION_MODEL_FALLBACK : GROQ_VISION_MODEL;
  
  // Detect image format from base64 or default to jpeg
  // Try to determine format, but Groq accepts both jpeg and png
  const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    let errorMessage = `Groq vision request failed: ${detail}`;
    
    // Parse and provide user-friendly error
    try {
      const errorJson = JSON.parse(detail);
      if (errorJson.error?.code === 429 || errorJson.error?.status === 429) {
        // Handle rate limiting (429) with retry
        if (attempt < 3) {
          const retryAfter = attempt * 2; // Exponential backoff: 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return callGroqWithImage(apiKey, prompt, imageBase64, attempt + 1, useFallback);
        }
        errorMessage = `API quota exceeded. Please try again later or upgrade your plan. Details: ${errorJson.error.message || 'Rate limit exceeded'}`;
      } else if (errorJson.error?.code === 404 || errorJson.error?.message?.includes('model') || errorJson.error?.message?.includes('not found')) {
        // Model not found - try fallback model
        if (!useFallback) {
          console.log(`Model ${modelToUse} not found, trying fallback model ${GROQ_VISION_MODEL_FALLBACK}`);
          return callGroqWithImage(apiKey, prompt, imageBase64, attempt, true);
        }
        errorMessage = `Vision model not available. Please check your Groq API configuration. Error: ${errorJson.error.message || 'Model not found'}`;
      } else if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // If parsing fails, use the original error message
    }
    
    // Handle service unavailable (503) with retry
    if (response.status === 503 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      return callGroqWithImage(apiKey, prompt, imageBase64, attempt + 1, useFallback);
    }
    
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  const text = extractGroqText(payload);

  if (!text) {
    throw new Error("Groq returned an empty response");
  }

  return text;
};

const buildCertificatePrompt = (selectedTech: string[]) => {
  const techList = selectedTech.join(', ');
  
  return `You are an expert at analyzing educational and professional certificates. 

Analyze the certificate image and determine:
1. Is this a legitimate certificate? (Look for official seals, signatures, institution names, dates)
2. What skills or technologies does this certificate verify? (Match against: ${techList})
3. What is the certificate for? (Course name, certification program, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "isValid": boolean,
  "skills": string[],
  "certificateName": string,
  "issuingOrganization": string,
  "message": string
}

The "skills" array should contain technologies from this list that are verified by the certificate: ${techList}. Only include skills that are clearly mentioned or implied by the certificate content.

If the certificate is not valid or cannot be verified, set "isValid" to false and provide a helpful message explaining why.`;
};

const challengeEvaluationSchema = z.object({
  challengeId: z.string().min(1),
  skill: z.string().min(1),
  code: z.string().min(20, { message: "Please provide more context for the AI reviewer." }),
  language: z.string().optional(),
});

const challengeExplainSchema = z.object({
  challengeId: z.string().min(1),
  skill: z.string().min(1),
  code: z.string().optional().default(''),
});

app.post(
  "/api/challenges/evaluate",
  authMiddleware,
  zValidator("json", challengeEvaluationSchema),
  async (c) => {
    const body = c.req.valid("json");
    const apiKey = c.env.GROQ_API_KEY;
    const model = c.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    if (!apiKey) {
      return c.json({ error: "Groq API key missing. Ask an admin to configure GROQ_API_KEY." }, 500);
    }

    const challenge = findChallengeById(body.challengeId);

    if (!challenge) {
      return c.json({ error: "Challenge not found" }, 404);
    }

    const resolvedLanguage = body.language || challenge.language;
    const user = c.get("user")!;

    try {
      const rawText = await callGroq(
        apiKey,
        buildEvaluationPrompt(challenge, body.code, resolvedLanguage),
        model
      );
      const report = parseGroqJson(rawText);

      // Record completion if score is 70 or above
      if (report?.score >= 70) {
        try {
          await c.env.DB.prepare(
            `INSERT OR REPLACE INTO challenge_completions (user_id, challenge_id, skill, score, completed_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
          )
            .bind(user.id, body.challengeId, body.skill, report.score)
            .run();
        } catch (err) {
          // Log error but don't fail the request
          console.error("Failed to record challenge completion:", err);
        }
      }

      return c.json({ success: true, report, rawText });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "AI reviewer is unavailable. Try again soon.",
        },
        500
      );
    }
  }
);

app.post(
  "/api/challenges/explain",
  authMiddleware,
  zValidator("json", challengeExplainSchema),
  async (c) => {
    const body = c.req.valid("json");
    const apiKey = c.env.GROQ_API_KEY;
    const model = c.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    if (!apiKey) {
      return c.json({ error: "Groq API key missing. Ask an admin to configure GROQ_API_KEY." }, 500);
    }

    const challenge = findChallengeById(body.challengeId);

    if (!challenge) {
      return c.json({ error: "Challenge not found" }, 404);
    }

    try {
      const rawText = await callGroq(apiKey, buildAssistPrompt(challenge, body.code), model);
      return c.json({ success: true, message: rawText });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "AI helper is unavailable right now.",
        },
        500
      );
    }
  }
);

// Kumar Chatbot for coding assistance
const chatbotSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  attachment_type: z.enum(['file', 'link']).optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
});

const buildChatbotPrompt = (message: string, conversationHistory?: Array<{ role: string; content: string }>, attachment?: { type?: string; url?: string; name?: string }) => {
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map((msg) => `${msg.role === 'user' ? 'User' : 'thambi mayilvaganam'}: ${msg.content}`)
        .join('\n\n')
    : '';

  let attachmentContext = '';
  if (attachment?.type === 'link' && attachment.url) {
    attachmentContext = `\n\nUser has shared a link: ${attachment.url}`;
  } else if (attachment?.type === 'file' && attachment.name) {
    attachmentContext = `\n\nUser has shared a file: ${attachment.name}${attachment.url ? ` (${attachment.url})` : ''}`;
  }

  return `You are thambi mayilvaganam, a friendly and knowledgeable coding assistant. Your role is to help developers with:
- Programming questions and concepts
- Code explanations and debugging
- Best practices and design patterns
- Algorithm and data structure help
- Framework and library guidance
- Code review and optimization suggestions

Be concise, clear, and encouraging. Use code examples when helpful. If the question isn't about coding, politely redirect to coding topics.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}User: ${message}${attachmentContext}\nthambi mayilvaganam:`;
};

app.post(
  "/api/chatbot/kumar",
  authMiddleware,
  zValidator("json", chatbotSchema),
  async (c) => {
    const body = c.req.valid("json");
    const apiKey = c.env.GROQ_API_KEY;
    const model = c.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    if (!apiKey) {
      return c.json({ error: "Groq API key missing. Ask an admin to configure GROQ_API_KEY." }, 500);
    }

    try {
      const attachment = body.attachment_type ? {
        type: body.attachment_type,
        url: body.attachment_url,
        name: body.attachment_name,
      } : undefined;
      const prompt = buildChatbotPrompt(body.message, body.conversationHistory, attachment);
      const rawText = await callGroq(apiKey, prompt, model);
      
      return c.json({ success: true, message: rawText });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Kumar is unavailable right now. Please try again later.",
        },
        500
      );
    }
  }
);

export default app;
