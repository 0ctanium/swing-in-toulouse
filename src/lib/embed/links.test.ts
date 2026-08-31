/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import { shouldOpenEmbedLinkInNewTab } from "@/lib/embed/links";

function anchor(href: string, extras: Partial<HTMLAnchorElement> = {}) {
  const element = document.createElement("a");
  element.href = href;
  element.setAttribute("href", href);

  if (extras.target) {
    element.target = extras.target;
  }

  if (extras.download !== undefined) {
    element.download = extras.download;
  }

  return element;
}

describe("shouldOpenEmbedLinkInNewTab", () => {
  it("opens internal navigation links in a new tab", () => {
    expect(shouldOpenEmbedLinkInNewTab(anchor("/evenement/soiree"))).toBe(true);
  });

  it("ignores links that already target a new tab", () => {
    expect(
      shouldOpenEmbedLinkInNewTab(
        anchor("/evenement/soiree", { target: "_blank" }),
      ),
    ).toBe(false);
  });

  it("ignores hash, mailto and tel links", () => {
    expect(shouldOpenEmbedLinkInNewTab(anchor("#details"))).toBe(false);
    expect(shouldOpenEmbedLinkInNewTab(anchor("mailto:contact@example.com"))).toBe(
      false,
    );
    expect(shouldOpenEmbedLinkInNewTab(anchor("tel:+33123456789"))).toBe(false);
  });
});
