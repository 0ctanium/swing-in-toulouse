import { describe, expect, it } from "vitest";

import {
  categoryTagPublicPath,
  isPublishableTagType,
} from "@/lib/event-category-tags/publishable";

describe("publishable category tags", () => {
  it("identifies publishable tag types", () => {
    expect(isPublishableTagType("danse")).toBe(true);
    expect(isPublishableTagType("evenement")).toBe(true);
    expect(isPublishableTagType("autre")).toBe(false);
  });

  it("builds public paths for publishable tags", () => {
    expect(categoryTagPublicPath("danse", "lindy-hop")).toBe("/danse/lindy-hop");
    expect(categoryTagPublicPath("evenement", "festivals")).toBe(
      "/evenements/festivals",
    );
    expect(categoryTagPublicPath("autre", "misc")).toBeNull();
  });
});
