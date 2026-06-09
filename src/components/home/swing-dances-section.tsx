import Link from "next/link";

import { DanceCard } from "@/components/dances/dance-card";
import { listPublishedDanceTags } from "@/lib/event-category-tags/dance-pages";

export async function SwingDancesSection() {
  const dances = await listPublishedDanceTags();

  if (dances.length === 0) {
    return null;
  }

  return (
    <section
      id="danses"
      aria-labelledby="dances-heading"
      className="flex scroll-mt-6 flex-col gap-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="dances-heading"
          className="font-heading text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Les danses swing à Toulouse
        </h2>
        <div
          className="bg-primary/30 mx-auto mt-4 h-px w-16"
          role="presentation"
          aria-hidden
        />
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
          Explorez chaque style et ses prochains événements, ou consultez{" "}
          <Link href="/danse" className="text-foreground underline">
            toutes les pages danse
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dances.map((dance) => (
          <DanceCard key={dance.slug} tag={dance} />
        ))}
      </div>
    </section>
  );
}
