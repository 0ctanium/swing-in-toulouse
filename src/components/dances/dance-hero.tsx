import { DanceHeroTitle } from "@/components/dances/dance-hero-title";
import type { PublishedDanceTag } from "@/lib/event-category-tags/dance-pages";

type DanceHeroProps = {
  tag: Pick<
    PublishedDanceTag,
    | "name"
    | "subtitle"
    | "description"
    | "heroTitleBefore"
    | "heroTitleEmphasis"
    | "heroTitleAfter"
  >;
};

export function DanceHero({ tag }: DanceHeroProps) {
  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <DanceHeroTitle
        name={tag.name}
        heroTitleBefore={tag.heroTitleBefore}
        heroTitleEmphasis={tag.heroTitleEmphasis}
        heroTitleAfter={tag.heroTitleAfter}
      />
      {tag.subtitle ? (
        <p className="text-muted-foreground text-base leading-snug">
          {tag.subtitle}
        </p>
      ) : null}
      {tag.description ? (
        <p className="text-muted-foreground text-base leading-relaxed">
          {tag.description}
        </p>
      ) : null}
    </section>
  );
}
