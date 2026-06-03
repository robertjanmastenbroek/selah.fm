'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion, AnimatePresence } from 'framer-motion';
import CreatorAvatar from '@/components/CreatorAvatar';
import { ArrowLeft, Send, MessageCircle, X } from 'lucide-react';

interface Conversation {
  other_id: string;
  other_name: string;
  other_avatar: string;
  content: string;
  created_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export default function ChatWidget({ startWithUserId }: { startWithUserId?: string }) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ownUserId, setOwnUserId] = useState('');

  // Get own user ID from shared SWR cache (TopNav already warmed it)
  const { data: me } = useSWR('/api/auth/me', fetcher, swrConfig);
  useEffect(() => {
    if (me?.user?.id && !ownUserId) setOwnUserId(me.user.id);
  }, [me, ownUserId]);
  const msgEnd = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch conversations list ──────────────────────────────────
  const fetchConversations = useCallback(() => {
    fetch('/api/messages', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const raw = d.conversations || d;
        if (Array.isArray(raw)) {
          setConversations(raw.map((c: any) => ({
            other_id: c.other_user?.id || '',
            other_name: c.other_user?.display_name || 'User',
            other_avatar: c.other_user?.profile_image_url || '',
            content: c.last_message?.content || '',
            created_at: c.last_message?.created_at || '',
            unread: c.unread_count || 0,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch messages for active conversation ────────────────────
  const fetchMessages = useCallback((userId: string) => {
    fetch(`/api/messages?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setMessages(d);
          // Determine own user ID from the messages: find a message where
          // sender_id or receiver_id doesn't match the other user's ID
          const otherId = userId;
          for (const m of d) {
            if (m.sender_id !== otherId) {
              setOwnUserId(m.sender_id);
              break;
            }
            if (m.receiver_id !== otherId) {
              setOwnUserId(m.receiver_id);
              break;
            }
          }
        } else {
          setMessages([]);
        }
      })
      .catch(() => {});
  }, []);

  // ── Listen for external open-chat events (MessageButton) ──────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.userId) {
        setActiveConv({
          other_id: detail.userId,
          other_name: detail.name || 'User',
          other_avatar: '',
          content: '',
          created_at: '',
          unread: 0,
        });
        setOpen(true);
      }
    };
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  // ── Poll conversations list every 30s (even when closed, to update badge) ──
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ── Load conversations when opened ────────────────────────────
  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open, fetchConversations]);

  // Only poll when a conversation is active AND the widget is open
  useEffect(() => {
    if (!activeConv?.other_id || !open) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    fetchMessages(activeConv.other_id);
    pollRef.current = setInterval(() => fetchMessages(activeConv.other_id), 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConv, open, fetchMessages]);

  // ── Auto-scroll to bottom when messages change ────────────────
  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Focus input when opening a conversation ───────────────────
  useEffect(() => {
    if (activeConv && open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConv, open]);

  // ── Send message ──────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update: add message to local state immediately
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      sender_id: ownUserId,
      receiver_id: activeConv.other_id,
      content,
      created_at: new Date().toISOString(),
      sender_name: 'You',
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: activeConv.other_id, content }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setInput(content); // Restore input
        if (err.error?.includes('relation') || err.error?.includes('exist')) {
          alert('Chat requires setup. Run Admin → Migrate first.');
        } else {
          console.error('Failed to send message:', err.error);
        }
        return;
      }

      // Replace optimistic message with server response
      const sent = await res.json();
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...sent, sender_name: 'You' } : m));
      // Refresh conversations list to update the last message preview
      fetchConversations();
    } catch (e) {
      // Network error — remove optimistic message, restore input
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInput(content);
      console.error('Network error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  // ── Open a conversation ───────────────────────────────────────
  const openChat = (conv: Conversation, e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveConv(conv);
    // Mark as read
    if (conv.unread > 0) {
      fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: conv.other_id }),
      })
        .then(() => fetchConversations()) // Refresh after marking read
        .catch(() => {});
      // Optimistically clear unread count
      setConversations(prev =>
        prev.map(c => c.other_id === conv.other_id ? { ...c, unread: 0 } : c)
      );
    }
  };

  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <>
      {/* Floating chat bubble — always visible, collapsed by default */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-primary shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Messages"
      >
        {open ? (
          <X size={20} className="text-primary-foreground" />
        ) : (
          <>
            <MessageCircle size={22} className="text-primary-foreground" strokeWidth={1.5} />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 shadow-sm">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-20 top-1/2 -translate-y-1/2 z-50 w-80 sm:w-96 h-[480px] rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl origin-right"
          >
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/[0.06] flex items-center gap-3">
              {activeConv ? (
                <>
                  <button
                    onClick={() => setActiveConv(null)}
                    className="p-1 -ml-1 hover:text-foreground text-muted-foreground"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <CreatorAvatar name={activeConv.other_name} size="sm" />
                  <span className="font-medium text-sm">{activeConv.other_name}</span>
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="text-primary" strokeWidth={1.5} />
                  <span className="font-medium text-sm">Messages</span>
                </>
              )}
              <button
                onClick={() => { setOpen(false); setActiveConv(null); }}
                className="ml-auto p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!activeConv ? (
                /* Conversation list */
                <div>
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <img src="/images/empty-messages.png" alt="No messages" className="mx-auto mb-4 w-24 h-24 object-contain opacity-70" loading="lazy" />
                      <p>No messages yet</p>
                      <p className="text-xs mt-1 text-muted-foreground/60">
                        Find artists or creators and click Message to start a conversation.
                      </p>
                    </div>
                  ) : (
                    conversations.map(c => (
                      <button
                        key={c.other_id}
                        onClick={(e) => openChat(c, e)}
                        className={`w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] ${
                          c.unread > 0 ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        <CreatorAvatar name={c.other_name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{c.other_name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.content}</p>
                        </div>
                        {c.unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                            {c.unread}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Chat thread */
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map(m => {
                      // Determine if this message is from the current user
                      const isOwn = ownUserId
                        ? m.sender_id === ownUserId
                        : m.sender_id !== activeConv.other_id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-white/[0.06] text-foreground rounded-bl-md'
                            } ${m.id.startsWith('opt-') ? 'opacity-70' : ''}`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={msgEnd} />
                </div>
              )}
            </div>

            {/* Input */}
            {activeConv && (
              <div className="shrink-0 p-3 border-t border-white/[0.06] flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90 active:scale-95"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}