'use client';

import { useCallback, useRef } from 'react';

export function useRipple() {
  const rippleRef = useRef<HTMLSpanElement | null>(null);

  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;

    // Remove any existing ripples
    const existing = button.getElementsByClassName('ripple-effect');
    while (existing.length > 0) existing[0].remove();

    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const span = document.createElement('span');
    span.className = 'ripple-effect';
    span.style.width = span.style.height = `${diameter}px`;
    span.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    span.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;

    button.appendChild(span);
    rippleRef.current = span;

    span.addEventListener('animationend', () => {
      span.remove();
      if (rippleRef.current === span) rippleRef.current = null;
    });
  }, []);

  return createRipple;
}
