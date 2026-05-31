import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Robert-Jan Mastenbroek — Founder of Selah.fm',
  description: 'From record deal dropout to busking on Tenerife beaches, building a €6M crowdfunding platform, losing everything, and rebuilding Selah.fm — a CPM marketplace for independent artists.',
  openGraph: {
    title: 'About Robert-Jan Mastenbroek — Selah.fm Founder',
    description: 'The story behind Selah.fm: a musician who walked away from a record deal, built and lost millions, and created a marketplace where artists own their promotion.',
    type: 'profile',
    url: 'https://selah.fm/about',
    siteName: 'Selah.fm',
  },
  alternates: { canonical: 'https://selah.fm/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Robert-Jan Mastenbroek</h1>
        <p className="text-muted-foreground mb-12">Founder of Selah.fm — former professional musician, multi-millionaire entrepreneur, and worshipper.</p>

        {/* Timeline */}
        <div className="space-y-8">
          <Section
            title="The Record Deal I Walked Away From"
            content="At 17, I got what most musicians dream of — a record deal. Then I read the contract. The label took 98% of revenue. I'd get pennies while they owned my music forever. I walked away. That moment shaped everything I believe about artists owning their work."
          />

          <Section
            title="Building Dream or Donate (€6M+ Platform)"
            content="I built the biggest personal crowdfunding platform in Holland and Belgium — Dream or Donate. Over €6 million donated. People funded surgeries, started businesses, chased dreams. It proved something: people want to support things they believe in. You don't need a label."
          />

          <Section
            title="Losing Everything"
            content="The platform got hacked. I was publicly cancelled by national media — front page news, TV segments, the works. I sold everything I owned to pay everyone back. Ended up living in a campervan, busking on the streets of Tenerife with a guitar. No house. No car. Just me and the ocean."
          />

          <Section
            title="Finding Faith on a Beach"
            content="That's when things changed. I found faith — real faith, not the Sunday-morning kind. I quit smoking after 15 years. Started making electronic worship music. These 'holy raves' were raw, honest, and completely different from anything I'd made before. And people connected with it."
          />

          <Section
            title="Building Selah.fm"
            content="Everything I learned — the record deal exploitation, the platform that empowered people, the loss that stripped everything away, the music that came from nothing — led here. Selah.fm lets artists set budgets and creators earn per verified view on TikTok, Reels, and Shorts. No middlemen taking 98%. No black boxes. Artists own their promotion."
          />
        </div>

        {/* Credentials + Links */}
        <div className="mt-16 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-xl font-bold mb-4">Credentials</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Former professional musician — signed record deal (walked away)</li>
            <li>• Built Dream or Donate — €6M+ crowdfunding platform (Holland/Belgium)</li>
            <li>• Became multi-millionaire by 27 across coaching, Bitcoin, real estate</li>
            <li>• Featured in national Dutch media (front page, TV)</li>
            <li>• Currently performs electronic worship music ("holy raves") in Tenerife</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <Link href="/blog" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Read the blog →
            </Link>
            <a href="https://robertjanmastenbroek.com" target="_blank" rel="noopener" className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors">
              Personal site ↗
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}
