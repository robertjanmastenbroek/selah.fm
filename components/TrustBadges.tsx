import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

type BadgeKey = "real-views" | "artist-approval" | "pay-per-view" | "secure-payments";

interface BadgeDef {
  key: BadgeKey;
  icon: ReactNode;
  label: string;
  tooltip: string;
}

const BADGE_DEFS: Record<BadgeKey, BadgeDef> = {
  "real-views": {
    key: "real-views",
    icon: "👁",
    label: "100% real views",
    tooltip: "Every view is verified through platform APIs — no bots, no fakery.",
  },
  "artist-approval": {
    key: "artist-approval",
    icon: "✅",
    label: "You approve every video",
    tooltip: "Creators review and green-light every campaign video before it goes live.",
  },
  "pay-per-view": {
    key: "pay-per-view",
    icon: "🎯",
    label: "Pay per view",
    tooltip: "You only pay for views that our system verifies as genuine.",
  },
  "secure-payments": {
    key: "secure-payments",
    icon: "🔒",
    label: "Secure payments",
    tooltip: "All transactions are processed securely through Stripe.",
  },
};

const ALL_BADGE_KEYS: BadgeKey[] = [
  "real-views",
  "artist-approval",
  "pay-per-view",
  "secure-payments",
];

// ---------------------------------------------------------------------------
// Single badge pill
// ---------------------------------------------------------------------------

function BadgePill({ icon, label, tooltip }: Omit<BadgeDef, "key">) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// TrustBadges — composable credibility row
// ---------------------------------------------------------------------------

export interface TrustBadgesProps {
  /** Which badges to show. Defaults to all four. */
  badges?: BadgeKey[];
  /** Additional CSS classes appended to the container. */
  className?: string;
}

export default function TrustBadges({
  badges = ALL_BADGE_KEYS,
  className = "",
}: TrustBadgesProps) {
  if (badges.length === 0) return null;

  const resolved = badges
    .map((k) => BADGE_DEFS[k])
    .filter(Boolean);

  if (resolved.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="Trust signals"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {resolved.map((def) => (
        <BadgePill key={def.key} icon={def.icon} label={def.label} tooltip={def.tooltip} />
      ))}
    </div>
  );
}
