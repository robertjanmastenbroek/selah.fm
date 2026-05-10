'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Shield, Lock, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PaymentSuccess from '@/components/PaymentSuccess';

const SUGGESTED_AMOUNTS = [
  { amount: 50, label: '$50', popular: false },
  { amount: 100, label: '$100', popular: false },
  { amount: 200, label: '$200', popular: true },
  { amount: 300, label: '$300', popular: false },
  { amount: 500, label: '$500', popular: false },
  { amount: 1000, label: '$1,000', popular: false },
];

export default function DonatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [amount, setAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch campaign info
  useState(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCampaign(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount;

  const handleContinue = async () => {
    if (effectiveAmount < 1) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/campaigns/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentOpen(true);
      } else {
        setError(data.error || 'Could not start payment. Please try again.');
      }
    } catch { setError('Network error. Check your connection.'); }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.3) 0%, #0A0A0A 60%), #0A0A0A' }}>
      {/* Back link */}
      <button onClick={() => router.back()} className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] space-y-8"
      >
        {/* Campaign info — subtle */}
        {campaign && (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 border border-white/[0.06]">
              {campaign.cover_art_url ? (
                <img src={campaign.cover_art_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                  <Heart size={24} className="text-primary/30" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">You're supporting</p>
            <h1 className="text-xl font-bold">{campaign.track_title}</h1>
          </div>
        )}

        {/* Amount selector */}
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Choose your donation</h2>
            <p className="text-sm text-muted-foreground">Every dollar helps this artist reach more listeners.</p>
          </div>

          {/* Suggested amounts */}
          <div className="grid grid-cols-3 gap-3">
            {SUGGESTED_AMOUNTS.map(opt => (
              <button
                key={opt.amount}
                onClick={() => { setAmount(opt.amount); setCustomAmount(''); }}
                className={`relative rounded-2xl border-2 py-4 text-center transition-all ${
                  amount === opt.amount && !customAmount
                    ? 'border-primary bg-primary/[0.06] text-foreground'
                    : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12]'
                }`}
              >
                {opt.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    <Sparkles size={10} /> Popular
                  </span>
                )}
                <span className="text-lg font-bold">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <DollarSign size={18} />
            </div>
            <Input
              type="number"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
              placeholder="Enter custom amount"
              className="pl-10 py-6 text-lg font-bold rounded-2xl"
              min={1}
            />
          </div>

          {/* Donate button */}
          <Button
            onClick={handleContinue}
            disabled={effectiveAmount < 1 || processing}
            className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_30px_rgba(91,127,255,0.25)]"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Heart size={18} className="mr-2" /> Donate ${effectiveAmount}</>
            )}
          </Button>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1"><Lock size={10} /> SSL</span>
            <span className="flex items-center gap-1"><Shield size={10} /> Secure</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </motion.div>

      {/* Payment modal (Stripe Elements) */}
      {paymentOpen && clientSecret && campaign && (
        <StripePaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => { setPaymentOpen(false); setSuccessOpen(true); }}
          clientSecret={clientSecret}
          title={campaign.track_title}
          subtitle="Your donation goes directly to the campaign budget"
          coverArtUrl={campaign.cover_art_url}
          amount={effectiveAmount}
          mode="donation"
        />
      )}

      {/* Success celebration */}
      <PaymentSuccess
        open={successOpen}
        mode="donation"
        amount={effectiveAmount}
        campaignTitle={campaign?.track_title}
        campaignId={id as string}
        onClose={() => router.push(`/c/${id}`)}
      />
    </div>
  );
}

// Inline import — StripePaymentModal uses Elements which needs the client secret
// Re-importing here to avoid circular dependency issues
import StripePaymentModal from '@/components/StripePaymentModal';
