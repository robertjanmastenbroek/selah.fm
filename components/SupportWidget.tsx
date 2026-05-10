'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bug, Mail, Sparkles, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

// ── Selah AI response engine ──────────────────────────────────────
function getBotResponse(userMessage: string): string | null {
  const msg = userMessage.toLowerCase();

  // Campaign / artist questions
  if (/(create|campaign|promote|launch).*(track|song|music)/.test(msg)) {
    return "To create a campaign: go to your Dashboard, click New, choose a track, set your CPM rate and budget, and launch. Creators will find it on the Browse page and start making content!";
  }
  if (/(cpm|rate|budget|cost|price|pricing)/.test(msg)) {
    return "You set your own CPM rate (cost per 1,000 views). The platform takes a 20% service fee from creator payouts. There are no hidden costs — you only pay for verified views you approve.";
  }
  if (/(fee|fees|charge|commission|platform fee)/.test(msg)) {
    return "Selah.fm charges a 20% platform fee on creator payouts. Artists pay exactly what they budget — no surprise costs. Creators earn 80% of the CPM for verified views.";
  }

  // Creator questions
  if (/(join|submit|content|video).*(campaign|promote)/.test(msg)) {
    return "Browse campaigns at selah.fm/browse, click 'Join campaign' on any track you like, paste your video link, and submit. The artist reviews it — if approved, you earn based on verified views!";
  }
  if (/(earn|payout|get paid|money|cash)/.test(msg)) {
    return "Creators earn per 1,000 verified views at the campaign's CPM rate, minus the 20% platform fee. Payouts are processed via Stripe Connect. Set up your Stripe account in the Earnings page.";
  }

  // Payments / Stripe
  if (/(stripe|payment|bank|payout|connect)/.test(msg)) {
    return "We use Stripe for all payments. Artists deposit via Stripe Checkout. Creators connect their bank account via Stripe Connect in the Earnings page to receive payouts. It's secure and works in 40+ countries.";
  }
  if (/(deposit|fund|add.*budget)/.test(msg)) {
    return "You can add budget to an active campaign from your Dashboard — click 'Add budget' on any campaign card. Payments are processed securely through Stripe.";
  }

  // Verification
  if (/(verify|views|fake|bot|real)/.test(msg)) {
    return "We verify views through YouTube's public API, TikTok's oEmbed, and manual review for Instagram. Only organic, verified views count toward creator earnings. We take fraud seriously.";
  }

  // Account / login issues
  if (/(login|sign.*in|sign.*up|register|account|password|google|oauth)/.test(msg)) {
    return "You can sign up with email/password or continue with Google. If you signed up via Google, use the 'Continue with Google' button — password login won't work for Google accounts. For password resets, contact support@selah.fm.";
  }
  if (/(forgot|reset|change.*password)/.test(msg)) {
    return "Password reset isn't self-service yet — but we're building it! For now, email support@selah.fm and we'll help you reset within 24 hours.";
  }

  // General platform info
  if (/(about|what is|how does|platform|marketplace)/.test(msg)) {
    return "Selah.fm is an open-source CPM marketplace for music promotion. Artists create campaigns with budgets, creators make TikToks/Reels/Shorts using the track, artists review and approve, and creators get paid for verified views. We're transparent — all code is MIT licensed on GitHub!";
  }
  if (/(open.source|github|code|mit|license)/.test(msg)) {
    return "Selah.fm is fully open source under the MIT license! Check out the code at github.com/robertjanmastenbroek/selah.fm. You can contribute, audit, or run your own instance.";
  }

  // Greetings
  if (/^(hi|hello|hey|yo|sup|hola|greetings)/.test(msg.trim())) {
    return "Hey there! 👋 I'm Selah AI, your support assistant. I can help with campaigns, payments, creator questions, or anything about the platform. What can I help you with?";
  }

  // Thanks
  if (/(thanks|thank you|thx|appreciate)/.test(msg.trim())) {
    return "You're welcome! Happy to help. If you need anything else, just ask. 🎵";
  }

  // Fallback — offer human escalation
  return null;
}

// ── Component ────────────────────────────────────────────────────
export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', content: "Hi! I'm Selah AI — your support assistant. Ask me anything about campaigns, payments, creators, or the platform. If I can't help, I'll connect you with a human.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [emailForwarded, setEmailForwarded] = useState(false);
  const msgEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 200); }, [open, minimized]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    // Add user message
    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    // Get bot response
    setTimeout(() => {
      const botReply = getBotResponse(userMsg);
      if (botReply) {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: 'bot', content: botReply, timestamp: new Date() }]);
        setSending(false);
      } else {
        // Bot couldn't answer — offer escalation
        setMessages(prev => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          content: "I'm not sure about that one — let me connect you with our team. They'll get back to you by email, usually within a few hours.",
          timestamp: new Date(),
        }]);
        setEmailForwarded(true);
        setSending(false);

        // Forward to email via API
        fetch('/api/support', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, history: messages.slice(-4).map(m => `${m.role}: ${m.content}`) }),
        }).catch(() => {});
      }
    }, 600 + Math.random() * 800); // Simulate typing delay
  };

  const reportBug = () => {
    setMessages(prev => [
      ...prev,
      { id: `sys-${Date.now()}`, role: 'system', content: '🐛 Opening bug report form... You can also report directly at /report-bug.', timestamp: new Date() },
    ]);
    window.open('/report-bug', '_blank');
  };

  const requestHuman = () => {
    setMessages(prev => [
      ...prev,
      { id: `sys-${Date.now()}`, role: 'system', content: '📧 Forwarding your conversation to support@selah.fm. Someone will email you shortly.', timestamp: new Date() },
    ]);
    setEmailForwarded(true);

    fetch('/api/support', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'User requested human support', history: messages.map(m => `${m.role}: ${m.content}`), urgent: true }),
    }).catch(() => {});
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9998] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Selah AI Support</p>
                <p className="text-[10px] text-muted-foreground">{emailForwarded ? 'Human notified' : 'Instant AI responses'}</p>
              </div>
              <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground active:scale-[0.95]" title="Minimize">
                <Minimize2 size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground active:scale-[0.95]" title="Close">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => {
                if (m.role === 'system') {
                  return (
                    <div key={m.id} className="text-center">
                      <span className="text-[11px] text-muted-foreground/60 bg-white/[0.02] px-3 py-1 rounded-full">{m.content}</span>
                    </div>
                  );
                }
                const isBot = m.role === 'bot';
                return (
                  <div key={m.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isBot
                        ? 'bg-white/[0.04] text-foreground rounded-bl-md'
                        : 'bg-primary text-primary-foreground rounded-br-md'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd} />
            </div>

            {/* Actions row */}
            <div className="shrink-0 px-4 pb-1 flex gap-2">
              <button
                onClick={reportBug}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors active:scale-[0.97]"
              >
                <Bug size={12} /> Report a bug
              </button>
              <button
                onClick={requestHuman}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors active:scale-[0.97]"
              >
                <Mail size={12} /> Talk to a human
              </button>
            </div>

            {/* Input */}
            <div className="shrink-0 p-3 border-t border-white/[0.06] flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything..."
                disabled={sending}
                className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90 active:scale-95"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => {
          if (!open) { setOpen(true); setMinimized(false); }
          else if (minimized) setMinimized(false);
          else setOpen(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-colors ${
          open && !minimized
            ? 'bg-white/[0.06] border border-white/[0.1]'
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {open && !minimized ? (
          <X size={22} className="text-foreground" />
        ) : minimized ? (
          <MessageCircle size={22} className="text-primary-foreground" />
        ) : (
          <MessageCircle size={22} className="text-primary-foreground" />
        )}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-primary" />
        )}
      </motion.button>

      {/* Minimized notification dot */}
      {minimized && open && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setMinimized(false)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Support chat minimized — tap to open
        </motion.button>
      )}
    </div>
  );
}
