import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Paperclip, Link as LinkIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function KumarChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm thambi mayilvaganam, your coding assistant. I can help you with programming questions, code explanations, debugging, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'file' | 'link' | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentLink, setAttachmentLink] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = async () => {
    if ((!input.trim() && !attachmentFile && !attachmentLink.trim()) || loading) return;

    let messageContent = input.trim();
    if (attachmentType === 'file' && attachmentFile) {
      messageContent = messageContent || `Shared file: ${attachmentFile.name}`;
    } else if (attachmentType === 'link' && attachmentLink.trim()) {
      messageContent = messageContent || `Shared link: ${attachmentLink}`;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

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
        };
      } else if (attachmentType === 'link' && attachmentLink.trim()) {
        attachmentData = {
          attachment_type: 'link',
          attachment_url: attachmentLink.trim(),
          attachment_name: attachmentLink.trim(),
        };
      }

      const response = await fetch('/api/chatbot/kumar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input.trim() || (attachmentType ? 'See attachment' : ''),
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setAttachmentType(null);
      setAttachmentFile(null);
      setAttachmentLink('');
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
          aria-label="Open thambi mayilvaganam chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border-2 border-primary/20 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold text-lg">thambi mayilvaganam</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Coding Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
            {(attachmentType === 'file' && attachmentFile) && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-900 truncate">{attachmentFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentType(null);
                    setAttachmentFile(null);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {attachmentType === 'link' && (
              <div className="mb-2">
                <input
                  type="url"
                  value={attachmentLink}
                  onChange={(e) => setAttachmentLink(e.target.value)}
                  placeholder="Paste a link..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentType(null);
                    setAttachmentLink('');
                  }}
                  className="mt-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  Remove link
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex gap-1">
                <label className="cursor-pointer p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={loading}
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
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="say anything to thambi mayilvaganam"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !attachmentFile && !attachmentLink.trim()) || loading}
                className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

