import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Disc3, Mic2, Music2, Music4, Piano, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import type { HeroArtVariant } from "./types";

function ArtCanvas({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "accent";
}) {
  const glow =
    tone === "accent"
      ? "bg-accent/[0.14]"
      : "bg-primary/[0.07]";
  const glowSecondary =
    tone === "accent"
      ? "bg-primary/[0.05]"
      : "bg-accent/[0.1]";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      aria-hidden
    >
      <div
        className={cn(
          "absolute right-[-10%] bottom-[-18%] size-[min(80vw,440px)] rounded-full blur-3xl",
          glow,
        )}
      />
      <div
        className={cn(
          "absolute top-[-15%] right-[-8%] size-56 rounded-full blur-3xl",
          glowSecondary,
        )}
      />
      {children}
    </div>
  );
}

function IconMark({
  icon: Icon,
  size,
  strokeWidth = 1.25,
  className,
  style,
}: {
  icon: LucideIcon;
  size: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn("absolute text-primary", className)}
      style={style}
    />
  );
}

/** Jazz club — disque XXL, micro live, ambiance groove. */
function VinylArt() {
  return (
    <ArtCanvas tone="primary">
      <IconMark
        icon={Disc3}
        size={280}
        strokeWidth={0.75}
        className="text-primary right-[-5rem] bottom-[-5rem] opacity-[0.18] hero-icon-spin-slower"
      />
      <IconMark
        icon={Disc3}
        size={180}
        strokeWidth={0.9}
        className="text-primary right-6 bottom-4 opacity-[0.08] hero-icon-spin md:right-10 md:bottom-6"
        style={{ rotate: "18deg" }}
      />
      <IconMark
        icon={Mic2}
        size={104}
        strokeWidth={0.95}
        className="text-primary right-10 bottom-24 opacity-[0.24] md:right-16 md:bottom-28"
        style={{ rotate: "-22deg" }}
      />
      <IconMark
        icon={Music4}
        size={48}
        strokeWidth={1.35}
        className="text-primary right-44 top-12 opacity-[0.28] hero-icon-float md:right-52 md:top-14"
        style={{ rotate: "-10deg" }}
      />
      <IconMark
        icon={Music2}
        size={32}
        strokeWidth={1.5}
        className="text-primary right-6 top-20 opacity-[0.22] hero-icon-float-slow md:right-10 md:top-24"
        style={{ rotate: "16deg" }}
      />
      <IconMark
        icon={Music2}
        size={24}
        strokeWidth={1.5}
        className="text-accent right-32 bottom-12 opacity-[0.35] hero-icon-float-delayed hidden sm:block md:right-40"
        style={{ rotate: "-14deg" }}
      />
    </ArtCanvas>
  );
}

/** Scène live — piano, paillettes, soirée festive. */
function SceneArt() {
  return (
    <ArtCanvas tone="accent">
      <IconMark
        icon={Piano}
        size={168}
        strokeWidth={0.85}
        className="text-primary right-[-0.5rem] bottom-2 opacity-[0.2] md:right-2 md:bottom-6"
        style={{ rotate: "-5deg" }}
      />
      <IconMark
        icon={Mic2}
        size={64}
        strokeWidth={1.1}
        className="text-primary right-36 top-16 opacity-[0.16] md:right-44 md:top-20"
        style={{ rotate: "-12deg" }}
      />
      <IconMark
        icon={Sparkles}
        size={44}
        strokeWidth={1.25}
        className="fill-accent/25 text-accent right-24 top-8 opacity-50 hero-icon-float md:right-32 md:top-10"
      />
      <IconMark
        icon={Sparkles}
        size={26}
        strokeWidth={1.5}
        className="fill-accent/20 text-accent right-12 top-28 opacity-40 hero-icon-float-delayed md:right-16 md:top-32"
      />
      <IconMark
        icon={Sparkles}
        size={18}
        strokeWidth={1.5}
        className="fill-accent/15 text-accent right-40 top-24 opacity-35 hero-icon-float-slow hidden sm:block md:right-48"
      />
      <IconMark
        icon={Music4}
        size={56}
        strokeWidth={1.15}
        className="text-primary right-4 bottom-36 opacity-[0.2] md:bottom-40"
        style={{ rotate: "12deg" }}
      />
      <IconMark
        icon={Disc3}
        size={56}
        strokeWidth={1.1}
        className="text-primary/80 right-28 bottom-44 opacity-[0.12] md:right-36 md:bottom-48"
        style={{ rotate: "20deg" }}
      />
    </ArtCanvas>
  );
}

const artByVariant = {
  vinyl: VinylArt,
  scene: SceneArt,
} as const;

type HeroArtProps = {
  variant?: HeroArtVariant;
};

export function HeroArt({ variant = "vinyl" }: HeroArtProps) {
  const Art = artByVariant[variant];
  return <Art />;
}

export type { HeroArtVariant } from "./types";
