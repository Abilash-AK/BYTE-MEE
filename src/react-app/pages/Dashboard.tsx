import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Code2, Sparkles, Users, Clock, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();

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
            onClick={logout}
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
          
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-warmth/30 hover:shadow-2xl transition-all">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full mb-3">
                    Intermediate
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Build a React Counter App
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create a counter component with increment, decrement, and reset functionality. 
                    Learn about React state management and event handling.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Code2 className="w-4 h-4" />
                      <span>React</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>2 hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>1-on-1 pairing</span>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-warmth rounded-xl p-6 min-w-[140px]">
                  <div className="text-white text-center">
                    <div className="text-4xl font-bold mb-1">2:15</div>
                    <div className="text-sm opacity-90">hours left</div>
                  </div>
                </div>
              </div>

              <button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Join Now
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <div className="text-3xl font-bold text-primary mb-1">3</div>
              <div className="text-sm text-gray-600">Skills growing</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <div className="text-3xl font-bold text-secondary mb-1">5</div>
              <div className="text-sm text-gray-600">Challenges completed</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <div className="text-3xl font-bold text-accent mb-1">12</div>
              <div className="text-sm text-gray-600">Coding buddies</div>
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
    </div>
  );
}
