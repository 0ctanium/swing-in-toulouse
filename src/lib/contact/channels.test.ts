import { describe, expect, it } from "vitest";

import {
  defaultPublicContactConfig,
  instagramHandleFromUrl,
  listPublicContactChannels,
} from "@/lib/contact/channels";

describe("listPublicContactChannels", () => {
  it("always includes email", () => {
    const channels = listPublicContactChannels({
      email: "mail@benjaminlepas.fr",
    });

    expect(channels).toEqual([
      {
        id: "email",
        label: "Email",
        href: "mailto:mail@benjaminlepas.fr",
        display: "mail@benjaminlepas.fr",
      },
    ]);
  });

  it("includes Instagram and Facebook by default, never a phone number", () => {
    const channels = listPublicContactChannels();
    const serialized = JSON.stringify(channels);

    expect(channels.map((channel) => channel.id)).toEqual([
      "email",
      "instagram",
      "facebook",
    ]);
    expect(channels[1]?.display).toBe("@benjamin.lepas");
    expect(channels[2]?.href).toBe(
      defaultPublicContactConfig.facebook,
    );
    expect(serialized).not.toMatch(/06\s?48\s?43\s?60\s?20/);
    expect(serialized).not.toContain("33648436020");
    expect(serialized).not.toContain("wa.me");
  });
});

describe("instagramHandleFromUrl", () => {
  it("extracts the handle", () => {
    expect(instagramHandleFromUrl("https://instagram.com/benjamin.lepas")).toBe(
      "@benjamin.lepas",
    );
  });
});
