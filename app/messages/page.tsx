'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import { ArrowLeft, Send, MessageCircle, User, X } from 'lucide-react';

interface UserInfo { id: string; display_name: string; profile_image_url?: string; }
interface Conversation { other_user: UserInfo; last_message: { content: string; created_at: string }; unread_count: number; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; read: boolean; status?: 'sending' | 'sent' | 'failed'; }

// ── New Message search modal ──
function NewMessageButton({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const q = query.trim();
    fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [query, open]);

  const select = (user: any) => {
    router.push(`/messages?user=${user.id}`);
    setOpen(false);
    setQuery('');
    setUsers([]);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-1.5">
        <MessageCircle size={13} /> New
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setOpen(false); setQuery(''); setUsers([]); }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
                <div className="relative flex-1">
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search users by name..."
                    autoFocus
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/50" />
                  <button onClick={() => { setOpen(false); setQuery(''); setUsers([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.06]"><X size={16} className="text-muted-foreground" /></button>
                </div>
              </div>
              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3"><MessageCircle size={24} className="text-muted-foreground/30" /></div>
                    <p className="text-sm text-muted-foreground mb-1">{query.trim() ? 'No users found' : 'Loading users...'}</p>
                    <p className="text-xs text-muted-foreground/50">Try a different name or check the spelling.</p>
                  </div>
                ) : (
                  users.map(u => (
                    <button key={u.id} onClick={() => select(u)}
                      className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-0">
                      <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/[0.04]">
                        {u.profile_image_url ? <img src={u.profile_image_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-muted-foreground/40" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{u.display_name || 'User'}</p>
                        {u.email && <p className="text-[10px] text-muted-foreground/50 truncate">{u.email}</p>}
                      </div>
                    </button>
                  ))
                )}
              </div>
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [preselectLoading, setPreselectLoading] = useState(!!preselectedUser);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const typingPollRef = useRef<ReturnType<typeof setInterval>>();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingSent = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auth
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.user) setCurrentUserId(d.user.id); })
      .catch(e => console.error('Auth error:', e));
  }, []);

  // Load conversations + pre-select
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      if (!res.ok) { console.error('Conversations API:', res.status); setLoading(false); return; }
      const data = await res.json();
      const convs = data.conversations || [];
      setConversations(convs);
      setUnreadTotal(convs.reduce((s: number, c: Conversation) => s + c.unread_count, 0));

      // Pre-select from URL — wait for currentUserId, skip self
      if (preselectedUser && currentUserId) {
        if (preselectedUser === currentUserId) { setPreselectLoading(false); return; }
        const match = convs.find((c: Conversation) => c.other_user.id === preselectedUser);
        if (match) { selectUser(match.other_user); }
        else {
          const r = await fetch(`/api/users/search?id=${encodeURIComponent(preselectedUser)}`, { credentials: 'include' });
          if (r.ok) {
            const u = (await r.json()).users?.[0];
            if (u) { setSelectedUser({ id: u.id, display_name: u.display_name || 'User', profile_image_url: u.profile_image_url }); setMessages([]); }
          }
        }
        setPreselectLoading(false);
      }

      // Auto-select most recent conversation if none selected and no URL params
      // (WhatsApp/Telegram pattern — shows last chat immediately on desktop)
      if (!selectedUser && !preselectedUser && convs.length > 0) {
        selectUser(convs[0].other_user);
      }
    } catch (e) { console.error('loadConversations:', e); } finally { setLoading(false); }
  }, [preselectedUser, currentUserId]);

  useEffect(() => { loadConversations(); }, [loadConversations, currentUserId]);

  // Select conversation
  const selectUser = async (user: UserInfo) => {
    setSelectedUser(user);
    try {
      const res = await fetch(`/api/messages?with=${user.id}`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); if (d.messages) setMessages(d.messages); }
      fetch('/api/messages', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user.id }) })
        .catch(e => console.error('Mark read:', e));
    } catch (e) { console.error('selectConversation:', e); }
  };

  // ── Polling (no SSE) ──
  useEffect(() => {
    if (!selectedUser) return;
    const id = selectedUser.id;

    const poll = async () => {
      try {
        const res = await fetch(`/api/messages?with=${id}`, { credentials: 'include', signal: AbortSignal.timeout(10000) });
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) {
          const serverIds = new Set(data.messages.map((m: any) => m.id));
          setMessages(prev => {
            const localOnly = prev.filter(m => m.id.startsWith('temp-') && !serverIds.has(m.id));
            return localOnly.length > 0 ? [...data.messages, ...localOnly] : data.messages;
          });
        }
        fetch('/api/messages', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: id }) })
          .catch(() => {});
        loadConversations();
      } catch (e) { console.error('Poll:', e); }
    };

    pollRef.current = setInterval(poll, 5000);
    return () => { clearInterval(pollRef.current); };
  }, [selectedUser, loadConversations]);

  // Typing indicator — debounced 3s
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (!selectedUser || now - lastTypingSent.current < 3000) return;
    lastTypingSent.current = now;
    fetch('/api/messages/typing', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_with: selectedUser.id }) })
      .catch(e => console.error('Typing:', e));
  }, [selectedUser]);

  // Typing poll — every 3s, check if other is typing
  useEffect(() => {
    if (!selectedUser) return;
    const poll = () => {
      fetch(`/api/messages/typing?with=${selectedUser.id}`, { credentials: 'include' })
        .then(r => r.json()).then(d => setOtherTyping(d.typing || false)).catch(() => setOtherTyping(false));
    };
    poll();
    typingPollRef.current = setInterval(poll, 3000);
    return () => clearInterval(typingPollRef.current);
  }, [selectedUser]);

  // Auto-scroll
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!selectedUser || sending) return;
    const text = input.trim();
    if (!text) return;
    const receiverId = selectedUser.id;
    setInput('');
    setSending(true);

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, sender_id: currentUserId || '', receiver_id: receiverId, content: text, created_at: new Date().toISOString(), read: false, status: 'sending' }]);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiver_id: receiverId, content: text }), signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data?.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? { id: data.message.id, sender_id: currentUserId || '', receiver_id: receiverId, content: text, created_at: data.message.created_at, read: false, status: 'sent' } : m));
        loadConversations();
      } else if (data?.error) {
        // Keep failed message visible — WhatsApp pattern
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        console.error('Send failed:', data.error);
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      if (e.name === 'AbortError') console.error('Send timed out');
      else console.error('Send error:', e);
    }
    setSending(false);
  };

  // Retry
  const retryMessage = async (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' } : m));
    try {
      const controller = new AbortController(); setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiver_id: msg.receiver_id, content: msg.content }), signal: controller.signal });
      const data = await res.json();
      if (data?.message) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { id: data.message.id, sender_id: currentUserId || '', receiver_id: msg.receiver_id, content: msg.content, created_at: data.message.created_at, read: false, status: 'sent' } : m));
        loadConversations();
      } else { setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m)); }
    } catch { setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m)); }
  };

  const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime())/60000); if(m<1)return 'now'; if(m<60)return `${m}m`; const h=Math.floor(m/60); if(h<24)return `${h}h`; const days=Math.floor(h/24); if(days<7)return `${days}d`; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}); };
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});

  return (
    <div className="min-h-screen" style={{background:'#0F0F23'}}>
      <Header />
      <div className="max-w-5xl mx-auto h-[calc(100dvh-56px)] flex overflow-hidden">
        {/* ── Left: List ── */}
        <AnimatePresence>
          {(selectedUser ? !isMobile : true) && (
            <motion.div initial={{x:-20,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-20,opacity:0}}
              className={`flex-col border-r border-white/[0.06] bg-white/[0.01] ${isMobile ? 'w-full' : 'w-80 shrink-0'} ${selectedUser && isMobile ? 'hidden' : 'flex'}`}>
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold" style={{fontFamily:'Righteous,system-ui,sans-serif'}}>Messages</h1>
                    {unreadTotal>0 && <p className="text-xs text-muted-foreground mt-1">{unreadTotal} unread</p>}
                  </div>
                  <NewMessageButton onStart={loadConversations} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? [1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-4 animate-pulse"><div className="w-10 h-10 rounded-full bg-white/[0.04]" /><div className="flex-1 space-y-2"><div className="h-3 w-24 bg-white/[0.04] rounded" /><div className="h-2 w-40 bg-white/[0.02] rounded" /></div></div>
                )) : conversations.length===0 ? (
                  <div className="p-8 text-center"><MessageCircle size={32} className="mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground mb-2">No messages yet</p></div>
                ) : conversations.map(c => (
                  <button key={c.other_user.id} onClick={() => { selectUser(c.other_user); }}
                    className={`w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] ${selectedUser?.id===c.other_user.id?'bg-white/[0.04]':''}`}>
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                      {c.other_user.profile_image_url ? <img src={c.other_user.profile_image_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-muted-foreground/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><p className="text-sm font-medium truncate">{c.other_user.display_name||'User'}</p><span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{timeAgo(c.last_message.created_at)}</span></div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message.content}</p>
                    </div>
                    {c.unread_count>0 && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Right: Thread ── */}
        <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex items-center justify-center' : ''}`}>
          {preselectLoading ? (
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" /><p className="text-xs text-muted-foreground">Loading conversation...</p></div></div>
          ) : !selectedUser ? (
            <div className="text-center p-8"><MessageCircle size={48} className="mx-auto mb-4 text-muted-foreground/10" /><p className="text-muted-foreground text-sm">Select a conversation</p></div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                <button onClick={() => setSelectedUser(null)} className="p-1 -ml-1 md:hidden"><ArrowLeft size={20} className="text-muted-foreground" /></button>
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedUser.profile_image_url ? <img src={selectedUser.profile_image_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedUser.display_name||'User'}</p>
                  {otherTyping && <p className="text-[10px] text-primary/60 animate-pulse">typing<span className="animate-ping">...</span></p>}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.sender_id === currentUserId;
                  const dateSep = !i || new Date(m.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString();
                  const today = new Date();
                  const label = dateSep ? (new Date(m.created_at).toDateString()===today.toDateString()?'Today':new Date(m.created_at).toDateString()===new Date(today.setDate(today.getDate()-1)).toDateString()?'Yesterday':new Date(m.created_at).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})) : null;

                  return (
                    <div key={m.id}>
                      {label && <div className="flex items-center gap-3 py-2"><div className="flex-1 h-px bg-white/[0.04]" /><span className="text-[10px] text-muted-foreground/40 font-medium shrink-0">{label}</span><div className="flex-1 h-px bg-white/[0.04]" /></div>}
                      <div className={`flex ${isMe?'justify-end':'justify-start'}`}>
                        <div className="group relative max-w-[75%]">
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white/[0.04] text-foreground rounded-bl-md'}`}>
                            {m.content}
                          </div>
                          {/* Status */}
                          {isMe && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              {m.status === 'sending' && <span className="text-[9px] text-muted-foreground/40">◌</span>}
                              {m.status === 'failed' ? (
                                <button onClick={() => retryMessage(m)} className="text-[9px] text-red-400 hover:underline flex items-center gap-1">
                                  ❗ Tap to retry
                                </button>
                              ) : m.status === 'sent' ? <span className="text-[9px] text-muted-foreground/40">✓</span> : null}
                            </div>
                          )}
                          {/* Hover: copy */}
                          <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigator.clipboard.writeText(m.content)} className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Copy">📋</button>
                            {isMe && m.status !== 'sending' && m.status !== 'failed' && (
                              <>
                                <button onClick={async () => { const n=prompt('Edit:',m.content); if(n&&n!==m.content){await fetch('/api/messages',{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({message_id:m.id,content:n})}).catch(()=>{});} }} className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Edit">✏️</button>
                                <button onClick={async () => { if(confirm('Delete?')){await fetch(`/api/messages?id=${m.id}`,{method:'DELETE',credentials:'include'});setMessages(p=>p.filter(msg=>msg.id!==m.id));} }} className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-muted-foreground text-[10px]" title="Delete">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/[0.06] shrink-0">
                <div className="flex items-end gap-2">
                  <textarea value={input} onChange={e => { setInput(e.target.value); sendTyping(); }}
                    onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                    placeholder="Message..." rows={1}
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm resize-none max-h-24 focus:border-primary/30 focus:outline-none placeholder:text-muted-foreground" />
                  <button onClick={sendMessage} disabled={!input.trim()||sending}
                    className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 transition-all">
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
