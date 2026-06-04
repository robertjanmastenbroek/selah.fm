'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SparklineData {
  value: number;
  label?: string;
}

export default function AnimatedKPICard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  trendDirection,
  color = 'primary',
  sparkline,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'emerald' | 'amber' | 'indigo' | 'rose';
  sparkline?: SparklineData[];
  onClick?: () => void;
}) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [showSparkline, setShowSparkline] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Count-up animation
  useEffect(() => {
    const raw = String(value);
    const isDollar = raw.startsWith('$');
    const isK = raw.endsWith('K');
    const numStr = raw.replace(/[$K,.]/g, '');
    const targetNum = parseInt(numStr) || 0;
    const duration = 800;
    const steps = 30;
    let step = 0;

    if (targetNum === 0) {
      setDisplayValue(String(value));
      return;
    }

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * targetNum);

      if (isDollar && isK) setDisplayValue(`$${current}K`);
      else if (isDollar) setDisplayValue(`$${current}`);
      else if (isK) setDisplayValue(`${current}K`);
      else if (raw.includes('%')) setDisplayValue(`${current}%`);
      else setDisplayValue(String(current));

      if (progress >= 1) {
        setDisplayValue(String(value));
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  // Sparkline animation
  useEffect(() => {
    const timer = setTimeout(() => setShowSparkline(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const colorMap = {
    primary: { text: 'text-primary', bg: 'bg-primary/[0.08]', gradient: 'from-primary/60 to-primary/20' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]', gradient: 'from-emerald-400/60 to-emerald-400/20' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/[0.08]', gradient: 'from-amber-400/60 to-amber-400/20' },
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/[0.08]', gradient: 'from-indigo-400/60 to-indigo-400/20' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500/[0.08]', gradient: 'from-rose-400/60 to-rose-400/20' },
  };

  const c = colorMap[color];
  const maxSpark = sparkline ? Math.max(...sparkline.map(s => s.value), 1) : 1;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-4 ${
        onClick ? 'cursor-pointer' : ''
      } group`}
    >
      {/* Hover glow */}
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.03] to-transparent blur-xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={18} className={c.text} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">{label}</p>
            <motion.p
              key={displayValue}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight mt-0.5"
            >
              {displayValue}
            </motion.p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {trend && (
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
              trendDirection === 'up' ? 'text-emerald-400' :
              trendDirection === 'down' ? 'text-rose-400' : 'text-muted-foreground/50'
            }`}>
              {trendDirection === 'up' && '↑'}
              {trendDirection === 'down' && '↓'}
              {trend}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 1 && showSparkline && (
        <div className="mt-3 h-8 relative z-10">
          <svg className="w-full h-full" viewBox={`0 0 ${sparkline.length * 10} 32`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={sparkline.map((d, i) => {
                const x = (i / (sparkline.length - 1)) * (sparkline.length * 10);
                const y = 32 - (d.value / maxSpark) * 28;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={c.text}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
            />
            <motion.path
              d={sparkline.map((d, i) => {
                const x = (i / (sparkline.length - 1)) * (sparkline.length * 10);
                const y = 32 - (d.value / maxSpark) * 28;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ') + ` L ${(sparkline.length - 1) * 10} 32 L 0 32 Z`}
              fill={`url(#spark-${label.replace(/\s/g, '')})`}
              className={c.text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            />
          </svg>
        </div>
      )}

      {sublabel && (
        <p className="text-[10px] text-muted-foreground/40 mt-1 relative z-10">{sublabel}</p>
      )}
    </motion.div>
  );
}
