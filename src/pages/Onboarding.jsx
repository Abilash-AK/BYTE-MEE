import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCode, FaReact, FaPython, FaNodeJs, FaJava, FaDocker } from 'react-icons/fa';
import { SiTypescript, SiJavascript } from 'react-icons/si';

const skills = [
    { id: 'react', name: 'React', icon: <FaReact size={24} /> },
    { id: 'js', name: 'JavaScript', icon: <SiJavascript size={24} /> },
    { id: 'ts', name: 'TypeScript', icon: <SiTypescript size={24} /> },
    { id: 'python', name: 'Python', icon: <FaPython size={24} /> },
    { id: 'node', name: 'Node.js', icon: <FaNodeJs size={24} /> },
    { id: 'java', name: 'Java', icon: <FaJava size={24} /> },
    { id: 'docker', name: 'Docker', icon: <FaDocker size={24} /> },
    { id: 'html', name: 'HTML/CSS', icon: <FaCode size={24} /> },
];

const Onboarding = () => {
    const [step, setStep] = useState('welcome'); // welcome | skills
    const [selectedSkills, setSelectedSkills] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 'welcome') {
            const timer = setTimeout(() => {
                setStep('skills');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const toggleSkill = (id) => {
        if (selectedSkills.includes(id)) {
            setSelectedSkills(selectedSkills.filter(s => s !== id));
        } else {
            setSelectedSkills([...selectedSkills, id]);
        }
    };

    const handleFinish = () => {
        navigate('/dashboard');
    };

    if (step === 'welcome') {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', background: 'var(--color-bg)' }}>
                <h1 className="animate-fade-in" style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                    Welcome to the circle!
                </h1>
                <p className="animate-fade-in" style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', animationDelay: '0.5s' }}>
                    Let's find your study buddies.
                </p>
                {/* Simple Pulse Animation */}
                <div style={{ marginTop: '3rem' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'var(--color-joy)',
                        animation: 'pulse 2s infinite'
                    }}></div>
                </div>
                <style>{`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(184, 59, 94, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(184, 59, 94, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(184, 59, 94, 0); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', background: 'var(--color-bg)' }}>
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>What are you learning?</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Pick a few to help us match you with the perfect pod.</p>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '3rem'
                }}>
                    {skills.map(skill => (
                        <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: selectedSkills.includes(skill.id)
                                    ? '2px solid var(--color-energy)'
                                    : '1px solid var(--color-border)',
                                background: selectedSkills.includes(skill.id)
                                    ? '#FFF5F0'
                                    : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: selectedSkills.includes(skill.id) ? 'var(--color-text-main)' : 'var(--color-text-muted)'
                            }}
                        >
                            <div style={{ color: selectedSkills.includes(skill.id) ? 'var(--color-energy)' : 'currentColor' }}>
                                {skill.icon}
                            </div>
                            <span style={{ fontWeight: 600 }}>{skill.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-center">
                    <button
                        className="btn btn-primary"
                        onClick={handleFinish}
                        disabled={selectedSkills.length === 0}
                        style={{
                            paddingLeft: '3rem', paddingRight: '3rem', fontSize: '1.1rem',
                            opacity: selectedSkills.length === 0 ? 0.5 : 1,
                            cursor: selectedSkills.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Find My Pod
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
