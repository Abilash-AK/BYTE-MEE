import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import KumarChatbot from '@/react-app/components/KumarChatbot';
import { Code2, Sparkles, Users, Clock, LogOut, Flame } from 'lucide-react';

interface DashboardStats {
  challengesCompleted: number;
  codingBuddies: number;
  streakDays: number;
}

interface DailyPod {
  hasPod: boolean;
  message?: string;
  pod?: {
    id: number;
    name: string;
    description: string;
    skills_needed: string;
    team_size: number;
    duration: string;
    isMember: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    timeRemaining: string;
  };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyPod, setDailyPod] = useState<DailyPod | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningPod, setJoiningPod] = useState(false);

  useEffect(() => {
    if (user && !checking && !isPending) {
      fetchDashboardData();
    }
  }, [user, checking, isPending]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, podRes] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/dashboard/daily-pod', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (podRes.ok) {
        const podData = await podRes.json();
        setDailyPod(podData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPod = async () => {
    if (!dailyPod?.pod || dailyPod.pod.isMember) {
      if (dailyPod?.pod) {
        navigate(`/pods/${dailyPod.pod.id}`);
      }
      return;
    }

    setJoiningPod(true);
    try {
      const response = await fetch(`/api/pods/${dailyPod.pod.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          why_interested: 'I want to join this daily pod to learn and collaborate!',
          skills: user?.tech_stack || '',
        }),
      });

      if (response.ok) {
        navigate(`/pods/${dailyPod.pod.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join pod');
      }
    } catch (error) {
      console.error('Failed to join pod:', error);
      alert('Failed to join pod. Please try again.');
    } finally {
      setJoiningPod(false);
    }
  };

  if (isPending || checking || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  const firstName = user.given_name || user.name?.split(' ')[0] || 'there';

  // Parse skills from pod
  const podSkills = dailyPod?.pod?.skills_needed?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const difficulty = dailyPod?.pod?.team_size && dailyPod.pod.team_size <= 2 
    ? 'Beginner' 
    : dailyPod?.pod?.team_size && dailyPod.pod.team_size <= 4 
    ? 'Intermediate' 
    : 'Advanced';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-64 p-6 md:p-8">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">CoLearn</span>
          </div>
          <button
            onClick={() => void logout()}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Ready to learn together, {firstName}? 🌟
          </h1>
          <p className="text-gray-600">Your coding journey continues here</p>
        </div>

        {/* Today's Daily Pod Card */}
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Daily Pod</h2>
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-xl p-8 flex items-center justify-center">
              <div className="animate-spin">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          ) : dailyPod?.hasPod && dailyPod.pod ? (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-warmth/30 hover:shadow-2xl transition-all">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full mb-3">
                      {difficulty}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {dailyPod.pod.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {dailyPod.pod.description || 'Join this pod to collaborate and learn together!'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      {podSkills.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Code2 className="w-4 h-4" />
                          <span>{podSkills[0]}</span>
                          {podSkills.length > 1 && <span className="text-xs">+{podSkills.length - 1}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{dailyPod.pod.duration || 'Ongoing'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Team of {dailyPod.pod.team_size}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-warmth rounded-xl p-6 min-w-[140px]">
                    <div className="text-white text-center">
                      <div className="text-4xl font-bold mb-1">
                        {dailyPod.pod.hoursRemaining > 0 
                          ? `${dailyPod.pod.hoursRemaining}:${dailyPod.pod.minutesRemaining.toString().padStart(2, '0')}`
                          : '0:00'}
                      </div>
                      <div className="text-sm opacity-90">
                        {dailyPod.pod.hoursRemaining > 0 ? 'hours left' : 'Expired'}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleJoinPod}
                  disabled={joiningPod || dailyPod.pod.isMember}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  {joiningPod 
                    ? 'Joining...' 
                    : dailyPod.pod.isMember 
                    ? 'View Pod' 
                    : 'Join Now'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-warmth/30 p-6 md:p-8">
              <div className="text-center py-8">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Pods</h3>
                <p className="text-gray-600 mb-6">
                  {dailyPod?.message || 'No active pods available at the moment. Create one to get started!'}
                </p>
                <button 
                  onClick={() => navigate('/pods/create')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Create Your First Pod
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary mb-1 flex items-center gap-2">
                    <Flame className="w-6 h-6" />
                    {stats?.streakDays || 0}
                  </div>
                  <div className="text-sm text-gray-600">Days challenge streak</div>
                </>
              )}
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-secondary mb-1">
                    {stats?.challengesCompleted || 0}
                  </div>
                  <div className="text-sm text-gray-600">Challenges completed</div>
                </>
              )}
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-accent mb-1">
                    {stats?.codingBuddies || 0}
                  </div>
                  <div className="text-sm text-gray-600">Coding buddies</div>
                </>
              )}
            </div>
          </div>

          {/* Create Pod Button */}
          <div className="mt-8 bg-gradient-to-r from-warmth/20 to-secondary/20 rounded-xl p-6 border border-secondary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Have a project in mind?
                </h3>
                <p className="text-gray-600">
                  Create a learning pod and find the perfect team to build with
                </p>
              </div>
              <button 
                onClick={() => navigate('/pods/create')}
                className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-all hover:shadow-lg whitespace-nowrap"
              >
                Create Pod
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Kumar Chatbot */}
      <KumarChatbot />
    </div>
  );
}
