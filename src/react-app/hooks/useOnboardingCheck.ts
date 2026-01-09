import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';

export function useOnboardingCheck() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isPending) return;

      if (!user) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('/api/users/me');
        const userData = await response.json();

        if (!userData.onboarding_completed) {
          navigate('/onboarding');
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, isPending, navigate]);

  return { checking, isPending };
}
