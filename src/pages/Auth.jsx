import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, loginWithGithub } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
            navigate('/onboarding');
        } catch (err) {
            setError('Login failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGithub();
            navigate('/onboarding');
        } catch (err) {
            setError('GitHub login failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFFDFA 0%, #FFF5EB 100%)' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>

                {/* Brand Header */}
                <div>
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>CoLearn</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Your cozy digital study space.</p>
                </div>

                {error && (
                    <div style={{ padding: '0.8rem', background: '#ffebee', color: '#c62828', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {/* Login Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="btn"
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'wait' : 'pointer'
                        }}
                    >
                        <FaGoogle style={{ color: '#4285F4' }} />
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <button
                        onClick={handleGithubLogin}
                        disabled={loading}
                        className="btn"
                        style={{
                            backgroundColor: '#24292e',
                            color: 'white',
                            justifyContent: 'center',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        <FaGithub />
                        Continue with GitHub
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', justifyContent: 'center' }}>
                    <span>New here?</span>
                    <button className="btn" style={{ border: '1px solid var(--color-border)', background: 'white' }} onClick={() => navigate('/register')}>
                        Create an account
                    </button>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    By joining, you agree to look out for your study buddies. 💜
                </p>

            </div>
        </div>
    );
};

export default Auth;
