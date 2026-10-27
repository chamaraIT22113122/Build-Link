'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle,
  X,
  Minus,
  Maximize2,
  Send,
  Paperclip,
  CheckCircle2,
  HardHat,
  User,
  ShieldCheck,
  ChevronUp,
} from 'lucide-react';
import { DirectMessageDto, ConversationSummaryDto, UserRole } from '@buildlink/shared';

interface OpenChatWindow {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerRole?: UserRole;
  isVerifiedEngineer?: boolean;
  partnerTitle?: string;
  isMinimized: boolean;
  messages: DirectMessageDto[];
  inputText: string;
  loading: boolean;
}

export function DockedMessenger() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [openChats, setOpenChats] = useState<OpenChatWindow[]>([]);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Listen for global custom events to open chat from any card or sidebar
  useEffect(() => {
    const handleOpenChatEvent = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail || !detail.partnerId) return;
      openChatWithUser(
        detail.partnerId,
        detail.partnerName || 'User',
        detail.partnerAvatar,
        detail.partnerRole,
        detail.isVerifiedEngineer,
        detail.partnerTitle
      );
    };

    window.addEventListener('buildlink:open-chat' as any, handleOpenChatEvent as any);
    return () => {
      window.removeEventListener('buildlink:open-chat' as any, handleOpenChatEvent as any);
    };
  }, [openChats]);

  // Load conversations periodically when user is logged in
  useEffect(() => {
    if (!token || !user) return;

    const loadConversations = async () => {
      try {
        const res = await fetch(`${apiUrl}/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setConversations(data.data);
          const totalUnread = data.data.reduce(
            (acc: number, c: ConversationSummaryDto) => acc + (c.unreadCount || 0),
            0
          );
          setUnreadTotal(totalUnread);
        }
      } catch {
        // Handled silently
      }
    };

    loadConversations();
    const interval = setInterval(loadConversations, 12000);
    return () => clearInterval(interval);
  }, [token, user]);

  const openChatWithUser = async (
    partnerId: string,
    partnerName: string,
    partnerAvatar?: string,
    partnerRole?: UserRole,
    isVerifiedEngineer?: boolean,
    partnerTitle?: string
  ) => {
    // If chat already open, just maximize it
    const existing = openChats.find((c) => c.partnerId === partnerId);
    if (existing) {
      setOpenChats((prev) =>
        prev.map((c) => (c.partnerId === partnerId ? { ...c, isMinimized: false } : c))
      );
      return;
    }

    // Limit to max 2 simultaneously open desktop chatboxes
    let current = [...openChats];
    if (current.length >= 2) {
      current.shift();
    }

    const newChat: OpenChatWindow = {
      partnerId,
      partnerName,
      partnerAvatar,
      partnerRole,
      isVerifiedEngineer,
      partnerTitle,
      isMinimized: false,
      messages: [],
      inputText: '',
      loading: true,
    };

    setOpenChats([...current, newChat]);

    // Load thread
    if (token) {
      try {
        const res = await fetch(`${apiUrl}/messages/thread/${partnerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOpenChats((prev) =>
            prev.map((c) =>
              c.partnerId === partnerId ? { ...c, messages: data.data, loading: false } : c
            )
          );
        }
      } catch {
        setOpenChats((prev) =>
          prev.map((c) => (c.partnerId === partnerId ? { ...c, loading: false } : c))
        );
      }
    }
  };

  const closeChat = (partnerId: string) => {
    setOpenChats((prev) => prev.filter((c) => c.partnerId !== partnerId));
  };

  const toggleMinimize = (partnerId: string) => {
    setOpenChats((prev) =>
      prev.map((c) => (c.partnerId === partnerId ? { ...c, isMinimized: !c.isMinimized } : c))
    );
  };

  const setChatInput = (partnerId: string, text: string) => {
    setOpenChats((prev) =>
      prev.map((c) => (c.partnerId === partnerId ? { ...c, inputText: text } : c))
    );
  };

  const handleSendMessage = async (partnerId: string, e: React.FormEvent) => {
    e.preventDefault();
    const chat = openChats.find((c) => c.partnerId === partnerId);
    if (!chat || !chat.inputText.trim() || !token) return;

    const content = chat.inputText.trim();
    setChatInput(partnerId, '');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: DirectMessageDto = {
      id: tempId,
      senderId: user?.id || 'me',
      senderName: user?.profile?.displayName || 'You',
      recipientId: partnerId,
      recipientName: chat.partnerName,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setOpenChats((prev) =>
      prev.map((c) =>
        c.partnerId === partnerId
          ? { ...c, messages: [...c.messages, optimisticMsg] }
          : c
      )
    );

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: partnerId,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOpenChats((prev) =>
          prev.map((c) =>
            c.partnerId === partnerId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === tempId ? data.data : m)),
                }
              : c
          )
        );
      }
    } catch {
      // Handled silently
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-0 right-2 sm:right-4 z-50 flex items-end space-x-2 sm:space-x-3 pointer-events-auto">
      {/* Docked Open Chat Windows */}
      {openChats.map((chat) => (
        <div
          key={chat.partnerId}
          className="w-[calc(100vw-32px)] sm:w-80 bg-white border border-slate-200 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
          style={{ height: chat.isMinimized ? '48px' : '440px' }}
        >
          {/* Header */}
          <div
            onClick={() => toggleMinimize(chat.partnerId)}
            className="bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-200 select-none"
          >
            <div className="flex items-center space-x-2 truncate">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-xs">
                  {chat.partnerAvatar ? (
                    <img
                      src={chat.partnerAvatar}
                      alt={chat.partnerName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    chat.partnerName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>

              <div className="truncate">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {chat.partnerName}
                  </span>
                  {chat.isVerifiedEngineer && (
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
                  )}
                </div>
                {chat.partnerTitle && (
                  <p className="text-[10px] text-slate-500 truncate">
                    {chat.partnerTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleMinimize(chat.partnerId)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200"
                title={chat.isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => closeChat(chat.partnerId)}
                className="p-1 text-slate-500 hover:text-red-500 rounded hover:bg-slate-200"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          {!chat.isMinimized && (
            <>
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50 text-xs">
                {chat.loading ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <span className="animate-pulse">Loading conversation...</span>
                  </div>
                ) : chat.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4 space-y-1">
                    <MessageCircle className="w-8 h-8 text-slate-300 mb-1" />
                    <p className="font-bold text-slate-900">Say hello to {chat.partnerName}!</p>
                    <p className="text-[11px] text-slate-500">Discuss site work, blueprints, or technical questions directly.</p>
                  </div>
                ) : (
                  chat.messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-2xl break-words text-[12px] leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-brand-blue text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => handleSendMessage(chat.partnerId, e)}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-1.5"
              >
                <input
                  type="text"
                  value={chat.inputText}
                  onChange={(e) => setChatInput(chat.partnerId, e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs rounded-full px-3.5 py-2 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue"
                />
                <button
                  type="submit"
                  disabled={!chat.inputText.trim()}
                  className="p-2 rounded-full bg-brand-blue hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      ))}

      {/* Floating Messenger Tray Button (Facebook Bottom-Right Widget) */}
      <div className="relative">
        {/* Tray Popup */}
        {isTrayOpen && (
          <div className="absolute bottom-12 right-0 w-[calc(100vw-32px)] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden mb-2">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-brand-blue" />
                <span className="font-bold text-xs text-slate-900">Active Conversations</span>
              </div>
              <button
                onClick={() => setIsTrayOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No active conversations yet. Click any engineer on the right sidebar to start chatting!
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.otherUserId}
                    onClick={() => {
                      openChatWithUser(
                        conv.otherUserId,
                        conv.otherUserName,
                        conv.otherUserAvatar,
                        conv.otherUserRole,
                        conv.isVerifiedEngineer,
                        conv.otherUserTitle
                      );
                      setIsTrayOpen(false);
                    }}
                    className="p-3 hover:bg-blue-50/70 cursor-pointer flex items-center space-x-3 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-xs">
                        {conv.otherUserAvatar ? (
                          <img
                            src={conv.otherUserAvatar}
                            alt={conv.otherUserName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          conv.otherUserName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.otherUserName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage || 'Active now'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsTrayOpen(!isTrayOpen)}
          className="relative flex items-center space-x-2 bg-brand-navy hover:bg-slate-800 text-white px-4 py-2.5 rounded-t-xl shadow-xl transition-transform active:scale-95 font-bold text-xs border border-slate-700"
        >
          <MessageCircle className="w-4 h-4 text-brand-orange" />
          <span className="hidden sm:inline">Messenger</span>
          {unreadTotal > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center animate-bounce">
              {unreadTotal}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
