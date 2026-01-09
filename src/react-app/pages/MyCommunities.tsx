import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, ChevronRight, MessageCircle } from 'lucide-react';

interface Community {
  id: number;
  name: string;
  description: string;
  technology: string;
  color: string;
  member_count: number;
}

export default function MyCommunities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !checking && !isPending) {
      fetchMyCommunities();
    }
  }, [user, checking, isPending]);

  const fetchMyCommunities = async () => {
    try {
      const response = await fetch('/api/communities/mine');
      const data = await response.json();
      setCommunities(data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending || checking || loading || !user) {
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
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My Communities
            </h1>
            <p className="text-gray-600">
              Communities you've joined to learn and collaborate
            </p>
          </div>

          {communities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-gray-100">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No communities yet
              </h3>
              <p className="text-gray-600 mb-6">
                Join technology communities to connect with other learners
              </p>
              <button
                onClick={() => navigate('/communities')}
                className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-all"
              >
                Browse Communities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-100 hover:shadow-xl hover:border-warmth/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/communities/${community.id}`)}
                >
                  <div 
                    className="h-32 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${community.color}20 0%, ${community.color}40 100%)`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                        style={{ backgroundColor: community.color }}
                      >
                        {community.technology.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {community.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {community.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
