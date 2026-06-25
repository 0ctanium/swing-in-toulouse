import { describe, expect, it } from "vitest";

import { formatLlmsTxtContent } from "@/lib/seo/llms-txt";

describe("formatLlmsTxtContent", () => {
  it("follows the llms.txt structure with absolute links", () => {
    const content = formatLlmsTxtContent([
      {
        name: "Lindy Hop",
        slug: "lindy-hop",
        subtitle: null,
        description: "Soirées et cours de Lindy Hop.",
        seoTitle: null,
        seoDescription: null,
        heroTitleBefore: null,
        heroTitleEmphasis: null,
        heroTitleAfter: null,
      },
    ]);

    expect(content.startsWith("# Swingin Toulouse\n\n> ")).toBe(true);
    expect(content).toContain("## Pages principales");
    expect(content).toContain("## Danses à Toulouse");
    expect(content).toContain(
      "- [Lindy Hop](http://localhost:3000/danse/lindy-hop): Soirées et cours de Lindy Hop.",
    );
    expect(content).toContain("## Données machine-lisibles");
    expect(content).toContain("/api/events");
    expect(content).not.toContain("](/");
    expect(content).toContain("Langue : fr-FR");
  });
});
