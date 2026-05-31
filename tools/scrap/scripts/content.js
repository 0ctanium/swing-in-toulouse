chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "PING") {
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === "STOP_SCRAPE") {
    ScrapExt.requestScrapeStop?.();
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === "FETCH_EVENT_DETAIL") {
    void (async () => {
      try {
        const eventId = message.eventId;
        if (!eventId) {
          sendResponse({ ok: false, error: "Missing event id" });
          return;
        }

        ScrapExt.log.info("FETCH_EVENT_DETAIL", {
          eventId,
          eventUrl: message.eventUrl,
        });
        const details = await ScrapExt.fetchEventDetailPatch(
          String(eventId),
          message.eventUrl,
        );
        sendResponse({ ok: true, details });
      } catch (error) {
        ScrapExt.log.error("FETCH_EVENT_DETAIL failed", error);
        sendResponse({
          ok: false,
          error:
            error instanceof Error ? error.message : "Detail fetch failed",
        });
      }
    })();

    return true;
  }

  if (message.action !== "SCRAPE_EVENTS") {
    return undefined;
  }

  ScrapExt.installFetchSniffer?.();

  ScrapExt.log.info("SCRAPE_EVENTS received", {
    mode: message.mode,
    pastMaxDate: message.pastMaxDate,
    url: window.location.href,
  });

  void (async () => {
    try {
      const mode = message.mode === "past" ? "past" : "upcoming";
      const pastMaxDate =
        mode === "past" ? (message.pastMaxDate ?? null) : null;

      if (mode === "past" && !pastMaxDate) {
        sendResponse({
          ok: false,
          error: "Past events require a max date.",
        });
        return;
      }

      const scrapeResult = await ScrapExt.scrapeGroupEvents(
        mode,
        (progress) => {
          ScrapExt.log.info("Scrape progress", progress);
          chrome.runtime
            .sendMessage({
              type: "SCRAPE_PROGRESS",
              ...progress,
            })
            .catch(() => {
              // Popup may be closed; ignore.
            });
        },
        { pastMaxDate },
      );

      const events = scrapeResult.events;
      const context = ScrapExt.getGroupContext();

      ScrapExt.log.info("Scrape complete", {
        eventCount: events.length,
        groupId: context.groupId,
        stopReason: scrapeResult.stopReason,
        sample: events.slice(0, 3).map((event) => ({
          id: event.id,
          name: event.name,
        })),
      });

      sendResponse({
        ok: true,
        events,
        context,
        stopReason: scrapeResult.stopReason,
      });
    } catch (error) {
      ScrapExt.log.error("Scrape failed", error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Scrape failed",
      });
    }
  })();

  return true;
});
