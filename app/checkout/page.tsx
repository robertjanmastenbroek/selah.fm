'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Heart, ArrowLeft, Shield, Lock, AlertCircle, Check, Zap, Wallet,
  DollarSign, Sparkles, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LiveTicker from '@/components/LiveTicker';
import PaymentSuccess from '@/components/PaymentSuccess';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const PRESETS = [
  { amount: 50 }, { amount: 100 }, { amount: 200, recommended: true },
  { amount: 300 }, { amount: 500 }, { amount: 1000 },
];

// ── Recent Supporters ──────────────────────────────────────────
function RecentSupporters({ donations }: { donations: any[] }) {
  if (!donations || donations.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
        <Users size={11} /> Recent supporters
      </p>
      <div className="space-y-1">
        {donations.slice(0, 5).map((d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4338CA]/20 to-[#4338CA]/5 flex items-center justify-center text-[10px] font-bold text-[#4338CA] shrink-0">
              {(d.donor_name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <span className="text-xs truncate text-white/40">{d.donor_name || 'Anonymous'}</span>
              <span className="text-xs font-semibold text-[#4338CA] shrink-0 ml-2">${(d.amount_cents / 100).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Circle Progress ─────────────────────────────────────────
function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  return `rgb(${lerpColor(0x5B, 0x1F, t)},${lerpColor(0x7F, 0x3A, t)},${lerpColor(0xFF, 0x8A, t)})`;
}

function CircleProgress({ pct, size = 72 }: { pct: number; size?: number }) {
  const stroke = 5, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <span className="absolute text-sm font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

// ── Payment Form (Stripe Elements) ──────────────────────────
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
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 min-h-[60px]">
        {!stripe ? (
          <div className="flex items-center justify-center gap-2 text-sm text-white/50 py-2">
            <div className="w-4 h-4 border-2 border-[#4338CA]/30 border-t-[#4338CA] rounded-full animate-spin" />
            Loading secure payment...
          </div>
        ) : (
          <PaymentElement options={{
            layout: { type: 'tabs', defaultCollapsed: false },
            wallets: { applePay: 'auto', googlePay: 'auto' },
            fields: { billingDetails: 'auto' },
          }} />
        )}
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-white/60">You pay</span>
          <span className="font-semibold text-white">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground/50">Platform fee (20%)</span>
          <span className="text-muted-foreground/50">−${(amount * 0.20).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground/50">Stripe processing (2.9% + $0.30)</span>
          <span className="text-muted-foreground/50">−${(amount * 0.029 + 0.30).toFixed(2)}</span>
        </div>
        <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-semibold">
          <span className="text-emerald-400 flex items-center gap-1"><Check size={10} /> Goes to campaign</span>
          <span className="text-emerald-400">$${Math.max(0, amount - amount * 0.20 - (amount * 0.029 + 0.30)).toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" disabled={!stripe || processing}
        className="w-full py-6 text-base font-bold rounded-2xl
                   bg-gradient-to-r from-[#4338CA] to-[#3730A3]
                   hover:shadow-[0_0_40px_rgba(67,56,202,0.3)]
                   disabled:opacity-50 transition-all active:scale-[0.98]">
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : type === 'donation' ? (
          <span className="flex items-center justify-center gap-2"><Heart size={18} /> Donate ${amount}</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Zap size={18} /> Deposit ${amount}</span>
        )}
      </Button>
    </form>
  );
}

// ── Main Consolidated Checkout Page ─────────────────────────
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = (searchParams.get('type') || 'donation') as 'donation' | 'deposit';
  const campaignId = searchParams.get('campaignId') || '';
  const artistId = searchParams.get('artistId') || '';
  const artistSlug = searchParams.get('artistSlug') || '';

  const [campaign, setCampaign] = useState<any>(null);
  const [artistCheckout, setArtistCheckout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customValue, setCustomValue] = useState('0');
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [gettingSecret, setGettingSecret] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const effectiveAmount = parseInt(customValue) || 0;

  // Fetch campaign or artist data
  useEffect(() => {
    if (artistSlug) {
      // Search by slug (not name — slug is from the artist page URL)
      fetch(`/api/artists/${encodeURIComponent(artistSlug)}`)
        .then(r => r.json()).then(ad => {
          if (ad.artist) setArtistCheckout(ad);
          setLoading(false);
        }).catch(() => setLoading(false));
    } else if (campaignId) {
      fetch(`/api/campaigns/${campaignId}`)
        .then(r => r.json()).then(d => { if (!d.error) setCampaign(d); })
        .catch(e => console.error('Async error in checkout/page.tsx:', e)).finally(() => setLoading(false));
    } else setLoading(false);
  }, [campaignId, artistSlug]);

  // Get clientSecret (debounced)
  useEffect(() => {
    if (effectiveAmount < 1 || loading) return;
    const isArtistMode = !!artistSlug;
    if (!isArtistMode && !campaignId) return;
    setClientSecret('');
    setPaymentError('');
    setGettingSecret(true);
    const timer = setTimeout(() => {
      let endpoint: string;
      let body: any;

      if (isArtistMode) {
        endpoint = `/api/artists/${artistSlug}/fund`;
        body = {
          amount: effectiveAmount,
          donorName: `${firstName} ${lastName}`.trim() || undefined,
          donorEmail: email || undefined,
          message: donorMessage || undefined,
        };
      } else if (type === 'donation') {
        endpoint = `/api/campaigns/${campaignId}/support`;
        body = {
          amount: effectiveAmount,
          donorName: `${firstName} ${lastName}`.trim() || undefined,
          message: donorMessage || undefined,
        };
      } else {
        endpoint = '/api/stripe';
        body = { amount: effectiveAmount, campaignId };
      }

      fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(r => r.json())
        .then(d => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setPaymentError(d.error || 'Could not start payment');
        })
        .catch(() => setPaymentError('Network error'))
        .finally(() => setGettingSecret(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [effectiveAmount, campaignId, artistSlug, type, loading, firstName, lastName, email, donorMessage]);

  const handlePreset = (val: number) => {
    setCustomValue(String(val));
    setActivePreset(val);
  };

  const handleCustom = (val: string) => {
    setCustomValue(val);
    setActivePreset(null);
  };

  const bg = '#080817';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#4338CA]/30 border-t-[#4338CA] rounded-full animate-spin" />
      </div>
    );
  }

  const isArtistMode = !!artistSlug;
  const entity = isArtistMode ? artistCheckout : campaign;

  if (!entity && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: bg }}>
        <p className="text-white/50">{isArtistMode ? 'Artist not found' : 'Campaign not found'}</p>
        <Button variant="outline" onClick={() => router.push(isArtistMode ? '/browse' : '/browse')}>Browse</Button>
      </div>
    );
  }

  // Derive display data based on mode
  const artist = isArtistMode ? entity?.artist : null;
  const artistStats = isArtistMode ? entity?.stats : null;
  const donations = campaign?.donations || { totalCents: 0, count: 0, supporters: [] };
  const totalRaised = isArtistMode
    ? ((artistStats?.total_donations_cents || 0) / 100)
    : (donations.totalCents / 100);
  const budget = isArtistMode ? 0 : (campaign?.total_budget_cents / 100 || 0);
  const spent = isArtistMode ? 0 : (budget - ((campaign?.budget_remaining_cents || 0) / 100));
  const progress = isArtistMode ? 0 : (budget > 0 ? (spent / budget) * 100 : 0);
  const displayTitle = isArtistMode ? artist?.artist_name : (campaign?.title || campaign?.track_title);
  const coverArt = isArtistMode ? artist?.spotify_image_url : (campaign?.cover_art_url || campaign?.cover_url);
  const supporterCount = isArtistMode ? (artistStats?.donation_count || 0) : (donations.count || 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080817]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          {type === 'donation' ? (
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Heart size={12} className="text-[#4338CA]/60" /> Donation
            </span>
          ) : (
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Wallet size={12} className="text-[#4338CA]/60" /> Deposit
            </span>
          )}
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <Lock size={10} /> Secure
          </span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* ── Track Preview Card ── */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {coverArt && (
              <div className="aspect-[2/1] bg-white/[0.02] overflow-hidden">
                <img src={coverArt} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              {!coverArt && (
                <div className="flex items-center gap-4 mb-4">
                  <CircleProgress pct={progress} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
                      {type === 'donation' ? "You're supporting" : 'Your track'}
                    </p>
                    <h1 className="text-lg font-bold truncate">{campaign.title || campaign.track_title}</h1>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  {coverArt && (
                    <>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                        {type === 'donation' ? "You're supporting" : 'Your track'}
                      </p>
                      <h1 className="text-xl font-bold">{displayTitle}</h1>
                    </>
                  )}
                  {!isArtistMode && <p className="text-xs text-white/40 mt-1">${((campaign?.cpm_rate_cents || 0) / 100).toFixed(2)} per 1,000 verified views</p>}
                </div>
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-white/[0.06]">
                  <div>
                    <div className="text-lg font-bold">{totalRaised > 0 ? `$${totalRaised.toFixed(0)}` : '$0'}</div>
                    <div className="text-[10px] text-white/30 uppercase">Raised</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">${budget.toFixed(0)}</div>
                    <div className="text-[10px] text-white/30 uppercase">Budget</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{supporterCount}</div>
                    <div className="text-[10px] text-white/30 uppercase">Supporters</div>
                  </div>
                </div>
                <RecentSupporters donations={donations.supporters} />
              </div>
            </div>
          </div>

          {/* ── Amount Selection ── */}
          <div>
            <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">
              {type === 'donation' ? 'Donation amount' : 'Deposit amount'}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESETS.map(opt => {
                const active = activePreset === opt.amount;
                return (
                  <button key={opt.amount} onClick={() => handlePreset(opt.amount)}
                    className={`relative rounded-xl py-4 text-center font-semibold text-sm transition-all border ${
                      active
                        ? 'border-[#4338CA] bg-[#4338CA]/[0.08] text-[#4338CA]'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.15] hover:text-white'
                    }`}>
                    {opt.recommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full
                                      bg-[#22C55E]/20 border border-[#22C55E]/30 text-[10px] font-bold text-[#22C55E] flex items-center gap-1">
                        <Sparkles size={9} /> Best
                      </span>
                    )}
                    ${opt.amount}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="number" value={customValue === '0' ? '' : customValue}
                onChange={e => handleCustom(e.target.value)}
                placeholder="Custom amount"
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#4338CA]/40 rounded-xl pl-10 pr-4 py-4
                           text-lg font-bold text-white placeholder:text-white/20 focus:outline-none transition-colors"
                min={0} step="0.01" />
            </div>
          </div>

          {/* ── Donor Details ── */}
          {type === 'donation' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Your details</p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="First name" className="rounded-xl h-11 bg-white/[0.04] border-white/[0.06] text-white" />
                <Input value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Last name" className="rounded-xl h-11 bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email"
                placeholder="Email address" className="rounded-xl h-11 bg-white/[0.04] border-white/[0.06] text-white" />
              {!showMessage ? (
                <button onClick={() => setShowMessage(true)}
                  className="text-xs text-[#818CF8] hover:underline font-medium">
                  + Add a message of support
                </button>
              ) : (
                <textarea value={donorMessage} onChange={e => setDonorMessage(e.target.value)}
                  placeholder="Write a message of encouragement..." rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3
                             text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4338CA]/30 resize-none" />
              )}
            </div>
          )}

          {/* ── Live Ticker ── */}
          {campaignId && <LiveTicker campaignId={campaignId} />}

          {/* ── Payment Section ── */}
          <div>
            {!PUBLISHABLE_KEY ? (
              <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-6 text-center space-y-3">
                <AlertCircle size={32} className="mx-auto text-yellow-400/60" />
                <h3 className="font-semibold text-white/80">Payment not configured</h3>
                <p className="text-xs text-white/40">Stripe keys need to be set for payments to work.</p>
              </div>
            ) : effectiveAmount < 1 ? (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                <p className="text-sm text-white/40">Enter an amount above to continue</p>
              </div>
            ) : gettingSecret ? (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <div className="w-5 h-5 border-2 border-[#4338CA]/30 border-t-[#4338CA] rounded-full animate-spin" />
                  Preparing secure payment...
                </div>
              </div>
            ) : paymentError ? (
              <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />{paymentError}
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#4338CA',
                    colorBackground: '#080817',
                    colorText: '#F0F0F0',
                    colorTextSecondary: '#8C8C8C',
                    borderRadius: '12px',
                    spacingUnit: '4px',
                  },
                },
              } as any}>
                <CheckoutForm clientSecret={clientSecret} amount={effectiveAmount} type={type}
                  onSuccess={() => setSuccessOpen(true)} onError={setPaymentError} />
              </Elements>
            ) : null}
          </div>

          {/* ── Trust Signals ── */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/30 pb-8">
            <span className="flex items-center gap-1"><Lock size={10} /> SSL encrypted</span>
            <span className="flex items-center gap-1"><Shield size={10} /> Secure</span>
            <span>Powered by Stripe</span>
          </div>
        </motion.div>
      </div>

      {/* ── Success Overlay ── */}
      <PaymentSuccess
        open={successOpen}
        mode={type}
        amount={effectiveAmount}
        campaignTitle={displayTitle || ''}
        campaignId={campaignId}
        donorName={`${firstName} ${lastName}`.trim()}
        donorMessage={donorMessage}
        onClose={() => router.push(isArtistMode ? `/artist/${artistSlug}` : `/c/${campaignId}`)}
      />
    </div>
  );
}
