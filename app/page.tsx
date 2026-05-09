import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Selah.fm | Music Promotion & Creator Earnings',
  description: 'Real creators make TikToks, Reels & Shorts for your music. You set the CPM, approve every video, and pay only for verified views.',
};

export default function SplitterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[672px] space-y-6">
        {/* Logo */}
        <div className="text-center animate-[fadeIn_0.3s_ease-out]">
          <span className="text-sm font-medium text-muted-foreground tracking-wide">Selah<span className="text-[#8B9FFF]">.fm</span></span>
        </div>

        {/* Two routing cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Artist card */}
          <Link href="/welcome-artists" className="group block" aria-label="Artist sign up">
            <article className="h-full rounded-xl bg-card border border-border/30 p-6 md:p-8 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#1E1E1E] hover:border-primary/20 hover:shadow-[0_0_0_2px_rgba(91,127,255,0.08)]"
              style={{ animation: 'fadeIn 0.4s ease-out, slideUp 0.4s ease-out' }}>
              <div className="text-4xl mb-5 opacity-40">🎵</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Get your music heard.</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-[240px]">
                Real creators make content using your music. You approve and pay for verified views.
              </p>
              <div className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm text-center group-hover:scale-[1.015] transition-transform duration-150">
                I&apos;m an artist
              </div>
            </article>
          </Link>

          {/* Creator card */}
          <Link href="/welcome-creators" className="group block" aria-label="Creator sign up">
            <article className="h-full rounded-xl bg-card border border-border/30 p-6 md:p-8 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#1E1E1E] hover:border-primary/20 hover:shadow-[0_0_0_2px_rgba(91,127,255,0.08)]"
              style={{ animation: 'fadeIn 0.4s ease-out, slideUp 0.45s ease-out' }}>
              <div className="text-4xl mb-5 opacity-40">📱</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Get paid to create.</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-[240px]">
                Pick tracks you love, make short videos, and earn per 1,000 verified views.
              </p>
              <div className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm text-center group-hover:scale-[1.015] transition-transform duration-150">
                I&apos;m a creator
              </div>
            </article>
          </Link>
        </div>

        {/* Sign-in link */}
        <div className="text-center animate-[fadeIn_0.5s_ease-out]">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-[#A0A0A0] transition-colors duration-150" aria-label="Sign in to existing account">
            Already have an account? Sign in.
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-muted-foreground animate-[fadeIn_0.6s_ease-out]">
          Trusted by 200+ artists and 390+ creators.
        </p>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
