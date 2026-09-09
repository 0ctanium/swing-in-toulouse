import { describe, expect, it } from "vitest";

import {
  isHoneypotFilled,
  parseContactFormData,
} from "@/lib/contact/schema";

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

const valid = {
  name: "Alice",
  email: "alice@example.com",
  phone: "06 12 34 56 78",
  topic: "erreur",
  message: "Il manque un événement vendredi au Bikini.",
};

describe("parseContactFormData", () => {
  it("parses a valid payload", () => {
    const result = parseContactFormData(formData(valid));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Alice",
        email: "alice@example.com",
        phone: "+33612345678",
        topic: "erreur",
        message: "Il manque un événement vendredi au Bikini.",
      });
    }
  });

  it("keeps optional organization and page", () => {
    const result = parseContactFormData(
      formData({
        ...valid,
        organization: "Swing Club",
        page: "/evenement/bal-du-vendredi",
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organization).toBe("Swing Club");
      expect(result.data.page).toBe("/evenement/bal-du-vendredi");
    }
  });

  it("rejects a page that is not a site path", () => {
    const result = parseContactFormData(
      formData({ ...valid, page: "https://evil.example" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a short message", () => {
    const result = parseContactFormData(formData({ ...valid, message: "Hi" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = parseContactFormData(
      formData({ ...valid, email: "not-an-email" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = parseContactFormData(
      formData({ ...valid, phone: "123" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("isHoneypotFilled", () => {
  it("is empty for humans", () => {
    expect(isHoneypotFilled(formData(valid))).toBe(false);
  });

  it("detects bots that fill website", () => {
    expect(isHoneypotFilled(formData({ ...valid, website: "https://spam" }))).toBe(
      true,
    );
  });
});
