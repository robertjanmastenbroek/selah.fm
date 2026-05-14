'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TickerEvent {
  type: 'donation' | 'submission';
  message: string;
  timestamp: string;
}

// ── Live dot spinner icon ───────────────────────────────────
function LiveDot() {
  return (
    <span className="inline-flex items-center shrink-0" aria-hidden="true">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
    </span>
  );
}

export default function LiveTicker({ campaignId }: { campaignId: string }) {
  const [events, setEvents] = useState<TickerEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [exiting, setExiting] = useState(false);
  const [entering, setEntering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotion.current = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch campaign events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/live-ticker`);
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setIsPlaceholder(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [campaignId]);

  // Fetch platform totals for placeholder
  const fetchPlaceholder = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/totals');
      const data = await res.json();
      setPlaceholderText(`${data.total_videos.toLocaleString()} videos submitted across Selah.fm · $${data.total_donations.toLocaleString()} donated so far`);
      setIsPlaceholder(true);
    } catch {
      setPlaceholderText('Videos and donations across Selah.fm');
      setIsPlaceholder(true);
    }
  }, []);

  // Initial load — set a safety timeout so loading state never persists >8s
  useEffect(() => {
    let settled = false;
    const safety = setTimeout(() => {
      if (!settled) {
        setPlaceholderText('Videos and donations across Selah.fm');
        setIsPlaceholder(true);
      }
    }, 8000);

    fetchEvents().then(hasEvents => {
      settled = true;
      clearTimeout(safety);
      if (!hasEvents) fetchPlaceholder();
    });
    return () => clearTimeout(safety);
  }, [fetchEvents, fetchPlaceholder]);

  // Rotation timer
  useEffect(() => {
    if (events.length === 0) return;

    const interval = 3500;
    timerRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % events.length);
        setExiting(false);
        setEntering(true);
        setTimeout(() => setEntering(false), 400);
      }, 400);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [events.length]);

  // Poll for new events every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      fetchEvents().then(hasEvents => {
        if (hasEvents && isPlaceholder) setIsPlaceholder(false);
      });
    }, 30000);
    return () => clearInterval(poll);
  }, [fetchEvents, isPlaceholder]);

  const currentEvent = events[currentIndex];
  const useReducedMotion = reducedMotion.current;

  return (
    <div ref={containerRef} className="relative h-10 overflow-hidden" aria-live="polite" aria-atomic="true">
      {/* Placeholder */}
      {isPlaceholder && (
        <div className="absolute inset-0 flex items-center text-xs text-muted-foreground font-medium">
          {placeholderText}
        </div>
      )}

      {/* Active events carousel */}
      {!isPlaceholder && currentEvent && (
        <div className="absolute inset-0 flex items-center gap-2">
          <LiveDot />
          {/* Exiting old message */}
          <span
            className={`text-xs font-medium text-muted-foreground whitespace-nowrap truncate transition-all duration-400 ${
              exiting
                ? useReducedMotion
                  ? 'opacity-0'
                  : 'opacity-0 -translate-y-3'
                : entering
                ? useReducedMotion
                  ? 'opacity-100'
                  : 'opacity-100 translate-y-0'
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionTimingFunction: exiting ? 'cubic-bezier(0.4, 0, 1, 1)' : 'cubic-bezier(0, 0, 0.2, 1)' }}
          >
            {currentEvent.message}
          </span>
        </div>
      )}

      {/* Loading state — short-lived, auto-transitions to placeholder */}
      {!isPlaceholder && !currentEvent && (
        <div className="absolute inset-0 flex items-center gap-2">
          <LiveDot />
          <span className="text-xs font-medium text-muted-foreground">Loading recent activity...</span>
        </div>
      )}
    </div>
  );
}
