/**
 * Persist scraped Facebook events per group in chrome.storage.local.
 */
(function initEventStore(global) {
  /**
   * @param {string} groupId
   */
  function storageKey(groupId) {
    return `group:${groupId}`;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function fingerprint(event) {
    return JSON.stringify({
      name: event.name,
      url: event.url,
      dateText: event.dateText,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
      isCanceled: event.isCanceled,
      isPast: event.isPast,
    });
  }

  /**
   * @param {string} groupId
   */
  async function loadGroupStore(groupId) {
    const key = storageKey(groupId);
    const result = await chrome.storage.local.get(key);
    const store = result[key];

    if (!store || typeof store !== "object") {
      return {
        groupId,
        groupName: null,
        updatedAt: null,
        pastMaxDate: null,
        events: {},
      };
    }

    return {
      groupId,
      groupName: store.groupName ?? null,
      updatedAt: store.updatedAt ?? null,
      pastMaxDate: store.pastMaxDate ?? null,
      events: store.events ?? {},
    };
  }

  /**
   * @param {string} groupId
   * @param {Record<string, unknown>} store
   */
  async function saveGroupStore(groupId, store) {
    await chrome.storage.local.set({
      [storageKey(groupId)]: store,
    });
  }

  /**
   * @param {Record<string, ScrapFbEvent>} events
   */
  function getAllStoredEvents(events) {
    return Object.values(events);
  }

  /**
   * @param {ScrapFbEvent[]} events
   */
  function sortEventsForExport(events) {
    return [...events].sort((a, b) => {
      const aTime = a.startTimestamp ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.startTimestamp ?? Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }

  /**
   * @param {ScrapFbEvent[]} events
   */
  function buildStoreStats(events, scrapeStats) {
    const totalStored = events.length;
    const upcomingCount = global.ScrapExt.countUpcomingEvents(events);
    const seenThisRun =
      scrapeStats.new + scrapeStats.changed + scrapeStats.unchanged;

    return {
      new: scrapeStats.new,
      changed: scrapeStats.changed,
      unchanged: scrapeStats.unchanged,
      totalStored,
      exportTotal: totalStored,
      upcomingCount,
      notSeenThisRun: Math.max(0, totalStored - seenThisRun),
    };
  }

  /**
   * @param {string} groupId
   * @param {string | null | undefined} groupName
   * @param {"upcoming" | "past"} mode
   * @param {ScrapFbEvent[]} scrapedEvents
   * @param {string | null | undefined} pastMaxDate
   */
  async function mergeScrapedEvents(
    groupId,
    groupName,
    mode,
    scrapedEvents,
    pastMaxDate,
  ) {
    const store = await loadGroupStore(groupId);
    const now = new Date().toISOString();

    if (groupName) {
      store.groupName = groupName;
    }
    store.updatedAt = now;

    if (pastMaxDate) {
      store.pastMaxDate = pastMaxDate;
    }

    /** @type {{ new: number; changed: number; unchanged: number }} */
    const scrapeStats = {
      new: 0,
      changed: 0,
      unchanged: 0,
    };

    for (const event of scrapedEvents) {
      const existing = store.events[event.id];

      if (!existing) {
        store.events[event.id] = {
          ...event,
          firstSeenAt: now,
          lastSeenAt: now,
        };
        scrapeStats.new++;
        continue;
      }

      if (fingerprint(event) !== fingerprint(existing)) {
        store.events[event.id] = {
          ...existing,
          ...event,
          firstSeenAt: existing.firstSeenAt ?? now,
          lastSeenAt: now,
          lastChangedAt: now,
        };
        scrapeStats.changed++;
        continue;
      }

      store.events[event.id] = {
        ...existing,
        lastSeenAt: now,
      };
      scrapeStats.unchanged++;
    }

    await saveGroupStore(groupId, store);

    const exportEvents = sortEventsForExport(getAllStoredEvents(store.events));

    return {
      stats: {
        ...buildStoreStats(exportEvents, scrapeStats),
        scannedOnPage: scrapedEvents.length,
        pastMaxDate: store.pastMaxDate ?? null,
        scrapeMode: mode,
      },
      events: exportEvents,
    };
  }

  /**
   * @param {string} groupId
   */
  async function loadExportEvents(groupId) {
    const store = await loadGroupStore(groupId);
    return sortEventsForExport(getAllStoredEvents(store.events));
  }

  /**
   * Events to fetch or refresh this export run.
   * @param {ScrapFbEvent[]} events
   */
  function filterEventsForDetailRefresh(events) {
    return events.filter((event) =>
      global.ScrapExt.shouldRefreshDetails(event),
    );
  }

  /**
   * Events that block export because details were never stored.
   * @param {ScrapFbEvent[]} events
   */
  function filterEventsMissingDetails(events) {
    return events.filter((event) => global.ScrapExt.isMissingDetails(event));
  }

  /**
   * @param {ScrapFbEvent[]} events
   */
  function filterEventsNeedingDetails(events) {
    return filterEventsForDetailRefresh(events);
  }

  /**
   * @param {string} groupId
   * @param {string} eventId
   * @param {Partial<ScrapFbEvent>} details
   */
  async function applyEventDetails(groupId, eventId, details) {
    const store = await loadGroupStore(groupId);
    const existing = store.events[eventId];

    if (!existing) {
      store.events[eventId] = {
        id: eventId,
        name: details.name ?? "Untitled event",
        url:
          details.url ?? `https://www.facebook.com/events/${eventId}/`,
        dateText: details.dateText ?? null,
        startTimestamp: details.startTimestamp ?? null,
        endTimestamp: details.endTimestamp ?? null,
        isCanceled: details.isCanceled ?? false,
        isPast: details.isPast ?? false,
        ...details,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
    } else {
      store.events[eventId] = {
        ...existing,
        ...details,
        id: eventId,
        lastSeenAt: new Date().toISOString(),
      };
    }

    store.updatedAt = new Date().toISOString();
    await saveGroupStore(groupId, store);
    return store.events[eventId];
  }

  /**
   * @param {string} groupId
   */
  async function getStoreStats(groupId) {
    const store = await loadGroupStore(groupId);
    const allEvents = sortEventsForExport(getAllStoredEvents(store.events));

    return {
      totalStored: allEvents.length,
      exportTotal: allEvents.length,
      upcomingCount: global.ScrapExt.countUpcomingEvents(allEvents),
      updatedAt: store.updatedAt,
      groupName: store.groupName,
      pastMaxDate: store.pastMaxDate,
    };
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.mergeScrapedEvents = mergeScrapedEvents;
  global.ScrapExt.getStoreStats = getStoreStats;
  global.ScrapExt.loadExportEvents = loadExportEvents;
  global.ScrapExt.filterEventsNeedingDetails = filterEventsNeedingDetails;
  global.ScrapExt.filterEventsForDetailRefresh = filterEventsForDetailRefresh;
  global.ScrapExt.filterEventsMissingDetails = filterEventsMissingDetails;
  global.ScrapExt.applyEventDetails = applyEventDetails;
})(globalThis);
