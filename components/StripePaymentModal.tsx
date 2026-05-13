'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Shield, Lock, DollarSign, Heart, AlertCircle, X, Check } from 'lucide-react';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  clientSecret: string;
  title: string;
  subtitle: string;
  coverArtUrl?: string;
  amount: number;
  mode: 'donation' | 'deposit';
  donorName?: string;
  donorMessage?: string;
}

function CheckoutForm({ onSuccess, onClose, amount, mode }: {
  onSuccess: (piId: string) => void;
  onClose: () => void;
  amount: number;
  mode: 'donation' | 'deposit';
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError('Payment system is initializing — please wait a moment.');
      return;
    }

    setProcessing(true);
    setError('');

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else if (paymentIntent?.status === 'requires_action') {
      setError('Additional verification needed. Please follow your bank\'s instructions.');
      setProcessing(false);
    } else {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Payment Element */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 min-h-[80px] flex items-center justify-center">
        {!stripe ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading payment form...
          </div>
        ) : (
          <PaymentElement
            options={{
              layout: { type: 'tabs', defaultCollapsed: false },
              wallets: { applePay: 'auto', googlePay: 'auto' },
            }}
          />
        )}
      </div>

      {/* Amount summary — 100% goes to campaign */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-xs">
        <div className="flex justify-between font-semibold">
          <span className="text-emerald-400 flex items-center gap-1"><Check size={10} /> 100% added to campaign</span>
          <span className="text-emerald-400">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 justify-center flex-wrap">
        <span className="flex items-center gap-1"><Lock size={10} /> SSL encrypted</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="flex items-center gap-1"><Shield size={10} /> Secure payment</span>
        <span className="text-muted-foreground/30">·</span>
        <span>Powered by Stripe</span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.25)] disabled:opacity-50"
      >
        {processing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : mode === 'donation' ? (
          <><Heart size={16} className="mr-2" /> Donate ${amount}</>
        ) : (
          <><DollarSign size={16} className="mr-2" /> Deposit ${amount}</>
        )}
      </Button>

      <button
        type="button"
        onClick={onClose}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Cancel
      </button>
    </form>
  );
}

export default function StripePaymentModal({
  open, onClose, onSuccess, clientSecret,
  title, subtitle, coverArtUrl, amount, mode,
}: PaymentModalProps) {
  if (!open || !clientSecret) return null;

  const bg = '#0F0F23';

  // Stripe not configured
  if (!PUBLISHABLE_KEY || !stripePromise) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center space-y-4">
              <AlertCircle size={40} className="mx-auto text-yellow-400/60" />
              <h3 className="font-semibold text-lg">Payment system not configured</h3>
              <p className="text-sm text-muted-foreground">
                Stripe is not connected yet. Add <code className="text-xs bg-white/[0.04] px-1.5 py-0.5 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment.
              </p>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#4338CA',
        colorBackground: '#0F0F23',
        colorText: '#F0F0F0',
        colorTextSecondary: '#8C8C8C',
        colorDanger: '#EF4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
      },
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 w-full max-w-md rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              {coverArtUrl && (
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/[0.02]">
                  <img src={coverArtUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">${amount}</span>
              <span className="text-xs text-muted-foreground">{mode === 'donation' ? 'donation' : 'deposit'}</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm onSuccess={onSuccess} onClose={onClose} amount={amount} mode={mode} />
            </Elements>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
