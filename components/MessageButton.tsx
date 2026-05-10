'use client';

import { MessageCircle } from 'lucide-react';

export function MessageButton({ userId, name, className = '' }: { userId: string; name: string; className?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId, name } }));
  };

  return (
    <button onClick={handleClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all ${className}`}>
      <MessageCircle size={14} strokeWidth={1.5} />
      Message
    </button>
  );
}

export function openChat(userId: string, name: string) {
  window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId, name } }));
}
