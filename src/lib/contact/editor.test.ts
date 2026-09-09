import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getEditorDirectContact, hasEditorPhone } from "@/lib/contact/editor";

describe("getEditorDirectContact", () => {
  it("returns a formatted number that is not in public channel HTML helpers", () => {
    expect(hasEditorPhone()).toBe(true);

    const contact = getEditorDirectContact();
    expect(contact).toEqual({
      phoneDisplay: "06 48 43 60 20",
      phoneHref: "tel:+33648436020",
      whatsappHref: expect.stringContaining("https://wa.me/33648436020"),
    });
  });
});
