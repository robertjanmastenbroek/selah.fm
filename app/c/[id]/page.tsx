import { Metadata } from 'next';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaignId = params.id;
  // In production, fetch campaign from DB
  const title = `Campaign ${campaignId} — SendMusic.io`;
  return {
    title,
    description: `Join this music promotion campaign on SendMusic.io. Creators earn CPM for every verified view on TikTok, Instagram Reels, and YouTube Shorts.`,
    openGraph: {
      title,
      description: `Join this music promotion campaign. Creators earn for every view.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
    },
    alternates: { canonical: `https://sendmusic-io-production.up.railway.app/c/${campaignId}` },
  };
}

export default async function CampaignPage({ params }: Props) {
  const campaignId = params.id;
  
  return (
    <main className="min-h-screen bg-bg">
      <div className="page-container py-12 md:py-16">
        <a href="/browse" className="text-text-muted text-sm hover:text-text mb-8 inline-block">← Back to Discover</a>
        
        <div className="card p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl text-text mb-2">Campaign #{campaignId}</h1>
              <p className="text-text-secondary">Music promotion campaign on TikTok, Reels & Shorts.</p>
            </div>
            <span className="bg-gold/10 text-gold text-sm font-semibold px-4 py-2 rounded-full">Active</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6 text-center mb-6">
            <div>
              <div className="text-gold font-bold text-2xl">$3.00</div>
              <div className="text-text-muted text-sm mt-1">CPM per 1K views</div>
            </div>
            <div>
              <div className="text-gold font-bold text-2xl">$500</div>
              <div className="text-text-muted text-sm mt-1">Total budget</div>
            </div>
            <div>
              <div className="text-gold font-bold text-2xl">8</div>
              <div className="text-text-muted text-sm mt-1">Submissions</div>
            </div>
          </div>

          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gold rounded-full" style={{ width: '25%' }} />
          </div>

          <a href="/login" className="btn-gold w-full text-lg">
            Join this campaign
          </a>
        </div>

        {/* SEO content */}
        <section className="prose max-w-none">
          <h2 className="font-display text-xl text-text mb-4">How it works</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Artists post campaigns with CPM rates on SendMusic.io. Creators browse, pick tracks they love, 
            and make TikToks, Instagram Reels, or YouTube Shorts. They submit their content links, 
            and artists review and approve. Creators get paid for every verified view.
          </p>
          <p className="text-text-secondary leading-relaxed">
            No bots. No fake views. Every view is verified through platform APIs. 
            Artists set a max payout per submission so their budget stays safe.
          </p>
        </section>
      </div>
    </main>
  );
}
