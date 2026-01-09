import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/auth';
import { User, Mail, Code2, Edit2, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const TECH_OPTIONS = [
  'React',
  'JavaScript',
  'TypeScript',
  'Python',
  'Node.js',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'HTML/CSS',
  'SQL',
  'MongoDB',
  'PostgreSQL',
  'AWS',
  'Docker',
  'Git',
];

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  tech_stack: string;
  coding_task_answer: string;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile(data);
      
      if (data.tech_stack) {
        setSelectedTech(data.tech_stack.split(', ').filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const handleSave = async () => {
    if (selectedTech.length === 0) {
      setError('Please select at least one technology');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tech_stack: selectedTech.join(', '),
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile?.tech_stack) {
      setSelectedTech(profile.tech_stack.split(', ').filter(Boolean));
    }
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin">
            <Code2 className="w-10 h-10 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5 flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information and skills</p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-semibold">Profile updated successfully!</p>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 mb-6">
            {/* User Info Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Personal Information
              </h2>
              
              <div className="space-y-4">
                {/* Profile Picture and Name */}
                <div className="flex items-center gap-6">
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt={profile?.name || 'User'}
                      className="w-20 h-20 rounded-full border-4 border-primary/20"
                    />
                  )}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Full Name</div>
                    <div className="text-xl font-bold text-gray-900">
                      {profile?.name || user?.name || 'Not set'}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Email Address</div>
                    <div className="text-lg text-gray-900">
                      {profile?.email || user?.email || 'Not set'}
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Code2 className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Member Since</div>
                    <div className="text-lg text-gray-900">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Stack Section */}
            <div className="border-t-2 border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Code2 className="w-6 h-6 text-primary" />
                  Tech Stack
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Skills
                  </button>
                )}
              </div>

              {editing ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Select the technologies you're familiar with. This helps us match you with relevant projects and communities.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                    {TECH_OPTIONS.map((tech) => (
                      <button
                        key={tech}
                        onClick={() => toggleTech(tech)}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          selectedTech.includes(tech)
                            ? 'border-primary bg-primary text-white shadow-md'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <p className="text-red-800">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || selectedTech.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Code2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTech.length > 0 ? (
                    selectedTech.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg border-2 border-primary/20"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No technologies selected yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Code2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Keep your skills updated!</strong> Your tech stack helps us recommend relevant communities and match you with hackathon teams that need your expertise. You can update it anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
