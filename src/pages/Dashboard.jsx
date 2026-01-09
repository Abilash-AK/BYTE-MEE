import React from 'react';
import Sidebar from '../components/Sidebar';
import DailyPodCard from '../components/DailyPodCard';
import MainFeaturesGrid from '../components/MainFeaturesGrid';
import SkillVerificationCard from '../components/SkillVerificationCard';
import PortfolioCard from '../components/PortfolioCard';
import { FaFire, FaGithub, FaPlusCircle, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const userName = user?.displayName?.split(' ')[0] || 'Friend';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar />

            <main style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                {/* Center Stage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Good morning, {userName}! ☀️</h1>
                            <p style={{ color: 'var(--color-text-muted)' }}>Ready to grow your skills today?</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => window.location.assign('/pods')}><FaPlusCircle /> Create Pod</button>
                            <button className="btn" style={{ border: '1px solid var(--color-border)', background: '#fffaf2' }} onClick={() => window.location.assign('/dashboard#daily')}><FaUsers /> Join Daily Pod</button>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {[
                            { label: 'Daily streak', value: '12 days' },
                            { label: 'Pods joined', value: '4' },
                            { label: 'AI assists', value: '8 this week' },
                        ].map(stat => (
                            <div key={stat.label} className="card" style={{ padding: '1rem' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{stat.label}</div>
                                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-primary)' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div id="daily">
                        <DailyPodCard />
                    </div>

                    <MainFeaturesGrid />

                    <SkillVerificationCard />

                    <PortfolioCard />

                    <div>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>Recommended for you</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {[1, 2].map(i => (
                                <div key={i} className="card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-joy)', fontWeight: 600 }}>REACT BASICS</span>
                                        <FaFire color="var(--color-energy)" />
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Component Lifecycle</h4>
                                    <div style={{ height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '60%', background: 'var(--color-energy)' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Skill Progress */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Skill Progress</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-energy)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="70" strokeLinecap="round" transform="rotate(-90 50 50)" />
                                </svg>
                                <div style={{ position: 'absolute', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>75%</div>
                                    <div style={{ fontSize: '0.7rem' }}>React</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Heatmap Mock */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <FaGithub size={20} />
                            <h3 style={{ fontSize: '1.1rem' }}>Activity</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {Array.from({ length: 28 }).map((_, i) => (
                                <div key={i} style={{
                                    height: '12px',
                                    borderRadius: '2px',
                                    background: Math.random() > 0.7 ? 'var(--color-primary)' : Math.random() > 0.4 ? 'var(--color-joy)' : '#eee'
                                }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Pods */}
                    <div className="card" style={{ background: '#FFFDF0', border: '1px solid var(--color-support)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Upcoming Pods</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', fontWeight: 700, textAlign: 'center' }}>14:00</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>JavaScript Algo</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>with Sarah & Mike</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Dashboard;
