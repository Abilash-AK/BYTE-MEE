import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
let genAI;

try {
    genAI = new GoogleGenerativeAI(API_KEY);
} catch (error) {
    console.warn('Gemini API not configured, using mock responses');
}

export const getCodeSuggestion = async (code, prompt) => {
    // If API is not configured, return mock suggestions
    if (!genAI || API_KEY === 'demo-key') {
        return getMockSuggestion(prompt);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const fullPrompt = `You are a helpful coding assistant. Given this code:\n\n${code}\n\nUser request: ${prompt}\n\nProvide a concise code suggestion or improvement.`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI Error:', error);
        return getMockSuggestion(prompt);
    }
};

export const getCodeCompletion = async (code, cursorPosition) => {
    if (!genAI || API_KEY === 'demo-key') {
        return '// AI suggestion: Add error handling here';
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Complete this code snippet:\n${code}\n\nProvide only the next 1-2 lines of code.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI Error:', error);
        return '// AI completion unavailable';
    }
};

const LEDGER_KEY = 'ai_ledger_events';

const getMockSuggestion = (prompt) => {
    const suggestions = [
        '// Consider adding error handling with try-catch',
        '// You might want to add loading states for better UX',
        '// Consider extracting this into a reusable component',
        '// Add PropTypes or TypeScript for type safety',
        '// Consider memoizing this function with useCallback'
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
};

export const trackAIUsage = () => {
    // Simple tracking - in production, use analytics
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '{"human": 0, "ai": 0}');
    return usage;
};

export const updateAIUsage = (type, amount = 1) => {
    const usage = trackAIUsage();
    usage[type] = (usage[type] || 0) + amount;
    localStorage.setItem('ai_usage', JSON.stringify(usage));
    return usage;
};

const readLedger = () => JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]');

const writeLedger = (events) => localStorage.setItem(LEDGER_KEY, JSON.stringify(events.slice(-50)));

export const logAIEvent = (entry) => {
    const events = readLedger();
    events.push({
        id: Date.now(),
        ...entry,
        at: new Date().toISOString()
    });
    writeLedger(events);
    return events;
};

export const getAIEvents = () => readLedger();
