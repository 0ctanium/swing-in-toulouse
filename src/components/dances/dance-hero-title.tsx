import {
  resolveDanceHeroTitle,
  type DanceHeroTitleFields,
} from "@/lib/event-category-tags/hero-title";
import { cn } from "@/lib/utils";

type DanceHeroTitleProps = Partial<DanceHeroTitleFields> & {
  name: string;
  className?: string;
  as?: "h1" | "h2" | "p";
};

export function DanceHeroTitle({
  name,
  heroTitleBefore,
  heroTitleEmphasis,
  heroTitleAfter,
  className,
  as: Tag = "h1",
}: DanceHeroTitleProps) {
  const { before, emphasis, after } = resolveDanceHeroTitle(name, {
    heroTitleBefore: heroTitleBefore ?? null,
    heroTitleEmphasis: heroTitleEmphasis ?? null,
    heroTitleAfter: heroTitleAfter ?? null,
  });

  return (
    <Tag
      className={cn(
        "font-heading max-w-3xl font-semibold tracking-tight",
        Tag === "h1" && "text-3xl leading-[1.12] md:text-4xl md:leading-[1.1]",
        Tag === "h2" && "text-lg leading-tight",
        Tag === "p" && "text-2xl leading-[1.12]",
        className,
      )}
    >
      <span className="block">
        {before}{" "}
        <span className="text-primary">{emphasis}</span>
      </span>
      {after ? <span className="mt-1 block">{after}</span> : null}
    </Tag>
  );
}
