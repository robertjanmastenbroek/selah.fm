import Link from 'next/link';
import { Music4, Clapperboard, Sparkles } from 'lucide-react';

function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <div className="absolute rounded-full bg-primary/10" style={{
      left: `${x}%`, top: `${y}%`, width: size, height: size,
      animation: `particleFloat ${4 + delay * 2}s ease-in-out infinite`,
      animationDelay: `${delay}s`, opacity: 0.3 + delay * 0.2,
    }} />
  );
}

export default function SplitterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl animate-pulse" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Particle key={i} delay={i * 0.6} x={10 + Math.sin(i * 2.7) * 40} y={20 + Math.cos(i * 1.9) * 35} size={2 + (i % 4)} />
        ))}
      </div>

      <div className="w-full max-w-[672px] space-y-8 relative z-10">
        <div className="text-center" style={{ animation: 'fadeDown 0.5s ease-out forwards' }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.04] border border-primary/[0.06]">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">Selah<span className="text-primary">.fm</span></span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Link href="/welcome-artists" className="group block" aria-label="Artist sign up">
            <article className="h-full rounded-2xl bg-card border border-border/[0.15] p-8 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#1E1E1E] hover:border-primary/20 hover:shadow-[0_0_0_1px_rgba(91,127,255,0.1),0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1"
              style={{ animation: 'fadeUp 0.5s ease-out 0.1s forwards', opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center text-primary mb-6 transition-all duration-300 group-hover:bg-primary/[0.12] group-hover:scale-105">
                <Music4 size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">Get your music heard.</h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[220px]">Real creators make content using your music. You approve and pay for verified views.</p>
              <div className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm text-center transition-all duration-200 group-hover:shadow-[0_0_24px_rgba(91,127,255,0.3)]">I&apos;m an artist</div>
            </article>
          </Link>

          <Link href="/welcome-creators" className="group block" aria-label="Creator sign up">
            <article className="h-full rounded-2xl bg-card border border-border/[0.15] p-8 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#1E1E1E] hover:border-primary/20 hover:shadow-[0_0_0_1px_rgba(91,127,255,0.1),0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1"
              style={{ animation: 'fadeUp 0.5s ease-out 0.2s forwards', opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center text-primary mb-6 transition-all duration-300 group-hover:bg-primary/[0.12] group-hover:scale-105">
                <Clapperboard size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">Get paid to create.</h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[220px]">Pick tracks you love, make short videos, and earn per 1,000 verified views.</p>
              <div className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm text-center transition-all duration-200 group-hover:shadow-[0_0_24px_rgba(91,127,255,0.3)]">I&apos;m a creator</div>
            </article>
          </Link>
        </div>

        <div className="text-center" style={{ animation: 'fadeUp 0.5s ease-out 0.4s forwards', opacity: 0 }}>
          <Link href="/login" className="inline-block text-sm text-muted-foreground hover:text-[#A0A0A0] transition-colors duration-200">Already have an account? Sign in</Link>
        </div>

        <p className="text-center text-xs text-muted-foreground/60" style={{ animation: 'fadeUp 0.5s ease-out 0.5s forwards', opacity: 0 }}>Trusted by 200+ artists and 390+ creators</p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes particleFloat { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; } 33% { transform: translateY(-12px) translateX(6px); opacity: 0.6; } 66% { transform: translateY(8px) translateX(-4px); opacity: 0.4; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
