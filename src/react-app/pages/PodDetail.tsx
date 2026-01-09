import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, Clock, ArrowLeft, Check, X } from 'lucide-react';

interface PodMember {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_picture: string | null;
  joined_at: string;
}

interface PodApplication {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_picture: string | null;
  why_interested: string;
  skills: string;
  status: string;
  created_at: string;
}

interface Pod {
  id: number;
  name: string;
  description: string;
  creator_id: string;
  creator_name: string;
  skills_needed: string;
  team_size: number;
  duration: string;
  created_at: string;
  members: PodMember[];
  applications: PodApplication[];
}

export default function PodDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [pod, setPod] = useState<Pod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    why_interested: '',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && id && !checking && !isPending) {
      fetchPod();
    }
  }, [user, id, checking, isPending]);

  const fetchPod = async () => {
    try {
      const response = await fetch(`/api/pods/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPod(data);
      } else {
        navigate('/pods/browse');
      }
    } catch (error) {
      console.error('Failed to fetch pod:', error);
      navigate('/pods/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/pods/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        alert('Application submitted successfully! 🎉');
        setShowApplicationForm(false);
        fetchPod();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/pods/${id}/applications/${applicationId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchPod();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept application');
      }
    } catch (error) {
      console.error('Failed to accept application:', error);
      alert('Failed to accept application');
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/pods/${id}/applications/${applicationId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchPod();
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  if (isPending || checking || !user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  if (!pod) return null;

  const skills = pod.skills_needed ? pod.skills_needed.split(',').map(s => s.trim()) : [];
  const isCreator = pod.creator_id === user.id;
  const isMember = pod.members.some(m => m.user_id === user.id);
  const isFull = pod.members.length >= pod.team_size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {isCreator && (
                  <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full mb-3">
                    Created by you
                  </div>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{pod.name}</h1>
                <p className="text-gray-600 mb-4">{pod.description}</p>
                <p className="text-sm text-gray-500">Created by {pod.creator_name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{pod.members.length}/{pod.team_size} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{pod.duration}</span>
              </div>
            </div>

            {!isMember && !isCreator && !isFull && (
              <button
                onClick={() => setShowApplicationForm(!showApplicationForm)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
              >
                {showApplicationForm ? 'Cancel Application' : 'Apply to Join'}
              </button>
            )}

            {showApplicationForm && (
              <form onSubmit={handleApply} className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Apply to Join</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="why_interested" className="block text-sm font-semibold text-gray-900 mb-2">
                      Why are you interested? *
                    </label>
                    <textarea
                      id="why_interested"
                      required
                      rows={4}
                      value={applicationData.why_interested}
                      onChange={(e) => setApplicationData({ ...applicationData, why_interested: e.target.value })}
                      placeholder="Tell the team why you want to join and what excites you about this project"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="skills" className="block text-sm font-semibold text-gray-900 mb-2">
                      Your Skills *
                    </label>
                    <input
                      type="text"
                      id="skills"
                      required
                      value={applicationData.skills}
                      onChange={(e) => setApplicationData({ ...applicationData, skills: e.target.value })}
                      placeholder="e.g., React, Python, UI Design"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Members ({pod.members.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pod.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {member.user_picture ? (
                    <img
                      src={member.user_picture}
                      alt={member.user_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {member.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.user_name}</p>
                    <p className="text-sm text-gray-500 truncate">{member.user_email}</p>
                  </div>
                  {member.user_id === pod.creator_id && (
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded">
                      Creator
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Applications (only visible to creator) */}
          {isCreator && pod.applications.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Pending Applications ({pod.applications.length})
              </h2>
              <div className="space-y-4">
                {pod.applications.map((application) => (
                  <div key={application.id} className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {application.user_picture ? (
                        <img
                          src={application.user_picture}
                          alt={application.user_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold">
                            {application.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{application.user_name}</p>
                        <p className="text-sm text-gray-500">{application.user_email}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-semibold">Skills:</span> {application.skills}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Why interested:</p>
                      <p className="text-gray-700">{application.why_interested}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptApplication(application.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectApplication(application.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
