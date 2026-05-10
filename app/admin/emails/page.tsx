'use client';

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, ExternalLink, Send, X, Inbox, ArrowLeft, ChevronLeft } from 'lucide-react';

export default function EmailsPage() {
  return <EmailsContent />;
}

function EmailsContent() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [mailbox, setMailbox] = useState<'support' | 'info'>('support');
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  // Compose state
  const [compose, setCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [fromAddr, setFromAddr] = useState('info');
  const [imageUrl, setImageUrl] = useState('');

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inbox?mailbox=${mailbox}`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setEmails(data);
      else setError('Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const loadSent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setEmails(data);
      else setError('Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'inbox') loadInbox();
    else loadSent();
  }, [tab, mailbox]);

  const openEmail = async (email: any) => {
    setSelected(email);
    if (tab === 'inbox' && !email.read) {
      try {
        await fetch('/api/admin/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: email.id }),
        });
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
      } catch {}
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const subject = selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`;
      const res = await fetch('/api/admin/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selected.from_address, subject, body: replyText, from: mailbox }),
      });
      const data = await res.json();
      setStatus(data.sent ? 'Reply sent ✓' : `Failed: ${data.reason || 'Unknown'}`);
      if (data.sent) { setReplyMode(false); setReplyText(''); setSelected(null); }
    } catch { setStatus('Network error'); }
    setSending(false);
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: composeTo.trim(), subject: composeSubject.trim(), body: composeBody.trim(), from: fromAddr, imageUrl: imageUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (data.sent) {
        setStatus('Sent ✓');
        setCompose(false); setComposeTo(''); setComposeSubject(''); setComposeBody(''); setImageUrl('');
        loadSent();
      } else { setStatus(`Failed: ${data.reason || 'Unknown'}`); }
    } catch { setStatus('Network error'); }
    setSending(false);
  };

  const unreadCount = emails.filter((e: any) => !e.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Email</h1>
          <p className="text-muted-foreground text-sm">
            info@selah.fm · support@selah.fm ·{' '}
            <a href="https://resend.com/emails" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
              Resend <ExternalLink size={12} />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => tab === 'inbox' ? loadInbox() : loadSent()} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {!compose && (
            <button onClick={() => { setCompose(true); setSelected(null); setReplyMode(false); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97]">
              <Send size={14} /> Compose
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${status.includes('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {status}
          <button onClick={() => setStatus('')} className="ml-3 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Compose form */}
      {compose && (
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">New message</h2>
            <button onClick={() => setCompose(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">From:</span>
            <select value={fromAddr} onChange={e => setFromAddr(e.target.value)} className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground">
              <option value="info">info@selah.fm</option>
              <option value="support">support@selah.fm</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">To:</span>
            <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="email@example.com" className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Subj:</span>
            <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject" className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
          </div>
          <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." className="w-full h-40 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Img:</span>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
          </div>
          <button onClick={handleSend} disabled={sending || !composeTo || !composeSubject || !composeBody} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {sending ? 'Sending...' : 'Send email'}
          </button>
        </div>
      )}

      {/* Email detail view */}
      {selected && !compose && (
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden mb-6">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <button onClick={() => { setSelected(null); setReplyMode(false); }} className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{selected.subject}</h3>
              <p className="text-xs text-muted-foreground">
                {tab === 'inbox' ? `From: ${selected.from_address}` : `To: ${selected.recipient}`} · {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>
            {tab === 'inbox' && !replyMode && (
              <button onClick={() => setReplyMode(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Reply</button>
            )}
          </div>
          <div className="p-5">
            {tab === 'inbox' ? (
              <div className="text-sm text-muted-foreground leading-relaxed [&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-primary" dangerouslySetInnerHTML={{ __html: selected.body_html || selected.body_text || '(No content)' }} />
            ) : (
              <p className="text-sm text-muted-foreground">{selected.subject} — <span className={selected.sent ? 'text-emerald-400' : 'text-red-400'}>{selected.sent ? 'Delivered' : 'Failed'}</span></p>
            )}
            {replyMode && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." className="w-full h-32 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none" />
                <div className="flex gap-2">
                  <button onClick={handleReply} disabled={sending || !replyText.trim()} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40">{sending ? 'Sending...' : 'Send reply'}</button>
                  <button onClick={() => setReplyMode(false)} className="px-4 py-2 rounded-lg bg-white/[0.04] text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {!selected && !compose && (
        <>
          <div className="flex items-center gap-1 mb-4">
            {[
              { id: 'inbox' as const, label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Inbox },
              { id: 'sent' as const, label: 'Sent', icon: Send },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
            {tab === 'inbox' && (
              <div className="ml-auto flex rounded-lg border border-white/[0.06] overflow-hidden">
                {(['support', 'info'] as const).map(m => (
                  <button key={m} onClick={() => setMailbox(m)} className={`px-3 py-1.5 text-xs font-medium ${mailbox === m ? 'bg-white/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m}@selah.fm
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <button onClick={() => tab === 'inbox' ? loadInbox() : loadSent()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">{tab === 'inbox' ? 'No emails received yet.' : 'No emails sent yet.'}</p>
              </div>
            ) : (
              <div>
                {emails.map((email: any, i: number) => (
                  <button key={email.id || i} onClick={() => openEmail(email)} className={`w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0 ${tab === 'inbox' && !email.read ? 'bg-white/[0.02]' : ''}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${tab === 'inbox' && !email.read ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-sm truncate ${tab === 'inbox' && !email.read ? 'font-semibold' : ''}`}>
                          {tab === 'inbox' ? email.from_address : email.recipient}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{new Date(email.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${tab === 'inbox' && !email.read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        {email.subject}
                        {tab === 'sent' && !email.sent && <span className="ml-2 text-red-400">Failed</span>}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
