'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, RefreshCw, User, Bot } from 'lucide-react';

export default function SupportChatsPage() {
  return <AdminLayout><SupportChatsContent /></AdminLayout>;
}

function SupportChatsContent() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/support-chats');
      const data = await res.json();
      if (Array.isArray(data)) setChats(data);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Support Chats</h1>
          <p className="text-muted-foreground text-sm">Read conversations to improve bot responses and catch bugs.</p>
        </div>
        <button onClick={loadChats} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : error ? (
        <Card className="text-center py-16"><CardContent><p className="text-muted-foreground text-sm mb-4">{error}</p><button onClick={loadChats} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button></CardContent></Card>
      ) : chats.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageCircle size={40} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-lg font-medium mb-1">No chats yet</h2>
            <p className="text-muted-foreground text-sm">Support conversations will appear here as users chat.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map(chat => (
            <Card key={chat.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${sourceColor(chat.reply_source)}`}>{chat.reply_source}</Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(chat.created_at).toLocaleString()}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <User size={12} className="text-blue-400" />
                      <span className="text-[10px] text-blue-400 font-medium">User</span>
                    </div>
                    <p className="text-sm">{chat.user_message}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bot size={12} className="text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">Selah AI</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{chat.bot_reply || '(No reply)'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
