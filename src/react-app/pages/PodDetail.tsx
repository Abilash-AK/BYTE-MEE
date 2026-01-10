import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, Clock, ArrowLeft, Check, X, MessageCircle, Send, Paperclip, Link as LinkIcon, MapPin, Calendar, FolderOpen, Upload, FileText, Bot, User as UserIcon, BarChart3, Edit, Trash2 } from 'lucide-react';

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
  user_tech_stack?: string | null;
}

interface PodMessage {
  id: number;
  pod_id: number;
  user_id: string;
  user_name: string;
  user_picture: string | null;
  message: string;
  created_at: string;
  attachment_type?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
}

interface WorkFile {
  id: number;
  pod_id: number;
  user_id: string;
  user_name: string;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  file_type?: string | null;
  description?: string | null;
  ai_contribution_percent: number;
  human_contribution_percent: number;
  created_at: string;
  updated_at: string;
}

interface UserContribution {
  user_id: string;
  user_name: string;
  user_picture: string | null;
  total_files: number;
  total_ai: number;
  total_human: number;
  average_ai: number;
  average_human: number;
}

interface ContributionStats {
  total_files: number;
  average_ai_contribution: number;
  average_human_contribution: number;
  total_ai_contribution: number;
  total_human_contribution: number;
  per_user?: UserContribution[];
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
  deadline?: string | null;
  location_name?: string | null;
  city?: string | null;
  district?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
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
  const [userSkills, setUserSkills] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState<PodMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'file' | 'link' | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentLink, setAttachmentLink] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Work Environment state
  const [workFiles, setWorkFiles] = useState<WorkFile[]>([]);
  const [contributions, setContributions] = useState<ContributionStats | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [fileUploadData, setFileUploadData] = useState({
    file: null as File | null,
    file_url: '',
    description: '',
    ai_contribution_percent: 0,
    human_contribution_percent: 100,
  });

  useEffect(() => {
    if (user && id && !checking && !isPending) {
      fetchPod();
      fetchUserSkills();
    }
  }, [user, id, checking, isPending]);

  const fetchUserSkills = async () => {
    try {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (response.ok) {
        const profile = await response.json();
        if (profile?.tech_stack) {
          setUserSkills(profile.tech_stack);
          // Auto-fill skills in application data
          setApplicationData(prev => ({
            ...prev,
            skills: profile.tech_stack,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user skills:', error);
    }
  };

  useEffect(() => {
    if (pod) {
      const isMember = pod.members.some(m => m.user_id === user?.id);
      if (isMember) {
        fetchMessages();
        fetchWorkFiles();
        fetchContributions();
        const interval = setInterval(() => {
          fetchMessages();
          fetchWorkFiles();
          fetchContributions();
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [pod?.id, pod?.members, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/pods/${id}/messages`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchWorkFiles = async () => {
    try {
      const response = await fetch(`/api/pods/${id}/work-files`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWorkFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching work files:', error);
    }
  };

  const fetchContributions = async () => {
    try {
      const response = await fetch(`/api/pods/${id}/contributions`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setContributions(data);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const handleWorkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUploadWorkFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploadData.file && !fileUploadData.file_url.trim()) {
      alert('Please select a file or provide a file URL');
      return;
    }

    setUploadingFile(true);
    try {
      let fileUrl = fileUploadData.file_url;
      let fileName = '';
      let fileSize = 0;
      let fileType = '';
      let fileContent: string | null = null;

      if (fileUploadData.file) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileUploadData.file!);
        });
        fileUrl = base64;
        fileName = fileUploadData.file.name;
        fileSize = fileUploadData.file.size;
        fileType = fileUploadData.file.type;
        
        // Extract text content for text-based files
        if (fileType.startsWith('text/') || 
            fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || fileName.endsWith('.tsx') ||
            fileName.endsWith('.py') || fileName.endsWith('.java') || fileName.endsWith('.cpp') || fileName.endsWith('.c') ||
            fileName.endsWith('.html') || fileName.endsWith('.css') || fileName.endsWith('.json') ||
            fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.sql')) {
          try {
            const textReader = new FileReader();
            const text = await new Promise<string>((resolve, reject) => {
              textReader.onload = () => resolve(textReader.result as string);
              textReader.onerror = reject;
              textReader.readAsText(fileUploadData.file!);
            });
            fileContent = text;
          } catch (err) {
            console.warn('Could not read file as text:', err);
          }
        }
      } else {
        fileName = fileUrl.split('/').pop() || 'file';
      }

      const response = await fetch(`/api/pods/${id}/work-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          description: fileUploadData.description,
          file_content: fileContent, // Send file content for AI analysis
          // Don't send contribution percentages - let AI analyze
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
        await fetchWorkFiles();
        await fetchContributions();
        setShowFileUpload(false);
        setEditingFileId(null);
        setFileUploadData({
          file: null,
          file_url: '',
          description: '',
          ai_contribution_percent: 0,
          human_contribution_percent: 100,
        });
        alert('File uploaded successfully!');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload error:', error);
        alert(error.error || `Failed to upload file (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditFile = (file: WorkFile) => {
    setEditingFileId(file.id);
    setFileUploadData({
      file: null,
      file_url: file.file_url,
      description: file.description || '',
      ai_contribution_percent: file.ai_contribution_percent || 0,
      human_contribution_percent: file.human_contribution_percent || 100,
    });
    setShowFileUpload(true);
  };

  const handleUpdateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFileId) return;
    if (!fileUploadData.file && !fileUploadData.file_url.trim()) {
      alert('Please provide a file or file URL');
      return;
    }

    setUploadingFile(true);
    try {
      let fileUrl = fileUploadData.file_url;
      let fileName = '';
      let fileSize = 0;
      let fileType = '';
      let fileContent: string | null = null;

      if (fileUploadData.file) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileUploadData.file!);
        });
        fileUrl = base64;
        fileName = fileUploadData.file.name;
        fileSize = fileUploadData.file.size;
        fileType = fileUploadData.file.type;
        
        if (fileType.startsWith('text/') || 
            fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || fileName.endsWith('.tsx') ||
            fileName.endsWith('.py') || fileName.endsWith('.java') || fileName.endsWith('.cpp') || fileName.endsWith('.c') ||
            fileName.endsWith('.html') || fileName.endsWith('.css') || fileName.endsWith('.json') ||
            fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.sql')) {
          try {
            const textReader = new FileReader();
            const text = await new Promise<string>((resolve, reject) => {
              textReader.onload = () => resolve(textReader.result as string);
              textReader.onerror = reject;
              textReader.readAsText(fileUploadData.file!);
            });
            fileContent = text;
          } catch (err) {
            console.warn('Could not read file as text:', err);
          }
        }
      } else {
        const existingFile = workFiles.find(f => f.id === editingFileId);
        fileName = existingFile?.file_name || fileUrl.split('/').pop() || 'file';
      }

      const response = await fetch(`/api/pods/${id}/work-files/${editingFileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          description: fileUploadData.description,
          file_content: fileContent,
        }),
      });

      if (response.ok) {
        await fetchWorkFiles();
        await fetchContributions();
        setShowFileUpload(false);
        setEditingFileId(null);
        setFileUploadData({
          file: null,
          file_url: '',
          description: '',
          ai_contribution_percent: 0,
          human_contribution_percent: 100,
        });
        alert('File updated successfully!');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(error.error || 'Failed to update file');
      }
    } catch (error) {
      console.error('Error updating file:', error);
      alert(`Failed to update file: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/pods/${id}/work-files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchWorkFiles();
        await fetchContributions();
        alert('File deleted successfully!');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(error.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete file: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setAttachmentFile(file);
      setAttachmentType('file');
      setAttachmentLink('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachmentFile && !attachmentLink.trim()) return;
    if (sendingMessage) return;

    setSendingMessage(true);
    try {
      let attachmentData: any = {};
      
      if (attachmentType === 'file' && attachmentFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(attachmentFile);
        });
        attachmentData = {
          attachment_type: 'file',
          attachment_url: base64,
          attachment_name: attachmentFile.name,
          attachment_size: attachmentFile.size,
        };
      } else if (attachmentType === 'link' && attachmentLink.trim()) {
        attachmentData = {
          attachment_type: 'link',
          attachment_url: attachmentLink.trim(),
          attachment_name: attachmentLink.trim(),
        };
      }

      const response = await fetch(`/api/pods/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: newMessage.trim() || (attachmentType ? 'Shared an attachment' : ''),
          ...attachmentData,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setAttachmentType(null);
        setAttachmentFile(null);
        setAttachmentLink('');
        fetchMessages();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to send message:', errorData);
        alert(errorData.error || `Failed to send message (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setSendingMessage(false);
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

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 flex-wrap">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{pod.members.length}/{pod.team_size} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{pod.duration}</span>
              </div>
              {pod.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline: {new Date(pod.deadline).toLocaleString()}</span>
                </div>
              )}
              {(pod.location_name || pod.city || pod.location_lat) && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {pod.location_name || (pod.city && pod.district 
                      ? `${pod.city}, ${pod.district}`
                      : pod.city || pod.district || (pod.location_lat && pod.location_lng
                        ? `${pod.location_lat.toFixed(4)}, ${pod.location_lng.toFixed(4)}`
                        : 'Location set'))}
                  </span>
                </div>
              )}
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Your Skills (from your profile)
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                      {userSkills ? (
                        <div className="flex flex-wrap gap-2">
                          {userSkills.split(',').map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No skills in your profile. Update your profile to add skills.</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your skills from your profile will be automatically included in your application
                    </p>
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

          {/* Team Chat (only visible to members) */}
          {isMember && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Team Chat</h2>
              </div>

              {/* Messages */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.user_id === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                        >
                          {!isOwnMessage && (
                            <div>
                              {message.user_picture ? (
                                <img
                                  src={message.user_picture}
                                  alt={message.user_name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-primary text-xs font-bold">
                                    {message.user_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-semibold text-gray-900 ${isOwnMessage ? 'order-2' : ''}`}>
                                {isOwnMessage ? 'You' : message.user_name}
                              </span>
                              <span className={`text-xs text-gray-500 ${isOwnMessage ? 'order-1' : ''}`}>
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div
                              className={`inline-block px-4 py-2 rounded-lg max-w-md ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-primary to-accent text-white'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.message}
                              </p>
                              {message.attachment_type === 'link' && message.attachment_url && (
                                <div className={`mt-2 pt-2 ${isOwnMessage ? 'border-white/20' : 'border-gray-200'} border-t`}>
                                  <a
                                    href={message.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm underline flex items-center gap-1 ${isOwnMessage ? 'text-white' : 'text-blue-600'}`}
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    {message.attachment_name || message.attachment_url}
                                  </a>
                                </div>
                              )}
                              {message.attachment_type === 'file' && message.attachment_name && (
                                <div className={`mt-2 pt-2 ${isOwnMessage ? 'border-white/20' : 'border-gray-200'} border-t`}>
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="w-3 h-3" />
                                    <span className="text-sm">{message.attachment_name}</span>
                                    {message.attachment_size && (
                                      <span className={`text-xs ${isOwnMessage ? 'opacity-70' : 'text-gray-500'}`}>
                                        ({(message.attachment_size / 1024).toFixed(1)} KB)
                                      </span>
                                    )}
                                  </div>
                                  {message.attachment_url && (
                                    <a
                                      href={message.attachment_url}
                                      download={message.attachment_name}
                                      className={`text-xs underline mt-1 block ${isOwnMessage ? 'text-white' : 'text-blue-600'}`}
                                    >
                                      Download
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="space-y-2">
                {(attachmentType === 'file' && attachmentFile) && (
                  <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900">{attachmentFile.name}</span>
                      <span className="text-xs text-blue-600">
                        ({(attachmentFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentType(null);
                        setAttachmentFile(null);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {attachmentType === 'link' && (
                  <div>
                    <input
                      type="url"
                      value={attachmentLink}
                      onChange={(e) => setAttachmentLink(e.target.value)}
                      placeholder="Paste a link..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentType(null);
                        setAttachmentLink('');
                      }}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Remove link
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-600" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={sendingMessage}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (attachmentType === 'link') {
                          setAttachmentType(null);
                          setAttachmentLink('');
                        } else {
                          setAttachmentType('link');
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <LinkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !attachmentFile && !attachmentLink.trim()) || sendingMessage}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Work Environment (only visible to members) */}
          {pod.members.some(m => m.user_id === user?.id) && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Work Environment</h2>
                </div>
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </div>

              {/* Contribution Statistics */}
              {contributions && contributions.total_files > 0 && (
                <div className="mb-6 space-y-4">
                  {/* Overall Statistics */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">Overall Contribution Statistics</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">AI Contribution</p>
                          <p className="text-2xl font-bold text-blue-600">{contributions.average_ai_contribution}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Human Contribution</p>
                          <p className="text-2xl font-bold text-green-600">{contributions.average_human_contribution}%</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Based on {contributions.total_files} file(s)</p>
                  </div>

                  {/* Per-User Statistics */}
                  {contributions.per_user && contributions.per_user.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">Contributions by Person</h3>
                      </div>
                      <div className="space-y-3">
                        {contributions.per_user.map((userStat) => (
                          <div
                            key={userStat.user_id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {userStat.user_picture ? (
                                  <img
                                    src={userStat.user_picture}
                                    alt={userStat.user_name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <span className="font-semibold text-gray-900">{userStat.user_name}</span>
                                <span className="text-xs text-gray-500">({userStat.total_files} file{userStat.total_files !== 1 ? 's' : ''})</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">AI</span>
                                    <span className="text-sm font-bold text-blue-600">{userStat.average_ai}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all"
                                      style={{ width: `${userStat.average_ai}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-green-600" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">Human</span>
                                    <span className="text-sm font-bold text-green-600">{userStat.average_human}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-600 h-2 rounded-full transition-all"
                                      style={{ width: `${userStat.average_human}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload/Edit Form */}
              {showFileUpload && (
                <form onSubmit={editingFileId ? handleUpdateFile : handleUploadWorkFile} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingFileId ? 'Edit Work File' : 'Upload Work File'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFileUpload(false);
                        setEditingFileId(null);
                        setFileUploadData({
                          file: null,
                          file_url: '',
                          description: '',
                          ai_contribution_percent: 0,
                          human_contribution_percent: 100,
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        File
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          onChange={handleWorkFileSelect}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={uploadingFile}
                        />
                        <input
                          type="url"
                          value={fileUploadData.file_url}
                          onChange={(e) => setFileUploadData(prev => ({ ...prev, file_url: e.target.value }))}
                          placeholder="Or paste file URL..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={uploadingFile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Description (optional, helps AI analyze better)
                      </label>
                      <textarea
                        value={fileUploadData.description}
                        onChange={(e) => setFileUploadData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this file contains, what tools were used, or any context that helps understand the work..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={uploadingFile}
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI will automatically analyze the file content and determine AI vs Human contribution percentages
                      </p>
                    </div>

                    {uploadingFile && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="animate-spin">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-blue-800">
                          AI is analyzing your file to determine contribution percentages...
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={uploadingFile}
                        className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileUpload(false);
                          setFileUploadData({
                            file: null,
                            file_url: '',
                            description: '',
                            ai_contribution_percent: 0,
                            human_contribution_percent: 100,
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Work Files List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Files</h3>
                {workFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No files uploaded yet. Upload your first file to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-primary" />
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-gray-900 hover:text-primary"
                              >
                                {file.file_name}
                              </a>
                            </div>
                            {file.description && (
                              <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Uploaded by {file.user_name}</span>
                              <span>•</span>
                              <span>{new Date(file.created_at).toLocaleDateString()}</span>
                              {file.file_size && (
                                <>
                                  <span>•</span>
                                  <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                                <Bot className="w-3 h-3 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-600">{file.ai_contribution_percent}%</span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                                <UserIcon className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-semibold text-green-600">{file.human_contribution_percent}%</span>
                              </div>
                            </div>
                            {(file.user_id === user?.id || isCreator) && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleEditFile(file)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit file"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications (only visible to creator) */}
          {isCreator && pod.applications.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Pending Applications ({pod.applications.length})
              </h2>
              <div className="space-y-4">
                {pod.applications.map((application) => {
                  const applicantSkills = application.user_tech_stack || application.skills || '';
                  const skillsList = applicantSkills ? applicantSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
                  
                  return (
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
                          <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{application.user_name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('Navigating to profile:', application.user_id);
                                navigate(`/profile/${application.user_id}`, { replace: false });
                              }}
                              className="text-xs text-primary hover:text-primary/80 underline font-medium"
                            >
                              View Profile →
                            </button>
                          </div>
                        <p className="text-sm text-gray-500">{application.user_email}</p>
                      </div>
                    </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Skills:</p>
                        {skillsList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {skillsList.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No skills listed</p>
                        )}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
