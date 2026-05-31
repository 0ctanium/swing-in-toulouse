import { homeHero } from "@/lib/content/swing-dances";

import { HeroActions, type HeroExperimentTracking } from "./hero-shared";

const previewEvents = [
  {
    day: "Ven.",
    date: "6 juin",
    title: "Soirée Lindy Hop",
    venue: "Salle des fêtes",
  },
  { day: "Sam.", date: "7 juin", title: "Bal Blues", venue: "Le Bijou" },
  {
    day: "Dim.",
    date: "8 juin",
    title: "Pratique Balboa",
    venue: "Studio Hop",
  },
] as const;

function AgendaPreviewStack() {
  return (
    <div
      className="relative mx-auto w-full max-w-xs md:mx-0 md:max-w-none"
      aria-hidden
    >
      {previewEvents.map((event, index) => (
        <article
          key={event.title}
          className="bg-card text-card-foreground rounded-xl border px-4 py-3 shadow-sm"
          style={{
            transform: `rotate(${index === 0 ? -2 : index === 1 ? 1.5 : -0.5}deg) translateY(${index * -12}px)`,
            marginTop: index === 0 ? 0 : "-0.5rem",
            zIndex: previewEvents.length - index,
            position: "relative",
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-primary text-xs font-semibold uppercase tracking-wide">
              {event.day} {event.date}
            </p>
            <span className="bg-accent/60 size-2 shrink-0 rounded-full" />
          </div>
          <p className="font-heading mt-1 text-base font-semibold">
            {event.title}
          </p>
          <p className="text-muted-foreground text-xs">{event.venue}</p>
        </article>
      ))}
      <p className="text-muted-foreground mt-4 text-center text-[0.65rem] italic md:text-left">
        Aperçu fictif — l&apos;agenda réel est juste en dessous
      </p>
    </div>
  );
}

export function HeroVariantC({
  heroLayoutVariant,
  flagVariant,
}: HeroExperimentTracking) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-12"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-primary text-sm font-medium">{homeHero.kicker}</p>
          <h1
            id="home-hero-heading"
            className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl"
          >
            {homeHero.title[0]}
            <span className="text-primary block">{homeHero.title[1]}</span>
          </h1>
        </div>

        <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
          {homeHero.lead}
        </p>

        <p className="text-foreground/85 max-w-md text-sm leading-relaxed">
          {homeHero.followUp}
        </p>

        <HeroActions
          heroLayoutVariant={heroLayoutVariant}
          flagVariant={flagVariant}
        />
      </div>

      <AgendaPreviewStack />
    </section>
  );
}
