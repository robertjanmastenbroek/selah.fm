'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Heart, ArrowLeft, Shield, Lock, Sparkles, AlertCircle, Check, Zap, Wallet, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const PRESETS = [
  { amount: 50 }, { amount: 100 }, { amount: 200 }, { amount: 300 }, { amount: 500 }, { amount: 1000 },
];

// ── Circle Progress ─────────────────────────────────────────
function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  return `rgb(${lerpColor(0x5B, 0x1E, t)},${lerpColor(0x7F, 0x3A, t)},${lerpColor(0xFF, 0x8A, t)})`;
}

function CircleProgress({ pct, size = 80 }: { pct: number; size?: number }) {
  const stroke = 5, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <span className="absolute text-sm font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

// ── Checkout Form (embedded Stripe Elements) ────────────────
function CheckoutForm({ clientSecret, amount, type, onSuccess, onError }: {
  clientSecret: string; amount: number; type: 'donation' | 'deposit';
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) { onError('Payment system loading...'); return; }
    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements, confirmParams: { return_url: window.location.href }, redirect: 'if_required',
    });
    if (error) { onError(error.message || 'Payment failed'); setProcessing(false); }
    else if (paymentIntent?.status === 'succeeded') onSuccess();
    else setProcessing(false);
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 min-h-[80px]">
        {!stripe ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading secure payment...
          </div>
        ) : (
          <PaymentElement options={{ layout: { type: 'tabs', defaultCollapsed: false }, wallets: { applePay: 'auto', googlePay: 'auto' } }} />
        )}
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-xs space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>{type === 'donation' ? 'Your donation' : 'Your deposit'}</span>
          <span className="font-semibold">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold pt-1.5 border-t border-white/[0.05]">
          <span className="text-emerald-400 flex items-center gap-1"><Check size={10} /> Added to campaign</span>
          <span className="text-emerald-400">${amount.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" disabled={!stripe || processing}
        className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_30px_rgba(91,127,255,0.25)] disabled:opacity-50 transition-all">
        {processing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : type === 'donation' ? (
          <><Heart size={18} className="mr-2" /> Donate ${amount}</>
        ) : (
          <><Zap size={18} className="mr-2" /> Deposit ${amount}</>
        )}
      </Button>
    </form>
  );
}

// ── Main Checkout Page ──────────────────────────────────────
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = (searchParams.get('type') || 'donation') as 'donation' | 'deposit';
  const campaignId = searchParams.get('campaignId') || '';

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customValue, setCustomValue] = useState('200');
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [gettingSecret, setGettingSecret] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const effectiveAmount = parseInt(customValue) || 0;

  useEffect(() => {
    if (!campaignId) { setLoading(false); return; }
    fetch(`/api/campaigns/${campaignId}`)
      .then(r => r.json()).then(d => { if (!d.error) setCampaign(d); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    if (effectiveAmount < 1 || !campaignId || loading) return;
    setClientSecret('');
    setPaymentError('');
    setGettingSecret(true);
    const timer = setTimeout(() => {
      const endpoint = type === 'donation'
        ? `/api/campaigns/${campaignId}/support`
        : '/api/stripe';
      const body: any = type === 'donation'
        ? { amount: effectiveAmount, donorName: donorName || undefined, message: donorMessage || undefined }
        : { amount: effectiveAmount, campaignId };
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.json())
        .then(d => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setPaymentError(d.error || 'Could not start payment');
        })
        .catch(() => setPaymentError('Network error'))
        .finally(() => setGettingSecret(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [effectiveAmount, campaignId, loading]);

  const handlePreset = (val: number) => {
    setCustomValue(String(val));
    setIsCustom(false);
  };

  const bg = '#0A0A0A';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaignId || !campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: bg }}>
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="outline" onClick={() => router.push('/browse')}>Browse campaigns</Button>
      </div>
    );
  }

  const displayTitle = campaign.title || campaign.track_title;
  const donations = campaign.donations || { totalCents: 0, count: 0 };
  const totalRaised = donations.totalCents / 100;
  const budget = campaign.total_budget_cents / 100;
  const spent = budget - (campaign.budget_remaining_cents / 100);
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const artistName = campaign.artist_name || 'Unknown Artist';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          {type === 'donation' ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart size={12} className="text-primary/60" /> Donation</span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Wallet size={12} className="text-primary/60" /> Deposit</span>
          )}
          <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1"><Lock size={10} /> Secure</span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

          {/* ── Campaign header with progress ── */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex items-center gap-5">
            <CircleProgress pct={progress} size={72} />
            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-base font-bold truncate">{displayTitle}</h1>
              <p className="text-xs text-muted-foreground truncate">{artistName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">${totalRaised.toFixed(0)}</strong> raised</span>
                <span className="text-white/[0.15]">·</span>
                <span><strong className="text-foreground">{donations.count}</strong> supporters</span>
                <span className="text-white/[0.15]">·</span>
                <span>of <strong className="text-foreground">${budget.toFixed(0)}</strong></span>
              </div>
            </div>
          </div>

          {/* ── Big amount input ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {type === 'donation' ? 'Donation amount' : 'Deposit amount'}
            </p>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-light text-muted-foreground">$</span>
              <input
                type="number"
                value={customValue}
                onChange={e => { setCustomValue(e.target.value); setIsCustom(true); }}
                className="w-full bg-white/[0.04] border-2 border-white/[0.08] focus:border-primary/40 rounded-2xl pl-12 pr-5 py-6 text-4xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors"
                min={1}
                placeholder="0"
              />
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {PRESETS.map(opt => {
                const active = parseInt(customValue) === opt.amount && !isCustom;
                return (
                  <button
                    key={opt.amount}
                    onClick={() => handlePreset(opt.amount)}
                    className={`rounded-xl py-3 text-center font-semibold text-sm transition-all border ${
                      active
                        ? 'border-primary bg-primary/[0.08] text-primary'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.15] hover:text-foreground'
                    }`}
                  >
                    ${opt.amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Donor info (donation only) ── */}
          {type === 'donation' && (
            <div className="space-y-3">
              <input
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
              />
              {!showMessage ? (
                <button onClick={() => setShowMessage(true)} className="text-xs text-primary hover:underline font-medium">+ Add a message of support</button>
              ) : (
                <textarea
                  value={donorMessage}
                  onChange={e => setDonorMessage(e.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none"
                />
              )}
            </div>
          )}

          {/* ── Payment section ── */}
          <div>
            {!PUBLISHABLE_KEY ? (
              <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-6 text-center space-y-3">
                <AlertCircle size={32} className="mx-auto text-yellow-400/60" />
                <h3 className="font-semibold">Payment not configured</h3>
                <p className="text-xs text-muted-foreground">Stripe is not connected yet.</p>
              </div>
            ) : effectiveAmount < 1 ? (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                <p className="text-sm text-muted-foreground">Enter an amount to continue</p>
              </div>
            ) : gettingSecret ? (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Preparing secure payment...
                </div>
              </div>
            ) : paymentError ? (
              <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />{paymentError}
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise}
                options={{ clientSecret,
                  appearance: { theme: 'night', variables: { colorPrimary: '#5B7FFF', colorBackground: '#0A0A0A', colorText: '#F0F0F0', colorTextSecondary: '#8C8C8C', borderRadius: '12px', spacingUnit: '4px' } }
                }}>
                <CheckoutForm clientSecret={clientSecret} amount={effectiveAmount} type={type}
                  onSuccess={() => setSuccessOpen(true)} onError={setPaymentError} />
              </Elements>
            ) : null}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40 pb-8">
            <span className="flex items-center gap-1"><Lock size={10} /> SSL encrypted</span>
            <span className="flex items-center gap-1"><Shield size={10} /> Secure</span>
            <span>Powered by Stripe</span>
          </div>
        </motion.div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {successOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => router.push(`/c/${campaignId}`)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-8 text-center max-w-sm w-full space-y-5" onClick={e => e.stopPropagation()}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
                  <Check size={32} className="text-emerald-400" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">{type === 'donation' ? 'Thank you!' : 'Funded!'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {type === 'donation'
                    ? `Your $${effectiveAmount} donation supports this campaign.`
                    : `$${effectiveAmount} added to your campaign budget.`}
                </p>
              </div>
              {type === 'donation' && (
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Share this campaign — every share brings more support</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-muted-foreground truncate select-all font-mono">
                      selah.fm/c/{campaignId}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`https://selah.fm/c/${campaignId}`); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
                      className="shrink-0 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-semibold hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                    >
                      {shareCopied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Share2 size={12} /> Copy link</>}
                    </button>
                  </div>
                </div>
              )}
              <Button onClick={() => router.push(`/c/${campaignId}`)} className="w-full rounded-xl">
                {type === 'donation' ? 'Back to campaign' : 'View campaign'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
