export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Content Guidelines — Selah.fm',
  description: 'Content creation guidelines for creators on Selah.fm — CPM marketplace for music promotion.',
};

export default function ContentGuidelinesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-muted-foreground text-sm hover:text-foreground mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mb-4">Creator Content Guidelines</h1>
        <p className="text-muted-foreground text-sm mb-10">These guidelines apply to all content created for Selah.fm tracks. Following them ensures your submissions get approved and you get paid.</p>

        <div className="text-sm space-y-8 text-muted-foreground">

          {/* 1. Disclosure */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">1. Disclose Your Connection</h2>
            <p>You must make your connection to the artist and Selah.fm clear to viewers. When an artist requires FTC disclosure hashtags (e.g., #PaidPartner, #Ad), you must include them. Failure to disclose paid partnerships may result in rejection.</p>
          </section>

          {/* 2. Honest Content */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">2. Create Honest, Original Content</h2>
            <p>Only make claims about the track or artist that are provided in the campaign requirements. Do not make claims about other artists or platforms. Your content should reflect your genuine style and authentic experience with the music.</p>
          </section>

          {/* 3. Original Content Only */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">3. Original Content Only</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All content must be your own original creation.</li>
              <li>Do not repost, re-upload, or steal another creator&apos;s content.</li>
              <li>Do not post the same video multiple times on the same account.</li>
              <li>Using another creator&apos;s clip without permission will result in immediate rejection and possible account suspension.</li>
            </ul>
          </section>

          {/* 4. No Artificial Engagement */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">4. No Artificial Engagement</h2>
            <p>Any attempt to artificially inflate views, likes, or engagement is strictly prohibited. This includes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Using bots, view farms, or click generators</li>
              <li>Purchasing views or engagement</li>
              <li>Coordinated view inflation schemes</li>
              <li>Misleading metadata or tags to boost visibility</li>
            </ul>
            <p className="mt-2">Violations will result in rejected submissions, forfeited earnings, and permanent account bans.</p>
          </section>

          {/* 5. Follow Track Requirements */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">5. Follow Track Requirements</h2>
            <p>Each track has specific requirements set by the artist. Read them carefully before creating content:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Minimum video length</strong> — if specified, your video must meet or exceed this duration</li>
              <li><strong>Required hashtags</strong> — include all hashtags listed in the track</li>
              <li><strong>Content style</strong> — follow the artist&apos;s creative direction</li>
              <li><strong>Platform tags</strong> — tag the artist&apos;s social accounts if required</li>
              <li><strong>Caption requirements</strong> — use the specified caption text if provided</li>
            </ul>
          </section>

          {/* 6. Respect Rights */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">6. Respect Intellectual Property</h2>
            <p>You may use the artist&apos;s music as provided through the campaign for promotional content on approved platforms only. Do not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Alter, remix, or modify the track without permission</li>
              <li>Use the music outside of the approved platforms (TikTok, Instagram Reels, YouTube Shorts)</li>
              <li>Use third-party copyrighted material (images, video clips, music) without permission</li>
            </ul>
          </section>

          {/* 7. Prohibited Content */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">7. Prohibited Content</h2>
            <p>Content that violates any of the following will be rejected and may result in account suspension:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Hate speech, discrimination, or harassment</li>
              <li>Violence, threats, or self-harm content</li>
              <li>Sexually explicit or suggestive material</li>
              <li>Illegal activity or promotion of illegal conduct</li>
              <li>Misinformation or deceptive claims</li>
              <li>Impersonation or misrepresentation</li>
              <li>Spam or mass messaging</li>
            </ul>
          </section>

          {/* 8. View Requirements */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">8. View Requirements & Payout</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must earn at least <strong>$5 total</strong> across all submissions before we send a payout via Stripe. This avoids Stripe fees consuming your earnings.</li>
              <li>Each track may have a <strong>minimum view threshold</strong> — your video must reach this many views to qualify for payout.</li>
              <li>Each submission has a <strong>maximum payout cap</strong> — you won&apos;t earn more than this amount per video, regardless of views.</li>
              <li>The artist reviews every submission and has final approval. Only approved content counts toward your earnings.</li>
              <li>Views are verified through platform APIs where available (YouTube). For TikTok and Instagram, views are verified during the artist&apos;s review.</li>
              <li>Payouts are processed via Stripe after approval and view verification.</li>
            </ul>
          </section>

          {/* 9. Platform Compliance */}
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">9. Platform Compliance</h2>
            <p>Your content must comply with the terms of service of the platform you&apos;re posting on (TikTok, Instagram, YouTube). Selah.fm is not responsible for content removed by these platforms.</p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-xs">Last updated: May 2026. Questions? Contact support@selah.fm.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
