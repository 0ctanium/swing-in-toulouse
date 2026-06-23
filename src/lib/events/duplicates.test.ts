import { describe, expect, it } from "vitest";

import { DuplicateLinkError } from "@/lib/events/duplicates";

describe("DuplicateLinkError", () => {
  it("is a named error with the provided message", () => {
    const error = new DuplicateLinkError("Impossible de lier ces événements.");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DuplicateLinkError");
    expect(error.message).toBe("Impossible de lier ces événements.");
  });
});
