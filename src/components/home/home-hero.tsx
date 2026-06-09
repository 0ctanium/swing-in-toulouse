import Link from "next/link";

import { HeroDanceChips } from "@/components/dances/hero-dance-chips";
import { homeHero } from "@/lib/content/swing-dances";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { Button } from "@/components/ui/button";
import { emptyIcalPayload } from "@/lib/ical/payload";

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Disc3, Mic2, Music4, Piano, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeHeroSection() {
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="home-hero-heading"
        className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-secondary/80 via-background to-accent/15 px-6 py-10 shadow-sm md:min-h-88 md:px-10 md:py-14"
      >
        <SceneArt />

        <div className="relative flex max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-primary text-sm font-medium tracking-wide">
              {homeHero.kicker}
            </p>
            <h1
              id="home-hero-heading"
              className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl lg:text-[3.25rem]"
            >
              {homeHero.title[0]}
              <span className="text-primary block">{homeHero.title[1]}</span>
            </h1>
          </div>

          <p className="text-muted-foreground max-w-xl text-base leading-relaxed md:text-lg">
            {homeHero.lead}
          </p>

          <HeroDanceChips />

          <p className="text-foreground/85 max-w-lg text-sm leading-relaxed">
            {homeHero.followUp}
          </p>

          <div className={"flex flex-wrap gap-3"}>
            <Link
              href="/agenda"
              className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors hover:bg-primary/90"
            >
              Voir l&apos;agenda
            </Link>
            <CalendarSubscribeDialog payload={emptyIcalPayload()}>
              <Button variant="outline" className="h-10">
                S&apos;abonner au calendrier
              </Button>
            </CalendarSubscribeDialog>
          </div>
        </div>
      </section>
    </div>
  );
}

function SceneArt() {
  return (
    <ArtCanvas tone="accent">
      <IconMark
        icon={Piano}
        size={168}
        strokeWidth={0.85}
        className="text-primary -right-2 bottom-2 opacity-[0.2] md:right-2 md:bottom-6"
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

function ArtCanvas({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "accent";
}) {
  const glow = tone === "accent" ? "bg-accent/[0.14]" : "bg-primary/[0.07]";
  const glowSecondary =
    tone === "accent" ? "bg-primary/[0.05]" : "bg-accent/[0.1]";

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
