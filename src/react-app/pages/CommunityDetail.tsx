import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, UserPlus, UserMinus, ArrowLeft, Send, MessageCircle, Paperclip, Link as LinkIcon, X } from 'lucide-react';

interface Community {
  id: number;
  name: string;
  description: string;
  technology: string;
  color: string;
  member_count: number;
  is_member: number;
  members: Member[];
}

interface Member {
  id: number;
  user_name: string;
  user_email: string;
  user_picture: string | null;
  joined_at: string;
}

interface Message {
  id: number;
  community_id: number;
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

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'file' | 'link' | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentLink, setAttachmentLink] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id && !checking && !isPending) {
      fetchCommunity();
    }
  }, [user, id, checking, isPending]);

  useEffect(() => {
    if (community && community.is_member === 1) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [community?.id, community?.is_member]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${id}`);
      if (!response.ok) {
        navigate('/communities');
        return;
      }
      const data = await response.json();
      setCommunity(data);
    } catch (error) {
      console.error('Error fetching community:', error);
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/communities/${id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleJoinLeave = async () => {
    if (!community || actionLoading) return;

    setActionLoading(true);
    try {
      const endpoint = community.is_member === 1 ? 'leave' : 'join';
      const response = await fetch(`/api/communities/${id}/${endpoint}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCommunity();
        if (endpoint === 'leave') {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
    } finally {
      setActionLoading(false);
    }
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
        // Convert file to base64
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

      const response = await fetch(`/api/communities/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        await fetchMessages();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (isPending || checking || loading || !user || !community) {
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
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Communities
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Community Info & Members */}
            <div className="lg:col-span-1 space-y-6">
              {/* Community Header */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-100">
                <div 
                  className="h-32 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${community.color}20 0%, ${community.color}60 100%)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl"
                      style={{ backgroundColor: community.color }}
                    >
                      {community.technology.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {community.name}
                  </h1>
                  <p className="text-gray-600 text-sm mb-4">
                    {community.description}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500 mb-4">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <button
                    onClick={handleJoinLeave}
                    disabled={actionLoading}
                    className={`w-full px-4 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      community.is_member === 1
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-secondary text-white hover:bg-secondary/90 hover:shadow-lg'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : community.is_member === 1 ? (
                      <>
                        <UserMinus className="w-5 h-5" />
                        Leave Community
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Join Community
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Members Section */}
              <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Members
                </h2>

                {community.members.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No members yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {community.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-warmth/30 transition-all"
                      >
                        {member.user_picture ? (
                          <img
                            src={member.user_picture}
                            alt={member.user_name}
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                            {member.user_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {member.user_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Chat */}
            <div className="lg:col-span-2">
              {community.is_member === 1 ? (
                <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 flex flex-col h-[700px]">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-6 h-6 text-primary" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Community Chat
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Discuss, ask questions, and share knowledge
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">No messages yet</p>
                        <p className="text-sm text-gray-400">
                          Be the first to start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.user_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          >
                            {message.user_picture ? (
                              <img
                                src={message.user_picture}
                                alt={message.user_name}
                                className="w-10 h-10 rounded-full border-2 border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                                {message.user_name.charAt(0).toUpperCase()}
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
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.message}
                                </p>
                                {message.attachment_type === 'link' && message.attachment_url && (
                                  <div className="mt-2 pt-2 border-t border-white/20">
                                    <a
                                      href={message.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm underline flex items-center gap-1"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      {message.attachment_name || message.attachment_url}
                                    </a>
                                  </div>
                                )}
                                {message.attachment_type === 'file' && message.attachment_name && (
                                  <div className="mt-2 pt-2 border-t border-white/20">
                                    <div className="flex items-center gap-2">
                                      <Paperclip className="w-3 h-3" />
                                      <span className="text-sm">{message.attachment_name}</span>
                                      {message.attachment_size && (
                                        <span className="text-xs opacity-70">
                                          ({(message.attachment_size / 1024).toFixed(1)} KB)
                                        </span>
                                      )}
                                    </div>
                                    {message.attachment_url && (
                                      <a
                                        href={message.attachment_url}
                                        download={message.attachment_name}
                                        className="text-xs underline mt-1 block"
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
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
                    {(attachmentType === 'file' && attachmentFile) && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
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
                      <div className="mb-3">
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
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        maxLength={2000}
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={(!newMessage.trim() && !attachmentFile && !attachmentLink.trim()) || sendingMessage}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingMessage ? (
                          <Sparkles className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Join to Access Chat
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Become a member to participate in community discussions
                  </p>
                  <button
                    onClick={handleJoinLeave}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      'Join Community'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
