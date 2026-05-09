import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  icon = '♪',
  title,
  description,
  action,
  actionHref,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <Card className="text-center py-16 animate-fade-in border-border/30">
      <CardContent>
        <div className="text-5xl mb-4 opacity-[0.06] animate-float">{icon}</div>
        <h2 className="text-lg font-medium text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {action && actionHref && (
          <a href={actionHref}>
            <Button>{action}</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  message = "Hmm, that didn't go as planned.",
  action = 'Try again',
  onAction,
}: {
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] px-5 py-4 animate-shake">
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{message}</p>
          {onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-sm font-medium text-primary hover:underline transition-colors"
            >
              {action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
