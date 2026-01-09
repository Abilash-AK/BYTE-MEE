import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { Code2, Users, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (isPending) {
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
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">CoLearn</span>
          </div>
          <button
            onClick={redirectToLogin}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 bg-warmth/20 rounded-full">
              <span className="text-sm font-medium text-primary">
                Where collaboration feels like high-fiving your future self
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Learn to Code,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                Together
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join a warm, encouraging coding community. Practice with daily challenges, 
              build projects with peers, and grow together with AI-powered support.
            </p>

            <button
              onClick={redirectToLogin}
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all hover:scale-105"
            >
              Join our coding community
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="mt-4 text-sm text-gray-500">
              Sign up with Google in seconds
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-warmth/20">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Coding Pods</h3>
              <p className="text-gray-600">
                Get matched with a coding buddy every day. Solve challenges together in real-time with live code sync and chat.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-warmth/20">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-warmth rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project Teams</h3>
              <p className="text-gray-600">
                Create or join learning pods for hackathons, side projects, or skill-building. Find your perfect team.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-warmth/20">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI with Transparency</h3>
              <p className="text-gray-600">
                Get AI-powered coding help when stuck. Every AI suggestion is clearly labeled so you stay in control of your learning.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Built for learners • CoLearn © 2024
        </div>
      </footer>
    </div>
  );
}
