'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MessageCircle, User, X, AlertCircle } from 'lucide-react';

interface UserInfo { id: string; display_name: string; profile_image_url?: string; }
interface Conversation { other_user: UserInfo; last_message: { content: string; created_at: string }; unread_count: number; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; read: boolean; }

// ── New Message Button (with live autocomplete) ──
function NewMessageButton({ campaignId, onConversationStart }: { campaignId?: string; onConversationStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const searchTimer = useRef<NodeJS.Timeout>();

  // Debounced live search — on mount (empty query), show all users
  useEffect(() => {
    if (selectedUser) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`, { credentials: 'include' });
        const data = await res.json();
        setSuggestions(data.users || []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 200);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, selectedUser]);

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setQuery(user.display_name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const startConversation = () => {
    if (!selectedUser) return;
    router.push(`/messages?user=${selectedUser.id}`);
    setOpen(false);
    setQuery('');
    setSelectedUser(null);
    setSuggestions([]);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4338CA] text-white hover:bg-[#4338CA]/90 transition-all active:scale-[0.97] flex items-center gap-1.5">
        <MessageCircle size={13} /> New
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => { setOpen(false); setQuery(''); setSelectedUser(null); setSuggestions([]); setShowDropdown(false); }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New message</h3>
                <button onClick={() => { setOpen(false); setQuery(''); setSelectedUser(null); setSuggestions([]); setShowDropdown(false); }}
                  className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"><X size={18} className="text-muted-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground">Select a user below or search by name to start a conversation.</p>
              
              {/* Live search input with autocomplete */}
              <div className="relative">
                <div className="flex gap-2">
                  <Input value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedUser(null); setShowDropdown(false); }}
                    placeholder="Search by name..."
                    className="flex-1 text-sm rounded-xl h-11 bg-white/[0.04] border-white/[0.06]"
                    autoFocus
                  />
                  {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-[#4338CA]/30 border-t-[#4338CA] rounded-full animate-spin" /></div>}
                </div>

                {/* Autocomplete dropdown */}
                <AnimatePresence>
                  {showDropdown && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-20 mt-1 w-full rounded-xl bg-[#1C1C3A] border border-white/[0.08] shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {suggestions.map((s: any) => (
                        <button
                          key={s.id + (s._type || 'user')}
                          onClick={() => selectUser(s)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0 ${
                            selectedUser?.id === s.id ? 'bg-white/[0.04]' : ''
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                            {s.profile_image_url ? (
                              <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.display_name || 'User'}</p>
                            {s.email && <p className="text-[10px] text-muted-foreground/50 truncate">{s.email}</p>}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected user preview */}
              {selectedUser && (
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedUser.profile_image_url ? (
                      <img src={selectedUser.profile_image_url} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={18} className="text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{selectedUser.display_name || 'User'}</p>
                    {selectedUser.email && <p className="text-[10px] text-muted-foreground/50 truncate">{selectedUser.email}</p>}
                  </div>
                  <button onClick={startConversation}
                    className="px-4 py-2 rounded-xl bg-[#4338CA] text-white text-xs font-semibold hover:bg-[#4338CA]/90 transition-all">
                    Message
                  </button>
                </div>
              )}

              {/* Empty state */}
              {query.length > 0 && !searching && suggestions.length === 0 && !selectedUser && (
                <p className="text-xs text-muted-foreground/60 text-center py-4">No users found matching &quot;{query}&quot;. Try a different name.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const preselectedUser = searchParams.get('user');
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const loadingRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [preselectLoading, setPreselectLoading] = useState(!!preselectedUser);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

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
      const convs = data.conversations || [];
      setConversations(convs);
      setUnreadTotal(convs.reduce((s: number, c: Conversation) => s + c.unread_count, 0));
      
      // Pre-select user from URL param — even without existing conversations
      if (preselectedUser) {
        const match = convs.find((c: Conversation) => c.other_user.id === preselectedUser);
        if (match) {
          selectConversation(match.other_user);
          if (isMobile) setShowList(false);
        } else {
          // No existing conversation — fetch user by ID directly
          const searchRes = await fetch("/api/users/search?id=" + encodeURIComponent(preselectedUser), { credentials: "include" });
          const searchData = await searchRes.json();
          const user = searchData.users?.[0];
          if (user) {
            setSelectedUser({
              id: user.id,
              display_name: user.display_name || "User",
              profile_image_url: user.profile_image_url || "",
            });
            setMessages([]);
            if (isMobile) setShowList(false);
          }
        }
        setPreselectLoading(false);
      }
    } catch {} finally { setLoading(false); }
  }, [preselectedUser]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── SSE for real-time delivery ────────────────────────────
  const sseRef = useRef<EventSource | null>(null);
  useEffect(() => {
    if (!selectedUser) return;
    
    // Try SSE for real-time updates
    try {
      const es = new EventSource(`/api/messages/stream?with=${selectedUser.id}`, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener('messages', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.messages) {
            const serverIds = new Set(data.messages.map((m: any) => m.id));
            setMessages(prev => {
              const localOnly = prev.filter(m => m.id.startsWith('temp-') && !serverIds.has(m.id));
              return localOnly.length > 0 ? [...data.messages, ...localOnly] : data.messages;
            });
            // Update own user ID
            const otherId = selectedUser.id;
            const found = data.messages.find((m: any) => m.sender_id !== otherId);
            if (found) setCurrentUserId(found.sender_id);
          }
        } catch {}
      });

      es.onerror = () => {
        // SSE failed — fall back to polling
        es.close();
        sseRef.current = null;
        startPolling();
      };
    } catch {
      startPolling();
    }

    // Poll for typing indicator every 3s
    const pollTyping = () => {
      if (!selectedUser) return;
      fetch(`/api/messages/typing?with=${selectedUser.id}`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => setOtherTyping(d.typing || false))
        .catch(() => setOtherTyping(false));
    };
    pollTyping();
    typingPollRef.current = setInterval(pollTyping, 3000);

    return () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); }
      if (typingPollRef.current) { clearInterval(typingPollRef.current); }
    };
  }, [selectedUser]);

  // Fire typing indicator on input change (uses ref to avoid stale closures)
  const typingTargetRef = useRef<string>('');
  const handleInputChange = (value: string) => {
    setInput(value);
    typingTargetRef.current = selectedUser?.id || '';
    if (!selectedUser || !value.trim()) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    const otherId = selectedUser.id;
    fetch('/api/messages/typing', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_with: otherId }),
    }).catch(() => {});
    typingTimerRef.current = setTimeout(() => {
      fetch('/api/messages/typing', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_with: otherId }),
      }).catch(() => {});
    }, 3000);
  };

  // Polling fallback (used when SSE fails)
  const startPolling = () => {
    if (!selectedUser) return;
    if (pollRef.current) clearInterval(pollRef.current);
    const otherId = selectedUser.id;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?with=${otherId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.messages) {
          const serverIds = new Set(data.messages.map((m: any) => m.id));
          setMessages(prev => {
            const localOnly = prev.filter(m => m.id.startsWith('temp-') && !serverIds.has(m.id));
            return localOnly.length > 0 ? [...data.messages, ...localOnly] : data.messages;
          });
        }
        
        fetch('/api/messages', {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: otherId }),
        }).catch(() => {});
        
        loadConversations();
      } catch {}
    }, 10000);
  };

  // Auto-scroll messages container (not the page — keeps thread header visible)
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

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
    if (!selectedUser || sending) return;
    const text = input.trim();
    if (!text) return;
    const receiverId = selectedUser.id;
    
    setInput('');
    setSending(true);

    // Optimistic UI
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, sender_id: currentUserId || '', receiver_id: receiverId, content: text, created_at: new Date().toISOString(), read: false }]);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId, content: text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data?.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.message.id, created_at: data.message.created_at } : m));
        loadConversations();
      } else if (data?.error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInput(text);
        setSendError(true);
        setTimeout(() => setSendError(false), 3000);
        console.error('Failed to send message:', data.error);
      } else {
        console.error('Unexpected API response:', data);
      }
    } catch (e: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
      setSendError(true);
      setTimeout(() => setSendError(false), 3000);
      if (e.name === 'AbortError') console.error('Message send timed out');
      else console.error('Network error sending message:', e);
    }
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [sendError, setSendError] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const typingPollRef = useRef<ReturnType<typeof setInterval>>();

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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Messages</h1>
                    {unreadTotal > 0 && <p className="text-xs text-muted-foreground mt-1">{unreadTotal} unread</p>}
                  </div>
                  <NewMessageButton onConversationStart={loadConversations} />
                </div>
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
                    <p className="text-xs text-muted-foreground/50">Find artists or creators you have worked with and click Message to start a conversation</p>
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedUser.display_name || 'User'}</p>
                  {otherTyping && (
                    <p className="text-[10px] text-primary/60 animate-pulse">
                      <span className="inline-flex gap-0.5">
                        typing<span className="animate-bounce" style={{animationDelay:'0ms'}}>.</span>
                        <span className="animate-bounce" style={{animationDelay:'150ms'}}>.</span>
                        <span className="animate-bounce" style={{animationDelay:'300ms'}}>.</span>
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.sender_id === currentUserId;
                  const isOptimistic = m.id.startsWith('temp-');
                  const isLast = i === messages.length - 1;
                  
                  // Date separator logic
                  const prevMsg = i > 0 ? messages[i-1] : null;
                  const showDateSep = !prevMsg || new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                  const showTimeSep = !prevMsg || new Date(m.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000;
                  
                  // Format date label
                  const msgDate = new Date(m.created_at);
                  const today = new Date();
                  const dateLabel = showDateSep
                    ? (msgDate.toDateString() === today.toDateString() ? 'Today'
                      : msgDate.toDateString() === new Date(today.setDate(today.getDate()-1)).toDateString() ? 'Yesterday'
                      : msgDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
                    : null;

                  return (
                    <div key={m.id}>
                      {dateLabel && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-white/[0.04]" />
                          <span className="text-[10px] text-muted-foreground/40 font-medium shrink-0">{dateLabel}</span>
                          <div className="flex-1 h-px bg-white/[0.04]" />
                        </div>
                      )}
                      {showTimeSep && !dateLabel && (
                        <p className="text-center text-[10px] text-muted-foreground/40 mb-3">
                          {formatTime(m.created_at)}
                        </p>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-70' : ''}`}>
                        <div className="group relative max-w-[75%]">
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#4338CA] text-white rounded-br-md'
                              : 'bg-white/[0.04] text-foreground rounded-bl-md'
                          }`}>
                            {m.content}
                            {isMe && isLast && (
                              <span className="ml-1.5 inline-flex text-[9px] opacity-60">
                                {isOptimistic ? '◌' : m.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                          {/* Actions on hover */}
                          <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            <button onClick={() => navigator.clipboard.writeText(m.content)}
                              className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Copy">📋</button>
                            {isMe && !isOptimistic && (
                              <>
                                <button onClick={async () => {
                                  const newText = prompt('Edit message:', m.content);
                                  if (newText && newText !== m.content) {
                                    await fetch('/api/messages', { method: 'PATCH', credentials: 'include',
                                      headers: {'Content-Type':'application/json'},
                                      body: JSON.stringify({ message_id: m.id, content: newText }) });
                                    // Refresh via SSE/poll
                                  }
                                }} className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Edit">✏️</button>
                                <button onClick={async () => {
                                  if (confirm('Delete this message?')) {
                                    await fetch(`/api/messages?id=${m.id}`, { method: 'DELETE', credentials: 'include' });
                                    setMessages(prev => prev.filter(msg => msg.id !== m.id));
                                  }
                                }} className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Delete">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
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
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm resize-none max-h-24 focus:border-primary/30 focus:outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 transition-all ${
                      sendError ? 'bg-red-500 animate-pulse' : 'bg-[#4338CA]'
                    }`}
                    title={sendError ? 'Message failed — try again' : 'Send'}
                  >
                    {sendError ? <X size={14} className="text-white" /> : <Send size={14} className="text-white" />}
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
