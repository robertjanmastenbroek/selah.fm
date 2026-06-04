'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Check, ArrowRight, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const resendEmail = async () => {
    if (!email) return;
    setResent(false);
    setError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });
      if (err) setError(err.message);
      else setResent(true);
    } catch { setError('Failed to resend'); }
  };

  const mailtoLinks = [
    { name: 'Gmail', url: `https://mail.google.com/mail/u/0/#inbox` },
    { name: 'Outlook', url: `https://outlook.live.com/mail/0/inbox` },
    { name: 'Yahoo', url: `https://mail.yahoo.com/d/folders/1` },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.25) 0%, #0F0F23 60%), #0F0F23' }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        {/* Animated mail icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] border border-primary/[0.08] flex items-center justify-center mx-auto"
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Mail size={36} className="text-primary" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-foreground font-medium">{email || 'your email'}</span>
          </p>
        </div>

        {/* Steps */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4 text-left">
          {[
            { num: '1', text: 'Open your email inbox' },
            { num: '2', text: 'Find the email from Selah.fm' },
            { num: '3', text: 'Click the confirmation link' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-primary/[0.08] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{step.num}</span>
              </div>
              <span className="text-sm text-muted-foreground">{step.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick links to mail providers */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50">Open inbox:</span>
          {mailtoLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
            >
              {link.name} <ExternalLink size={10} />
            </a>
          ))}
        </div>

        {/* Resend button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={resendEmail}
            disabled={resent}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {resent ? (
              <><Check size={16} className="text-emerald-400" /> Email sent!</>
            ) : (
              <><RefreshCw size={16} /> Resend email</>
            )}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 justify-center">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/50">
            Didn&apos;t receive it? Check spam folder or try a different email address.
          </p>
        </div>

        {/* Back to login */}
        <a
          href="/login"
          className="block text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors pt-2"
        >
          ← Back to login
        </a>
      </motion.div>
    </div>
  );
}
