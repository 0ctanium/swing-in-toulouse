import Link from "next/link";

import { listPublishedDanceTags } from "@/lib/event-category-tags/dance-pages";

type HeroDanceChipsProps = {
  variant?: "pill" | "inline";
};

export async function HeroDanceChips({ variant = "pill" }: HeroDanceChipsProps) {
  const dances = await listPublishedDanceTags();

  if (dances.length === 0) {
    return (
      <Link
        href="/danse"
        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
      >
        Les danses swing à Toulouse
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <p className="text-muted-foreground text-sm">
        {dances.map((dance, index) => (
          <span key={dance.slug}>
            {index > 0 ? (
              <span className="text-border mx-2" aria-hidden>
                ·
              </span>
            ) : null}
            <Link
              href={`/danse/${dance.slug}`}
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              {dance.name}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Styles de danse">
      {dances.map((dance) => (
        <li key={dance.slug}>
          <Link
            href={`/danse/${dance.slug}`}
            className="bg-background/80 text-foreground hover:border-primary/30 hover:bg-background inline-flex rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          >
            {dance.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
