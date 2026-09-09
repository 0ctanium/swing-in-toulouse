import { describe, expect, it } from "vitest";

import { ContactErrorLink, contactPageHref } from "@/components/contact/contact-error-link";
import { renderWithProviders, screen } from "../../../tests/helpers/render";

describe("contactPageHref", () => {
  it("returns the bare contact path without a page", () => {
    expect(contactPageHref()).toBe("/contact");
  });

  it("encodes a site path", () => {
    expect(contactPageHref("/evenement/bal du vendredi")).toBe(
      "/contact?page=%2Fevenement%2Fbal%20du%20vendredi",
    );
  });

  it("ignores non-path values", () => {
    expect(contactPageHref("https://evil.example")).toBe("/contact");
  });
});

describe("ContactErrorLink", () => {
  it("links to the contact page", () => {
    renderWithProviders(<ContactErrorLink page="/evenement/bal" />);

    const link = screen.getByRole("link", { name: /contactez-moi/i });
    expect(link).toHaveAttribute(
      "href",
      "/contact?page=%2Fevenement%2Fbal",
    );
  });
});
