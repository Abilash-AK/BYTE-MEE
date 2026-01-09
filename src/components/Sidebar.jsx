import React from 'react';
import { FaHome, FaCode, FaChartLine, FaUserFriends, FaFire, FaUserCircle } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();
    const userName = user?.displayName?.split(' ')[0] || 'User';
    const userPhoto = user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '3rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>C</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>CoLearn</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SidebarLink to="/dashboard" icon={<FaHome />} label="Hub" />
                <SidebarLink to="/pods" icon={<FaUserFriends />} label="Pods" />
                <SidebarLink to="/workspace" icon={<FaCode />} label="Collab Space" />
                <SidebarLink to="/profile" icon={<FaUserCircle />} label="Profile" />
                <SidebarLink to="/dashboard#growth" icon={<FaChartLine />} label="Growth" />
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ position: 'relative' }}>
                        <img src={userPhoto} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white' }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: 'var(--color-support)', borderRadius: '50%', border: '2px solid var(--color-primary)' }}></div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaFire color="var(--color-energy)" /> 12 day streak
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const SidebarLink = ({ icon, label, to }) => (
    <NavLink to={to} style={({ isActive: active }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.8rem 1rem',
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)',
        backgroundColor: active ? 'var(--color-support)' : 'transparent',
        textDecoration: 'none',
        fontWeight: 600,
        transition: 'all 0.2s'
    })}>
        {icon}
        {label}
    </NavLink>
);

export default Sidebar;
