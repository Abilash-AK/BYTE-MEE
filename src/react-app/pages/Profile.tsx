import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { User, Mail, Code2, Edit2, Save, X, CheckCircle2, AlertCircle, Upload, FileImage, Bot, BarChart3, Lock } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Sidebar from '../components/Sidebar';

const TECH_OPTIONS = [
  'React',
  'JavaScript',
  'TypeScript',
  'Python',
  'Node.js',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'HTML/CSS',
  'SQL',
  'MongoDB',
  'PostgreSQL',
  'AWS',
  'Docker',
  'Git',
];

const ALL_MCQ_QUESTIONS = [
  {
    id: 1,
    language: 'JavaScript',
    code: `let x = '5';
let y = 10;
console.log(x + y);`,
    question: 'What will be the output?',
    options: ['15', '510', 'NaN', 'Error'],
    correctAnswer: '510',
  },
  {
    id: 2,
    language: 'Python',
    code: `def func(x=[]):
    x.append(1)
    return x

print(func())
print(func())`,
    question: 'What will be printed?',
    options: ['[1] then [1]', '[1] then [1, 1]', '[1, 1] then [1, 1]', 'Error'],
    correctAnswer: '[1] then [1, 1]',
  },
  {
    id: 3,
    language: 'Java',
    code: `String str1 = "Hello";
String str2 = "Hello";
System.out.println(str1 == str2);`,
    question: 'What will be the output?',
    options: ['true', 'false', 'null', 'Compilation Error'],
    correctAnswer: 'true',
  },
  {
    id: 4,
    language: 'C++',
    code: `int arr[5] = {1, 2, 3};
cout << arr[4];`,
    question: 'What will be the output?',
    options: ['0', 'Garbage value', '3', 'Compilation Error'],
    correctAnswer: '0',
  },
  {
    id: 5,
    language: 'JavaScript',
    code: `const arr = [1, 2, 3];
arr.push(4);
console.log(arr);`,
    question: 'What will happen?',
    options: ['Prints [1, 2, 3, 4]', 'Error: const cannot be modified', 'Prints [1, 2, 3]', 'undefined'],
    correctAnswer: 'Prints [1, 2, 3, 4]',
  },
  {
    id: 6,
    language: 'Python',
    code: `print(type(5 / 2))
print(type(5 // 2))`,
    question: 'What will be printed?',
    options: ['int then int', 'float then int', 'int then float', 'float then float'],
    correctAnswer: 'float then int',
  },
  {
    id: 7,
    language: 'Java',
    code: `int x = 5;
if (x = 10) {
    System.out.println("True");
}`,
    question: 'What will happen?',
    options: ['Prints "True"', 'Prints nothing', 'Compilation Error', 'Runtime Error'],
    correctAnswer: 'Compilation Error',
  },
  {
    id: 8,
    language: 'JavaScript',
    code: `console.log(typeof null);
console.log(typeof undefined);`,
    question: 'What will be logged?',
    options: ['object then undefined', 'null then undefined', 'object then object', 'null then null'],
    correctAnswer: 'object then undefined',
  },
  {
    id: 9,
    language: 'Python',
    code: `x = [1, 2, 3]
y = x
y.append(4)
print(len(x))`,
    question: 'What will be printed?',
    options: ['3', '4', 'Error', 'None'],
    correctAnswer: '4',
  },
  {
    id: 10,
    language: 'Java',
    code: `Integer a = 127;
Integer b = 127;
System.out.println(a == b);`,
    question: 'What will be the output?',
    options: ['true', 'false', 'null', 'Compilation Error'],
    correctAnswer: 'true',
  },
  {
    id: 11,
    language: 'C++',
    code: `int x = 5;
int y = ++x;
cout << x << " " << y;`,
    question: 'What will be the output?',
    options: ['5 5', '6 5', '5 6', '6 6'],
    correctAnswer: '6 6',
  },
  {
    id: 12,
    language: 'JavaScript',
    code: `function test() {
  console.log(a);
  var a = 5;
}
test();`,
    question: 'What will be logged?',
    options: ['5', 'undefined', 'ReferenceError', 'null'],
    correctAnswer: 'undefined',
  },
  {
    id: 13,
    language: 'Python',
    code: `result = 10 / 3
print(int(result))`,
    question: 'What will be printed?',
    options: ['3', '3.33', '4', 'Error'],
    correctAnswer: '3',
  },
  {
    id: 14,
    language: 'Java',
    code: `int[] arr = new int[3];
System.out.println(arr[0]);`,
    question: 'What will be the output?',
    options: ['0', 'null', 'Garbage value', 'Compilation Error'],
    correctAnswer: '0',
  },
  {
    id: 15,
    language: 'C++',
    code: `string s = "Hello";
cout << s[10];`,
    question: 'What will likely happen?',
    options: ['Prints empty character', 'Undefined behavior', 'Compilation Error', 'Prints "H"'],
    correctAnswer: 'Undefined behavior',
  },
];

const TECH_TO_LANGUAGE_MAP: Record<string, string[]> = {
  'JavaScript': ['JavaScript'],
  'TypeScript': ['JavaScript'],
  'React': ['JavaScript'],
  'Node.js': ['JavaScript'],
  'Python': ['Python'],
  'Java': ['Java'],
  'Kotlin': ['Java'],
  'C++': ['C++'],
};

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  tech_stack: string;
  coding_task_answer: string;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  // Check if we're viewing another user's profile - userId exists and is different from current user
  // Use useMemo to recalculate when userId or user.id changes
  const isViewingOtherProfile = useMemo(() => {
    return Boolean(userId && user?.id && userId !== user.id);
  }, [userId, user?.id]);
  const [viewedUser, setViewedUser] = useState<{ id: string; email: string; name: string; picture?: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [originalTech, setOriginalTech] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'quiz' | 'certificate' | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateVerifying, setCertificateVerifying] = useState(false);
  const [certificateResult, setCertificateResult] = useState<{
    success: boolean;
    message: string;
    skills?: string[];
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    score?: number;
    total?: number;
  } | null>(null);
  const [contributions, setContributions] = useState<{
    total_files: number;
    average_ai_contribution: number;
    average_human_contribution: number;
  } | null>(null);
  const [showCodingTest, setShowCodingTest] = useState(false);
  const [codingTestCode, setCodingTestCode] = useState('');
  const [codingTestLanguage, setCodingTestLanguage] = useState('javascript');
  const [submittingCodingTest, setSubmittingCodingTest] = useState(false);
  const [codingTestResult, setCodingTestResult] = useState<{
    success: boolean;
    compiles: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [currentVerifyingSkill, setCurrentVerifyingSkill] = useState<string | null>(null);
  const [skillVerification, setSkillVerification] = useState<{
    level_1_completed: number;
    level_2_completed: number;
    level_3_completed: number;
  } | null>(null);
  
  // Filter questions based on new skills only
  const filteredQuestions = useMemo(() => {
    if (!profile) return [];
    
    const originalSet = new Set(originalTech);
    const newSkills = selectedTech.filter(tech => !originalSet.has(tech));
    
    if (newSkills.length === 0) return [];
    
    const relevantLanguages = new Set<string>();
    newSkills.forEach(tech => {
      const languages = TECH_TO_LANGUAGE_MAP[tech];
      if (languages) {
        languages.forEach(lang => relevantLanguages.add(lang));
      }
    });

    if (relevantLanguages.size === 0) {
      return ALL_MCQ_QUESTIONS.filter(q => q.language === 'JavaScript').slice(0, 7);
    }

    const filtered = ALL_MCQ_QUESTIONS.filter(q => relevantLanguages.has(q.language));
    return filtered.slice(0, Math.max(7, Math.min(filtered.length, 4)));
  }, [selectedTech, originalTech, profile]);

  const requiredCorrect = useMemo(() => {
    return Math.ceil(filteredQuestions.length * 0.7);
  }, [filteredQuestions.length]);

  useEffect(() => {
    // Reset state when userId changes
    setProfile(null);
    setViewedUser(null);
    setLoading(true);
    setError('');
    
    // Wait for user to load before deciding which profile to fetch
    if (!user) {
      console.log('Profile: Waiting for user to load...');
      return;
    }
    
    console.log('Profile: userId from params:', userId);
    console.log('Profile: current user.id:', user.id);
    
    // If userId parameter exists and is different from current user, fetch that user's profile
    if (userId && userId !== user.id) {
      console.log('Profile: Fetching other user profile for:', userId);
      fetchOtherUserProfile(userId);
    } else if (!userId) {
      // No userId parameter, fetch current user's profile
      console.log('Profile: No userId param, fetching current user profile');
      fetchProfile();
      fetchContributions();
    } else {
      // userId matches current user, fetch current user's profile
      console.log('Profile: userId matches current user, fetching current user profile');
      fetchProfile();
      fetchContributions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id]);

  const fetchContributions = async (targetUserId?: string) => {
    try {
      let response;
      const userIdToFetch = targetUserId || userId;
      
      if (isViewingOtherProfile && userIdToFetch) {
        // Fetch other user's contributions
        response = await fetch(`/api/users/${userIdToFetch}/contributions`, { credentials: 'include' });
      } else if (!isViewingOtherProfile) {
        // Fetch current user's contributions
        response = await fetch('/api/profile/contributions', { credentials: 'include' });
      } else {
        return; // Don't fetch if we don't have userId
      }
      
      if (response && response.ok) {
        const data = await response.json();
        setContributions(data);
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    }
  };

  const fetchOtherUserProfile = async (targetUserId: string) => {
    setLoading(true);
    try {
      console.log('Fetching profile for user:', targetUserId);
      const response = await fetch(`/api/users/${targetUserId}/profile`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user profile data:', JSON.stringify(data, null, 2));
        
        // Validate that we received user data
        if (!data.user) {
          console.error('No user data in API response:', data);
          setError('User data not found in response');
          setLoading(false);
          return;
        }
        
        // Extract name and email - prioritize profile data, fallback to user data
        const displayName = (data.profile?.name && data.profile.name.trim()) 
          ? data.profile.name.trim() 
          : (data.user?.name && data.user.name.trim()) 
            ? data.user.name.trim() 
            : null;
        
        const displayEmail = (data.profile?.email && data.profile.email.trim()) 
          ? data.profile.email.trim() 
          : (data.user?.email && data.user.email.trim()) 
            ? data.user.email.trim() 
            : null;
        
        // Set viewedUser for display
        const viewedUserData = {
          id: data.user.id || targetUserId,
          name: displayName,
          email: displayEmail,
          picture: data.user.picture || null,
        };
        
        console.log('Setting viewedUser:', viewedUserData);
        console.log('Raw API response - user:', data.user);
        console.log('Raw API response - profile:', data.profile);
        setViewedUser(viewedUserData);
        
        // Set profile data - use profile data from API, ensure all required fields
        const techStack = (data.profile?.tech_stack && data.profile.tech_stack.trim()) 
          ? data.profile.tech_stack.trim() 
          : '';
        
        const profileData = {
          user_id: targetUserId,
          name: displayName || '',
          email: displayEmail || '',
          tech_stack: techStack,
          coding_task_answer: data.profile?.coding_task_answer || '',
          created_at: data.profile?.created_at || new Date().toISOString(),
          updated_at: data.profile?.updated_at || new Date().toISOString(),
          onboarding_completed: data.profile?.onboarding_completed || 0,
        } as UserProfile;
        
        console.log('Setting profile data:', profileData);
        console.log('Final values - name:', profileData.name, 'email:', profileData.email, 'tech_stack:', profileData.tech_stack);
        setProfile(profileData);
        
        // Set selectedTech for display
        if (techStack) {
          const techArray = techStack.split(', ').filter(Boolean);
          setSelectedTech(techArray);
          setOriginalTech(techArray);
        } else {
          setSelectedTech([]);
          setOriginalTech([]);
        }
        
        // Fetch contributions for this user
        fetchContributions(targetUserId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch other user profile:', response.status, errorData);
        setError(`Failed to load profile: ${response.status === 404 ? 'User not found' : 'Server error'}`);
        // Only redirect on 404, otherwise show error
        if (response.status === 404) {
          setTimeout(() => navigate('/profile'), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', { credentials: 'include' });
      const data = await response.json();
      setProfile(data);
      
      if (data.tech_stack) {
        const techArray = data.tech_stack.split(', ').filter(Boolean);
        setSelectedTech(techArray);
        setOriginalTech(techArray);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const handleSave = async () => {
    if (selectedTech.length === 0) {
      setError('Please select at least one technology');
      return;
    }

    // Check if new skills were added
    const originalSet = new Set(originalTech);
    const newSkills = selectedTech.filter(tech => !originalSet.has(tech));
    
    if (newSkills.length > 0 && filteredQuestions.length > 0) {
      // New skills detected - require verification
      setShowVerification(true);
      setVerificationMethod(null);
      setError('');
      return;
    }

    // No new skills or no questions needed - save directly
    await saveProfile();
  };

  const handleCertificateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Certificate image must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setCertificateFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCertificatePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setCertificateResult(null);
      setError('');
    }
  };

  const handleVerifyCertificate = async () => {
    if (!certificateFile) {
      setError('Please select a certificate image');
      return;
    }

    setCertificateVerifying(true);
    setError('');
    setCertificateResult(null);

    try {
      let base64: string | undefined;
      
      if (certificateFile) {
        // Convert file to base64
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/...;base64, prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(certificateFile);
        });
      }

      const response = await fetch('/api/profile/verify-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: base64,
          filename: certificateFile.name,
          tech_stack: selectedTech,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCertificateResult({
          success: data.success,
          message: data.message,
          skills: data.skills || [],
        });
      } else {
        const errorMsg = data.error || data.message || 'Failed to verify certificate';
        setError(errorMsg);
        setCertificateResult({
          success: false,
          message: errorMsg,
          skills: [],
        });
      }
    } catch {
      setError('An error occurred while verifying the certificate');
    } finally {
      setCertificateVerifying(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
    setValidationResult(null);
  };

  const handleValidateQuiz = async () => {
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < filteredQuestions.length) {
      setError(`Please answer all ${filteredQuestions.length} questions (${answeredCount}/${filteredQuestions.length} answered)`);
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setError('');

    try {
      // Get the first new skill being verified
      const originalSet = new Set(originalTech);
      const newSkills = selectedTech.filter(tech => !originalSet.has(tech));
      const skillToVerify = newSkills[0] || 'General';

      const response = await fetch('/api/profile/validate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          answers: quizAnswers,
          questionIds: filteredQuestions.map(q => q.id),
          skill: skillToVerify,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult({
          success: data.success,
          message: data.message,
          score: data.score,
          total: data.total,
        });
        
        // If quiz passed, show coding test and fetch verification status
        if (data.success) {
          setCurrentVerifyingSkill(skillToVerify);
          setShowCodingTest(true);
          fetchSkillVerification(skillToVerify);
          // Set default language based on skill
          const langMap: Record<string, string> = {
            'JavaScript': 'javascript',
            'TypeScript': 'typescript',
            'Python': 'python',
            'Java': 'java',
            'C++': 'cpp',
            'React': 'javascript',
          };
          setCodingTestLanguage(langMap[skillToVerify] || 'javascript');
        }
      } else {
        setError(data.error || 'Failed to validate answers');
      }
    } catch {
      setError('An error occurred while validating your answers');
    } finally {
      setValidating(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const originalSet = new Set(originalTech);
      const newSkills = selectedTech.filter(tech => !originalSet.has(tech));
      const hasNewSkills = newSkills.length > 0;
      
      const body: {
        tech_stack: string;
        coding_task_answer?: string;
        certificate_verified?: boolean;
        certificate_skills?: string[];
      } = {
        tech_stack: selectedTech.join(', '),
      };

      // If new skills were added, include verification
      if (hasNewSkills) {
        if (verificationMethod === 'quiz' && validationResult?.success) {
          body.coding_task_answer = JSON.stringify(quizAnswers);
        } else if (verificationMethod === 'certificate' && certificateResult?.success) {
          body.certificate_verified = true;
          body.certificate_skills = certificateResult?.skills || [];
        }
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setOriginalTech(selectedTech);
        setEditing(false);
        setShowVerification(false);
        setVerificationMethod(null);
        setQuizAnswers({});
        setValidationResult(null);
        setCertificateFile(null);
        setCertificatePreview(null);
        setCertificateResult(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAfterVerification = async () => {
    if (verificationMethod === 'quiz') {
      if (!validationResult?.success) {
        setError(`Please complete the quiz and pass with at least ${requiredCorrect}/${filteredQuestions.length} correct answers`);
        return;
      }
      // Check if coding test is completed (Level 2 and Level 3)
      if (showCodingTest && (!skillVerification || skillVerification.level_3_completed !== 1)) {
        setError('Please complete the coding test (Level 2) to verify your skill');
        return;
      }
    }

    if (verificationMethod === 'certificate' && !certificateResult?.success) {
      setError('Please verify your certificate first');
      return;
    }

    await saveProfile();
  };

  const fetchSkillVerification = async (skill: string) => {
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(skill)}/verification`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSkillVerification(data);
      }
    } catch (error) {
      console.error('Error fetching skill verification:', error);
    }
  };

  const handleSubmitCodingTest = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!codingTestCode.trim()) {
      setError('Please write some code before submitting');
      return;
    }

    if (!currentVerifyingSkill) {
      setError('Skill verification not initialized. Please refresh and try again.');
      return;
    }

    setSubmittingCodingTest(true);
    setCodingTestResult(null);
    setError('');

    try {
      console.log('Submitting coding test:', {
        skill: currentVerifyingSkill,
        codeLength: codingTestCode.length,
        language: codingTestLanguage,
      });

      const response = await fetch('/api/skills/coding-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skill: currentVerifyingSkill,
          code: codingTestCode,
          language: codingTestLanguage,
        }),
      });

      const data = await response.json();
      console.log('Coding test response:', data);

      if (response.ok) {
        setCodingTestResult(data);
        if (data.success) {
          // Refresh verification status
          await fetchSkillVerification(currentVerifyingSkill);
          // Auto-save profile after successful verification
          setTimeout(() => {
            saveProfile();
          }, 2000);
        } else {
          setError(data.error || 'Code compilation failed. Please check your code and try again.');
        }
      } else {
        setError(data.error || 'Failed to submit coding test');
      }
    } catch (error: any) {
      console.error('Error submitting coding test:', error);
      setError(`An error occurred: ${error.message || 'Please check your connection and try again'}`);
    } finally {
      setSubmittingCodingTest(false);
    }
  };

  const handleCancel = () => {
    if (profile?.tech_stack) {
      const techArray = profile.tech_stack.split(', ').filter(Boolean);
      setSelectedTech(techArray);
      setOriginalTech(techArray);
    }
    setEditing(false);
    setShowVerification(false);
    setVerificationMethod(null);
    setQuizAnswers({});
    setValidationResult(null);
    setCertificateFile(null);
    setCertificatePreview(null);
    setCertificateResult(null);
    setShowCodingTest(false);
    setCodingTestCode('');
    setCodingTestResult(null);
    setCurrentVerifyingSkill(null);
    setSkillVerification(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin">
            <Code2 className="w-10 h-10 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5 flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {isViewingOtherProfile ? `${viewedUser?.name || 'User'}'s Profile` : 'My Profile'}
            </h1>
            <p className="text-gray-600">
              {isViewingOtherProfile ? 'View user profile and skills' : 'Manage your account information and skills'}
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-semibold">Profile updated successfully!</p>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 mb-6">
            {/* User Info Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Personal Information
              </h2>
              
              <div className="space-y-4">
                {/* Profile Picture and Name */}
                <div className="flex items-center gap-6">
                  {(isViewingOtherProfile ? viewedUser?.picture : user?.picture) && (
                    <img
                      src={(isViewingOtherProfile ? viewedUser?.picture : user?.picture) || ''}
                      alt={profile?.name || viewedUser?.name || user?.name || 'User'}
                      className="w-20 h-20 rounded-full border-4 border-primary/20"
                    />
                  )}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Full Name</div>
                    <div className="text-xl font-bold text-gray-900">
                      {(() => {
                        if (isViewingOtherProfile) {
                          // Try viewedUser first, then profile, then fallback
                          const name = viewedUser?.name ?? profile?.name ?? null;
                          if (name && typeof name === 'string' && name.trim()) {
                            return name.trim();
                          }
                          return 'Not set';
                        } else {
                          const name = profile?.name ?? user?.name ?? null;
                          if (name && typeof name === 'string' && name.trim()) {
                            return name.trim();
                          }
                          return 'Not set';
                        }
                      })()}
                    </div>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-400 mt-1 space-y-1">
                        <div>Debug: isViewingOtherProfile={String(isViewingOtherProfile)}</div>
                        <div>viewedUser.name={String(viewedUser?.name ?? 'null')}</div>
                        <div>profile.name={String(profile?.name ?? 'null')}</div>
                        <div>profile.email={String(profile?.email ?? 'null')}</div>
                        <div>profile.tech_stack={String(profile?.tech_stack ?? 'null')}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Email Address</div>
                    <div className="text-lg text-gray-900">
                      {(() => {
                        if (isViewingOtherProfile) {
                          const email = viewedUser?.email ?? profile?.email ?? null;
                          if (email && typeof email === 'string' && email.trim()) {
                            return email.trim();
                          }
                          return 'Not set';
                        } else {
                          const email = profile?.email ?? user?.email ?? null;
                          if (email && typeof email === 'string' && email.trim()) {
                            return email.trim();
                          }
                          return 'Not set';
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Code2 className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Member Since</div>
                    <div className="text-lg text-gray-900">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution Statistics Section */}
            {contributions && contributions.total_files > 0 && (
              <div className="border-t-2 border-gray-100 pt-8 mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Contribution Statistics</h2>
                </div>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Average AI vs Human contribution across all your pod work files ({contributions.total_files} file{contributions.total_files !== 1 ? 's' : ''})
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">AI Contribution</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{contributions.average_ai_contribution}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${contributions.average_ai_contribution}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">Human Contribution</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{contributions.average_human_contribution}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{ width: `${contributions.average_human_contribution}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tech Stack Section */}
            <div className="border-t-2 border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Code2 className="w-6 h-6 text-primary" />
                  Tech Stack
                </h2>
                {!isViewingOtherProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Skills
                  </button>
                )}
              </div>

              {editing ? (
                <>
                  {!showVerification ? (
                    <>
                      <p className="text-gray-600 mb-4">
                        Select the technologies you're familiar with. This helps us match you with relevant projects and communities.
                        {(() => {
                          const originalSet = new Set(originalTech);
                          const newSkills = selectedTech.filter(tech => !originalSet.has(tech));
                          return newSkills.length > 0 ? (
                            <span className="block mt-2 text-amber-600 font-semibold">
                              ⚠️ You've added {newSkills.length} new skill{newSkills.length > 1 ? 's' : ''}. You'll need to verify these skills (quiz or certificate) to save these changes.
                            </span>
                          ) : null;
                        })()}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                        {TECH_OPTIONS.map((tech) => {
                          const originalSet = new Set(originalTech);
                          const isNew = !originalSet.has(tech) && selectedTech.includes(tech);
                          return (
                            <button
                              key={tech}
                              onClick={() => toggleTech(tech)}
                              className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all relative ${
                                selectedTech.includes(tech)
                                  ? 'border-primary bg-primary text-white shadow-md'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                              }`}
                            >
                              {tech}
                              {isNew && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving || selectedTech.length === 0}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Code2 className="w-5 h-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : verificationMethod === null ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-900 font-semibold mb-2">
                          Verification Required
                        </p>
                        <p className="text-blue-800 text-sm">
                          You've added new skills to your profile. Please choose how you'd like to verify your knowledge.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Quiz Option */}
                        <button
                          onClick={() => setVerificationMethod('quiz')}
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Code2 className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Take Coding Quiz</h3>
                          </div>
                          <p className="text-gray-600">
                            Answer multiple-choice questions about your new skills. You need 70% correct to pass.
                          </p>
                        </button>

                        {/* Certificate Option */}
                        <button
                          onClick={() => setVerificationMethod('certificate')}
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                              <FileImage className="w-6 h-6 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Upload Certificate</h3>
                          </div>
                          <p className="text-gray-600">
                            Upload a photo of your certificate. Our AI will analyze it and verify your skills automatically.
                          </p>
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowVerification(false);
                            setVerificationMethod(null);
                            setError('');
                          }}
                          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : verificationMethod === 'quiz' ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-900 font-semibold mb-2">
                          Verification Required
                        </p>
                        <p className="text-blue-800 text-sm">
                          You've added new skills to your profile. Please complete this coding quiz to verify your knowledge before we update your profile.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {filteredQuestions.map((question) => (
                          <div key={question.id} className="border-2 border-gray-200 rounded-lg p-6">
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                  {question.language}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Question {filteredQuestions.indexOf(question) + 1} of {filteredQuestions.length}
                                </span>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-3">
                                {question.code}
                              </pre>
                              <p className="font-semibold text-gray-900 mb-3">{question.question}</p>
                            </div>
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => handleAnswerSelect(question.id, option)}
                                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                                    quizAnswers[question.id] === option
                                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                                      : 'border-gray-200 hover:border-primary/50'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                          </div>
                        </div>
                      )}

                      {validationResult && (
                        <div className={`border rounded-lg p-4 ${
                          validationResult.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {validationResult.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                              <p className={`font-semibold ${
                                validationResult.success ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {validationResult.success ? '🎉 Level 1 Complete!' : 'Keep Trying!'}
                              </p>
                              <p className={`text-sm mt-1 ${
                                validationResult.success ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {validationResult.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Level 2: Coding Test */}
                      {showCodingTest && validationResult?.success && (
                        <div className="border-2 border-primary rounded-lg p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Level 2: Coding Test</h3>
                              <p className="text-sm text-gray-600">Write code to solve a simple problem. Copy-paste is disabled.</p>
                            </div>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-yellow-900 text-sm font-semibold mb-1">⚠️ Security Notice</p>
                            <p className="text-yellow-800 text-sm">
                              Copy-paste is disabled for this test. You must write the code yourself to verify your skills.
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Problem: Write a function that returns the sum of two numbers
                            </label>
                            <div 
                              className="border-2 border-gray-200 rounded-lg overflow-hidden"
                              onPaste={(e: React.ClipboardEvent) => {
                                // Only prevent paste on the editor itself, not on buttons
                                if ((e.target as HTMLElement).closest('.monaco-editor')) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  alert('Copy-paste is disabled for this test. Please write the code yourself.');
                                }
                              }}
                              onCopy={(e: React.ClipboardEvent) => {
                                // Only prevent copy on the editor itself
                                if ((e.target as HTMLElement).closest('.monaco-editor')) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              onCut={(e: React.ClipboardEvent) => {
                                // Only prevent cut on the editor itself
                                if ((e.target as HTMLElement).closest('.monaco-editor')) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <Editor
                                height="300px"
                                language={codingTestLanguage}
                                value={codingTestCode}
                                onChange={(value) => setCodingTestCode(value || '')}
                                theme="vs-dark"
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: 'on',
                                  readOnly: false,
                                  // Disable copy-paste
                                  contextmenu: false,
                                  copyWithSyntaxHighlighting: false,
                                  // Disable shortcuts
                                  quickSuggestions: false,
                                  suggestOnTriggerCharacters: false,
                                  acceptSuggestionOnEnter: 'off',
                                  tabSize: 2,
                                  wordWrap: 'on',
                                }}
                                onMount={(editorInstance) => {
                                  // Disable copy-paste via keyboard shortcuts
                                  const monaco = (window as any).monaco;
                                  if (monaco) {
                                    try {
                                      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => false);
                                      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => false);
                                      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => false);
                                    } catch (e) {
                                      // Ignore if commands can't be added
                                    }
                                  }
                                  // Disable right-click context menu
                                  editorInstance.onContextMenu(() => false);
                                }}
                              />
                            </div>
                          </div>

                          {codingTestResult && (
                            <div className={`border rounded-lg p-4 mb-4 ${
                              codingTestResult.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-start gap-2">
                                {codingTestResult.success ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div>
                                  <p className={`font-semibold ${
                                    codingTestResult.success ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {codingTestResult.success ? '🎉 Level 2 Complete!' : 'Compilation Failed'}
                                  </p>
                                  <p className={`text-sm mt-1 ${
                                    codingTestResult.success ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {codingTestResult.message || codingTestResult.error}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('Button clicked', {
                                  hasCode: !!codingTestCode.trim(),
                                  codeLength: codingTestCode.length,
                                  skill: currentVerifyingSkill,
                                  submitting: submittingCodingTest,
                                  alreadySuccess: codingTestResult?.success,
                                });
                                handleSubmitCodingTest(e);
                              }}
                              disabled={!codingTestCode.trim() || submittingCodingTest || codingTestResult?.success || !currentVerifyingSkill}
                              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !codingTestCode.trim() 
                                  ? 'Please write some code' 
                                  : !currentVerifyingSkill 
                                  ? 'Skill verification not initialized' 
                                  : submittingCodingTest 
                                  ? 'Submitting...' 
                                  : codingTestResult?.success 
                                  ? 'Already completed' 
                                  : 'Click to compile and submit'
                              }
                            >
                              {submittingCodingTest ? (
                                <>
                                  <Code2 className="w-5 h-5 animate-spin" />
                                  Compiling...
                                </>
                              ) : (
                                <>
                                  <Code2 className="w-5 h-5" />
                                  Compile & Submit
                                </>
                              )}
                            </button>
                          </div>

                          {skillVerification && skillVerification.level_3_completed === 1 && (
                            <div className="mt-4 bg-gradient-to-r from-green-50 to-accent/10 border-2 border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <div>
                                  <p className="font-bold text-green-900">🎊 Skill Verification Accomplished!</p>
                                  <p className="text-sm text-green-700 mt-1">
                                    You have successfully completed all 3 levels. Your {currentVerifyingSkill} skill is now verified!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowVerification(false);
                            setQuizAnswers({});
                            setValidationResult(null);
                            setError('');
                          }}
                          disabled={saving || validating}
                          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Back
                        </button>
                        {!validationResult?.success ? (
                          <button
                            onClick={handleValidateQuiz}
                            disabled={validating || Object.keys(quizAnswers).length < filteredQuestions.length}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                          >
                            {validating ? (
                              <>
                                <Code2 className="w-5 h-5 animate-spin" />
                                Validating...
                              </>
                            ) : (
                              'Validate Answers'
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmitAfterVerification}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Code2 className="w-5 h-5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                Save Changes
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Upload Certificate
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Upload a photo of your certificate. Our AI will analyze it and verify your skills automatically.
                      </p>

                      {!certificateFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
                          <label className="flex flex-col items-center justify-center cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mb-4" />
                            <span className="text-lg font-semibold text-gray-700 mb-2">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-sm text-gray-500">
                              PNG, JPG, or JPEG (max 10MB)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCertificateSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-4 mb-6">
                          {certificatePreview && (
                            <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={certificatePreview}
                                alt="Certificate preview"
                                className="w-full h-auto max-h-96 object-contain"
                              />
                              <button
                                onClick={() => {
                                  setCertificateFile(null);
                                  setCertificatePreview(null);
                                  setCertificateResult(null);
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                              <strong>File:</strong> {certificateFile.name} ({(certificateFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        </div>
                      )}


                      {certificateResult && (
                        <div className={`mb-6 border-2 rounded-lg p-4 ${
                          certificateResult.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {certificateResult.success ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`font-semibold mb-1 ${
                                certificateResult.success ? 'text-green-900' : 'text-red-900'
                              }`}>
                                {certificateResult.success ? '✅ Certificate Verified!' : '❌ Verification Failed'}
                              </p>
                              <p className={`text-sm ${
                                certificateResult.success ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {certificateResult.message}
                              </p>
                              {certificateResult.success && certificateResult.skills && certificateResult.skills.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-semibold text-green-800 mb-1">Skills detected:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {certificateResult.skills.map((skill, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setVerificationMethod(null);
                            setCertificateFile(null);
                            setCertificatePreview(null);
                            setCertificateResult(null);
                            setError('');
                          }}
                          disabled={certificateVerifying || saving}
                          className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          Back
                        </button>
                        {!certificateResult?.success ? (
                          <button
                            onClick={handleVerifyCertificate}
                            disabled={certificateVerifying || !certificateFile}
                            className="flex-1 px-6 py-4 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {certificateVerifying ? (
                              <>
                                <Code2 className="w-5 h-5 animate-spin" />
                                Analyzing Certificate...
                              </>
                            ) : (
                              <>
                                <FileImage className="w-5 h-5" />
                                Verify Certificate
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmitAfterVerification}
                            disabled={saving}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Code2 className="w-5 h-5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                Save Changes
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTech.length > 0 ? (
                    selectedTech.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg border-2 border-primary/20"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No technologies selected yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Code2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Keep your skills updated!</strong> Your tech stack helps us recommend relevant communities and match you with hackathon teams that need your expertise. You can update it anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
