import { describe, expect, it } from "vitest";

import {
  findNamedEntityMatchesInText,
  matchProperNameInText,
  suggestNamedEntitiesFromText,
} from "@/lib/proper-names/match-in-text";

describe("matchProperNameInText", () => {
  it("matches a full venue name with accents and articles", () => {
    expect(
      matchProperNameInText(
        "Soirée Lindy au Le Grand Bal ce samedi",
        "Le Grand Bal",
      ),
    ).toBe("exact");
  });

  it("matches without the leading article in the text", () => {
    expect(
      matchProperNameInText(
        "Cours au Grand Bal pour débutants",
        "Le Grand Bal",
      ),
    ).toBe("exact");
  });

  it("does not pluralize proper names like category tags", () => {
    expect(
      matchProperNameInText("Les Candelas Swing", "Candela Swing"),
    ).toBeNull();
  });

  it("rejects very short partial matches", () => {
    expect(matchProperNameInText("Concert au Bal", "Le Grand Bal")).toBeNull();
  });
});

describe("findNamedEntityMatchesInText", () => {
  const candidates = [
    {
      id: "venue-a",
      names: ["Le Grand Bal", "Grand Bal Toulouse"],
    },
    {
      id: "org-a",
      names: ["Candela Swing"],
    },
  ] as const;

  it("returns exact matches before partial ones and prefers longer names", () => {
    expect(
      findNamedEntityMatchesInText(
        "Candela Swing organise une soirée au Grand Bal",
        candidates,
      ),
    ).toEqual([
      { id: "org-a", kind: "exact", matchedNameLength: 13 },
      { id: "venue-a", kind: "exact", matchedNameLength: 12 },
    ]);
  });
});

describe("suggestNamedEntitiesFromText", () => {
  it("excludes the currently selected entity", () => {
    const labelsById = new Map([
      ["venue-a", "Le Grand Bal"],
      ["org-a", "Candela Swing"],
    ]);

    expect(
      suggestNamedEntitiesFromText({
        title: "Soirée au Grand Bal",
        description: "Par Candela Swing",
        candidates: [
          { id: "venue-a", names: ["Le Grand Bal"] },
          { id: "org-a", names: ["Candela Swing"] },
        ],
        labelsById,
        selectedId: "venue-a",
      }),
    ).toEqual([
      { id: "org-a", label: "Candela Swing", kind: "exact" },
    ]);
  });
});
