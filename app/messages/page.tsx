'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';

interface UserInfo { id: string; display_name: string; profile_image_url?: string; }
interface Conversation { other_user: UserInfo; last_message: { content: string; created_at: string }; unread_count: number; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; read: boolean; }

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const preselectedUser = searchParams.get('user');
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  // Fetch current user + conversations
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUserId(d.user.id); })
      .catch(() => {});
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        setUnreadTotal(data.unreadTotal || data.conversations.reduce((s: number, c: Conversation) => s + c.unread_count, 0));
        
        // Pre-select user from URL param
        if (preselectedUser && data.conversations.length > 0) {
          const match = data.conversations.find((c: Conversation) => c.other_user.id === preselectedUser);
          if (match) selectConversation(match.other_user);
        }
      }
    } catch {} finally { setLoading(false); }
  }, [preselectedUser]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedUser) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?with=${selectedUser.id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
        
        // Mark as read
        fetch('/api/messages', {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: selectedUser.id }),
        }).catch(() => {});
        
        // Refresh conversations for updated previews
        loadConversations();
      } catch {}
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [selectedUser]);

  // Auto-scroll
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectConversation = async (user: UserInfo) => {
    setSelectedUser(user);
    try {
      const res = await fetch(`/api/messages?with=${user.id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      
      // Mark as read
      fetch('/api/messages', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id }),
      }).catch(() => {});
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedUser || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, sender_id: currentUserId, receiver_id: selectedUser.id, content, created_at: new Date().toISOString(), read: false }]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: selectedUser.id, content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.message.id } : m));
      }
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showList, setShowList] = useState(true);

  const backToList = () => { setShowList(true); setSelectedUser(null); };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <div className="max-w-5xl mx-auto h-[calc(100vh-56px)] flex">
        {/* ── Conversation List ── */}
        <AnimatePresence>
          {(showList || !isMobile) && (
            <motion.div
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className={`${selectedUser && isMobile ? 'hidden' : 'flex'} flex-col border-r border-white/[0.06] bg-white/[0.01] ${isMobile ? 'w-full' : 'w-80 shrink-0'}`}
            >
              <div className="p-5 border-b border-white/[0.06]">
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Messages</h1>
                {unreadTotal > 0 && <p className="text-xs text-muted-foreground mt-1">{unreadTotal} unread</p>}
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                        <div className="flex-1"><div className="h-3 w-24 bg-white/[0.04] rounded mb-2" /><div className="h-2 w-40 bg-white/[0.02] rounded" /></div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle size={32} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-xs text-muted-foreground/50">Start a conversation from a campaign or creator profile</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button
                      key={c.other_user.id}
                      onClick={() => { selectConversation(c.other_user); if (isMobile) setShowList(false); }}
                      className={`w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] ${selectedUser?.id === c.other_user.id ? 'bg-white/[0.04]' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                        {c.other_user.profile_image_url ? (
                          <img src={c.other_user.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{c.other_user.display_name || 'User'}</p>
                          <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{timeAgo(c.last_message.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message.content}</p>
                      </div>
                      {c.unread_count > 0 && (
                        <div className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Message Thread ── */}
        <div className={`flex-1 flex flex-col ${!selectedUser && !isMobile ? 'items-center justify-center' : ''} ${selectedUser || isMobile ? '' : 'hidden md:flex'}`}>
          {!selectedUser ? (
            <div className="text-center p-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-muted-foreground/10" />
              <p className="text-muted-foreground text-sm">Select a conversation</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Choose a contact from the left to start chatting</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                {isMobile && (
                  <button onClick={backToList} className="p-1 -ml-1"><ArrowLeft size={20} className="text-muted-foreground" /></button>
                )}
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-muted-foreground/40" />
                  )}
                </div>
                <p className="font-semibold text-sm">{selectedUser.display_name || 'User'}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.sender_id === currentUserId;
                  const showTimestamp = i === 0 || new Date(m.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
                  const isLast = i === messages.length - 1;
                  return (
                    <div key={m.id}>
                      {showTimestamp && (
                        <p className="text-center text-[10px] text-muted-foreground/40 mb-3">
                          {new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {formatTime(m.created_at)}
                        </p>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMe
                            ? 'bg-[#4338CA] text-white rounded-br-md'
                            : 'bg-white/[0.04] text-foreground rounded-bl-md'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                      {isLast && isMe && (
                        <p className="text-right text-[9px] text-muted-foreground/30 mt-1 mr-1">
                          {m.read ? 'Read' : 'Delivered'}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/[0.06] shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm resize-none max-h-24 focus:border-primary/30 focus:outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 rounded-full bg-[#4338CA] flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 transition-opacity"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
