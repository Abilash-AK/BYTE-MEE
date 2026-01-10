import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { MessageCircle, Send, ArrowLeft, User, Search } from 'lucide-react';

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface DirectMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_picture: string | null;
  receiver_name: string;
  receiver_picture: string | null;
  message: string;
  is_read: number;
  created_at: string;
}

export default function DirectMessages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !checking && !isPending) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checking, isPending]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOtherUserName(data.name || data.email || 'User');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    try {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (!selectedUserId && data.length > 0) {
          setSelectedUserId(data[0].other_user_id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      // Check if conversation exists in current list, if not fetch profile
      const convExists = conversations.some(c => c.other_user_id === selectedUserId);
      if (!convExists) {
        fetchUserProfile(selectedUserId);
      }
      
      const interval = setInterval(() => {
        fetchMessages(selectedUserId);
        fetchConversations();
      }, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          receiver_id: selectedUserId,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(selectedUserId);
        await fetchConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(c => c.other_user_id === selectedUserId);
  
  // If userId is in URL but no conversation exists, we still want to show the message input
  // So we'll create a temporary conversation object
  const displayConversation = selectedConversation || (selectedUserId ? {
    other_user_id: selectedUserId,
    other_user_name: otherUserName || 'User',
    other_user_picture: null,
    last_message: '',
    last_message_at: new Date().toISOString(),
    unread_count: 0,
  } : null);

  if (isPending || checking || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <MessageCircle className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Direct Messages</h1>
          </div>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-warmth/30">
            <div className="flex h-[calc(100vh-200px)] min-h-[600px]">
              {/* Conversations List */}
              <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin">
                        <MessageCircle className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">Start messaging community members!</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.other_user_id}
                        onClick={() => setSelectedUserId(conv.other_user_id)}
                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          selectedUserId === conv.other_user_id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {conv.other_user_picture ? (
                              <img
                                src={conv.other_user_picture}
                                alt={conv.other_user_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.other_user_name}
                              </h3>
                              {conv.unread_count > 0 && (
                                <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conv.last_message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(conv.last_message_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                {selectedUserId && displayConversation ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {displayConversation.other_user_picture ? (
                            <img
                              src={displayConversation.other_user_picture}
                              alt={displayConversation.other_user_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {displayConversation.other_user_name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                    >
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No messages yet</p>
                            <p className="text-sm mt-2">Start the conversation!</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isSent = msg.sender_id === user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isSent
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                {!isSent && (
                                  <div className="text-xs font-semibold mb-1 text-primary">
                                    {msg.sender_name}
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isSent ? 'text-primary/80' : 'text-gray-400'
                                  }`}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold">Select a conversation</p>
                      <p className="text-sm mt-2">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

