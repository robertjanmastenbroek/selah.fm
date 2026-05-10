'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatorAvatar from '@/components/CreatorAvatar';
import { ArrowLeft, Send, MessageCircle, X } from 'lucide-react';

interface Conversation { id: string; other_name: string; other_id: string; other_avatar: string; content: string; created_at: string; unread: number; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; sender_name: string; }

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ownId, setOwnId] = useState('');
  const [sentTo, setSentTo] = useState('');
  const msgEnd = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  const fetchConversations = () => {
    fetch('/api/messages').then(r=>r.json()).then(d=>{if(Array.isArray(d)) setConversations(d);}).catch(()=>{});
  };

  const fetchMessages = (userId: string) => {
    fetch(`/api/messages?userId=${userId}`).then(r=>r.json()).then(d=>{if(Array.isArray(d)) setMessages(d);setOwnId(d[0]?.receiver_id||'');}).catch(()=>{});
  };

  useEffect(() => { if (open) fetchConversations(); }, [open]);

  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.other_id);
    pollRef.current = setInterval(() => fetchMessages(activeConv.other_id), 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !activeConv) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: activeConv.other_id, content: input }),
    });
    setInput('');
    fetchMessages(activeConv.other_id);
    fetchConversations();
  };

  const openChat = (conv: Conversation, e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveConv(conv);
    // Mark as read
    if (conv.unread > 0) {
      fetch('/api/messages', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ markReadFrom: conv.other_id }) });
    }
  };

  const unreadTotal = conversations.reduce((s,c)=>s+c.unread,0);

  return (
    <div className="relative">
      {/* Chat bell */}
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
        <MessageCircle size={18} strokeWidth={1.5} />
        {unreadTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-11 z-50 w-80 sm:w-96 h-[480px] rounded-2xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/[0.06] flex items-center gap-3">
              {activeConv ? (
                <>
                  <button onClick={() => setActiveConv(null)} className="p-1 -ml-1 hover:text-foreground text-muted-foreground"><ArrowLeft size={16}/></button>
                  <CreatorAvatar name={activeConv.other_name} size="sm"/>
                  <span className="font-medium text-sm">{activeConv.other_name}</span>
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="text-primary" strokeWidth={1.5}/>
                  <span className="font-medium text-sm">Messages</span>
                </>
              )}
              <button onClick={() => setOpen(false)} className="ml-auto p-1 text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!activeConv ? (
                /* Conversation list */
                <div>
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No messages yet</div>
                  ) : (
                    conversations.map(c => (
                      <button key={c.other_id} onClick={(e) => openChat(c, e)}
                        className={`w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] ${c.unread > 0 ? 'bg-white/[0.02]' : ''}`}>
                        <CreatorAvatar name={c.other_name} size="md"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{c.other_name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.content}</p>
                        </div>
                        {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">{c.unread}</span>}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Chat thread */
                <div className="p-4 space-y-3">
                  {messages.map(m => {
                    const isOwn = m.sender_id !== activeConv.other_id;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-white/[0.06] text-foreground rounded-bl-md'}`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={msgEnd} />
                </div>
              )}
            </div>

            {/* Input */}
            {activeConv && (
              <div className="shrink-0 p-3 border-t border-white/[0.06] flex items-center gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
                <button onClick={send} disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity">
                  <Send size={16}/>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
