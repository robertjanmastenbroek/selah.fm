'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Heart, ArrowLeft, Shield, Lock, DollarSign, Sparkles, Users, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PaymentSuccess from '@/components/PaymentSuccess';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const PRESETS = [
  { amount: 50, popular: false },
  { amount: 100, popular: false },
  { amount: 200, popular: true },
  { amount: 300, popular: false },
  { amount: 500, popular: false },
  { amount: 1000, popular: false },
];

// ── Recent Supporters Ticker ──────────────────────────────────
function RecentSupporters({ donations }: { donations: any[] }) {
  if (!donations || donations.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Users size={11} /> Recent supporters
      </p>
      <div className="space-y-1">
        {donations.slice(0, 5).map((d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {(d.donor_name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <span className="text-xs truncate text-muted-foreground">{d.donor_name || 'Anonymous'}</span>
              <span className="text-xs font-semibold text-primary shrink-0 ml-2">${(d.amount_cents / 100).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Embedded Payment Form ─────────────────────────────────────
function DonateForm({ clientSecret, amount, onSuccess, onError }: { clientSecret: string; amount: number; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) { onError('Payment system loading...'); return; }
    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (error) { onError(error.message || 'Payment failed'); setProcessing(false); }
    else if (paymentIntent?.status === 'succeeded') onSuccess();
    else setProcessing(false);
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {/* Payment Element */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 min-h-[60px]">
        {!stripe ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading secure payment...
          </div>
        ) : (
          <PaymentElement options={{
            layout: { type: 'tabs', defaultCollapsed: false },
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }} />
        )}
      </div>

      {/* Amount summary — 100% goes to campaign */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-xs">
        <div className="flex justify-between font-semibold">
          <span className="text-emerald-400 flex items-center gap-1"><Check size={10} /> 100% added to campaign</span>
          <span className="text-emerald-400">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Error */}
      {false && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{''}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] disabled:opacity-50 transition-all"
      >
        {processing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><Heart size={18} className="mr-2" /> Donate ${amount}</>
        )}
      </Button>
    </form>
  );
}

// ── Main Donate Page ──────────────────────────────────────────
export default function DonatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [gettingSecret, setGettingSecret] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount;

  // Fetch campaign
  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCampaign(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Get clientSecret when amount changes (debounced)
  useEffect(() => {
    if (effectiveAmount < 1 || !campaign || loading) return;
    setClientSecret('');
    setPaymentError('');
    setGettingSecret(true);
    const timer = setTimeout(() => {
      fetch(`/api/campaigns/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          donorName: donorName || undefined,
          message: donorMessage || undefined,
        }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setPaymentError(d.error || 'Could not start payment');
        })
        .catch(() => setPaymentError('Network error'))
        .finally(() => setGettingSecret(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [effectiveAmount, campaign, loading]);

  const bg = '#0F0F23';

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: bg }}>
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="outline" onClick={() => router.push('/browse')}>Browse campaigns</Button>
      </div>
    );
  }

  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const totalRaised = donations.totalCents / 100;
  const budget = campaign.total_budget_cents / 100;
  const cpm = campaign.cpm_rate_cents / 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Top nav bar */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0F0F23]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
          <Lock size={10} /> Secure payment
        </span>
      </div>

      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Campaign preview card */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {campaign.cover_art_url && (
              <div className="aspect-[2/1] bg-white/[0.02] overflow-hidden">
                <img src={campaign.cover_art_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You&apos;re supporting</p>
                <h1 className="text-xl font-bold">{campaign.title || campaign.track_title}</h1>
                <p className="text-xs text-muted-foreground mt-1">${cpm.toFixed(2)} per 1,000 verified views</p>
              </div>
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/[0.06]">
                <div>
                  <div className="text-lg font-bold">${totalRaised.toFixed(0)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Raised of ${budget.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{donations.count}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Supporters</div>
                </div>
              </div>
              <RecentSupporters donations={donations.supporters} />
            </div>
          </div>

          {/* Amount selection */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Choose your donation
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESETS.map(opt => (
                <button
                  key={opt.amount}
                  onClick={() => { setAmount(opt.amount); setCustomAmount(''); }}
                  className={`relative rounded-xl border-2 py-4 text-center transition-all ${
                    amount === opt.amount && !customAmount
                      ? 'border-primary bg-primary/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  {opt.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1">
                      <Sparkles size={9} /> Popular
                    </span>
                  )}
                  <span className="text-lg font-bold">${opt.amount}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                placeholder="Custom amount"
                className="pl-10 py-5 text-lg font-bold rounded-xl h-auto"
                min={1}
              />
            </div>
          </div>

          {/* Name + Message */}
          <div className="space-y-2">
            <Input
              value={donorName}
              onChange={e => setDonorName(e.target.value)}
              placeholder="Your name (optional)"
              className="rounded-xl h-11"
            />
            {!showMessage ? (
              <button
                onClick={() => setShowMessage(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Add a message of support
              </button>
            ) : (
              <div className="relative">
                <textarea
                  value={donorMessage}
                  onChange={e => setDonorMessage(e.target.value)}
                  placeholder="Write a message of encouragement..."
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none"
                />
              </div>
            )}
          </div>

          {/* Payment section */}
          <div>
            {!PUBLISHABLE_KEY ? (
              <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-6 text-center space-y-3">
                <AlertCircle size={32} className="mx-auto text-yellow-400/60" />
                <h3 className="font-semibold">Payment not configured</h3>
                <p className="text-xs text-muted-foreground">
                  Stripe keys need to be set for payments to work.
                </p>
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
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {paymentError}
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#4338CA',
                      colorBackground: '#0F0F23',
                      colorText: '#F0F0F0',
                      colorTextSecondary: '#8C8C8C',
                      borderRadius: '12px',
                      spacingUnit: '4px',
                    },
                  },
                }}
              >
                <DonateForm
                  clientSecret={clientSecret}
                  amount={effectiveAmount}
                  onSuccess={() => setSuccessOpen(true)}
                  onError={setPaymentError}
                />
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

      <PaymentSuccess
        open={successOpen}
        mode="donation"
        amount={effectiveAmount}
        campaignTitle={campaign.title || campaign.track_title}
        campaignId={id as string}
        donorName={donorName}
        donorMessage={donorMessage}
        onClose={() => router.push(`/c/${id}`)}
      />
    </div>
  );
}
