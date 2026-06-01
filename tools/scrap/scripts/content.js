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

  const source = message.source === "feed" ? "feed" : "events-list";

  ScrapExt.log.info("SCRAPE_EVENTS received", {
    source,
    mode: message.mode,
    pastMaxDate: message.pastMaxDate,
    url: window.location.href,
  });

  void (async () => {
    try {
      const mode = message.mode === "past" ? "past" : "upcoming";
      const maxDate = message.pastMaxDate ?? null;

      if (source === "events-list" && mode === "past" && !maxDate) {
        sendResponse({
          ok: false,
          error: "Past events require a max date.",
        });
        return;
      }

      const onProgress = (progress) => {
        ScrapExt.log.info("Scrape progress", progress);
        chrome.runtime
          .sendMessage({
            type: "SCRAPE_PROGRESS",
            source,
            ...progress,
          })
          .catch(() => {
            // Popup may be closed; ignore.
          });
      };

      const scrapeResult =
        source === "feed"
          ? await ScrapExt.scrapeGroupFeed(onProgress, { maxDate })
          : await ScrapExt.scrapeGroupEvents(mode, onProgress, {
              pastMaxDate: maxDate,
            });

      const events = scrapeResult.events;
      const context = ScrapExt.getGroupContext();

      ScrapExt.log.info("Scrape complete", {
        source,
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
        source,
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
