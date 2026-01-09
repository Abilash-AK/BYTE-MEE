import React, { useEffect, useMemo, useState } from 'react';
import { FaClock, FaArrowRight, FaFire, FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTodayChallenge, getPartners, joinDailySession, getStreak, submitFeedback, getArchive } from '../services/dailyPods';

const DailyPodCard = () => {
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [partners, setPartners] = useState([]);
    const [timeLeft, setTimeLeft] = useState('');
    const [joined, setJoined] = useState(false);
    const [streak, setStreak] = useState(getStreak());
    const [sessionId, setSessionId] = useState('');
    const [feedback, setFeedback] = useState('');
    const [archive, setArchive] = useState(getArchive());

    useEffect(() => {
        const data = getTodayChallenge();
        setChallenge(data);
        setPartners(getPartners());

        const updateCountdown = () => {
            const now = new Date();
            const target = new Date(data.releaseAt);
            const diff = target - now;
            if (diff <= 0) {
                setTimeLeft('Unlocked – ready now');
            } else {
                const hrs = Math.floor(diff / 1000 / 60 / 60);
                const mins = Math.floor((diff / 1000 / 60) % 60);
                const secs = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleJoin = () => {
        const result = joinDailySession();
        setJoined(true);
        setStreak(result.streak);
        setSessionId(result.sessionId);
        setArchive(getArchive());
        navigate('/workspace');
    };

    const handleFeedback = () => {
        if (!sessionId || !feedback.trim()) return;
        submitFeedback(sessionId, feedback.trim());
        setFeedback('');
        setArchive(getArchive());
    };

    const isLocked = useMemo(() => challenge?.status === 'locked', [challenge]);

    if (!challenge) return null;

    return (
        <div className="card" style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid transparent',
            background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, var(--color-support), var(--color-energy)) border-box'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <span style={{
                        backgroundColor: 'var(--color-joy)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                    }}>
                        Daily Challenge
                    </span>
                    <h2 style={{ fontSize: '1.8rem', marginTop: '1rem', color: 'var(--color-primary)' }}>
                        {challenge.title}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        {challenge.description}
                    </p>
                    <div style={{ display: 'inline-flex', gap: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="pill"><FaClock /> {challenge.durationMinutes} min build</span>
                        <span className="pill">Static brief + timer</span>
                        <span className="pill">Random partner match</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><FaFire color="var(--color-energy)" /> Streak: {streak} days</span>
                        <span style={{ fontSize: '0.9rem' }}>{isLocked ? 'Unlocks at 9:00' : 'Available now'}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%', border: '4px solid var(--color-energy)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-energy)'
                    }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1, textAlign: 'center' }}>{timeLeft || '...'}</span>
                        <span style={{ fontSize: '0.75rem' }}>{isLocked ? 'until 9 AM' : 'left'}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex' }}>
                        {partners.map((p, idx) => (
                            <img key={p.name} src={p.avatar} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', marginLeft: idx === 0 ? 0 : '-10px' }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FaUserFriends /> Auto-matched partners are waiting
                    </span>
                </div>

                <button
                    className="btn"
                    onClick={handleJoin}
                    style={{
                        background: isLocked ? '#ccc' : 'var(--color-primary)',
                        color: 'white',
                        padding: '0.8rem 2rem',
                        boxShadow: '0 4px 15px rgba(106, 44, 112, 0.3)',
                        opacity: isLocked ? 0.6 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isLocked}
                >
                    {joined ? 'Rejoin Session' : 'Join Pod Now'} <FaArrowRight />
                </button>
            </div>

            {joined && (
                <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Post-session feedback</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Optional</span>
                    </div>
                    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What worked? What to improve?" style={{ width: '100%', minHeight: '70px', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                    <button className="btn btn-primary" style={{ marginTop: '0.6rem' }} onClick={handleFeedback} disabled={!feedback.trim()}>Submit feedback</button>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>You can rejoin the collaboration space anytime.</p>
                </div>
            )}

            {archive.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Recent Daily Pods</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {archive.slice(-3).reverse().map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <span>{item.title}</span>
                                <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyPodCard;
