import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Brain, ShieldCheck, Send, Loader2, Lightbulb } from 'lucide-react';
import Sidebar from '@/react-app/components/Sidebar';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import { getChallengesBySkill, supportedChallengeSkills, CodingChallenge } from '@/shared/codingChallenges';

const extractAiPointers = (value?: string, maxItems = 8) => {
  if (!value) return [];
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pointers: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    pointers.push(paragraphBuffer.join(' '));
    paragraphBuffer = [];
  };

  for (const line of lines) {
    if (/^[-*•]/.test(line)) {
      flushParagraph();
      pointers.push(line.replace(/^[-*•]\s*/, ''));
      continue;
    }

    paragraphBuffer.push(line);

    if (/[.!?]$/.test(line)) {
      flushParagraph();
    }
  }

  flushParagraph();

  return pointers.slice(0, maxItems);
};

const AiSuggestion = ({ text }: { text?: string }) => {
  const pointers = extractAiPointers(text);

  if (!pointers.length) {
    return <p className="text-sm text-gray-600">No AI notes yet.</p>;
  }

  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
      {pointers.map((item, index) => (
        <li key={`ai-pointer-${index}`} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
};

const parseSkills = (value?: string | null) => {
  if (!value) return [];
  const normalized = value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
};

type EvaluationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'done';
      verdict: string;
      score?: number;
      feedback?: string;
      passedTests?: string[];
      raw?: string;
    };

type AiAssistState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; response: string };

export default function CodingChallenges() {
  const { user } = useAuth();
  const { checking, isPending } = useOnboardingCheck();

  const profileSkills = useMemo(() => parseSkills(user?.tech_stack), [user?.tech_stack]);
  const supportedUserSkills = useMemo(() => {
    if (!profileSkills.length) return supportedChallengeSkills;
    const intersection = profileSkills.filter((skill) => supportedChallengeSkills.includes(skill));
    return intersection.length ? intersection : supportedChallengeSkills;
  }, [profileSkills]);

  const defaultSkill = supportedUserSkills[0] ?? supportedChallengeSkills[0] ?? 'JavaScript';
  const [selectedSkill, setSelectedSkill] = useState<string>(defaultSkill);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(() => {
    const initialChallenges = getChallengesBySkill(defaultSkill);
    return initialChallenges[0]?.id ?? null;
  });
  const [codeDraft, setCodeDraft] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationState>({ status: 'idle' });
  const [aiAssist, setAiAssist] = useState<AiAssistState>({ status: 'idle' });

  const skillChallenges = useMemo(() => getChallengesBySkill(selectedSkill), [selectedSkill]);
  const activeChallenge = useMemo<CodingChallenge | undefined>(
    () => skillChallenges.find((challenge) => challenge.id === activeChallengeId) || skillChallenges[0],
    [skillChallenges, activeChallengeId]
  );

  useEffect(() => {
    if (!supportedUserSkills.length) return;
    if (!supportedUserSkills.includes(selectedSkill)) {
      setSelectedSkill(supportedUserSkills[0]);
    }
  }, [supportedUserSkills, selectedSkill]);

  useEffect(() => {
    setActiveChallengeId((previous) => {
      if (previous && skillChallenges.some((challenge) => challenge.id === previous)) {
        return previous;
      }
      return skillChallenges[0]?.id ?? null;
    });
  }, [skillChallenges]);

  useEffect(() => {
    if (activeChallenge) {
      setCodeDraft(activeChallenge.starterCode.trim());
      setEvaluation({ status: 'idle' });
      setAiAssist({ status: 'idle' });
    }
  }, [activeChallenge?.id]);

  if (isPending || checking || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  const handleEvaluate = async () => {
    if (!activeChallenge) return;
    setEvaluation({ status: 'loading' });

    try {
      const response = await fetch('/api/challenges/evaluate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: activeChallenge.id,
          skill: selectedSkill,
          language: activeChallenge.language,
          code: codeDraft,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setEvaluation({
          status: 'error',
          message: payload?.error || 'AI evaluation failed. Please try again.',
        });
        return;
      }

      setEvaluation({
        status: 'done',
        verdict: payload?.report?.verdict || 'See AI feedback below',
        score: payload?.report?.score,
        feedback: payload?.report?.feedback || payload?.rawText,
        passedTests: payload?.report?.passedTests,
        raw: payload?.rawText,
      });
    } catch (error) {
      setEvaluation({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error while scoring code.',
      });
    }
  };

  const handleAiAssist = async () => {
    if (!activeChallenge) return;
    setAiAssist({ status: 'loading' });

    try {
      const response = await fetch('/api/challenges/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: activeChallenge.id,
          skill: selectedSkill,
          code: codeDraft,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setAiAssist({
          status: 'error',
          message: payload?.error || 'AI helper could not respond. Try again in a moment.',
        });
        return;
      }

      setAiAssist({ status: 'done', response: payload?.message || payload?.rawText });
    } catch (error) {
      setAiAssist({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error while generating guidance.',
      });
    }
  };

  const evaluationBadge = (() => {
    switch (evaluation.status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            {evaluation.verdict}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
            ⚠️ {evaluation.message}
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            Evaluating with AI...
          </span>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />
      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary font-semibold mb-1">
                Personalized practice
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Coding Challenges</h1>
              <p className="text-gray-600">
                Pick a skill, solve a curated prompt, and let AI review or explain the solution.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md px-4 py-3 flex items-center gap-3 border border-primary/10">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-500">AI Mentor powered by Gemini</p>
                <p className="text-base font-semibold text-gray-900">Instant feedback & guidance</p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Focus skill</h2>
            <div className="flex flex-wrap gap-2">
              {supportedUserSkills.map((skill) => {
                const isActive = selectedSkill === skill;
                return (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pick a challenge</h3>
                  <p className="text-sm text-gray-500">Designed for {selectedSkill} practitioners</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                  {skillChallenges.length} options
                </span>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {skillChallenges.map((challenge) => {
                  const isActive = challenge.id === activeChallenge?.id;
                  return (
                    <button
                      key={challenge.id}
                      onClick={() => setActiveChallengeId(challenge.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                          {challenge.difficulty}
                        </p>
                        <span className="text-xs text-gray-500">{challenge.estimatedTime}</span>
                      </div>
                      <p className="text-base font-bold text-gray-900">{challenge.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{challenge.summary}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:col-span-2 space-y-6">
              {activeChallenge ? (
                <>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {activeChallenge.skill}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                        {activeChallenge.language}
                      </span>
                      {evaluationBadge}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{activeChallenge.title}</h2>
                    <p className="text-gray-600">{activeChallenge.prompt}</p>
                    <ul className="flex flex-wrap gap-2 text-sm text-gray-500">
                      {activeChallenge.acceptanceCriteria.map((criterion) => (
                        <li key={criterion} className="px-3 py-1 bg-gray-100 rounded-full">
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label htmlFor="code-editor" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Your solution
                    </label>
                    <textarea
                      id="code-editor"
                      value={codeDraft}
                      onChange={(event) => setCodeDraft(event.target.value)}
                      className="w-full min-h-[260px] font-mono text-sm bg-gray-900 text-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleEvaluate}
                      disabled={evaluation.status === 'loading'}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-secondary text-white font-semibold hover:bg-secondary/90 disabled:opacity-70"
                    >
                      {evaluation.status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                      Run AI review
                    </button>
                    <button
                      onClick={handleAiAssist}
                      disabled={aiAssist.status === 'loading'}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 disabled:opacity-70"
                    >
                      {aiAssist.status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Lightbulb className="w-5 h-5" />
                      )}
                      Ask AI for help
                    </button>
                    <button
                      onClick={() => setCodeDraft(activeChallenge.starterCode.trim())}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                    >
                      <Send className="w-5 h-5" />
                      Reset starter code
                    </button>
                  </div>

                  {evaluation.status === 'done' && (
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 space-y-2">
                      <p className="font-semibold text-secondary">AI verdict</p>
                      <AiSuggestion text={evaluation.feedback} />
                      {typeof evaluation.score === 'number' && (
                        <p className="text-sm text-gray-600">Score: {evaluation.score}/100</p>
                      )}
                      {evaluation.passedTests?.length && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Highlighted tests:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {evaluation.passedTests.map((test) => (
                              <li key={test}>{test}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {evaluation.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                      {evaluation.message}
                    </div>
                  )}

                  {aiAssist.status === 'done' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <p className="font-semibold text-primary">AI guidance</p>
                      <AiSuggestion text={aiAssist.response} />
                    </div>
                  )}

                  {aiAssist.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                      {aiAssist.message}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No challenges available for this skill yet.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
