'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  DirectMessageDto,
  ConversationSummaryDto,
  UserRole,
} from '@buildlink/shared';
import {
  MessageCircle,
  Send,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  ShieldCheck,
  Search,
  CheckCircle2,
  X,
  ArrowLeft,
  Download,
  HardHat,
  User,
  Plus,
  ChevronDown,
} from 'lucide-react';

function MessengerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<{
    id: string;
    name: string;
    avatar?: string;
    title?: string;
    role?: string;
    isVerified?: boolean;
  } | null>(null);

  const [messages, setMessages] = useState<DirectMessageDto[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // File Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<
    { url: string; fileName: string; mimeType: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const shouldForceScrollRef = useRef(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Require login
  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login?redirect=/messages');
    }
  }, [isLoading, token]);


  // Load conversations
  const loadConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  // Check URL query for direct messaging target (e.g. /messages?userId=...)
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId) {
      setActivePartnerId(targetUserId);
      fetchPartnerProfile(targetUserId);
    }
  }, [searchParams]);

  const fetchPartnerProfile = async (targetId: string) => {
    try {
      // Find from conversations first
      const existing = conversations.find((c) => c.otherUserId === targetId);
      if (existing) {
        setActivePartner({
          id: existing.otherUserId,
          name: existing.otherUserName,
          avatar: existing.otherUserAvatar,
          title: existing.otherUserTitle,
          role: existing.otherUserRole,
          isVerified: existing.isVerifiedEngineer,
        });
        return;
      }

      // Or fetch user
      const res = await fetch(`${apiUrl}/users/${targetId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const u = data.data;
        setActivePartner({
          id: u.id,
          name: u.profile?.displayName || u.email,
          avatar: u.profile?.avatarUrl,
          title: u.engineerProfile?.title,
          role: u.role,
          isVerified: u.engineerProfile?.verificationStatus === 'VERIFIED',
        });
      }
    } catch {
      // ignore
    }
  };

  // Detect when user scrolls up to read old messages vs when they are at bottom
  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceToBottom < 100;
    isNearBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
      isNearBottomRef.current = true;
      setShowScrollBottom(false);
    }
  };

  // Load message thread for active conversation
  const loadThread = async (otherUserId: string, isPolling = false) => {
    if (!token) return;
    if (!isPolling) setLoadingThread(true);
    try {
      const res = await fetch(`${apiUrl}/messages/thread/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages((prev) => {
          // Prevent re-renders and auto-scroll if polled messages haven't changed
          if (
            prev.length === data.data.length &&
            prev[prev.length - 1]?.id === data.data[data.data.length - 1]?.id
          ) {
            return prev;
          }
          return data.data;
        });
      }
    } catch (err) {
      console.error('Failed to load messages thread:', err);
    } finally {
      if (!isPolling) setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (activePartnerId && token) {
      shouldForceScrollRef.current = true;
      isNearBottomRef.current = true;
      setShowScrollBottom(false);
      loadThread(activePartnerId, false);
      // Auto-poll new messages every 3 seconds without disturbing scroll
      const interval = setInterval(() => {
        loadThread(activePartnerId, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activePartnerId, token]);

  // Only auto-scroll to bottom if user is already at the bottom or sent a message
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    if (shouldForceScrollRef.current || isNearBottomRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      shouldForceScrollRef.current = false;
      setShowScrollBottom(false);
    }
  }, [messages]);

  const handleSelectConversation = (conv: ConversationSummaryDto) => {
    shouldForceScrollRef.current = true;
    isNearBottomRef.current = true;
    setShowScrollBottom(false);
    setActivePartnerId(conv.otherUserId);
    setActivePartner({
      id: conv.otherUserId,
      name: conv.otherUserName,
      avatar: conv.otherUserAvatar,
      title: conv.otherUserTitle,
      role: conv.otherUserRole,
      isVerified: conv.isVerifiedEngineer,
    });
    router.replace(`/messages?userId=${conv.otherUserId}`);
  };

  // Handle File Upload (Images, Videos, Blueprints, Documents)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    const file = files[0];
    setIsUploading(true);

    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const res = await fetch(`${apiUrl}/messages/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPendingAttachments((prev) => [
          ...prev,
          {
            url: data.data.url,
            fileName: data.data.fileName,
            mimeType: data.data.mimeType,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to upload file attachment:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && pendingAttachments.length === 0) || !activePartnerId || !token) {
      return;
    }

    setIsSending(true);
    const textToSend = messageInput.trim() || 'Attached files:';
    const attachmentUrls = pendingAttachments.map((a) => a.url);

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: activePartnerId,
          content: textToSend,
          attachments: attachmentUrls,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        shouldForceScrollRef.current = true;
        isNearBottomRef.current = true;
        setMessages((prev) => [...prev, data.data]);
        setMessageInput('');
        setPendingAttachments([]);
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to send direct message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.otherUserTitle && c.otherUserTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render attachment helper
  const renderAttachment = (url: string, index: number) => {
    const isImage = /\.(jpeg|jpg|png|webp|gif)$/i.test(url);
    const isVideo = /\.(mp4|webm|mov)$/i.test(url);
    const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(url);

    if (isImage) {
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl overflow-hidden border border-white/20 mt-1 max-w-sm hover:opacity-90 transition-opacity"
        >
          <img src={url} alt="Attachment" className="max-h-60 w-auto object-cover rounded-xl" />
        </a>
      );
    }

    if (isVideo) {
      return (
        <div key={index} className="mt-1 rounded-xl overflow-hidden max-w-sm border border-white/20">
          <video src={url} controls className="max-h-60 w-full rounded-xl bg-black" />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div key={index} className="mt-1 max-w-sm">
          <audio src={url} controls className="w-full" />
        </div>
      );
    }

    // Document / Blueprint fallback
    const fileName = url.split('/').pop() || `Attachment_${index + 1}`;
    return (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 p-2.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold mt-1 transition-colors"
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1">{fileName}</span>
        <Download className="w-3.5 h-3.5 shrink-0" />
      </a>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)]">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-border shadow-lg overflow-hidden h-full flex flex-col md:flex-row">
        {/* Left Pane: Conversations List (Messenger Sidebar) */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-brand-border flex flex-col bg-slate-50/50 ${
            activePartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-brand-border bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-brand-navy flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-brand-blue" />
                Messages
              </h1>
              <Link
                href="/engineers"
                className="p-2 rounded-xl bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1"
                title="Find & Add Engineers"
              >
                <Plus className="w-4 h-4" /> Find
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border text-xs text-brand-navy bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted space-y-3">
                <p className="font-semibold text-brand-navy">No conversations yet</p>
                <p>Find engineers in your category and start chatting freely!</p>
                <Link href="/engineers" className="btn-primary text-xs inline-flex items-center gap-1.5 px-4 py-2">
                  <HardHat className="w-3.5 h-3.5" /> Find Engineers
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activePartnerId === conv.otherUserId;

                return (
                  <button
                    key={conv.otherUserId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-3.5 text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-brand-blue'
                        : 'hover:bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {conv.otherUserName?.[0] || 'U'}
                      </div>
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs font-bold text-brand-navy truncate">
                            {conv.otherUserName}
                          </span>
                          {conv.isVerifiedEngineer && (
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-brand-muted shrink-0">
                          {conv.lastMessageAt && conv.lastMessageAt !== new Date(0).toISOString()
                            ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : ''}
                        </span>
                      </div>

                      {conv.otherUserTitle && (
                        <p className="text-[11px] font-medium text-brand-blue truncate">
                          {conv.otherUserTitle}
                        </p>
                      )}

                      <p className="text-xs text-brand-muted truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window (Facebook Messenger Thread) */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activePartnerId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {!activePartnerId ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-inner">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-brand-navy">Select a Conversation</h2>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">
                Select an engineer from the left or discover certified engineers to start a private consultation chat.
              </p>
              <Link href="/engineers" className="btn-accent text-xs font-bold inline-flex items-center gap-1.5 px-4 py-2">
                <HardHat className="w-4 h-4" /> Discover Engineers
              </Link>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-brand-border bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePartnerId(null)}
                    className="md:hidden p-1.5 rounded-lg text-brand-muted hover:text-brand-navy hover:bg-slate-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {activePartner?.name?.[0] || 'U'}
                    </div>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-brand-navy flex items-center gap-1.5">
                      {activePartner?.name}
                      {activePartner?.isVerified && (
                        <span className="badge-verified text-[10px] py-0.5">
                          <ShieldCheck className="w-3 h-3" /> Verified Engineer
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-brand-muted">
                      {activePartner?.title || 'Active now'}
                    </p>
                  </div>
                </div>

                <Link
                  href={activePartner?.role === UserRole.ENGINEER ? `/engineers` : `#`}
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  View Profile
                </Link>
              </div>

              {/* Chat Thread Messages */}
              <div className="relative flex-1 flex flex-col min-h-0 bg-slate-50/30">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5"
                >
                  {loadingThread && messages.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 space-y-2 text-brand-muted text-xs">
                      <p className="font-bold text-brand-navy">No messages yet with {activePartner?.name}</p>
                      <p>Send a message, site photos, blueprints, or ask for construction guidance freely!</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user?.id;

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-brand-muted">
                            <span className="font-bold text-brand-navy">{m.senderName}</span>
                            <span>•</span>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                              isMe
                                ? 'bg-brand-blue text-white rounded-br-none shadow-sm'
                                : 'bg-white text-brand-navy border border-brand-border rounded-bl-none shadow-xs'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-line">{m.content}</p>

                            {/* Attachments (Images, Videos, Blueprints) */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {m.attachments.map((url, idx) => renderAttachment(url, idx))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Floating Jump to Latest Button when reading old messages */}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-navy/90 hover:bg-brand-navy text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95"
                    title="Jump to latest messages"
                  >
                    <span>Latest messages</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Pending Attachments Bar */}
              {pendingAttachments.length > 0 && (
                <div className="p-3 bg-slate-100 border-t border-brand-border flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] font-bold text-brand-navy uppercase mr-2">
                    Attachments ({pendingAttachments.length}):
                  </span>
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-border rounded-xl text-xs font-medium text-brand-navy shadow-xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-brand-blue" />
                      <span className="max-w-[150px] truncate">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingAttachment(idx)}
                        className="text-brand-muted hover:text-red-500 font-bold ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input Bar (Facebook Messenger Style) */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-brand-border bg-white flex items-center gap-2">
                {/* Hidden File Picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.dwg"
                  className="hidden"
                />

                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl text-brand-muted hover:text-brand-blue hover:bg-blue-50 transition-colors shrink-0"
                  title="Attach Images, Videos, Blueprints, Documents"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message... (Press Enter to send)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isSending || (!messageInput.trim() && pendingAttachments.length === 0)}
                  className="btn-accent px-4 sm:px-5 py-2.5 text-xs font-bold gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessengerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <MessengerContent />
    </Suspense>
  );
}
