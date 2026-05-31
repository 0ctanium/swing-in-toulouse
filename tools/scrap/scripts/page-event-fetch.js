/**
 * Runs in the page (MAIN) world — fetches event HTML with the user's session.
 */
(function initPageEventFetch() {
  if (window.__scrapEventFetchReady) {
    return;
  }

  window.__scrapEventFetchReady = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data;
    if (data?.source !== "swing-scrap" || data?.type !== "FETCH_EVENT_PAGE") {
      return;
    }

    const { requestId, url } = data;
    if (!requestId || !url) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(url, {
          credentials: "include",
          redirect: "follow",
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "max-age=0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
          },
        });

        const text = await response.text();

        window.postMessage(
          {
            source: "swing-scrap",
            type: "FETCH_EVENT_PAGE_RESULT",
            requestId,
            ok: true,
            status: response.status,
            text,
            finalUrl: response.url,
          },
          window.location.origin,
        );
      } catch (error) {
        window.postMessage(
          {
            source: "swing-scrap",
            type: "FETCH_EVENT_PAGE_RESULT",
            requestId,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          window.location.origin,
        );
      }
    })();
  });
})();
