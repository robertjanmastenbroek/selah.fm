'use client';

interface EditorAttributionBadgeProps {
  artistId: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  contributorCount: number;
}

/**
 * Shows a small attribution badge on artist pages that have
 * received community edits. Only renders when edits exist —
 * never highlights that a page is purely AI-generated.
 */
export default function EditorAttributionBadge({
  artistId,
  lastEditedBy,
  lastEditedAt,
  contributorCount,
}: EditorAttributionBadgeProps) {
  // Don't render anything if there are no community edits
  // This prevents highlighting that the page is AI-only
  if (contributorCount === 0) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <span className="text-[9px] text-muted-foreground/30">·</span>
      <span className="text-[9px] text-muted-foreground/40">
        {contributorCount >= 5 ? (
          <>{contributorCount} contributors have improved this page</>
        ) : lastEditedBy ? (
          <>Last edited by {lastEditedBy} on {formatDate(lastEditedAt)}</>
        ) : lastEditedAt ? (
          <>Page last updated {formatDate(lastEditedAt)}</>
        ) : (
          <>{contributorCount} contribution{contributorCount !== 1 ? 's' : ''}</>
        )}
      </span>
      <button
        onClick={() => {
          // Phase 2: open edit history panel
          // For now, scroll to the HelpfulSurvey at the bottom
          document.getElementById('helpful-survey')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="text-[9px] text-primary/40 hover:text-primary/60 transition-colors"
        title="View edit history"
      >
        (history)
      </button>
      <span className="text-[9px] text-muted-foreground/30">·</span>
    </div>
  );
}
