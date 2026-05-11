'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import SupportWidget from '@/components/SupportWidget';
import { ChevronDown } from 'lucide-react';

interface FAQItem { q: string; a: string; section: string; }

const faqs: { section: string; items: FAQItem[] }[] = [
  {
    section: 'About Selah.fm',
    items: [
      {
        q: 'What is Selah.fm?',
        a: 'Selah.fm is an open-source CPM marketplace for music promotion. Artists create campaigns with budgets, set CPM (cost per 1,000 views) rates, and deposit funds via Stripe. Creators browse campaigns, make TikToks, Reels, or YouTube Shorts, and submit their videos. Artists review and approve submissions — creators get paid only for verified views.',
        section: 'About Selah.fm',
      },
      {
        q: 'Is Selah.fm really open source?',
        a: 'Yes. All code is publicly available under the MIT license on GitHub: github.com/robertjanmastenbroek/selah.fm. You can audit the code, contribute, or run your own instance.',
        section: 'About Selah.fm',
      },
      {
        q: 'Who is Selah.fm for?',
        a: 'Independent artists who want real organic promotion on short-form video platforms, and creators who want to earn money making content they enjoy.',
        section: 'About Selah.fm',
      },
      {
        q: 'How is this different from playlist bots or ads?',
        a: 'Playlist bots give you fake streams from fake accounts. Ads charge for impressions with zero guarantee. On Selah.fm, you pay only for verified views on real creator content that you personally approve. No bots, no black boxes.',
        section: 'About Selah.fm',
      },
    ],
  },
  {
    section: 'For Artists',
    items: [
      {
        q: 'How do I create a campaign?',
        a: 'Go to your Dashboard, click "New", upload your track, set your CPM rate and budget, and launch. Creators will find your campaign on the Browse page and start submitting content. It takes about 3 minutes.',
        section: 'For Artists',
      },
      {
        q: 'What is CPM and how do I set it?',
        a: 'CPM stands for Cost Per Mille (1,000 views). You choose how much you want to pay per 1,000 verified views on a creator\'s video. A higher CPM attracts more creators. Typical rates range from $0.50 to $5.00 per 1,000 views.',
        section: 'For Artists',
      },
      {
        q: 'Do I have to approve every submission?',
        a: 'Yes — you review every video before paying a cent. This ensures you only pay for content that genuinely promotes your track. You can approve or reject submissions from your Review page.',
        section: 'For Artists',
      },
      {
        q: 'How much does it cost?',
        a: 'You decide your budget (minimum $5). The platform takes a 20% fee from creator payouts. Stripe takes 2.9% + $0.30 on deposits. There are no setup fees, monthly fees, or hidden costs.',
        section: 'For Artists',
      },
      {
        q: 'Can I change my CPM rate after launching a campaign?',
        a: 'Once a campaign receives any submissions, the CPM rate is locked. This protects creators — they submitted at a specific rate expecting that payout. To change your rate, create a new campaign with the updated CPM. Campaigns with zero submissions can still have their CPM adjusted.',
        section: 'For Artists',
      },
      {
        q: 'Can I pause or cancel my campaign?',
        a: 'Campaigns automatically stop accepting submissions when the budget is exhausted. To end a campaign early, simply stop funding it. Any remaining budget stays in your account for future campaigns.',
        section: 'For Artists',
      },
      {
        q: 'Can fans support my campaign?',
        a: 'Yes. Every campaign page has a crowdfunding section where fans can donate to your promotion budget. Share your campaign link and let your fans help you get discovered.',
        section: 'For Artists',
      },
    ],
  },
  {
    section: 'For Creators',
    items: [
      {
        q: 'How do I start earning?',
        a: 'Browse campaigns at selah.fm/browse, find a track you like, create a TikTok/Reel/Short using that track, paste the video link, and submit. Once the artist approves it, you earn based on verified views.',
        section: 'For Creators',
      },
      {
        q: 'How much can I earn?',
        a: 'You earn 80% of the CPM rate per 1,000 verified views. For example, at a $2.00 CPM rate, 50,000 views would earn you $80. Top creators earn $50–500+ per campaign.',
        section: 'For Creators',
      },
      {
        q: 'When and how do I get paid?',
        a: 'Payouts are processed via Stripe Connect after the artist reviews and approves your video. Connect your bank account in the Earnings page. Payment typically arrives 1–3 business days after approval.',
        section: 'For Creators',
      },
      {
        q: 'Do I own my videos?',
        a: 'You do — 100%. Selah.fm never claims ownership of your content. The artist gets promotion; you keep full rights to your video.',
        section: 'For Creators',
      },
      {
        q: 'What kind of content should I make?',
        a: 'Anything creative that features the track. Dance challenges, lip-syncs, storytelling, duets, aesthetic edits, behind-the-scenes — as long as it showcases the music, you\'re good. Check each campaign\'s requirements for specific guidelines.',
        section: 'For Creators',
      },
      {
        q: 'How long does approval take?',
        a: 'Artists typically review submissions within 24–48 hours. You\'ll get a notification when they make a decision.',
        section: 'For Creators',
      },
      {
        q: 'Can I submit the same video to multiple campaigns?',
        a: 'No. Each video should be made specifically for one campaign. Authentic content performs better anyway.',
        section: 'For Creators',
      },
    ],
  },
  {
    section: 'Account & Billing',
    items: [
      {
        q: 'How do I sign up?',
        a: 'Go to selah.fm/login and sign up with email/password or Google. Choose whether you\'re an artist or creator during onboarding. It\'s free to join.',
        section: 'Account & Billing',
      },
      {
        q: 'Are there any fees to join?',
        a: 'No. Signing up and creating campaigns is free. You only pay when you deposit funds into a campaign budget (for artists) or earn money from content (for creators, minus the 20% platform fee).',
        section: 'Account & Billing',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. We use Stripe for all payments — one of the most trusted payment processors in the world. We never store your credit card or bank details on our servers.',
        section: 'Account & Billing',
      },
      {
        q: 'Can I use the platform outside the US?',
        a: 'Yes. Stripe operates in 40+ countries. Creators can earn from anywhere Stripe Connect is available.',
        section: 'Account & Billing',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot your password?" on the login page. Enter your email and we\'ll send you a reset link (valid for 1 hour). Click the link, set a new password, and you\'re back in.',
        section: 'Account & Billing',
      },
      {
        q: 'Do I need to verify my email?',
        a: 'When you sign up, we send a verification email. Click the link to verify your account. You can use the platform without verifying, but we recommend it for full access and account recovery.',
        section: 'Account & Billing',
      },
    ],
  },
  {
    section: 'Referrals',
    items: [
      {
        q: 'How does the referral program work?',
        a: 'When someone signs up using your referral link and later makes their first deposit, you both get 5% of that deposit credited to your campaign budgets. Share your referral link from the Dashboard.',
        section: 'Referrals',
      },
      {
        q: 'Where is my referral link?',
        a: 'Your referral link is shown at the top of your Dashboard. It looks like: selah.fm/login?ref=youremail@example.com.',
        section: 'Referrals',
      },
    ],
  },
  {
    section: 'Tech Support',
    items: [
      {
        q: 'Does Selah.fm work on mobile?',
        a: 'Yes. Selah.fm is fully mobile-responsive. You can browse, submit content, review submissions, and manage campaigns from any phone or tablet — no app download needed.',
        section: 'Tech Support',
      },
      {
        q: 'What platforms is Selah.fm available on?',
        a: 'It\'s a website: selah.fm. Works in any modern browser on desktop, phone, or tablet. No mobile app yet — but it works great on mobile browsers.',
        section: 'Tech Support',
      },
      {
        q: 'I found a bug. What should I do?',
        a: 'Report it at selah.fm/report-bug or click "Report a bug" in the support chat widget (bottom-right corner). We fix issues fast.',
        section: 'Tech Support',
      },
      {
        q: 'Can I contribute to the code?',
        a: 'Absolutely. The entire codebase is on GitHub: github.com/robertjanmastenbroek/selah.fm. Fork it, make changes, and submit a pull request.',
        section: 'Tech Support',
      },
    ],
  },
  {
    section: 'Contact',
    items: [
      {
        q: 'How do I contact support?',
        a: 'Use the chat widget in the bottom-right corner of any page, or email support@selah.fm. General inquiries: info@selah.fm.',
        section: 'Contact',
      },
      {
        q: 'Follow Selah.fm',
        a: 'Instagram: instagram.com/selahfm — TikTok: tiktok.com/@selah.fm — X/Twitter: x.com/selah_fm — GitHub: github.com/robertjanmastenbroek/selah.fm',
        section: 'Contact',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  let globalIndex = 0;
  const allItems: { item: FAQItem; index: number }[] = [];
  faqs.forEach(section => {
    section.items.forEach(item => {
      allItems.push({ item: { ...item, section: section.section }, index: globalIndex });
      globalIndex++;
    });
  });

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Frequently asked questions</h1>
          <p className="text-muted-foreground text-sm mb-10">Everything you need to know about Selah.fm — artists, creators, payments, and more.</p>
        </motion.div>

        {faqs.map((section, sectionIdx) => {
          const startIdx = faqs.slice(0, sectionIdx).reduce((sum, s) => sum + s.items.length, 0);
          return (
            <motion.div
              key={section.section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.08, duration: 0.4 }}
              className="mb-10"
            >
              <h2 className="text-lg font-semibold mb-4 text-primary/80">{section.section}</h2>
              <div className="space-y-1">
                {section.items.map((item, i) => {
                  const idx = startIdx + i;
                  const isOpen = openIndex === idx;
                  return (
                    <div key={idx} className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm font-medium pr-4">{item.q}</span>
                        <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center py-12 border-t border-white/[0.06] mt-8"
        >
          <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
          <p className="text-xs text-muted-foreground/70">
            Email us at <a href="mailto:support@selah.fm" className="text-primary hover:underline">support@selah.fm</a> or use the chat widget in the bottom-right corner.
          </p>
        </motion.div>
      </main>
      <SupportWidget />
    </div>
  );
}
