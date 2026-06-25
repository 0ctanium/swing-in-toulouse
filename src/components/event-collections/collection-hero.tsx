import { DanceHeroTitle } from "@/components/dances/dance-hero-title";
import { resolveCollectionHeroTitle } from "@/lib/event-collections/metadata";
import type { EventCollection } from "@/lib/event-collections/types";

type CollectionHeroProps = {
  collection: Pick<
    EventCollection,
    | "label"
    | "subtitle"
    | "description"
    | "heroTitleBefore"
    | "heroTitleEmphasis"
    | "heroTitleAfter"
    | "kind"
    | "tagType"
  >;
};

export function CollectionHero({ collection }: CollectionHeroProps) {
  const hero = resolveCollectionHeroTitle(collection);

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <DanceHeroTitle
        name={collection.label}
        resolved={hero}
      />
      {collection.subtitle ? (
        <p className="text-muted-foreground text-base leading-snug">
          {collection.subtitle}
        </p>
      ) : null}
      {collection.description ? (
        <p className="text-muted-foreground text-base leading-relaxed">
          {collection.description}
        </p>
      ) : null}
    </section>
  );
}
