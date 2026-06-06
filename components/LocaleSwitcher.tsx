'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = LOCALES.find(l => l.code === locale) || LOCALES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
        aria-label="Switch language"
      >
        <Globe size={12} />
        <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-[#11112A] border border-white/[0.08] shadow-2xl py-1 animate-slide-up">
          {LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => {
                document.cookie = `NEXT_LOCALE=${l.code}; path=/; max-age=31536000; SameSite=Lax`;
                window.location.reload();
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs transition-colors ${
                l.code === locale
                  ? 'text-primary bg-primary/[0.06]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && (
                <span className="ml-auto text-[9px] text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
