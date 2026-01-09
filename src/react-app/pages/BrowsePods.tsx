import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, Clock, Plus } from 'lucide-react';

interface Pod {
  id: number;
  name: string;
  description: string;
  creator_id: string;
  creator_name: string;
  skills_needed: string;
  team_size: number;
  duration: string;
  member_count: number;
  created_at: string;
}

export default function BrowsePods() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPods();
    }
  }, [user]);

  const fetchPods = async () => {
    try {
      const response = await fetch('/api/pods');
      const data = await response.json();
      setPods(data);
    } catch (error) {
      console.error('Failed to fetch pods:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Pods</h1>
              <p className="text-gray-600">Find teams to join for hackathons and projects</p>
            </div>
            <button
              onClick={() => navigate('/pods/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Pod
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          ) : pods.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pods available</h3>
              <p className="text-gray-600 mb-6">Be the first to create a pod for your project or hackathon</p>
              <button
                onClick={() => navigate('/pods/create')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Pod
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pods.map((pod) => {
                const skills = pod.skills_needed ? pod.skills_needed.split(',').map(s => s.trim()) : [];
                const isCreator = pod.creator_id === user.id;
                const isFull = pod.member_count >= pod.team_size;

                return (
                  <div
                    key={pod.id}
                    onClick={() => navigate(`/pods/${pod.id}`)}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-warmth/20 hover:border-warmth/40"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {isCreator && (
                          <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-2">
                            Created by you
                          </div>
                        )}
                        {isFull && (
                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full mb-2 ml-2">
                            Full
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pod.name}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{pod.description}</p>
                    <p className="text-sm text-gray-500 mb-4">by {pod.creator_name}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                          +{skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{pod.member_count}/{pod.team_size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{pod.duration}</span>
                        </div>
                      </div>
                      
                      {!isCreator && !isFull && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pods/${pod.id}`);
                          }}
                          className="px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
