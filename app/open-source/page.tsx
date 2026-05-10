'use client';

import Header from '@/components/TopNav';
import { motion } from 'framer-motion';
import { Github, Heart, Code, Globe, Zap, Users, ArrowRight, BookOpen } from 'lucide-react';

export default function OpenSourcePage() {
  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="page-container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 pt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6">
            <Github size={16} className="text-primary" />
            <span className="text-sm font-medium">Now open source</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Selah.fm is<br />
            <span className="text-primary">open source</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            The entire platform — frontend, backend, payments, and automation — is now public.
            Build with us. Audit us. Trust us.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <a
              href="https://github.com/robertjanmastenbroek/selah.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Github size={18} />
              View on GitHub
            </a>
            <a
              href="/CONTRIBUTING.md"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.06] transition-colors"
            >
              <BookOpen size={18} />
              Contribute
            </a>
          </div>
        </motion.div>

        {/* Why we open-sourced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Why we open-sourced</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: 'Transparency', desc: 'No black boxes. Every line of code is visible. You can see exactly how your data is handled, how payments flow, and how security works.' },
              { icon: Heart, title: 'Trust', desc: 'Open source means independent auditability. Anyone can verify there are no backdoors, hidden fees, or data leaks.' },
              { icon: Users, title: 'Community', desc: 'The best ideas come from everywhere. Musicians, creators, and developers can now shape the platform they use every day.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
                  <Icon size={24} strokeWidth={1.5} className="text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* What's open */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">What&apos;s open</h2>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Code size={18} className="text-primary" />
                  Full platform code
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Next.js 14 frontend (16 pages, glassmorphism UI)</li>
                  <li>• 26 REST API endpoints</li>
                  <li>• Stripe payment integration</li>
                  <li>• Google OAuth authentication</li>
                  <li>• Real-time chat and notifications</li>
                  <li>• Admin dashboard</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  Automation & tools
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Python orchestrator for task management</li>
                  <li>• AI agent instruction files</li>
                  <li>• E2E test suite (Playwright, 34 tests)</li>
                  <li>• Database migrations and seeding</li>
                  <li>• Railway deployment configuration</li>
                  <li>• GitHub Actions CI/CD</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Business model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="rounded-2xl bg-primary/[0.04] backdrop-blur-xl border border-primary/10 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Our business model</h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              We charge a <strong className="text-foreground">20% service fee</strong> on creator payouts to keep the platform running and improving. This covers hosting, support, payment processing, and the managed service at selah.fm.
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
          <div className="space-y-3">
            {[
              { q: 'Does open source mean I don\'t have to pay the fee?', a: 'No. The 20% service fee applies to the managed platform at selah.fm. The code is free to use, study, and modify, but the hosted service has operating costs.' },
              { q: 'Can I host my own version?', a: 'Yes. The MIT license allows you to fork the code and run your own instance. You\'ll need your own Stripe account, database, and Google OAuth credentials.' },
              { q: 'How do I contribute?', a: 'Fork the repo, make your changes, and open a pull request. Check CONTRIBUTING.md for guidelines. We welcome bug fixes, features, documentation, and design improvements.' },
              { q: 'Is my data safe?', a: 'Absolutely. The code is public for transparency, but your data on selah.fm is private and protected. Database credentials and API keys are never exposed — they live in Railway environment variables.' },
            ].map(faq => (
              <details key={faq.q} className="group rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium text-sm flex items-center justify-between">
                  {faq.q}
                  <ArrowRight size={16} className="text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="text-center pb-16"
        >
          <a
            href="https://github.com/robertjanmastenbroek/selah.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity hover:shadow-[0_0_30px_rgba(91,127,255,0.3)]"
          >
            <Github size={22} />
            Star us on GitHub
            <ArrowRight size={18} />
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            Every star helps more musicians and creators discover us.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
