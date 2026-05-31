(function initScrapScrape(global) {
  const CLICK_DELAY_MS = 1200;
  const MAX_SHOW_MORE_CLICKS = 100;
  const POST_CLICK_WAIT_MS = 400;
  const POST_CLICK_POLLS = 12;

  /** @type {ScrapFbEvent[]} */
  let sniffedEvents = [];
  let fetchSnifferInstalled = false;

  /** @type {{ aborted: boolean } | null} */
  let activeScrapeSession = null;

  function beginScrapeSession() {
    activeScrapeSession = { aborted: false };
    return activeScrapeSession;
  }

  function requestScrapeStop() {
    if (activeScrapeSession) {
      activeScrapeSession.aborted = true;
      global.ScrapExt.log?.info("Manual scrape stop requested");
    }
  }

  function isScrapeAborted() {
    return activeScrapeSession?.aborted ?? false;
  }

  /**
   * Content scripts can't patch page fetch — inject a MAIN-world sniffer.
   */
  function installFetchSniffer() {
    if (fetchSnifferInstalled) {
      return;
    }

    fetchSnifferInstalled = true;

    window.addEventListener("message", (event) => {
      if (event.source !== window) {
        return;
      }

      const data = event.data;
      if (data?.source !== "swing-scrap" || data?.type !== "SCRAP_GRAPHQL") {
        return;
      }

      const found = extractEventsFromGraphqlPayload(data.payload);
      if (found.length > 0) {
        sniffedEvents = dedupeEvents([...sniffedEvents, ...found]);
        global.ScrapExt.log?.info("GraphQL events sniffed", {
          batch: found.length,
          total: sniffedEvents.length,
        });
      }
    });

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("scripts/page-sniffer.js");
    script.onload = () => {
      script.remove();
    };
    script.onerror = () => {
      global.ScrapExt.log?.error("Failed to inject page sniffer");
      script.remove();
    };

    (document.head || document.documentElement).appendChild(script);
    global.ScrapExt.log?.info("Page-world GraphQL sniffer injected");
  }

  /**
   * @param {unknown} payload
   */
  function extractEventsFromGraphqlPayload(payload) {
    /** @type {ScrapFbEvent[]} */
    const events = [];

    /** @param {unknown} value */
    function walk(value) {
      if (!value || typeof value !== "object") {
        return;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item);
        }
        return;
      }

      const record = /** @type {Record<string, unknown>} */ (value);

      if (isGraphqlEventNode(record)) {
        events.push(normalizeEventNode(record));
      }

      if (Array.isArray(record.edges)) {
        for (const edge of record.edges) {
          walk(edge);
        }
      }

      for (const nested of Object.values(record)) {
        walk(nested);
      }
    }

    walk(payload);
    return dedupeEvents(events);
  }

  /**
   * @param {Record<string, unknown>} node
   */
  function isGraphqlEventNode(node) {
    if (typeof node.id !== "string" && typeof node.id !== "number") {
      return false;
    }

    if (typeof node.name !== "string") {
      return false;
    }

    const hasSchedule =
      typeof node.day_time_sentence === "string" ||
      typeof node.start_timestamp === "number";

    if (!hasSchedule) {
      return false;
    }

    if (typeof node.url === "string") {
      return /\/events\//.test(node.url);
    }

    return true;
  }

  /**
   * @param {"upcoming" | "past"} mode
   * @param {number} previousCount
   */
  async function waitForMoreEvents(mode, previousCount) {
    for (let poll = 0; poll < POST_CLICK_POLLS; poll++) {
      await sleep(POST_CLICK_WAIT_MS);

      const currentCount = collectEventsFromPage(mode).length;
      if (currentCount > previousCount || sniffedEvents.length > previousCount) {
        global.ScrapExt.log?.info("Events increased after click", {
          previousCount,
          currentCount,
          sniffed: sniffedEvents.length,
          poll,
        });
        return Math.max(currentCount, sniffedEvents.length);
      }
    }

    global.ScrapExt.log?.warn("No new events detected after click", {
      previousCount,
    });
    return previousCount;
  }

  /**
   * @param {string} label
   */
  function isShowMoreLabel(label) {
    const normalized = label.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return false;
    }

    if (/en savoir plus/i.test(normalized)) {
      return false;
    }

    if (/^(show more|see more|voir plus|afficher plus|mostrar más)$/i.test(normalized)) {
      return true;
    }

    if (/voir plus d.évènement/i.test(normalized)) {
      return true;
    }

    if (
      /(?:show more|see more|voir plus|afficher plus).*(?:évènement|événement|event)/i.test(
        normalized,
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * @param {Element} element
   */
  function getElementLabel(element) {
    return (element.getAttribute("aria-label") ?? element.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  /**
   * @param {Element} node
   * @param {Element} anchor
   */
  function followsInDocument(node, anchor) {
    return (anchor.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  }

  /**
   * @param {Element} node
   * @param {Element} anchor
   */
  function precedesInDocument(node, anchor) {
    return (node.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  }

  /**
   * @param {Element} node
   * @param {Element} start
   * @param {Element | null} end
   */
  function isBetweenInDocument(node, start, end) {
    if (!followsInDocument(node, start)) {
      return false;
    }
    if (end && !precedesInDocument(node, end)) {
      return false;
    }
    return true;
  }

  /**
   * @param {Element} root
   */
  function getEventIdsInSubtree(root) {
    /** @type {Set<string>} */
    const ids = new Set();

    for (const link of root.querySelectorAll('a[href*="/events/"]')) {
      const id = link.href.match(/\/events\/(\d+)/)?.[1];
      if (id) {
        ids.add(id);
      }
    }

    return ids;
  }

  /**
   * @param {string} text
   */
  function normalizeVisibleText(text) {
    return text.trim().replace(/\s+/g, " ");
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function sectionLabelPattern(mode) {
    return mode === "past"
      ? /évènements\s+passés|événements\s+passés|past\s+events/i
      : /évènements\s+à\s+venir|événements\s+à\s+venir|upcoming\s+events/i;
  }

  /**
   * @param {Element} element
   * @param {"upcoming" | "past"} mode
   */
  function isSectionLabelElement(element, mode) {
    const text = normalizeVisibleText(element.textContent ?? "");
    if (text.length > 80) {
      return false;
    }

    return sectionLabelPattern(mode).test(text);
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function findSectionLabelElement(mode) {
    const candidates = [
      ...document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, [role="heading"], span, div',
      ),
    ];

    /** @type {Element | null} */
    let headingMatch = null;
    /** @type {Element | null} */
    let looseMatch = null;

    for (const element of candidates) {
      if (!isSectionLabelElement(element, mode)) {
        continue;
      }

      looseMatch = element;

      const tag = element.tagName;
      if (
        tag === "H1" ||
        tag === "H2" ||
        tag === "H3" ||
        tag === "H4" ||
        element.getAttribute("role") === "heading"
      ) {
        headingMatch = element;
        break;
      }
    }

    return headingMatch ?? looseMatch;
  }

  /**
   * @param {Element} button
   */
  function isInsideSingleEventCard(button) {
    let node = button.parentElement;

    for (let depth = 0; depth < 12 && node; depth++) {
      if (getEventIdsInSubtree(node).size === 1) {
        return true;
      }
      node = node.parentElement;
    }

    return false;
  }

  /**
   * Find the shared container for a section label (e.g. "Évènements passés")
   * and its list-level "Voir plus" button.
   * @param {"upcoming" | "past"} mode
   */
  function findEventSection(mode) {
    const label = findSectionLabelElement(mode);
    const otherMode = mode === "past" ? "upcoming" : "past";
    const endLabel = findSectionLabelElement(otherMode);

    if (!label) {
      global.ScrapExt.log?.warn("Section label not found", { mode });
      return { label: null, container: null, endLabel };
    }

    /** @type {Element | null} */
    let bestContainer = label.parentElement;
    let node = label.parentElement;

    while (node && node !== document.body) {
      if (!node.contains(label)) {
        break;
      }

      if (
        endLabel &&
        endLabel !== label &&
        followsInDocument(endLabel, label) &&
        node.contains(endLabel)
      ) {
        break;
      }

      const paginationButtons = collectShowMoreCandidates().filter(
        (button) =>
          node.contains(button) &&
          followsInDocument(button, label) &&
          !isInsideSingleEventCard(button),
      );

      if (paginationButtons.length > 0) {
        bestContainer = node;
      }

      node = node.parentElement;
    }

    global.ScrapExt.log?.info("Section container resolved", {
      mode,
      label: normalizeVisibleText(label.textContent ?? ""),
      containerTag: bestContainer?.tagName ?? null,
      endLabel: endLabel
        ? normalizeVisibleText(endLabel.textContent ?? "")
        : null,
    });

    return {
      label,
      container: bestContainer ?? label.parentElement,
      endLabel:
        endLabel && label && followsInDocument(endLabel, label)
          ? endLabel
          : null,
    };
  }

  /**
   * @param {Element} node
   * @param {{ label: Element | null; container: Element | null; endLabel: Element | null }} section
   */
  function isInsideEventSection(node, section) {
    if (!section.label && !section.container) {
      return true;
    }

    if (section.container && !section.container.contains(node)) {
      return false;
    }

    if (section.label && !followsInDocument(node, section.label)) {
      return false;
    }

    if (
      section.endLabel &&
      section.label &&
      !precedesInDocument(node, section.endLabel)
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function findEventSectionHeadings(mode) {
    const section = findEventSection(mode);
    return { start: section.label, end: section.endLabel };
  }

  /**
   * @param {HTMLElement} element
   */
  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Collect all clickable "Voir plus" candidates.
   */
  function collectShowMoreCandidates() {
    return [...document.querySelectorAll('[role="button"], button, div[tabindex="0"]')]
      .filter((element) => isShowMoreLabel(getElementLabel(element)))
      .filter((element) => isVisible(/** @type {HTMLElement} */ (element)))
      .map((element) => /** @type {HTMLElement} */ (element));
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function findShowMoreButton(mode = "upcoming") {
    const section = findEventSection(mode);

    if (!section.label) {
      return collectShowMoreCandidates()[0] ?? null;
    }

    const paginationButtons = collectShowMoreCandidates()
      .filter((button) => isInsideEventSection(button, section))
      .filter((button) => !isInsideSingleEventCard(button));

    global.ScrapExt.log?.info("Show-more candidates in section", {
      mode,
      section: normalizeVisibleText(section.label.textContent ?? ""),
      inSection: paginationButtons.map((button) => getElementLabel(button)),
    });

    if (paginationButtons.length > 0) {
      return paginationButtons[paginationButtons.length - 1] ?? null;
    }

    global.ScrapExt.log?.info("No show-more in section container", {
      mode,
      sampleLabels: collectShowMoreCandidates()
        .slice(0, 10)
        .map((button) => getElementLabel(button)),
    });

    return null;
  }

  /**
   * @param {(progress: { phase: string; count?: number; clicks?: number }) => void} [onProgress]
   * @param {"upcoming" | "past"} [mode]
   * @param {() => void | Promise<void>} [onAfterClick]
   * @param {{ shouldStop?: () => boolean | { stop: boolean; reason?: string } }} [options]
   */
  async function clickShowMoreUntilDone(
    onProgress,
    mode = "upcoming",
    onAfterClick,
    options = {},
  ) {
    let clicks = 0;

    const checkStop = () => {
      if (options.shouldStop) {
        const result = options.shouldStop();
        if (typeof result === "object" && result?.stop) {
          return result;
        }
        if (result === true) {
          return { stop: true, reason: "past-max-date" };
        }
      }
      if (isScrapeAborted()) {
        return { stop: true, reason: "manual" };
      }
      return { stop: false };
    };

    for (let attempt = 0; attempt < MAX_SHOW_MORE_CLICKS; attempt++) {
      const stopBeforeClick = checkStop();
      if (stopBeforeClick.stop) {
        global.ScrapExt.log?.info("Stopping pagination", {
          reason: stopBeforeClick.reason,
          clicks,
        });
        onProgress?.({ phase: "stopped", reason: stopBeforeClick.reason, clicks });
        break;
      }

      const button = findShowMoreButton(mode);
      if (!button) {
        global.ScrapExt.log?.info("Show more button not found", { clicks });
        break;
      }

      const label =
        button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "";
      global.ScrapExt.log?.info("Clicking show more", { clicks: clicks + 1, label });

      clickElement(button);
      clicks++;
      onProgress?.({ phase: "loading", clicks });

      if (onAfterClick) {
        await onAfterClick();
      } else {
        await sleep(CLICK_DELAY_MS);
      }

      const stopAfterClick = checkStop();
      if (stopAfterClick.stop) {
        global.ScrapExt.log?.info("Stopping pagination", {
          reason: stopAfterClick.reason,
          clicks,
        });
        onProgress?.({ phase: "stopped", reason: stopAfterClick.reason, clicks });
        break;
      }
    }

    return clicks;
  }

  /**
   * @param {HTMLElement} element
   */
  function clickElement(element) {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    element.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function collectEventsFromPage(mode) {
    const html = document.documentElement.innerHTML;
    const fromJson = parseEventsFromEmbeddedJson(html, mode);
    const fromDom = parseEventsFromDom(mode);
    const fromSniffer = sniffedEvents.filter((event) =>
      mode === "past" ? event.isPast : !event.isPast,
    );
    const merged = dedupeEvents([...fromJson, ...fromDom, ...fromSniffer]);

    global.ScrapExt.log?.info("Collected events from page", {
      mode,
      fromJson: fromJson.length,
      fromDom: fromDom.length,
      fromSniffer: fromSniffer.length,
      merged: merged.length,
    });

    return merged;
  }

  /**
   * @param {"upcoming" | "past"} mode
   * @param {(progress: { phase: string; count?: number; clicks?: number }) => void} [onProgress]
   * @param {{ pastMaxDate?: string | null }} [options]
   */
  async function scrapeGroupEvents(mode, onProgress, options = {}) {
    sniffedEvents = [];
    installFetchSniffer();
    beginScrapeSession();

    const pastMaxDate =
      mode === "past" ? (options.pastMaxDate ?? null) : null;

    /** @type {ScrapFbEvent[]} */
    let allEvents = [];
    /** @type {string | null} */
    let stopReason = null;

    const applyCutoff = (events) => {
      if (!pastMaxDate) {
        return events;
      }
      return global.ScrapExt.filterEventsOnOrAfterDate(events, pastMaxDate);
    };

    const mergeCollected = () => {
      allEvents = applyCutoff(
        dedupeEvents([...allEvents, ...collectEventsFromPage(mode)]),
      );
      global.ScrapExt.log?.info("Running event total", {
        count: allEvents.length,
        oldest: global.ScrapExt.getOldestEventStartMs(allEvents),
        pastMaxDate,
      });
    };

    const shouldStopPastPagination = () => {
      if (isScrapeAborted()) {
        return { stop: true, reason: "manual" };
      }

      if (!pastMaxDate) {
        return { stop: false };
      }

      const rawEvents = dedupeEvents([
        ...allEvents,
        ...collectEventsFromPage(mode),
      ]);

      if (global.ScrapExt.shouldStopPastScrape(rawEvents, pastMaxDate)) {
        const oldest = global.ScrapExt.getOldestEventStartMs(rawEvents);
        global.ScrapExt.log?.info("Past max date reached", {
          pastMaxDate,
          oldest,
          eventCount: rawEvents.length,
        });
        return { stop: true, reason: "past-max-date" };
      }

      return { stop: false };
    };

    onProgress?.({ phase: "expanding" });
    mergeCollected();

    const clicks = await clickShowMoreUntilDone(
      onProgress,
      mode,
      async () => {
        await waitForMoreEvents(mode, allEvents.length);
        mergeCollected();
      },
      { shouldStop: mode === "past" ? shouldStopPastPagination : undefined },
    );

    mergeCollected();

    if (isScrapeAborted()) {
      stopReason = "manual";
    } else if (
      mode === "past" &&
      pastMaxDate &&
      global.ScrapExt.shouldStopPastScrape(allEvents, pastMaxDate)
    ) {
      stopReason = "past-max-date";
    }

    onProgress?.({ phase: "parsing", clicks });
    onProgress?.({
      phase: "done",
      count: allEvents.length,
      clicks,
      stopReason,
    });

    global.ScrapExt.log?.info("Scrape finished", {
      mode,
      clicks,
      count: allEvents.length,
      pastMaxDate,
      stopReason,
    });

    activeScrapeSession = null;
    return { events: allEvents, stopReason };
  }

  /**
   * @param {string} html
   * @param {"upcoming" | "past"} mode
   */
  function parseEventsFromEmbeddedJson(html, mode) {
    const key = mode === "upcoming" ? "upcoming_events" : "past_events";
    const blocks = global.ScrapExt.findAllJsonInString(html, key);

    /** @type {Record<string, unknown> | null} */
    let bestBlock = null;
    let bestEdgeCount = 0;

    for (const block of blocks) {
      const edges = block?.edges;
      if (!Array.isArray(edges)) {
        continue;
      }

      if (edges.length > bestEdgeCount) {
        bestBlock = block;
        bestEdgeCount = edges.length;
      }
    }

    global.ScrapExt.log?.info("Embedded JSON blocks", {
      mode,
      key,
      blockCount: blocks.length,
      bestEdgeCount,
    });

    if (!bestBlock || !Array.isArray(bestBlock.edges)) {
      return [];
    }

    /** @type {ScrapFbEvent[]} */
    const events = [];

    for (const edge of bestBlock.edges) {
      const node = edge?.node;
      if (!node?.id || !node?.name) {
        continue;
      }

      events.push(normalizeEventNode(node));
    }

    return dedupeEvents(events);
  }

  /**
   * @param {"upcoming" | "past"} mode
   */
  function parseEventsFromDom(mode) {
    const section = findEventSection(mode);

    /** @type {Map<string, ScrapFbEvent>} */
    const byId = new Map();
    const links = document.querySelectorAll('a[href*="/events/"]');

    for (const link of links) {
      if (!isInsideEventSection(link, section)) {
        continue;
      }

      const href = link.href;
      const match = href.match(/\/events\/(\d+)/);
      if (!match) {
        continue;
      }

      const id = match[1];
      const card =
        link.closest('[role="article"]') ??
        link.closest('[data-pagelet]') ??
        link.parentElement;

      const title =
        link.getAttribute("aria-label")?.trim() ||
        link.textContent?.trim() ||
        "";

      if (!title || title.length < 2) {
        continue;
      }

      const dateText = extractDateText(card, title);
      const parsedStartMs = dateText
        ? global.ScrapExt.parseEventDateText?.(dateText)
        : null;
      const existing = byId.get(id);

      if (existing && existing.name.length >= title.length) {
        continue;
      }

      byId.set(id, {
        id,
        name: title,
        url: canonicalEventUrl(id),
        dateText: dateText ?? existing?.dateText ?? null,
        startTimestamp:
          existing?.startTimestamp ??
          (parsedStartMs !== null && parsedStartMs !== undefined
            ? Math.floor(parsedStartMs / 1000)
            : null),
        endTimestamp: existing?.endTimestamp ?? null,
        isCanceled: existing?.isCanceled ?? false,
        isPast: mode === "past",
      });
    }

    return [...byId.values()];
  }

  /**
   * @param {ParentNode | null | undefined} card
   * @param {string} title
   */
  function extractDateText(card, title) {
    if (!card) {
      return null;
    }

    const text = card.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const withoutTitle = text.replace(title, "").trim();
    return withoutTitle || null;
  }

  /**
   * @param {Record<string, unknown>} node
   * @returns {ScrapFbEvent}
   */
  function normalizeEventNode(node) {
    const id = String(node.id);
    const url =
      typeof node.url === "string" ? node.url : canonicalEventUrl(id);

    return {
      id,
      name: String(node.name),
      url,
      dateText:
        typeof node.day_time_sentence === "string"
          ? node.day_time_sentence
          : null,
      startTimestamp:
        typeof node.start_timestamp === "number" ? node.start_timestamp : null,
      endTimestamp:
        typeof node.end_timestamp === "number" ? node.end_timestamp : null,
      isCanceled: Boolean(node.is_canceled),
      isPast: Boolean(node.is_past),
    };
  }

  /**
   * @param {ScrapFbEvent[]} events
   */
  function dedupeEvents(events) {
    const seen = new Set();
    /** @type {ScrapFbEvent[]} */
    const unique = [];

    for (const event of events) {
      if (seen.has(event.id)) {
        continue;
      }
      seen.add(event.id);
      unique.push(event);
    }

    return unique;
  }

  function canonicalEventUrl(id) {
    return `https://www.facebook.com/events/${id}/`;
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  /**
   * @returns {{ groupId: string | null; groupName: string | null }}
   */
  function getGroupContext() {
    const match = window.location.pathname.match(/^\/groups\/(\d+)\/events/);
    const groupId = match?.[1] ?? null;

    const heading =
      document.querySelector("h1")?.textContent?.trim() ||
      document.title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

    return {
      groupId,
      groupName: heading || null,
    };
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.scrapeGroupEvents = scrapeGroupEvents;
  global.ScrapExt.getGroupContext = getGroupContext;
  global.ScrapExt.installFetchSniffer = installFetchSniffer;
  global.ScrapExt.requestScrapeStop = requestScrapeStop;
})(globalThis);

/**
 * @typedef {Object} ScrapFbEvent
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string | null} dateText
 * @property {number | null} startTimestamp
 * @property {number | null} endTimestamp
 * @property {boolean} isCanceled
 * @property {boolean} isPast
 * @property {string | null} [description]
 * @property {Object | null} [location]
 * @property {boolean} [isOnline]
 * @property {Object | null} [onlineDetails]
 * @property {string | null} [timezone]
 * @property {string | null} [detailsFetchedAt]
 */
