'use client';

import Header from '@/components/TopNav';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';

const faqData = [
  {
    section: 'About Selah.fm',
    items: [
      {
        q: 'What is Selah.fm?',
        a: 'Selah.fm is an open-source CPM marketplace for music promotion. Artists create campaigns with budgets, set their own CPM (cost per 1,000 views) rates, and deposit funds via Stripe. Creators browse campaigns, make TikToks, Reels, or YouTube Shorts using the track, and submit their videos. Artists review and approve every submission — creators get paid only for verified views.',
      },
      {
        q: 'What does "Selah" mean?',
        a: '"Selah" is a Hebrew word found throughout the Psalms, often interpreted as "pause and reflect." Our platform creates a space where artists and creators can connect meaningfully — a pause from the noise of traditional music promotion.',
      },
      {
        q: 'Is Selah.fm really open source?',
        a: 'Yes! The entire platform code is MIT licensed and available on GitHub: <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener">github.com/robertjanmastenbroek/selah.fm</a>. You can audit the code, contribute, or run your own instance.',
      },
      {
        q: 'Who is Selah.fm for?',
        a: 'Independent artists who want real, verified promotion (no bots, no fake streams) and content creators who want to earn money making TikToks, Reels, and Shorts using music they genuinely enjoy.',
      },
      {
        q: 'How is this different from playlist pitching or ads?',
        a: 'Playlist bots give you fake streams from fake accounts. Ads charge for impressions with zero guarantee. On Selah.fm, you pay only for verified views on real creator content that you personally approve. No bots, no black boxes.',
      },
    ],
  },
  {
    section: 'For Artists',
    items: [
      {
        q: 'How do I create a campaign?',
        a: 'Go to your <a href="/dashboard">Dashboard</a>, click "New Campaign", upload your track (Spotify or SoundCloud link), set your CPM rate and budget, and launch. It takes about 2 minutes.',
      },
      {
        q: 'How much does it cost?',
        a: 'There are no monthly fees or subscriptions. You only pay when you run a campaign. You set your own budget (minimum $25). Stripe charges 2.9% + $0.30 on deposits. The platform takes a 20% service fee from creator payouts.',
      },
      {
        q: 'What happens to my money?',
        a: 'When you deposit $100: approximately $96.80 reaches your campaign budget after Stripe fees. Creators earn based on verified views. You approve every video before any payment is made. Unspent funds stay in your campaign until used.',
      },
      {
        q: 'Can I reject a video I don\'t like?',
        a: 'Absolutely. You review every submission. If a video doesn\'t meet your standards or requirements, you can reject it — you pay nothing for rejected submissions.',
      },
      {
        q: 'How are views verified?',
        a: 'YouTube views are verified automatically via YouTube\'s Data API. TikTok views are checked via oEmbed. Instagram views are manually reviewed. We never count bot views or fake engagement.',
      },
      {
        q: 'Can fans support my campaign?',
        a: 'Yes! Your campaign page at <code>selah.fm/c/[your-campaign-id]</code> has a crowdfunding section. Share the link with your fans — they can donate directly to your campaign budget to help you reach more listeners.',
      },
      {
        q: 'How do I pause or stop a campaign?',
        a: 'From your <a href="/dashboard">Dashboard</a>, click the pause button (⏸) on any active campaign. You can resume it anytime. Unspent budget stays in the campaign.',
      },
    ],
  },
  {
    section: 'For Creators',
    items: [
      {
        q: 'How do I start earning?',
        a: 'Browse campaigns at <a href="/browse">selah.fm/browse</a>, find a track you love, click "Join Campaign", paste your TikTok/Reels/Shorts link, and submit. Wait for the artist to approve — once approved, you earn based on verified views.',
      },
      {
        q: 'How much can I earn?',
        a: 'Your earnings depend on the campaign\'s CPM rate and your video\'s view count. For example: 50,000 views at $3 CPM = $150 gross, minus 20% platform fee = $120 net earnings. Top creators earn $50–500+ per campaign.',
      },
      {
        q: 'How do I get paid?',
        a: 'Go to your <a href="/earnings">Earnings</a> page and click "Set up Stripe Connect." Connect your bank account — it takes about 2 minutes and works in 40+ countries. Payouts are processed automatically after the artist approves your submission.',
      },
      {
        q: 'Do I need millions of followers?',
        a: 'No minimum follower count. We believe small creators with authentic audiences drive real results. You just need to create content that genuinely features the artist\'s track.',
      },
      {
        q: 'What kind of content should I make?',
        a: 'Each campaign has specific requirements set by the artist. Generally: use the track as background audio, keep it authentic to your style, and follow any hashtag or caption requirements. Check the campaign page for details.',
      },
      {
        q: 'Who owns my video?',
        a: 'You do — 100%. Selah.fm never claims ownership of your content. The artist gets promotion; you keep full rights to your video.',
      },
      {
        q: 'Can I submit to multiple campaigns?',
        a: 'Yes! You can submit to as many campaigns as you want. Each submission is independent.',
      },
    ],
  },
  {
    section: 'Account & Billing',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Go to <a href="/login">selah.fm/login</a>. You can sign up with email/password or continue with Google. Pick whether you\'re an artist or creator during signup.',
      },
      {
        q: 'I forgot my password — how do I reset it?',
        a: 'Password reset is available via email support. Contact <a href="mailto:support@selah.fm">support@selah.fm</a> and we\'ll help you reset within 24 hours. (Self-service password reset is coming soon.)',
      },
      {
        q: 'I signed up with Google but can\'t log in with a password.',
        a: 'If you created your account via "Continue with Google," you must keep using that button to sign in. Password login won\'t work for Google OAuth accounts. This is intentional for security.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'All payments go through Stripe — artists can use credit cards, debit cards, Apple Pay, Google Pay, and more. Creators connect their bank account via Stripe Connect.',
      },
      {
        q: 'Is there a refund policy?',
        a: 'Since you approve every video before payment, refunds are generally not applicable. If you haven\'t spent your campaign budget, you can pause the campaign and the remaining funds stay in your account. For exceptional cases, email <a href="mailto:support@selah.fm">support@selah.fm</a>.',
      },
      {
        q: 'What happens if I delete my account?',
        a: 'Your profile, campaigns, and submissions are permanently removed. Any remaining campaign budget is forfeited. Pending payouts are processed before deletion.',
      },
    ],
  },
  {
    section: 'Referrals & Bonuses',
    items: [
      {
        q: 'How does the referral program work?',
        a: 'Share your referral link (found on your <a href="/dashboard">Dashboard</a>). When a referred artist makes their first deposit, you both receive a 5% bonus credited to your campaign budgets. For example: a $100 deposit = $5 bonus for each of you.',
      },
      {
        q: 'When do I get my referral bonus?',
        a: 'The bonus is automatically credited when the referred artist makes their first deposit via Stripe. You\'ll get a notification in your bell icon.',
      },
      {
        q: 'Where can I find my referral link?',
        a: 'On your <a href="/dashboard">Dashboard</a>, in the referral banner. It looks like: <code>https://selah.fm/login?ref=your@email.com</code>',
      },
    ],
  },
  {
    section: 'Technical & Troubleshooting',
    items: [
      {
        q: 'The page won\'t load or shows an error.',
        a: 'Try a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). If the issue persists, the site may be deploying an update — wait 2 minutes and try again. If it\'s still broken, report it via the <a href="/report-bug">bug report form</a> or the support chat (bottom-right corner).',
      },
      {
        q: 'I see "0 campaigns" on Browse but I know there are campaigns.',
        a: 'Your browser may be showing a cached version. Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R). The campaign data is fetched fresh from our server with every visit.',
      },
      {
        q: 'My campaign isn\'t showing on my Dashboard.',
        a: 'Make sure you\'re logged into the correct account. Your Dashboard only shows campaigns you created. If you\'re sure this is wrong, email <a href="mailto:support@selah.fm">support@selah.fm</a> with your email and campaign name.',
      },
      {
        q: 'Chat messages aren\'t sending.',
        a: 'This can happen if the database tables need setup. An admin can run the migration at <code>/api/admin/migrate</code> to create the messages table. If you\'re not an admin, email <a href="mailto:support@selah.fm">support@selah.fm</a>.',
      },
      {
        q: 'Does Selah.fm work on mobile?',
        a: 'Yes! The entire platform is fully responsive and works on phones, tablets, and desktops. You can create campaigns, browse, submit content, and chat — all from your phone.',
      },
      {
        q: 'Is my data private and secure?',
        a: 'Yes. Passwords are hashed with bcrypt (12 rounds). Sessions use HMAC cookies. Stripe handles all payment data — we never see your credit card. The code is open source so anyone can audit our security. See our <a href="/privacy">Privacy Policy</a>.',
      },
      {
        q: 'What platforms is Selah.fm available on?',
        a: 'Selah.fm is a web app available at <a href="https://selah.fm">selah.fm</a> — no download required. It works in any modern browser (Chrome, Safari, Firefox, Edge).',
      },
    ],
  },
  {
    section: 'Support & Contact',
    items: [
      {
        q: 'How do I contact support?',
        a: 'You have several options: <br>• <strong>Support chat</strong>: click the blue chat bubble in the bottom-right corner of any page — Selah AI answers instantly, and can escalate to a human if needed.<br>• <strong>Email</strong>: <a href="mailto:support@selah.fm">support@selah.fm</a> — we typically respond within a few hours.<br>• <strong>Bug report</strong>: <a href="/report-bug">Report a bug form</a>.',
      },
      {
        q: 'How fast do you respond?',
        a: 'The AI support chat responds instantly. Human email responses are typically within a few hours during business hours (CET timezone).',
      },
      {
        q: 'How can I contribute to Selah.fm?',
        a: 'Selah.fm is open source! Fork the repo at <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener">GitHub</a>, make your changes, and open a pull request. See our <a href="/open-source">Open Source page</a> for more details.',
      },
      {
        q: 'Is there a community or social media?',
        a: 'We\'re building our community. For now, star us on <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener">GitHub</a> to stay updated with new features and releases.',
      },
    ],
  },
];

export default function FAQPage() {
  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="page-container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-sm">
            Everything you need to know about Selah.fm — artists, creators, payments, and more.
            Can&apos;t find what you&apos;re looking for? Use the support chat in the bottom-right corner.
          </p>
        </motion.div>

        <div className="space-y-8">
          {faqData.map((section, si) => (
            <motion.div
              key={section.section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08, duration: 0.4 }}
            >
              <h2 className="text-lg font-bold mb-4 text-primary">{section.section}</h2>
              <div className="space-y-2">
                {section.items.map((item, ii) => (
                  <details
                    key={ii}
                    className="group rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden"
                  >
                    <summary className="p-4 cursor-pointer text-sm font-medium flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      {item.q}
                      <ChevronDown size={16} className="text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-3" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:hover:no-underline [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
                      <p dangerouslySetInnerHTML={{ __html: item.a }} />
                    </div>
                  </details>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 mb-8 rounded-2xl bg-primary/[0.04] backdrop-blur-xl border border-primary/10 p-8 text-center"
        >
          <h2 className="text-lg font-bold mb-2">Still have questions?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI support chat is available 24/7 in the bottom-right corner. For anything it can&apos;t answer, a human will follow up by email.
          </p>
          <a
            href="mailto:support@selah.fm"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            support@selah.fm <ExternalLink size={14} />
          </a>
        </motion.div>
      </main>
    </div>
  );
}
