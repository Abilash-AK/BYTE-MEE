import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { Code2, Sparkles, CheckCircle2, AlertCircle, Upload, FileImage, X } from 'lucide-react';

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

// Map tech stack to question languages
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

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [verificationMethod, setVerificationMethod] = useState<'quiz' | 'certificate' | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateVerifying, setCertificateVerifying] = useState(false);
  const [certificateResult, setCertificateResult] = useState<{
    success: boolean;
    message: string;
    skills?: string[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    score?: number;
    total?: number;
  } | null>(null);
  const [error, setError] = useState('');

  // Filter questions based on selected tech stack
  const filteredQuestions = useMemo(() => {
    const relevantLanguages = new Set<string>();
    
    selectedTech.forEach(tech => {
      const languages = TECH_TO_LANGUAGE_MAP[tech];
      if (languages) {
        languages.forEach(lang => relevantLanguages.add(lang));
      }
    });

    if (relevantLanguages.size === 0) {
      // If no programming languages selected, show JavaScript questions as default
      return ALL_MCQ_QUESTIONS.filter(q => q.language === 'JavaScript').slice(0, 7);
    }

    // Filter questions for selected languages and limit to 7
    const filtered = ALL_MCQ_QUESTIONS.filter(q => 
      relevantLanguages.has(q.language)
    );

    // Return up to 7 questions, ensuring we have at least 4 if possible
    return filtered.slice(0, Math.max(7, Math.min(filtered.length, 4)));
  }, [selectedTech]);

  const requiredCorrect = useMemo(() => {
    // Need at least 70% correct
    return Math.ceil(filteredQuestions.length * 0.7);
  }, [filteredQuestions.length]);

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
    setValidationResult(null);
  };

  const handleValidate = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < filteredQuestions.length) {
      setError(`Please answer all ${filteredQuestions.length} questions (${answeredCount}/${filteredQuestions.length} answered)`);
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setError('');

    try {
      const response = await fetch('/api/profile/validate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          questionIds: filteredQuestions.map(q => q.id),
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
      } else {
        setError(data.error || 'Failed to validate answers');
      }
    } catch (err) {
      setError('An error occurred while validating your answers');
    } finally {
      setValidating(false);
    }
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
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(certificateFile);
      });

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

      if (response.ok) {
        setCertificateResult({
          success: data.success,
          message: data.message,
          skills: data.skills || [],
        });
      } else {
        setError(data.error || 'Failed to verify certificate');
      }
    } catch (err) {
      setError('An error occurred while verifying the certificate');
    } finally {
      setCertificateVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedTech.length === 0) {
      setError('Please select at least one technology');
      return;
    }

    if (verificationMethod === 'quiz' && !validationResult?.success) {
      setError(`Please complete the quiz and pass with at least ${requiredCorrect}/${filteredQuestions.length} correct answers`);
      return;
    }

    if (verificationMethod === 'certificate' && !certificateResult?.success) {
      setError('Please verify your certificate first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const body: any = {
        tech_stack: selectedTech.join(', '),
      };

      if (verificationMethod === 'quiz') {
        body.coding_task_answer = JSON.stringify(answers);
      } else if (verificationMethod === 'certificate') {
        body.certificate_verified = true;
        body.certificate_skills = certificateResult?.skills || [];
      }

      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="w-10 h-10 text-primary" />
            <span className="text-3xl font-bold text-primary">CoLearn</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome{user?.given_name ? `, ${user.given_name}` : ''}! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Let's set up your profile to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="hidden sm:inline font-semibold">Tech Stack</span>
          </div>
          <div className="w-12 h-1 bg-gray-200 rounded">
            <div className={`h-full bg-primary rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="hidden sm:inline font-semibold">Verification</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Select Your Tech Stack
              </h2>
              <p className="text-gray-600 mb-6">
                Choose the technologies you're familiar with. Your quiz will be customized based on your selections.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {TECH_OPTIONS.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      selectedTech.includes(tech)
                        ? 'border-primary bg-primary text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>

              {selectedTech.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">
                        {selectedTech.length} {selectedTech.length === 1 ? 'technology' : 'technologies'} selected
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedTech.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && step === 1 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (selectedTech.length === 0) {
                    setError('Please select at least one technology');
                  } else {
                    setError('');
                    setAnswers({});
                    setValidationResult(null);
                    setStep(2);
                  }
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all"
              >
                Continue to Verification
              </button>
            </>
          ) : verificationMethod === null ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Choose Verification Method
              </h2>
              <p className="text-gray-600 mb-6">
                Select how you'd like to verify your skills. You can either take a coding quiz or upload a certificate.
              </p>

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
                    Answer multiple-choice questions about your selected technologies. You need 70% correct to pass.
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

              <button
                onClick={() => setStep(1)}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Back to Tech Stack
              </button>
            </>
          ) : verificationMethod === 'quiz' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Coding Knowledge Quiz
              </h2>
              <p className="text-gray-600 mb-6">
                Answer these {filteredQuestions.length} multiple-choice questions about the languages you selected. You need {requiredCorrect} correct answers to pass.
              </p>

              {filteredQuestions.length < 4 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      You've selected technologies without coding questions. We recommend also selecting a programming language like JavaScript, Python, Java, or C++.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-6">
                {filteredQuestions.map((q, index) => (
                  <div key={q.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-full text-sm">
                            {q.language}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 mb-3">{q.question}</p>
                        <pre className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-sm overflow-x-auto mb-4">
                          <code className="text-gray-800">{q.code}</code>
                        </pre>
                        <div className="space-y-2">
                          {q.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleAnswerSelect(q.id, option)}
                              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                                answers[q.id] === option
                                  ? 'border-primary bg-primary/5 font-semibold'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-900">
                    Questions answered: {Object.keys(answers).length}/{filteredQuestions.length}
                  </span>
                  <div className="flex gap-1">
                    {filteredQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={`w-8 h-2 rounded-full ${
                          answers[q.id] ? 'bg-blue-600' : 'bg-blue-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {validationResult && (
                <div className={`${
                  validationResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                } border-2 rounded-lg p-4 mb-6`}>
                  <div className="flex items-start gap-2">
                    {validationResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${
                        validationResult.success ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        {validationResult.success ? '🎉 Quiz Passed!' : 'Keep Trying!'}
                      </p>
                      <p className={`text-sm ${
                        validationResult.success ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {validationResult.message}
                      </p>
                      {validationResult.score !== undefined && validationResult.total !== undefined && (
                        <p className={`text-sm font-bold mt-1 ${
                          validationResult.success ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          Score: {validationResult.score}/{validationResult.total} (Need {requiredCorrect} to pass)
                        </p>
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
                    setStep(1);
                    setAnswers({});
                    setValidationResult(null);
                    setError('');
                  }}
                  disabled={submitting}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                {!validationResult?.success ? (
                  <button
                    onClick={handleValidate}
                    disabled={validating || Object.keys(answers).length < filteredQuestions.length}
                    className="flex-1 px-6 py-4 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {validating ? (
                      <>
                        <Sparkles className="w-5 h-5 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Answers
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-secondary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-5 h-5 animate-spin" />
                        Completing Setup...
                      </>
                    ) : (
                      'Complete Setup & Start Learning'
                    )}
                  </button>
                )}
              </div>
            </>
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
                  disabled={certificateVerifying || submitting}
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
                        <Sparkles className="w-5 h-5 animate-spin" />
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
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-secondary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-5 h-5 animate-spin" />
                        Completing Setup...
                      </>
                    ) : (
                      'Complete Setup & Start Learning'
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">
                <strong>Why do we ask this?</strong> Your tech stack helps us recommend relevant communities and match you with hackathon teams that need your skills. The quiz ensures you have fundamental programming knowledge in your selected languages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
