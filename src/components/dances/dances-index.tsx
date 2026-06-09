import { DanceCard } from "@/components/dances/dance-card";
import type { PublishedDanceTag } from "@/lib/event-category-tags/dance-pages";

type DancesIndexProps = {
  dances: PublishedDanceTag[];
};

export function DancesIndex({ dances }: DancesIndexProps) {
  if (dances.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune page danse publiée pour le moment.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {dances.map((tag) => (
        <DanceCard key={tag.slug} tag={tag} />
      ))}
    </div>
  );
}
