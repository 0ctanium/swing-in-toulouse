import type { HeroArtVariant } from "./hero-art/types";
import type { HeroVariant } from "./types";

export function buildHeroPreviewHref({
  hero = "a",
  art = "vinyl",
  preview = false,
}: {
  hero?: HeroVariant;
  art?: HeroArtVariant;
  preview?: boolean;
}) {
  const params = new URLSearchParams();

  if (preview) {
    params.set("hero-preview", "1");
    params.set("hero", hero);
    if (hero === "a") {
      params.set("art", art);
    }
  } else {
    if (hero !== "a") {
      params.set("hero", hero);
    }

    if (hero === "a" && art !== "vinyl") {
      params.set("art", art);
    }
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
