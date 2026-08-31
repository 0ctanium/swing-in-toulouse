"use client";

import { useEffect } from "react";

import {
  openEmbedLinkInNewTab,
  shouldOpenEmbedLinkInNewTab,
} from "@/lib/embed/links";

function isEmbeddedFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function EmbedLinkBehavior() {
  useEffect(() => {
    if (!isEmbeddedFrame()) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (!shouldOpenEmbedLinkInNewTab(anchor)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openEmbedLinkInNewTab(anchor.href);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
