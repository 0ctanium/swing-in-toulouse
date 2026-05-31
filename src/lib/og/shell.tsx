import type { ReactNode } from "react";

import type { OgAssets } from "@/lib/og/assets";
import { ogPalette } from "@/lib/og/palette";
import { siteConfig } from "@/lib/site";

export function OgShell({
  assets,
  pill,
  children,
}: {
  assets: OgAssets;
  pill: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: ogPalette.background,
        color: ogPalette.foreground,
        fontFamily: "DM Sans",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          borderLeft: `10px solid ${ogPalette.primary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            padding: "48px 56px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 16px",
                borderRadius: 999,
                background: ogPalette.primary,
                color: ogPalette.primaryForeground,
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {pill}
            </div>
          </div>

          {children}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 56px",
          borderTop: `1px solid ${ogPalette.border}`,
          background: ogPalette.card,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.logoDataUrl}
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 10 }}
          />
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 28,
              fontWeight: 600,
              color: ogPalette.foreground,
            }}
          >
            {siteConfig.name}
          </span>
        </div>
        <span
          style={{
            fontSize: 22,
            color: ogPalette.muted,
            fontWeight: 500,
          }}
        >
          Toulouse
        </span>
      </div>
    </div>
  );
}

export function OgSidebarCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 180,
        minWidth: 180,
        padding: "24px 20px",
        borderRadius: 24,
        background: ogPalette.card,
        border: `1px solid ${ogPalette.border}`,
        boxShadow: "0 8px 24px rgba(58, 50, 46, 0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function OgContentColumn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        gap: 20,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

export function OgMetaLines({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontSize: 26,
        lineHeight: 1.35,
        color: ogPalette.muted,
      }}
    >
      {children}
    </div>
  );
}
