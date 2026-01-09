import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { Code2, Sparkles, Users, LogOut, Plus, Search, MessageCircle, Globe, User, Brain } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { path: '/dashboard', icon: Sparkles, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/challenges', icon: Brain, label: 'Coding Challenges' },
    { path: '/pods/my', icon: Users, label: 'My Pods' },
    { path: '/pods/browse', icon: Search, label: 'Browse Pods' },
    { path: '/pods/create', icon: Plus, label: 'Create Pod' },
  ];

  const communityItems = [
    { path: '/communities/my', icon: MessageCircle, label: 'My Communities' },
    { path: '/communities', icon: Globe, label: 'All Communities' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-primary text-white p-6 hidden md:block">
      <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <Code2 className="w-8 h-8" />
        <span className="text-2xl font-bold">CoLearn</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name || 'User'}
              className="w-12 h-12 rounded-full border-2 border-warmth"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-sm text-white/70 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                isActive ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/20 pt-4 mb-6">
        <h3 className="text-sm font-semibold text-white/70 mb-2 px-4">Communities</h3>
        <nav className="space-y-2">
          {communityItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="absolute bottom-6 left-6 right-6 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white/70 hover:text-white"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </aside>
  );
}
