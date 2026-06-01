/**
 * Scroll the group discussion feed and collect event links from posts.
 */
(function initScrapeFeed(global) {
  const SCROLL_WAIT_MS = 800;
  const IDLE_SCROLLS_TO_STOP = 5;
  const MAX_SCROLLS = 150;
  const SCROLL_RATIO = 0.9;
  const MIN_SCROLL_DELTA = 24;

  /**
   * @param {(progress: Record<string, unknown>) => void} [onProgress]
   * @param {{ maxDate?: string | null }} [options]
   */
  async function scrapeGroupFeed(onProgress, options = {}) {
    const maxDate = options.maxDate ?? null;

    global.ScrapExt.resetSniffedEvents?.();
    global.ScrapExt.installFetchSniffer?.();
    global.ScrapExt.beginScrapeSession?.();

    /** @type {ScrapFbEvent[]} */
    let allEvents = [];
    /** @type {string | null} */
    let stopReason = null;
    let scrolls = 0;
    let idleScrolls = 0;
    /** @type {Element | null} */
    let scrollContainer = null;
    /** @type {Set<string>} */
    let knownIds = new Set();

    const applyCutoff = (events) => {
      if (!maxDate) {
        return events;
      }
      return global.ScrapExt.filterEventsOnOrAfterDate(events, maxDate);
    };

    const mergeCollected = () => {
      const batch = global.ScrapExt.collectEventsFromFeed?.() ?? [];
      const before = knownIds.size;

      for (const event of batch) {
        knownIds.add(event.id);
      }

      allEvents = applyCutoff(
        global.ScrapExt.dedupeEvents([...allEvents, ...batch]),
      );

      const newCount = knownIds.size - before;
      global.ScrapExt.log?.info("Feed collection pass", {
        scrolls,
        batch: batch.length,
        newIds: newCount,
        total: allEvents.length,
        oldest: global.ScrapExt.getOldestEventStartMs(allEvents),
        maxDate,
      });

      return newCount;
    };

    const checkStop = () => {
      if (global.ScrapExt.isScrapeAborted?.()) {
        return { stop: true, reason: "manual" };
      }

      if (maxDate && global.ScrapExt.shouldStopPastScrape(allEvents, maxDate)) {
        return { stop: true, reason: "max-date" };
      }

      if (scrolls >= MAX_SCROLLS) {
        return { stop: true, reason: "max-scrolls" };
      }

      if (idleScrolls >= IDLE_SCROLLS_TO_STOP && scrolls > 0) {
        return { stop: true, reason: "idle" };
      }

      return { stop: false };
    };

    onProgress?.({ phase: "scrolling", scrolls: 0, count: 0 });

    mergeCollected();

    while (true) {
      const stopBefore = checkStop();
      if (stopBefore.stop) {
        stopReason = stopBefore.reason ?? null;
        onProgress?.({
          phase: "stopped",
          reason: stopReason,
          scrolls,
          count: allEvents.length,
        });
        break;
      }

      const scrollTopBefore = readScrollTop(scrollContainer);
      scrollContainer = scrollFeedOnce(scrollContainer);
      scrolls++;
      await sleep(SCROLL_WAIT_MS);

      const newCount = mergeCollected();
      const scrollTopAfter = readScrollTop(scrollContainer);
      const scrollMoved =
        Math.abs(scrollTopAfter - scrollTopBefore) >= MIN_SCROLL_DELTA;

      if (newCount === 0 && !scrollMoved) {
        idleScrolls++;
      } else {
        idleScrolls = 0;
      }

      onProgress?.({
        phase: "scrolling",
        scrolls,
        count: allEvents.length,
        newThisScroll: newCount,
      });

      const stopAfter = checkStop();
      if (stopAfter.stop) {
        stopReason = stopAfter.reason ?? null;
        onProgress?.({
          phase: "stopped",
          reason: stopReason,
          scrolls,
          count: allEvents.length,
        });
        break;
      }
    }

    if (global.ScrapExt.isScrapeAborted?.()) {
      stopReason = "manual";
    } else if (
      maxDate &&
      global.ScrapExt.shouldStopPastScrape(allEvents, maxDate)
    ) {
      stopReason = "max-date";
    }

    onProgress?.({ phase: "parsing", scrolls });
    onProgress?.({
      phase: "done",
      count: allEvents.length,
      scrolls,
      stopReason,
    });

    global.ScrapExt.log?.info("Feed scrape finished", {
      scrolls,
      count: allEvents.length,
      maxDate,
      stopReason,
    });

    global.ScrapExt.endScrapeSession?.();

    return { events: allEvents, stopReason };
  }

  /**
   * @param {Element | null} preferred
   */
  function findFeedScrollContainer(preferred) {
    if (
      preferred &&
      preferred instanceof HTMLElement &&
      isScrollableElement(preferred)
    ) {
      return preferred;
    }

    const scrollview = document.querySelector("#scrollview");
    if (scrollview instanceof HTMLElement && isScrollableElement(scrollview)) {
      return scrollview;
    }

    const main = document.querySelector('[role="main"]');
    if (main instanceof HTMLElement) {
      /** @type {HTMLElement | null} */
      let best = null;
      let bestOverflow = 0;
      const queue = [main];

      while (queue.length > 0) {
        const element = queue.shift();
        if (!element) {
          continue;
        }

        const overflow = element.scrollHeight - element.clientHeight;
        if (overflow > bestOverflow && overflow > 80) {
          best = element;
          bestOverflow = overflow;
        }

        for (const child of element.children) {
          if (child instanceof HTMLElement) {
            queue.push(child);
          }
        }
      }

      if (best) {
        return best;
      }
    }

    const scrollingElement = document.scrollingElement;
    if (
      scrollingElement instanceof HTMLElement &&
      isScrollableElement(scrollingElement)
    ) {
      return scrollingElement;
    }

    return null;
  }

  /**
   * @param {Element | null | undefined} element
   */
  function isScrollableElement(element) {
    return element.scrollHeight > element.clientHeight + 80;
  }

  /**
   * @param {Element | null} container
   */
  function readScrollTop(container) {
    if (!container || container === document.documentElement) {
      return window.scrollY;
    }

    return container.scrollTop;
  }

  /**
   * @param {Element | null} preferred
   * @returns {Element | null}
   */
  function scrollFeedOnce(preferred) {
    const candidates = [
      findFeedScrollContainer(preferred),
      document.querySelector("#scrollview"),
      document.querySelector('[role="main"]'),
      document.scrollingElement,
    ].filter(
      (element, index, list) =>
        element instanceof HTMLElement &&
        isScrollableElement(element) &&
        list.indexOf(element) === index,
    );

    const delta = Math.max(
      400,
      Math.floor(
        ((candidates[0] instanceof HTMLElement
          ? candidates[0].clientHeight
          : null) ?? window.innerHeight) * SCROLL_RATIO,
      ),
    );

    for (const container of candidates) {
      if (!(container instanceof HTMLElement)) {
        continue;
      }

      const before = readScrollTop(container);
      if (
        container === document.documentElement ||
        container === document.body
      ) {
        window.scrollBy({ top: delta, behavior: "instant" });
      } else {
        container.scrollBy({ top: delta, behavior: "instant" });
      }

      const after = readScrollTop(container);
      if (Math.abs(after - before) >= MIN_SCROLL_DELTA) {
        return container;
      }
    }

    window.scrollBy({ top: delta, behavior: "instant" });
    return candidates[0] ?? null;
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.scrapeGroupFeed = scrapeGroupFeed;
})(globalThis);
