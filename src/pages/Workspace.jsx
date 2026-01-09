import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaMicrophone, FaVideo, FaRobot, FaMagic, FaFileCode, FaFolderOpen, FaHistory } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import { getCodeSuggestion, trackAIUsage, updateAIUsage, logAIEvent, getAIEvents } from '../services/aiService';
import websocket from '../services/websocket';
import { subscribeToDocument, updateDocument } from '../services/realtime';

const Workspace = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedFile, setSelectedFile] = useState('src/WeatherWidget.jsx');
    const [code, setCode] = useState(`import React, { useState, useEffect } from 'react';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch weather data
    fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY')
      .then(res => res.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="weather-widget">
      <h2>{weather?.name}</h2>
      <p>{weather?.main?.temp}°C</p>
    </div>
  );
};

export default WeatherWidget;`);

    const loadMessages = () => JSON.parse(localStorage.getItem('ws_messages') || '[]');
    const saveMessages = (msgs) => localStorage.setItem('ws_messages', JSON.stringify(msgs));

    const [messages, setMessages] = useState(loadMessages().length ? loadMessages() : [
        { id: 1, sender: 'Sam', text: 'Hey! I think we should use the OpenWeatherMap API for this.', timestamp: new Date() },
        { id: 2, sender: 'You', text: 'Agreed! Do we have an API key?', timestamp: new Date() },
        { id: 3, sender: 'Mila', text: 'Yeah, I just pasted it in the .env file!', timestamp: new Date() }
    ]);

    const [newMessage, setNewMessage] = useState('');
    const [aiUsage, setAiUsage] = useState({ human: 60, ai: 40 });
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [showAiPanel, setShowAiPanel] = useState(false);
    const editorRef = useRef(null);
    const [aiEvents, setAiEvents] = useState(getAIEvents());
    const [timeline] = useState([
        { id: 1, label: 'You ran tests', detail: 'npm test --watch', type: 'human', time: '2m ago' },
        { id: 2, label: 'AI suggested refactor', detail: 'Extracted useWeather hook', type: 'ai', time: '5m ago' },
        { id: 3, label: 'Commit staged', detail: 'feat: weather widget', type: 'human', time: '12m ago' },
    ]);
    const [celebrate, setCelebrate] = useState(false);
    const isSyncingRef = useRef(false);
    const codeRef = useRef(code);

        const files = [
                'src/WeatherWidget.jsx',
                'src/hooks/useWeather.js',
                'src/components/ForecastCard.jsx',
                'src/styles/weather.css',
        ];

        const fileContents = {
                'src/WeatherWidget.jsx': code,
                'src/hooks/useWeather.js': `export const useWeather = (city) => {
    return { temp: 18, city };
};
`,
                'src/components/ForecastCard.jsx': `export const ForecastCard = ({ label, temp }) => (
    <div className="forecast-card">
        <div>{label}</div>
        <strong>{temp}°C</strong>
    </div>
);
`,
                'src/styles/weather.css': `.forecast-card { padding: 12px; border: 1px solid #eee; border-radius: 8px; }
`,
        };

    useEffect(() => {
        websocket.connect('demo-user');
        websocket.on('message', (msg) => {
            setMessages(prev => {
                const next = [...prev, msg];
                saveMessages(next);
                return next;
            });
        });

        const unsubscribe = subscribeToDocument('daily-pod-code', (content, isInitial) => {
            if (content && content !== codeRef.current) {
                isSyncingRef.current = true;
                setCode(content);
                codeRef.current = content;
                if (!isInitial) {
                    logAIEvent({ type: 'human-sync', detail: 'Live update from partner' });
                }
                setTimeout(() => { isSyncingRef.current = false; }, 50);
            }
        });

        return () => {
            websocket.disconnect();
            unsubscribe?.();
        };
    }, []);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const handleCodeChange = (value) => {
        if (!value) return;
        setCode(value);
        codeRef.current = value;
        if (!isSyncingRef.current) {
            updateDocument('daily-pod-code', value);
            updateAIUsage('human', 1);
            setAiUsage(trackAIUsage());
            const events = logAIEvent({ type: 'human-edit', detail: `Edited ${selectedFile}` });
            setAiEvents(events);
        }
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        if (fileContents[file] && file !== 'src/WeatherWidget.jsx') {
            setCode(fileContents[file]);
        }
    };

    const handleAiAssist = async () => {
        setShowAiPanel(true);
        const suggestion = await getCodeSuggestion(code, 'Improve this weather widget code');
        setAiSuggestion(suggestion);
        updateAIUsage('ai', 5);
        setAiUsage(trackAIUsage());
        const events = logAIEvent({ type: 'ai-suggest', detail: `AI suggestion on ${selectedFile}` });
        setAiEvents(events);
    };

    const handleRunCode = () => {
        alert(`Running ${selectedFile}... (simulated in sandbox)`);
        const events = logAIEvent({ type: 'human-run', detail: `Ran code in ${selectedFile}` });
        setAiEvents(events);
    };

    const handleComplete = () => {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2500);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now(),
            sender: 'You',
            text: newMessage,
            timestamp: new Date()
        };

        setMessages(prev => {
            const next = [...prev, msg];
            saveMessages(next);
            return next;
        });
        websocket.sendMessage('demo-pod', newMessage);
        setNewMessage('');
    };

    const tasks = [
        { id: 1, text: 'Setup API Client', color: 'var(--color-support)' },
        { id: 2, text: 'Create Loading State', color: 'var(--color-joy)' },
        { id: 3, text: 'Style Component', color: 'var(--color-primary)' }
    ];

    const totalUsage = aiUsage.human + aiUsage.ai;
    const aiPercent = totalUsage > 0 ? (aiUsage.ai / totalUsage) * 100 : 40;
    const humanPercent = 100 - aiPercent;

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#1e1e1e', overflow: 'hidden' }}>

            {/* LEFT: File tree + Code Editor */}
            <div style={{ display: 'flex', flex: 1, borderRight: '1px solid #333' }}>

                {/* File Tree */}
                <div style={{ width: '220px', background: '#151515', borderRight: '1px solid #333', padding: '0.75rem', color: '#ccc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#fff' }}>
                        <FaFolderOpen /> Files
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {files.map((file) => {
                            const isActive = selectedFile === file;
                            return (
                                <button
                                    key={file}
                                    onClick={() => handleFileSelect(file)}
                                    style={{
                                        textAlign: 'left',
                                        background: isActive ? '#252526' : 'transparent',
                                        color: isActive ? 'var(--color-energy)' : '#ccc',
                                        border: '1px solid #252526',
                                        borderRadius: '6px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <FaFileCode size={14} /> {file}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Editor Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Editor Toolbar */}
                <div style={{
                    height: '50px', background: '#252526', borderBottom: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-energy)', fontWeight: 600 }}>{selectedFile}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleAiAssist}
                            className="btn"
                            style={{ background: 'var(--color-primary)', color: 'white', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                            <FaMagic size={12} /> AI Assist
                        </button>
                        <button
                            onClick={handleRunCode}
                            className="btn"
                            style={{ background: 'var(--color-energy)', color: 'white', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                            <FaPlay size={12} /> Run
                        </button>
                        <button
                            onClick={handleComplete}
                            className="btn"
                            style={{ background: '#1b8a5a', color: 'white', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                        >
                            Complete Challenge
                        </button>
                    </div>
                </div>

                {/* Monaco Editor */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={code}
                        onChange={handleCodeChange}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />

                    {/* AI Suggestion Panel */}
                    {showAiPanel && aiSuggestion && (
                        <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            maxWidth: '300px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaRobot /> AI Suggestion
                                </span>
                                <button onClick={() => setShowAiPanel(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>✕</button>
                            </div>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{aiSuggestion}</p>
                        </div>
                    )}
                </div>

                {/* AI Transparency Widget */}
                <div style={{
                    background: '#252526', padding: '0.8rem', borderTop: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ccc'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaRobot color="var(--color-primary)" />
                        <span style={{ fontSize: '0.8rem' }}>AI Assistance</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, maxWidth: '200px', margin: '0 1rem' }}>
                        <div style={{ height: '4px', flex: aiPercent, background: 'var(--color-energy)', borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', flex: humanPercent, background: 'var(--color-joy)', borderRadius: '2px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{Math.round(aiPercent)}% AI / {Math.round(humanPercent)}% Human</div>
                </div>
                {celebrate && (
                    <div style={{ background: '#0f5132', color: '#d1e7dd', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                        🎉 Challenge complete! Great job finishing today’s pod.
                    </div>
                )}
                </div>
            </div>

            {/* RIGHT: Communication Panel + Timeline */}
            <div style={{ width: '370px', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)' }}>

                {/* Video Placeholder */}
                <div style={{ height: '200px', background: '#000', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'white', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>Sam</span>
                        <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>Mila</span>
                    </div>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '80px', height: '60px', background: '#333', borderRadius: '8px', border: '1px solid #555' }}></div>

                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                        <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}><FaMicrophone /></button>
                        <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}><FaVideo /></button>
                    </div>
                </div>

                {/* Tab Nav */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            flex: 1, padding: '1rem', background: 'transparent',
                            borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : 'none',
                            color: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600
                        }}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        style={{
                            flex: 1, padding: '1rem', background: 'transparent',
                            borderBottom: activeTab === 'tasks' ? '2px solid var(--color-primary)' : 'none',
                            color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600
                        }}
                    >
                        Tasks
                    </button>
                </div>

                {/* Chat/Task Content */}
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {activeTab === 'chat' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                                        background: msg.sender === 'You' ? 'var(--color-primary)' : '#F0F0F0',
                                        color: msg.sender === 'You' ? 'white' : 'var(--color-text-main)',
                                        padding: '0.8rem',
                                        borderRadius: msg.sender === 'You' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        maxWidth: '85%'
                                    }}
                                >
                                    {msg.sender !== 'You' && <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{msg.sender}</div>}
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {tasks.map(task => (
                                <div key={task.id} style={{ background: '#FFF9C4', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${task.color}` }}>
                                    {task.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {activeTab === 'chat' && (
                    <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{
                                width: '100%', padding: '0.8rem',
                                borderRadius: '20px', border: '1px solid var(--color-border)',
                                outline: 'none'
                            }}
                        />
                    </form>
                )}

                {/* Version Timeline */}
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '1rem', background: '#f9f9ff' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Live sync: simulated Firebase Realtime DB for this demo.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <FaHistory />
                        <strong>Version Timeline</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {timeline.map(item => (
                            <div key={item.id} style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', background: item.type === 'ai' ? '#fff4f8' : '#f4f7ff', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: item.type === 'ai' ? 'var(--color-energy)' : 'var(--color-primary)' }}>{item.label}</span>
                                    <small style={{ color: 'var(--color-text-muted)' }}>{item.time}</small>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{item.detail}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            <FaRobot /> AI Transparency Ledger
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                            {aiEvents.slice(-5).reverse().map(e => (
                                <div key={e.id} style={{ fontSize: '0.9rem', color: '#555', borderBottom: '1px dashed var(--color-border)', paddingBottom: '4px' }}>
                                    <strong style={{ color: e.type.includes('ai') ? 'var(--color-energy)' : 'var(--color-primary)' }}>{e.type}</strong>
                                    <span style={{ marginLeft: '6px' }}>{e.detail}</span>
                                </div>
                            ))}
                            {aiEvents.length === 0 && <small style={{ color: 'var(--color-text-muted)' }}>No events yet.</small>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Workspace;
