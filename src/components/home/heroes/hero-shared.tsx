"use client";

import Link from "next/link";
import posthog from "posthog-js";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { Button } from "@/components/ui/button";
import type { HeroArtVariant } from "@/components/home/heroes/hero-art/types";
import type { HeroVariant } from "@/components/home/heroes/types";
import { organizationDanceValues } from "@/lib/organizations/dances";
import { emptyIcalPayload } from "@/lib/ical/payload";

export type HeroExperimentTracking = {
  heroLayoutVariant: HeroVariant;
  heroArtVariant?: HeroArtVariant;
};

export function HeroActions({
  className,
  heroLayoutVariant,
  heroArtVariant,
}: HeroExperimentTracking & {
  className?: string;
}) {
  function captureHeroClick(action: "agenda" | "calendar") {
    posthog.capture(
      action === "agenda"
        ? "home_hero_agenda_clicked"
        : "home_hero_calendar_clicked",
      {
        hero_layout_variant: heroLayoutVariant,
        ...(heroArtVariant ? { hero_art_variant: heroArtVariant } : {}),
      },
    );
  }

  return (
    <div className={className ?? "flex flex-wrap gap-3"}>
      <Link
        href="/agenda"
        onClick={() => captureHeroClick("agenda")}
        className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors hover:bg-primary/90"
      >
        Voir l&apos;agenda
      </Link>
      <CalendarSubscribeDialog payload={emptyIcalPayload()}>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => captureHeroClick("calendar")}
        >
          S&apos;abonner au calendrier
        </Button>
      </CalendarSubscribeDialog>
    </div>
  );
}

export function HeroDanceChips({
  variant = "pill",
}: {
  variant?: "pill" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p className="text-muted-foreground text-sm">
        {organizationDanceValues.map((dance, index) => (
          <span key={dance}>
            {index > 0 ? (
              <span className="text-border mx-2" aria-hidden>
                ·
              </span>
            ) : null}
            <Link
              href="/#danses"
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              {dance}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Styles de danse">
      {organizationDanceValues.map((dance) => (
        <li key={dance}>
          <Link
            href="/#danses"
            className="bg-background/80 text-foreground hover:border-primary/30 hover:bg-background inline-flex rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          >
            {dance}
          </Link>
        </li>
      ))}
    </ul>
  );
}
