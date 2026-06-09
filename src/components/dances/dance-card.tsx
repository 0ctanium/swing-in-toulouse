import Link from "next/link";

import type { PublishedDanceTag } from "@/lib/event-category-tags/dance-pages";

type DanceCardProps = {
  tag: Pick<
    PublishedDanceTag,
    "name" | "slug" | "subtitle" | "description"
  >;
};

export function DanceCard({ tag }: DanceCardProps) {
  return (
    <article className="bg-card text-card-foreground group flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-xl font-semibold leading-tight">
          <Link
            href={`/danse/${tag.slug}`}
            className="hover:text-primary transition-colors"
          >
            {tag.name}
          </Link>
        </h2>
        {tag.subtitle ? (
          <p className="text-muted-foreground text-sm leading-snug">
            {tag.subtitle}
          </p>
        ) : null}
      </div>

      {tag.description ? (
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {tag.description}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Prochains événements {tag.name} à Toulouse.
        </p>
      )}

      <Link
        href={`/danse/${tag.slug}`}
        className="text-primary mt-auto text-sm font-medium underline-offset-4 group-hover:underline"
      >
        Voir les événements
      </Link>
    </article>
  );
}
