importScripts(
  "../lib/log.js",
  "../lib/dates.js",
  "../lib/ics.js",
  "../lib/event-detail.js",
  "../lib/event-store.js",
);

/** @type {boolean} */
let detailFetchAborted = false;

/**
 * MV3 service workers don't expose URL.createObjectURL — use a base64 data URL.
 * encodeURIComponent throws URIError on lone UTF-16 surrogates (common in FB copy).
 * @param {string} ics
 */
function icsToDownloadUrl(ics) {
  const bytes = new TextEncoder().encode(ics);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:text/calendar;charset=utf-8;base64,${btoa(binary)}`;
}

/**
 * @param {ScrapFbEvent[]} events
 * @param {string} groupId
 * @param {string} groupName
 * @param {boolean} saveAs
 */
function downloadIcs(events, groupId, groupName, saveAs) {
  const ics = ScrapExt.buildCalendar(events, {
    name: groupName,
    description: `Exported from Facebook group ${groupId}`,
    groupId,
  });

  const downloadUrl = icsToDownloadUrl(ics);
  const safeGroupId = String(groupId).replace(/[^\dA-Za-z_-]+/g, "-");
  const filename = `facebook-group-${safeGroupId}-events.ics`;

  return new Promise((resolve) => {
    chrome.downloads.download(
      {
        url: downloadUrl,
        filename,
        saveAs,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({ ok: true, downloadId, filename, bytes: ics.length });
      },
    );
  });
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {number} tabId
 */
async function ensureContentScriptReady(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "PING" });
    if (response?.ok) {
      return;
    }
  } catch {
    // Inject content scripts on the active tab if they are missing.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [
      "lib/log.js",
      "lib/dates.js",
      "lib/json.js",
      "lib/html-parser.js",
      "lib/event-detail.js",
      "lib/scrape.js",
      "scripts/content.js",
    ],
  });

  const response = await chrome.tabs.sendMessage(tabId, { action: "PING" });
  if (!response?.ok) {
    throw new Error(
      "Content script not ready. Refresh the Facebook group events page and try again.",
    );
  }
}

/**
 * @param {number} tabId
 * @param {string} groupId
 */
async function fetchMissingEventDetails(tabId, groupId) {
  detailFetchAborted = false;

  /** @type {{ fetched: number; failed: number; skipped: number; failures: Array<{ id: string; name: string; error: string }> }} */
  const stats = {
    fetched: 0,
    failed: 0,
    skipped: 0,
    failures: [],
  };

  await ensureContentScriptReady(tabId);

  const exportEvents = await ScrapExt.loadExportEvents(groupId);
  const pending = ScrapExt.filterEventsForDetailRefresh(exportEvents);
  const total = pending.length;

  ScrapExt.log.info("Detail refresh queue", { total });

  for (let index = 0; index < pending.length; index++) {
    if (detailFetchAborted) {
      stats.skipped = pending.length - index;
      break;
    }

    const event = pending[index];

    chrome.runtime
      .sendMessage({
        type: "DETAILS_PROGRESS",
        phase: "fetching",
        current: index + 1,
        total,
        eventId: event.id,
        eventName: event.name,
      })
      .catch(() => {
        // Popup may be closed.
      });

    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: "FETCH_EVENT_DETAIL",
        eventId: event.id,
        eventUrl: event.url,
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? "Detail fetch failed");
      }

      await ScrapExt.applyEventDetails(groupId, event.id, response.details);
      stats.fetched++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      stats.failed++;
      stats.failures.push({
        id: event.id,
        name: event.name,
        error: errorMessage,
      });
      ScrapExt.log.warn("Event detail fetch failed", {
        eventId: event.id,
        eventUrl: event.url,
        error: errorMessage,
      });
    }

    if (index + 1 < pending.length && !detailFetchAborted) {
      await delay(ScrapExt.FETCH_DELAY_MS);
    }
  }

  return stats;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "STOP_SYNC") {
    detailFetchAborted = true;
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === "GET_STORE_STATS") {
    void (async () => {
      try {
        const groupId = message.groupId;

        if (!groupId) {
          sendResponse({ ok: false, error: "Missing group id" });
          return;
        }

        const stats = await ScrapExt.getStoreStats(groupId);
        sendResponse({ ok: true, stats });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to read store",
        });
      }
    })();

    return true;
  }

  if (message.action === "SYNC_AND_EXPORT") {
    void (async () => {
      try {
        const scrapedEvents = message.scrapedEvents ?? [];
        const groupId = message.groupId ?? "group";
        const groupName = message.groupName ?? "Facebook group events";
        const mode = message.mode === "past" ? "past" : "upcoming";
        const pastMaxDate =
          mode === "past" ? (message.pastMaxDate ?? null) : null;
        const tabId = message.tabId;

        if (mode === "past" && !pastMaxDate) {
          sendResponse({
            ok: false,
            error: "Past events require a max date.",
          });
          return;
        }

        if (!tabId) {
          sendResponse({
            ok: false,
            error: "Missing tab id for detail fetch.",
          });
          return;
        }

        ScrapExt.log.info("SYNC_AND_EXPORT received", {
          scraped: scrapedEvents.length,
          groupId,
          mode,
          pastMaxDate,
          tabId,
        });

        const { stats, events: mergedEvents } = await ScrapExt.mergeScrapedEvents(
          groupId,
          groupName,
          mode,
          scrapedEvents,
          pastMaxDate,
        );

        ScrapExt.log.info("Store merged", stats);

        const pendingBefore = ScrapExt.filterEventsForDetailRefresh(mergedEvents);
        ScrapExt.log.info("Events needing details", {
          scraped: scrapedEvents.length,
          exportTotal: mergedEvents.length,
          toRefresh: pendingBefore.length,
        });

        const detailStats = await fetchMissingEventDetails(tabId, groupId);

        const exportEvents = await ScrapExt.loadExportEvents(groupId);
        const stillMissing = ScrapExt.filterEventsMissingDetails(exportEvents);

        ScrapExt.log.info("Detail fetch finished", {
          ...detailStats,
          stillMissing: stillMissing.length,
        });

        if (stillMissing.length > 0 && !detailFetchAborted) {
          sendResponse({
            ok: false,
            error: `Could not fetch details for ${stillMissing.length} event(s).`,
            failures: detailStats.failures,
            stats: {
              ...stats,
              details: detailStats,
              pendingDetails: stillMissing.length,
            },
          });
          return;
        }

        if (detailFetchAborted) {
          ScrapExt.log.info("Detail fetch stopped early", {
            stillMissing: stillMissing.length,
          });
        }

        const downloadResult = await downloadIcs(
          exportEvents,
          groupId,
          groupName,
          message.saveAs ?? true,
        );

        if (!downloadResult.ok) {
          sendResponse(downloadResult);
          return;
        }

        ScrapExt.log.info("Export complete", {
          ...stats,
          details: detailStats,
          downloadId: downloadResult.downloadId,
        });

        sendResponse({
          ok: true,
          stats: {
            ...stats,
            details: detailStats,
            exportTotal: exportEvents.length,
            stoppedEarly: detailFetchAborted,
          },
          downloadId: downloadResult.downloadId,
        });
      } catch (error) {
        ScrapExt.log.error("SYNC_AND_EXPORT failed", error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Sync failed",
        });
      }
    })();

    return true;
  }

  if (message.action === "DOWNLOAD_ICS") {
    void (async () => {
      ScrapExt.log.info("DOWNLOAD_ICS received", {
        eventCount: message.events?.length ?? 0,
        groupId: message.groupId,
      });

      try {
        const result = await downloadIcs(
          message.events ?? [],
          message.groupId ?? "group",
          message.groupName ?? "Facebook group events",
          message.saveAs ?? true,
        );
        sendResponse(result);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Download failed",
        });
      }
    })();

    return true;
  }

  return undefined;
});
