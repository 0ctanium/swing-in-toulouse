import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENT_CATEGORY_TAG_TYPE,
  eventCategoryTagTypeLabels,
  eventCategoryTagTypeOptions,
  formatEventCategoryTagType,
} from "@/lib/event-category-tags/tag-types";

describe("formatEventCategoryTagType", () => {
  it("returns the default label for missing values", () => {
    expect(formatEventCategoryTagType(null)).toBe(
      eventCategoryTagTypeLabels[DEFAULT_EVENT_CATEGORY_TAG_TYPE],
    );
  });

  it("returns the label for known tag types", () => {
    expect(formatEventCategoryTagType("danse")).toBe("Danse");
    expect(formatEventCategoryTagType("evenement")).toBe("Événement");
  });
});

describe("eventCategoryTagTypeOptions", () => {
  it("returns value/label pairs for every tag type", () => {
    const options = eventCategoryTagTypeOptions();

    expect(options).toEqual(
      expect.arrayContaining([
        { value: "danse", label: "Danse" },
        { value: "evenement", label: "Événement" },
        { value: "autre", label: "Autre" },
      ]),
    );
  });
});
