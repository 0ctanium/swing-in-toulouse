/**
 * Runs in the page (MAIN) world to intercept Facebook GraphQL responses.
 * Communicates with the content script via window.postMessage.
 */
(function initPageSniffer() {
  if (window.__scrapFetchPatched) {
    return;
  }

  window.__scrapFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;

    if (url?.includes("/api/graphql")) {
      void response
        .clone()
        .json()
        .then((payload) => {
          window.postMessage(
            {
              source: "swing-scrap",
              type: "SCRAP_GRAPHQL",
              payload,
            },
            window.location.origin,
          );
        })
        .catch(() => {
          // Ignore non-JSON GraphQL responses.
        });
    }

    return response;
  };
})();
