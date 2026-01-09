import React, { useMemo, useState } from 'react';
import { FaPlus, FaLock, FaGlobe, FaUsers, FaFilter, FaSearch, FaStar, FaEyeSlash, FaCalendarAlt, FaClock, FaCheck, FaClipboardList, FaShieldAlt, FaBolt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';

const basePods = [
    {
        id: 'pod-hack-1',
        name: 'Hackathon: Build a DevRel Dashboard',
        type: 'hackathon',
        visibility: 'public',
        requiredSkills: ['React', 'TypeScript', 'API Design'],
        experience: 'Intermediate',
        duration: '48h',
        teamSize: 3,
        objectives: 'Ship a live dashboard with GitHub data and onboarding funnel.',
        success: 'Demo-ready UI + clean API integration + tests.',
        blindReview: true,
        status: 'open',
        spotsLeft: 2,
    },
    {
        id: 'pod-proj-1',
        name: 'AI Study Planner (2-6 weeks)',
        type: 'project',
        visibility: 'invite',
        requiredSkills: ['Node.js', 'React', 'UX'],
        experience: 'Intermediate',
        duration: '2-6 weeks',
        teamSize: 5,
        objectives: 'Plan/track learning journeys with spaced repetition.',
        success: 'MVP with auth, planner, reminders, and analytics.',
        blindReview: false,
        status: 'open',
        spotsLeft: 3,
    },
    {
        id: 'pod-study-1',
        name: 'System Design Study Circle',
        type: 'study',
        visibility: 'private',
        requiredSkills: ['Architecture', 'Databases'],
        experience: 'All levels',
        duration: '4 weeks',
        teamSize: 6,
        objectives: 'Weekly deep-dives on scaling patterns and trade-offs.',
        success: '4 sessions + notes + mock designs reviewed.',
        blindReview: true,
        status: 'open',
        spotsLeft: 4,
    },
];

const typeLabels = {
    hackathon: 'Hackathon (48h)',
    project: 'Project Pod (2-6 weeks)',
    study: 'Study Pod',
};

const visibilityIcon = {
    public: <FaGlobe title="Public" />,
    private: <FaLock title="Private" />,
    invite: <FaEyeSlash title="Invite-only" />,
};

const Pods = () => {
    const [pods, setPods] = useState(basePods);
    const [saved, setSaved] = useState(new Set());
    const [applicationForm, setApplicationForm] = useState({ podId: '', message: '', availability: '', experience: '', coffeeChat: '', allowBlind: true });
    const [applications, setApplications] = useState({}); // podId -> {status, note, coffeeChat}
    const [filters, setFilters] = useState({ search: '', skill: '', duration: '', teamSize: '' });
    const [newPod, setNewPod] = useState({
        name: '',
        type: 'hackathon',
        visibility: 'public',
        requiredSkills: 'React, API Design',
        experience: 'Intermediate',
        duration: '48h',
        teamSize: 3,
        objectives: '',
        success: '',
        blindReview: true,
    });

    const userSkills = ['React', 'Node.js', 'UX', 'APIs'];

    const filteredPods = useMemo(() => pods.filter(pod => {
        const matchesSearch = filters.search
            ? pod.name.toLowerCase().includes(filters.search.toLowerCase()) || pod.objectives.toLowerCase().includes(filters.search.toLowerCase())
            : true;
        const matchesSkill = filters.skill
            ? pod.requiredSkills.some(skill => skill.toLowerCase().includes(filters.skill.toLowerCase()))
            : true;
        const matchesDuration = filters.duration ? pod.duration === filters.duration : true;
        const matchesSize = filters.teamSize ? pod.teamSize <= Number(filters.teamSize) : true;
        return matchesSearch && matchesSkill && matchesDuration && matchesSize;
    }), [pods, filters]);

    const recommendedPods = useMemo(() => filteredPods
        .map(pod => ({
            pod,
            score: pod.requiredSkills.reduce((score, skill) => score + (userSkills.some(u => skill.toLowerCase().includes(u.toLowerCase())) ? 1 : 0), 0),
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.pod)
        .slice(0, 3), [filteredPods, userSkills]);

    const handleCreatePod = (e) => {
        e.preventDefault();
        const skills = newPod.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
        const pod = {
            id: `pod-${Date.now()}`,
            name: newPod.name || 'Untitled Pod',
            type: newPod.type,
            visibility: newPod.visibility,
            requiredSkills: skills.length ? skills : ['Generalist'],
            experience: newPod.experience,
            duration: newPod.duration,
            teamSize: Number(newPod.teamSize) || 3,
            objectives: newPod.objectives || 'Collaborate and build together.',
            success: newPod.success || 'Working demo + learnings.',
            blindReview: newPod.blindReview,
            status: 'open',
            spotsLeft: Number(newPod.teamSize) - 1,
        };
        setPods([pod, ...pods]);
        setNewPod({ ...newPod, name: '', requiredSkills: 'React, API Design', objectives: '', success: '' });
    };

    const handleApply = (podId) => {
        if (!applicationForm.message || !applicationForm.experience) return;
        setApplications(prev => ({
            ...prev,
            [podId]: {
                status: 'Submitted',
                note: applicationForm.message,
                coffeeChat: applicationForm.coffeeChat || 'Propose a 15-min chat',
                blind: applicationForm.allowBlind,
            }
        }));
        setApplicationForm({ podId: '', message: '', availability: '', experience: '', coffeeChat: '', allowBlind: true });
    };

    const handleStatusChange = (podId, status) => {
        setApplications(prev => ({
            ...prev,
            [podId]: {
                ...(prev[podId] || {}),
                status,
                autoMessage: status === 'Accepted' ? 'Auto-acceptance note sent to applicant.' : status === 'Rejected' ? 'Auto-rejection note sent to applicant.' : undefined,
            }
        }));
    };

    const toggleSave = (podId) => {
        const next = new Set(saved);
        if (next.has(podId)) next.delete(podId); else next.add(podId);
        setSaved(next);
    };

    const activeFormPodId = applicationForm.podId;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Create Pod */}
                    <section className="card" style={{ padding: '1.5rem' }}>
                        <header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <FaPlus color="var(--color-primary)" />
                            <h2 style={{ margin: 0 }}>Create a Pod</h2>
                        </header>
                        <form onSubmit={handleCreatePod} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <input value={newPod.name} onChange={(e) => setNewPod({ ...newPod, name: e.target.value })} placeholder="Pod name" style={inputStyle} />
                            <select value={newPod.type} onChange={(e) => setNewPod({ ...newPod, type: e.target.value })} style={inputStyle}>
                                <option value="hackathon">Hackathon (48h)</option>
                                <option value="project">Project Pod (2-6 weeks)</option>
                                <option value="study">Study Pod</option>
                            </select>
                            <select value={newPod.visibility} onChange={(e) => setNewPod({ ...newPod, visibility: e.target.value })} style={inputStyle}>
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="invite">Invite-only</option>
                            </select>
                            <input value={newPod.requiredSkills} onChange={(e) => setNewPod({ ...newPod, requiredSkills: e.target.value })} placeholder="Required skills (comma separated)" style={inputStyle} />
                            <input value={newPod.experience} onChange={(e) => setNewPod({ ...newPod, experience: e.target.value })} placeholder="Experience level" style={inputStyle} />
                            <input value={newPod.duration} onChange={(e) => setNewPod({ ...newPod, duration: e.target.value })} placeholder="Duration (e.g., 48h, 4 weeks)" style={inputStyle} />
                            <input type="number" value={newPod.teamSize} min={2} onChange={(e) => setNewPod({ ...newPod, teamSize: e.target.value })} placeholder="Team size" style={inputStyle} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <input type="checkbox" checked={newPod.blindReview} onChange={(e) => setNewPod({ ...newPod, blindReview: e.target.checked })} />
                                Enable blind application review
                            </label>
                            <textarea value={newPod.objectives} onChange={(e) => setNewPod({ ...newPod, objectives: e.target.value })} placeholder="Learning objectives" style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: '80px' }} />
                            <textarea value={newPod.success} onChange={(e) => setNewPod({ ...newPod, success: e.target.value })} placeholder="Success criteria" style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: '80px' }} />
                            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', justifySelf: 'flex-start', padding: '0.8rem 1.6rem' }}>Create Pod</button>
                        </form>
                    </section>

                    {/* Filters */}
                    <section className="card" style={{ padding: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <FaFilter color="var(--color-primary)" />
                        <input placeholder="Search project type or tech" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ ...inputStyle, maxWidth: '260px' }} />
                        <input placeholder="Filter by skill" value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} style={{ ...inputStyle, maxWidth: '180px' }} />
                        <select value={filters.duration} onChange={(e) => setFilters({ ...filters, duration: e.target.value })} style={{ ...inputStyle, maxWidth: '180px' }}>
                            <option value="">Any duration</option>
                            <option value="48h">48h</option>
                            <option value="2-6 weeks">2-6 weeks</option>
                            <option value="4 weeks">4 weeks</option>
                        </select>
                        <input type="number" min={2} placeholder="Max team size" value={filters.teamSize} onChange={(e) => setFilters({ ...filters, teamSize: e.target.value })} style={{ ...inputStyle, maxWidth: '140px' }} />
                    </section>

                    {/* Pod discovery */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaSearch color="var(--color-primary)" />
                            <h3 style={{ margin: 0 }}>Browse & Apply</h3>
                        </header>
                        {recommendedPods.length > 0 && (
                            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-energy)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-energy)', fontWeight: 600 }}>
                                    <FaStar /> Recommended for you
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {userSkills.map(skill => (
                                        <span key={skill} style={{ background: '#FFF5F0', border: '1px solid var(--color-support)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.85rem' }}>{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {filteredPods.map(pod => {
                            const isSaved = saved.has(pod.id);
                            const app = applications[pod.id];
                            const openForm = activeFormPodId === pod.id;
                            return (
                                <div key={pod.id} className="card" style={{ padding: '1.2rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{pod.name}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    {visibilityIcon[pod.visibility]}
                                                    {typeLabels[pod.type]}
                                                </span>
                                                {pod.blindReview && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}><FaShieldAlt /> Blind review</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                {pod.requiredSkills.map(skill => (
                                                    <span key={skill} style={{ background: '#F4F5FB', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>{skill}</span>
                                                ))}
                                            </div>
                                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{pod.objectives}</p>
                                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaClock /> {pod.duration}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaUsers /> {pod.teamSize} ppl • {pod.spotsLeft} open</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px', alignItems: 'flex-end' }}>
                                            {app ? (
                                                <StatusPill status={app.status} />
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Status: Open</span>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn" style={{ padding: '0.5rem 0.9rem', border: '1px solid var(--color-border)' }} onClick={() => toggleSave(pod.id)}>
                                                    {isSaved ? 'Saved' : 'Save'}
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem 1rem' }}
                                                    onClick={() => setApplicationForm({ ...applicationForm, podId: pod.id })}
                                                >
                                                    {app ? 'Update' : 'Apply'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {openForm && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fafafa' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Application</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                                                <textarea
                                                    value={applicationForm.message}
                                                    onChange={(e) => setApplicationForm({ ...applicationForm, message: e.target.value })}
                                                    placeholder="Why you're a fit & what you want to learn"
                                                    style={{ ...inputStyle, minHeight: '70px', gridColumn: '1 / -1' }}
                                                />
                                                <input
                                                    value={applicationForm.experience}
                                                    onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                                                    placeholder="Experience level"
                                                    style={inputStyle}
                                                />
                                                <input
                                                    value={applicationForm.availability}
                                                    onChange={(e) => setApplicationForm({ ...applicationForm, availability: e.target.value })}
                                                    placeholder="Availability / timezone"
                                                    style={inputStyle}
                                                />
                                                <input
                                                    value={applicationForm.coffeeChat}
                                                    onChange={(e) => setApplicationForm({ ...applicationForm, coffeeChat: e.target.value })}
                                                    placeholder="Coffee chat time (e.g., Tue 3pm GMT)"
                                                    style={inputStyle}
                                                />
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={applicationForm.allowBlind}
                                                        onChange={(e) => setApplicationForm({ ...applicationForm, allowBlind: e.target.checked })}
                                                    />
                                                    Participate in blind review (hide identity until decision)
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                                                <button className="btn btn-primary" type="button" onClick={() => handleApply(pod.id)} disabled={!applicationForm.message || !applicationForm.experience}>
                                                    Submit Application
                                                </button>
                                                <button className="btn" type="button" onClick={() => setApplicationForm({ podId: '', message: '', availability: '', experience: '', coffeeChat: '', allowBlind: true })}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                </div>

                {/* Right rail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        <header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaClipboardList color="var(--color-primary)" />
                            <h4 style={{ margin: 0 }}>Application Tracker</h4>
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.8rem' }}>
                            {Object.entries(applications).length === 0 && (
                                <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No applications yet.</p>
                            )}
                            {Object.entries(applications).map(([podId, app]) => {
                                const pod = pods.find(p => p.id === podId);
                                return (
                                    <div key={podId} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{pod?.name || podId}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{app.note}</div>
                                            </div>
                                            <StatusPill status={app.status} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                                            <small style={{ color: 'var(--color-text-muted)' }}><FaCalendarAlt /> {app.coffeeChat || 'Chat pending'}</small>
                                            {app.blind && <small style={{ color: 'var(--color-text-muted)' }}><FaShieldAlt /> Blind review</small>}
                                            {app.autoMessage && <small style={{ color: 'var(--color-text-muted)' }}>{app.autoMessage}</small>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                                            <button className="btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleStatusChange(podId, 'Interview')}>
                                                Schedule Chat
                                            </button>
                                            <button className="btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleStatusChange(podId, 'Accepted')}>
                                                Accept
                                            </button>
                                            <button className="btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleStatusChange(podId, 'Rejected')}>
                                                Auto-Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1rem' }}>
                        <header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaStar color="var(--color-primary)" />
                            <h4 style={{ margin: 0 }}>Saved Pods</h4>
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.8rem' }}>
                            {pods.filter(p => saved.has(p.id)).map(pod => (
                                <div key={pod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{pod.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{typeLabels[pod.type]}</div>
                                    </div>
                                    <StatusPill status={applications[pod.id]?.status || 'Open'} />
                                </div>
                            ))}
                            {pods.filter(p => saved.has(p.id)).length === 0 && (
                                <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Save pods to track them here.</p>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-support)' }}>
                        <header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaBolt color="var(--color-support)" />
                            <h4 style={{ margin: 0 }}>Matching Insights</h4>
                        </header>
                        <ul style={{ marginTop: '0.8rem', paddingLeft: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            <li>Smart matching uses goals + skills overlap ({userSkills.join(', ')}).</li>
                            <li>Blind review toggle is available on eligible pods.</li>
                            <li>Auto messages send on accept/reject for quick turnaround.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatusPill = ({ status }) => {
    const color = status === 'Accepted' ? 'var(--color-primary)' : status === 'Rejected' ? '#d32f2f' : status === 'Interview' ? 'var(--color-energy)' : 'var(--color-text-muted)';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color, border: `1px solid ${color}`, padding: '4px 10px', borderRadius: '999px' }}>
            <FaCheck /> {status}
        </span>
    );
};

const inputStyle = {
    padding: '0.7rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '0.95rem',
    outlineColor: 'var(--color-primary)'
};

export default Pods;
