import { describe, expect, it } from "vitest";

import {
  formatPhoneForDisplay,
  normalizePhoneNumber,
  whatsappMeUrl,
} from "@/lib/contact/phone";

describe("normalizePhoneNumber", () => {
  it("keeps E.164 numbers", () => {
    expect(normalizePhoneNumber("+33612345678")).toBe("+33612345678");
  });

  it("converts a French 0x number", () => {
    expect(normalizePhoneNumber("06 12 34 56 78")).toBe("+33612345678");
  });

  it("accepts 00 international prefix", () => {
    expect(normalizePhoneNumber("0033612345678")).toBe("+33612345678");
  });

  it("returns null for empty or invalid values", () => {
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber("abc")).toBeNull();
    expect(normalizePhoneNumber("123")).toBeNull();
  });
});

describe("formatPhoneForDisplay", () => {
  it("formats French mobiles with spaces", () => {
    expect(formatPhoneForDisplay("+33612345678")).toBe("06 12 34 56 78");
  });

  it("leaves other E.164 numbers unchanged", () => {
    expect(formatPhoneForDisplay("+14155552671")).toBe("+14155552671");
  });
});

describe("whatsappMeUrl", () => {
  it("builds a wa.me link without plus sign", () => {
    expect(whatsappMeUrl("+33612345678")).toBe("https://wa.me/33612345678");
  });

  it("adds a prefilled text query", () => {
    expect(whatsappMeUrl("+33612345678", "Bonjour")).toBe(
      "https://wa.me/33612345678?text=Bonjour",
    );
  });
});
