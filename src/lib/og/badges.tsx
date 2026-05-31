import { ogPalette } from "@/lib/og/palette";

export type OgBadgeTone = "default" | "destructive" | "muted";

export type OgBadge = {
  label: string;
  tone: OgBadgeTone;
};

export function badgeColors(tone: OgBadgeTone) {
  switch (tone) {
    case "destructive":
      return {
        background: ogPalette.destructive,
        color: ogPalette.destructiveForeground,
        border: ogPalette.destructive,
      };
    case "muted":
      return {
        background: ogPalette.card,
        color: ogPalette.muted,
        border: ogPalette.border,
      };
    default:
      return {
        background: ogPalette.accent,
        color: ogPalette.accentForeground,
        border: ogPalette.border,
      };
  }
}

export function OgBadges({ badges }: { badges: OgBadge[] }) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {badges.map((badge) => {
        const colors = badgeColors(badge.tone);

        return (
          <span
            key={badge.label}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 500,
              background: colors.background,
              color: colors.color,
              border: `1px solid ${colors.border}`,
            }}
          >
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
