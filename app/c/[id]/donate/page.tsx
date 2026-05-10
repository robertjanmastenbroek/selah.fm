'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Shield, Lock, DollarSign, Sparkles, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StripePaymentModal from '@/components/StripePaymentModal';
import PaymentSuccess from '@/components/PaymentSuccess';

const SUGGESTED = [
  { amount: 50, popular: false },
  { amount: 100, popular: false },
  { amount: 200, popular: true },
  { amount: 500, popular: false },
  { amount: 1000, popular: false },
];

// ── Live donation ticker ──────────────────────────────────────
function LiveDonations({ campaignId }: { campaignId: string }) {
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    const fetchDonations = () => {
      fetch(`/api/campaigns/${campaignId}`)
        .then(r => r.json())
        .then(d => { if (d.donations?.supporters) setDonations(d.donations.supporters); })
        .catch(() => {});
    };
    fetchDonations();
    const interval = setInterval(fetchDonations, 15000);
    return () => clearInterval(interval);
  }, [campaignId]);

  if (donations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Users size={12} /> Recent support
      </div>
      <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {donations.slice(0, 8).map((d: any, i: number) => (
            <motion.div
              key={d.donor_name + d.amount_cents + i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {(d.donor_name || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">{d.donor_name || 'Anonymous'}</span>
                  <span className="text-xs font-bold text-primary shrink-0">${(d.amount_cents / 100).toFixed(0)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {(() => {
                    const date = new Date(d.created_at);
                    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
                    if (mins < 1) return 'just now';
                    if (mins < 60) return `${mins}m ago`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours}h ago`;
                    return date.toLocaleDateString();
                  })()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCampaign(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount;

  const handleDonate = async () => {
    if (effectiveAmount < 1) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/campaigns/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount, donorName: donorName || undefined, message: donorMessage || undefined }),
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
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  const donations = campaign?.donations || { totalCents: 0, count: 0 };
  const totalRaised = donations.totalCents / 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      {/* Top nav */}
      <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <span className="text-xs text-muted-foreground/60 flex items-center gap-1"><Lock size={10} /> Secure</span>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          
          {/* ── LEFT: Payment form ────────────────────────────── */}
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">You're supporting</p>
                <h1 className="text-xl font-bold">{campaign?.track_title}</h1>
              </div>

              {/* Amount selector */}
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">Choose amount</span>
                  <span className="text-[10px] text-muted-foreground/60">(USD)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SUGGESTED.map(opt => (
                    <button
                      key={opt.amount}
                      onClick={() => { setAmount(opt.amount); setCustomAmount(''); }}
                      className={`relative rounded-xl border-2 py-4 text-center transition-all ${
                        amount === opt.amount && !customAmount
                          ? 'border-primary bg-primary/[0.06] text-foreground'
                          : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12]'
                      }`}
                    >
                      {opt.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          <Sparkles size={10} /> Popular
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
                    placeholder="Enter custom amount"
                    className="pl-10 py-5 text-lg font-bold rounded-xl"
                    min={1}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Your name</label>
                <Input
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  placeholder="How should we list your name?"
                  className="rounded-xl"
                />
              </div>

              {/* Message toggle */}
              {!showMessage ? (
                <button onClick={() => setShowMessage(true)} className="text-xs text-primary hover:underline">
                  + Add a message of support
                </button>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Message (optional)</label>
                  <textarea
                    value={donorMessage}
                    onChange={e => setDonorMessage(e.target.value)}
                    placeholder="Write a message to the artist..."
                    rows={3}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-y"
                  />
                </div>
              )}

              {/* Donate button */}
              <Button
                onClick={handleDonate}
                disabled={effectiveAmount < 1 || processing}
                className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_30px_rgba(91,127,255,0.25)]"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Heart size={18} className="mr-2" /> Donate ${effectiveAmount || '—'}</>
                )}
              </Button>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center">{error}</div>
              )}

              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40">
                <span className="flex items-center gap-1"><Lock size={10} /> SSL</span>
                <span className="flex items-center gap-1"><Shield size={10} /> Secure</span>
                <span>Powered by Stripe</span>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Campaign card + live donations ──────────── */}
          <div className="hidden md:block space-y-5">
            {campaign && (
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden sticky top-8">
                {/* Campaign header */}
                {campaign.cover_art_url && (
                  <div className="aspect-video bg-white/[0.02]">
                    <img src={campaign.cover_art_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm">{campaign.track_title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">${((campaign.cpm_rate_cents || 0) / 100).toFixed(2)} CPM</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/[0.06]">
                    <div><div className="text-lg font-bold">${totalRaised.toFixed(0)}</div><div className="text-[10px] text-muted-foreground uppercase">Raised</div></div>
                    <div><div className="text-lg font-bold">{donations.count}</div><div className="text-[10px] text-muted-foreground uppercase">Supporters</div></div>
                  </div>

                  {/* Live donations */}
                  <LiveDonations campaignId={id as string} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal + celebration */}
      <StripePaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={() => { setPaymentOpen(false); setSuccessOpen(true); }} clientSecret={clientSecret} title={campaign?.track_title} subtitle="Your donation goes directly to the campaign budget" coverArtUrl={campaign?.cover_art_url} amount={effectiveAmount} mode="donation" />
      <PaymentSuccess open={successOpen} mode="donation" amount={effectiveAmount} campaignTitle={campaign?.track_title} campaignId={id as string} donorName={donorName} donorMessage={donorMessage} onClose={() => router.push(`/c/${id}`)} />
    </div>
  );
}
