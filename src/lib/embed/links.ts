export function shouldOpenEmbedLinkInNewTab(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank") {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return false;
  }

  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  return true;
}

export function openEmbedLinkInNewTab(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}
