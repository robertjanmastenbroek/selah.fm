'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, RefreshCw, User, Bot, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportChatsPage() {
  return <SupportChatsContent />;
}

function SupportChatsContent() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/support-chats', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
      else setError('Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadChats(); }, []);

  const sourceColor = (s: string) => {
    switch (s) {
      case 'ai': return 'bg-primary/10 text-primary border-primary/20';
      case 'keyword': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'human': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/[0.04] text-muted-foreground border-white/[0.06]';
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Support Chats</h1>
          <p className="text-muted-foreground text-sm">{conversations.length} conversations</p>
        </div>
        <button onClick={loadChats} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : error ? (
        <Card className="text-center py-16"><CardContent><p className="text-muted-foreground text-sm mb-4">{error}</p><button onClick={loadChats} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button></CardContent></Card>
      ) : conversations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageCircle size={40} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-lg font-medium mb-1">No chats yet</h2>
            <p className="text-muted-foreground text-sm">Support conversations will appear here as users chat.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, i) => {
            const isOpen = expanded === conv.id;
            const firstMsg = conv.messages[conv.messages.length - 1]; // oldest
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : conv.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageCircle size={14} className="text-primary/40 shrink-0" />
                          <span className="text-xs text-muted-foreground font-mono">#{conv.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                            <Clock size={10} /> {formatDate(conv.started_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{firstMsg?.user_message?.slice(0, 80) || '(no message)'}</span>
                          <span className="text-[10px] text-muted-foreground/50 shrink-0">{conv.message_count} messages</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </CardContent>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
                          {conv.messages.slice().reverse().map((msg: any) => (
                            <div key={msg.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-2.5">
                                <div className="flex items-center gap-1 mb-1">
                                  <User size={10} className="text-blue-400" />
                                  <span className="text-[9px] text-blue-400 font-medium">User</span>
                                  <span className="text-[8px] text-muted-foreground/50 ml-auto">{formatDate(msg.created_at)}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">{msg.user_message}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
                                <div className="flex items-center gap-1 mb-1">
                                  <Bot size={10} className="text-emerald-400" />
                                  <span className="text-[9px] text-emerald-400 font-medium">AI</span>
                                  <Badge className={`text-[8px] ml-auto ${sourceColor(msg.reply_source)}`}>{msg.reply_source}</Badge>
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">{msg.bot_reply || '(no reply)'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
