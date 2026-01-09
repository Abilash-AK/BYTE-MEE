import React, { useState } from 'react';
import { FaGithub, FaUserEdit, FaCheckCircle } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const [draft, setDraft] = useState({
    name: profile?.name || 'Learner',
    email: profile?.email || 'demo@colearn.dev',
    github: profile?.github || '',
  });
  const [skills] = useState(['React', 'Node.js', 'UX', 'APIs']);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <img src={profile?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Profile'} alt="avatar" style={{ width: '88px', height: '88px', borderRadius: '50%', border: '4px solid var(--color-support)' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>{profile?.name || 'New learner'}</h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{profile?.email}</p>
              {profile?.github && (
                <div style={{ marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '6px 10px', borderRadius: 'var(--radius-full)', background: '#f5f5f5', color: '#24292e', border: '1px solid var(--color-border)' }}>
                  <FaGithub /> @{profile.github}
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ height: '42px' }}>
              <FaUserEdit /> Save Profile
            </button>
          </div>

          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <label style={labelStyle}>Name<input style={inputStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label style={labelStyle}>Email<input style={inputStyle} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label style={labelStyle}>GitHub Username (optional)
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={draft.github} onChange={(e) => setDraft({ ...draft, github: e.target.value })} placeholder="octocat" />
                <button className="btn" style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)' }} onClick={handleSave}><FaGithub /> Connect</button>
              </div>
            </label>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Skills</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Auto-tagged from pods you joined.</p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {skills.map(skill => (
                <span key={skill} style={{ background: '#FFF5F0', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-support)', fontWeight: 600, color: 'var(--color-text-main)' }}>{skill}</span>
              ))}
            </div>
          </div>

          {saved && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-energy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaCheckCircle color="var(--color-energy)" /> Profile saved locally for this demo.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Pod Journey</h4>
            <ul style={{ paddingLeft: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              <li>Joined React Daily Pod</li>
              <li>Applied to DevRel Dashboard pod</li>
              <li>Completed Weather Widget challenge</li>
            </ul>
          </div>
          <div className="card" style={{ background: '#FFFDF0', border: '1px solid var(--color-support)' }}>
            <h4 style={{ marginTop: 0 }}>Celebration</h4>
            <p style={{ color: 'var(--color-text-muted)' }}>Complete a daily pod to unlock a confetti moment in the workspace.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const inputStyle = {
  padding: '0.75rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  outlineColor: 'var(--color-primary)',
  width: '100%'
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  color: 'var(--color-text-muted)',
  fontWeight: 600
};

export default Profile;
