export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CodingChallenge = {
  id: string;
  title: string;
  skill: string;
  difficulty: ChallengeDifficulty;
  summary: string;
  prompt: string;
  language: 'javascript' | 'typescript' | 'python';
  estimatedTime: string;
  starterCode: string;
  acceptanceCriteria: string[];
  testCases: Array<{
    description: string;
    input: string;
    expected: string;
  }>;
  aiRubric: string;
};

export const codingChallenges: CodingChallenge[] = [
  {
    id: 'js-sum-two-numbers',
    title: 'Add two numbers',
    skill: 'JavaScript',
    difficulty: 'beginner',
    summary: 'Write a tiny helper that adds two numeric inputs and returns the result.',
    prompt: 'Create a function `addNumbers(a: number, b: number): number` that returns the sum of both inputs. Treat missing values as 0.',
    language: 'typescript',
    estimatedTime: '5 min',
    starterCode: `export function addNumbers(a?: number, b?: number): number {
  // TODO: return the sum
  return 0;
}
`,
    acceptanceCriteria: [
      'Return the combined value of both inputs.',
      'When a value is undefined, treat it as 0.',
      'Work with negative numbers as well as positives.',
    ],
    testCases: [
      { description: 'adds positives', input: 'addNumbers(2, 3)', expected: '5' },
      { description: 'handles missing second arg', input: 'addNumbers(4)', expected: '4' },
      { description: 'adds negatives', input: 'addNumbers(-1, -5)', expected: '-6' },
    ],
    aiRubric: 'Check for correct addition plus safe fallback to zero when arguments are missing.',
  },
  {
    id: 'react-click-counter',
    title: 'Render a click counter button',
    skill: 'React',
    difficulty: 'beginner',
    summary: 'Create a simple button that increments a number every time it gets clicked.',
    prompt:
      'Implement a `<ClickCounter />` component that displays the current count and increments it when the button is pressed.',
    language: 'typescript',
    estimatedTime: '8 min',
    starterCode: `import { useState } from 'react';

export function ClickCounter() {
  // TODO: track count and update on click
  return (
    <button>
      Count: 0
    </button>
  );
}
`,
    acceptanceCriteria: [
      'Use React state to store the count.',
      'Initial count should be 0 and increase by 1 per click.',
      'Show the current count inside the button text.',
    ],
    testCases: [
      {
        description: 'initial render',
        input: 'mount component',
        expected: 'button text is "Count: 0"',
      },
      {
        description: 'single click',
        input: 'click once',
        expected: 'button text updates to "Count: 1"',
      },
      {
        description: 'multiple clicks',
        input: 'click three times',
        expected: 'button text shows "Count: 3"',
      },
    ],
    aiRubric: 'Confirm that React state is used and that each click correctly increments the visible count.',
  },
  {
    id: 'python-word-count',
    title: 'Count words in a sentence',
    skill: 'Python',
    difficulty: 'beginner',
    summary: 'Split a sentence into words and report how many were provided.',
    prompt:
      "Implement `count_words(sentence: str) -> int` that trims the input, splits by whitespace, and returns how many non-empty words exist.",
    language: 'python',
    estimatedTime: '7 min',
    starterCode: `def count_words(sentence: str) -> int:
    """Return how many words appear in the input string."""
    # TODO: implement
    return 0
`,
    acceptanceCriteria: [
      'Strip leading/trailing whitespace before counting.',
      'Treat consecutive spaces as a single separator.',
      'Return 0 for empty strings after trimming.',
    ],
    testCases: [
      { description: 'basic sentence', input: "'hello world'", expected: '2' },
      { description: 'extra spaces', input: "'  spaced   out   words '", expected: '3' },
      { description: 'empty string', input: "''", expected: '0' },
    ],
    aiRubric: 'Reward solutions that trim whitespace, ignore empty segments, and correctly handle blank input.',
  },
];

export const supportedChallengeSkills = Array.from(
  new Set(codingChallenges.map((challenge) => challenge.skill))
);

export const findChallengeById = (id: string) =>
  codingChallenges.find((challenge) => challenge.id === id);

export const getChallengesBySkill = (skill: string) =>
  codingChallenges.filter((challenge) => challenge.skill === skill);
