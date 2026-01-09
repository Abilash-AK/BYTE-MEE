import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelopeOpen, FaShieldAlt, FaCheckCircle, FaArrowLeft, FaCode } from 'react-icons/fa';
import { sendOtp, verifyOtp } from '../services/otpService';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { registerWithEmail } = useAuth();

  const [step, setStep] = useState('details'); // details | otp | skills
  const [form, setForm] = useState({ name: '', email: '', dob: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const skillCatalog = [
    { id: 'react', label: 'React', prompt: 'Build a counter component that uses useState and increments on click.', validator: (code) => code.toLowerCase().includes('usestate') && code.length > 40 },
    { id: 'javascript', label: 'JavaScript', prompt: 'Write a function isPalindrome(str) that returns true/false.', validator: (code) => code.toLowerCase().includes('function') && code.toLowerCase().includes('return') },
    { id: 'python', label: 'Python', prompt: 'Write a fizz_buzz(n) that returns a list of results.', validator: (code) => code.toLowerCase().includes('def') && code.toLowerCase().includes('return') },
  ];
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendOtp = () => {
    if (!form.name || !form.email || !form.dob || !form.phone) {
      setError('Please fill all fields.');
      return;
    }
    setSending(true);
    setError('');
    const code = sendOtp(form.email);
    setOtpHint(`Demo OTP: ${code}`);
    setStep('otp');
    setSending(false);
  };

  const handleVerify = () => {
    setError('');
    const ok = verifyOtp(form.email, otp.trim());
    if (!ok) {
      setError('Invalid or expired OTP.');
      return;
    }
    setStep('skills');
  };

  const toggleSkill = (id) => {
    setSelectedSkills((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((s) => s !== id);
        return next;
      }
      return [...prev, id];
    });
  };

  const updateSubmission = (id, payload) => {
    setSubmissions((prev) => ({
      ...prev,
      [id]: {
        code: payload.code !== undefined ? payload.code : prev[id]?.code || '',
        completed: payload.completed !== undefined ? payload.completed : prev[id]?.completed || false,
        error: payload.error !== undefined ? payload.error : prev[id]?.error || '',
      },
    }));
  };

  const validateSkill = (id) => {
    const skill = skillCatalog.find((s) => s.id === id);
    const code = submissions[id]?.code || '';
    if (!skill) return;
    if (skill.validator(code)) {
      updateSubmission(id, { completed: true, error: '' });
    } else {
      updateSubmission(id, { completed: false, error: 'Add a bit more detail to satisfy the task.' });
    }
  };

  const allCompleted = selectedSkills.length > 0 && selectedSkills.every((id) => submissions[id]?.completed);

  const handleComplete = async () => {
    try {
      const taskPayload = selectedSkills.map((id) => ({ skill: id, code: submissions[id]?.code || '' }));
      await registerWithEmail({ ...form, tasks: taskPayload });
      navigate('/dashboard');
    } catch (e) {
      setError('Could not complete registration.');
      console.error(e);
    }
  };

  const cardStyle = { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '1.5rem', border: '1px solid var(--color-border)' };
  const inputStyle = { padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', outlineColor: 'var(--color-primary)', width: '100%' };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFFDFA 0%, #FFF5EB 100%)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn" style={{ border: '1px solid var(--color-border)', background: 'white' }} onClick={() => navigate('/auth')}><FaArrowLeft /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
            <FaShieldAlt color="var(--color-primary)" /> Email verification required
          </div>
        </div>

        {error && (
          <div style={{ ...cardStyle, borderLeft: '4px solid #d32f2f', color: '#d32f2f', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {step === 'details' && (
          <div style={cardStyle}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Create your account</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Tell us a bit about you. We will send an OTP to confirm your email.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <label style={labelStyle}>Full name<input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label style={labelStyle}>Email<input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label style={labelStyle}>Date of birth<input style={inputStyle} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></label>
              <label style={labelStyle}>Phone number<input style={inputStyle} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 123 4567" /></label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handleSendOtp} disabled={sending}>
                <FaEnvelopeOpen /> {sending ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div style={cardStyle}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Verify your email</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Enter the 6-digit code we just sent to {form.email}.</p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, maxWidth: '220px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
              <span style={{ color: 'var(--color-text-muted)' }}>{otpHint}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem' }}>
              <button className="btn" style={{ border: '1px solid var(--color-border)', background: 'white' }} onClick={handleSendOtp}>Resend OTP</button>
              <button className="btn btn-primary" onClick={handleVerify}><FaCheckCircle /> Verify</button>
            </div>
          </div>
        )}

        {step === 'skills' && (
          <div style={cardStyle}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Show what you know</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Pick your skills and complete a tiny coding task for each. Registration finishes after tasks are validated.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
              {skillCatalog.map((skill) => {
                const active = selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    style={{
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '2px solid var(--color-energy)' : '1px solid var(--color-border)',
                      background: active ? '#FFF5F0' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      justifyContent: 'space-between',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><FaCode /> {skill.label}</span>
                    {submissions[skill.id]?.completed && <FaCheckCircle color="var(--color-primary)" />}
                  </button>
                );
              })}
            </div>

            {selectedSkills.length === 0 && (
              <div style={{ padding: '0.75rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
                Select at least one skill to unlock its coding check.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedSkills.map((id) => {
                const skill = skillCatalog.find((s) => s.id === id);
                const submission = submissions[id] || { code: '', completed: false, error: '' };
                if (!skill) return null;
                return (
                  <div key={id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <strong>{skill.label} check</strong>
                      {submission.completed ? (
                        <span style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}><FaCheckCircle /> Completed</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Pending</span>
                      )}
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>{skill.prompt}</p>
                    <textarea
                      value={submission.code}
                      onChange={(e) => updateSubmission(id, { code: e.target.value, completed: false })}
                      placeholder="Paste your quick solution here"
                      style={{ ...inputStyle, minHeight: '120px' }}
                    />
                    {submission.error && <div style={{ color: '#d32f2f', marginTop: '0.4rem' }}>{submission.error}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem', gap: '0.5rem' }}>
                      <button className="btn" style={{ border: '1px solid var(--color-border)', background: 'white' }} onClick={() => validateSkill(id)}>Validate task</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem' }}>
              <button className="btn" style={{ border: '1px solid var(--color-border)', background: 'white' }} onClick={() => setStep('details')}>Edit details</button>
              <button className="btn btn-primary" onClick={handleComplete} disabled={!allCompleted}><FaCheckCircle /> Finish & Go to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  color: 'var(--color-text-muted)',
  fontWeight: 600
};

export default Register;
