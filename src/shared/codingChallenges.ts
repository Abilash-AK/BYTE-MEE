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
  {
    id: 'js-find-max',
    title: 'Find the maximum number',
    skill: 'JavaScript',
    difficulty: 'beginner',
    summary: 'Write a function that finds the largest number in an array.',
    prompt: 'Create a function `findMax(numbers: number[]): number` that returns the largest number from the array. Return 0 if the array is empty.',
    language: 'javascript',
    estimatedTime: '5 min',
    starterCode: `function findMax(numbers) {
  // TODO: find and return the maximum number
  return 0;
}
`,
    acceptanceCriteria: [
      'Return the largest number in the array.',
      'Return 0 if the array is empty.',
      'Handle negative numbers correctly.',
    ],
    testCases: [
      { description: 'basic array', input: '[1, 5, 3, 9, 2]', expected: '9' },
      { description: 'with negatives', input: '[-1, -5, -3]', expected: '-1' },
      { description: 'empty array', input: '[]', expected: '0' },
    ],
    aiRubric: 'Check for correct maximum finding logic and proper handling of edge cases like empty arrays.',
  },
  {
    id: 'js-reverse-string',
    title: 'Reverse a string',
    skill: 'JavaScript',
    difficulty: 'beginner',
    summary: 'Write a function that reverses a given string.',
    prompt: 'Create a function `reverseString(str: string): string` that returns the reversed version of the input string.',
    language: 'javascript',
    estimatedTime: '5 min',
    starterCode: `function reverseString(str) {
  // TODO: return the reversed string
  return str;
}
`,
    acceptanceCriteria: [
      'Return the string with characters in reverse order.',
      'Handle empty strings (return empty string).',
      'Preserve all characters including spaces.',
    ],
    testCases: [
      { description: 'basic string', input: '"hello"', expected: '"olleh"' },
      { description: 'with spaces', input: '"hello world"', expected: '"dlrow olleh"' },
      { description: 'empty string', input: '""', expected: '""' },
    ],
    aiRubric: 'Verify that the string is correctly reversed character by character.',
  },
  {
    id: 'python-sum-list',
    title: 'Sum all numbers in a list',
    skill: 'Python',
    difficulty: 'beginner',
    summary: 'Write a function that adds up all numbers in a list.',
    prompt: 'Implement `sum_list(numbers: list[int]) -> int` that returns the sum of all numbers in the list. Return 0 for empty lists.',
    language: 'python',
    estimatedTime: '5 min',
    starterCode: `def sum_list(numbers):
    """Return the sum of all numbers in the list."""
    # TODO: implement
    return 0
`,
    acceptanceCriteria: [
      'Return the sum of all numbers.',
      'Return 0 if the list is empty.',
      'Handle negative numbers correctly.',
    ],
    testCases: [
      { description: 'basic list', input: '[1, 2, 3, 4]', expected: '10' },
      { description: 'with negatives', input: '[-1, 2, -3]', expected: '-2' },
      { description: 'empty list', input: '[]', expected: '0' },
    ],
    aiRubric: 'Check for correct summation logic and proper handling of edge cases.',
  },
  {
    id: 'js-check-even',
    title: 'Check if number is even',
    skill: 'JavaScript',
    difficulty: 'beginner',
    summary: 'Write a simple function that checks if a number is even.',
    prompt: 'Create a function `isEven(num: number): boolean` that returns true if the number is even, false otherwise.',
    language: 'javascript',
    estimatedTime: '3 min',
    starterCode: `function isEven(num) {
  // TODO: return true if num is even, false otherwise
  return false;
}
`,
    acceptanceCriteria: [
      'Return true for even numbers (0, 2, 4, 6, etc.).',
      'Return false for odd numbers (1, 3, 5, etc.).',
      'Handle negative numbers correctly.',
    ],
    testCases: [
      { description: 'even number', input: '4', expected: 'true' },
      { description: 'odd number', input: '5', expected: 'false' },
      { description: 'zero', input: '0', expected: 'true' },
      { description: 'negative even', input: '-2', expected: 'true' },
    ],
    aiRubric: 'Verify correct use of modulo operator to check even/odd status.',
  },
];

export const supportedChallengeSkills = Array.from(
  new Set(codingChallenges.map((challenge) => challenge.skill))
);

export const findChallengeById = (id: string) =>
  codingChallenges.find((challenge) => challenge.id === id);

export const getChallengesBySkill = (skill: string) =>
  codingChallenges.filter((challenge) => challenge.skill === skill);
