import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { Sparkles } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || undefined;

      if (!code) {
        navigate('/');
        return;
      }

      try {
        await exchangeCodeForSessionToken(code);
        
        // Check if user has completed onboarding
        const response = await fetch('/api/users/me');
        const userData = await response.json();
        
        if (userData.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <div className="animate-spin mb-4">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <p className="text-lg text-gray-700">Completing sign in...</p>
    </div>
  );
}
