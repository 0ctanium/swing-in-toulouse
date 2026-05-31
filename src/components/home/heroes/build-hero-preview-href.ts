import type { HeroArtVariant } from "./hero-art/types";
import type { HeroVariant } from "./types";

export function buildHeroPreviewHref({
  hero = "a",
  art = "vinyl",
}: {
  hero?: HeroVariant;
  art?: HeroArtVariant;
}) {
  const params = new URLSearchParams();

  if (hero !== "a") {
    params.set("hero", hero);
  }

  if (hero === "a" && art !== "vinyl") {
    params.set("art", art);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
