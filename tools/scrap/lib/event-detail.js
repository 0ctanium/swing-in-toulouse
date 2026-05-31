/**
 * Fetch Facebook event pages and enrich stored events with parsed details.
 */
(function initEventDetail(global) {
  const FETCH_DELAY_MS = 1000;
  const FETCH_TIMEOUT_MS = 45000;

  /** @type {boolean} */
  let pageFetchInjected = false;

  /** @type {Promise<void> | null} */
  let pageFetchInjectPromise = null;

  /**
   * Fetch when details were never loaded, or when the event is still upcoming
   * (by start timestamp — not Facebook's isPast flag).
   * @param {ScrapFbEvent} event
   * @param {number} [nowSec]
   */
  function shouldRefreshDetails(
    event,
    nowSec = Math.floor(Date.now() / 1000),
  ) {
    if (!event.detailsFetchedAt) {
      return true;
    }

    return (
      event.startTimestamp != null && event.startTimestamp > nowSec
    );
  }

  /**
   * Export is blocked only while required details are still missing entirely.
   * @param {ScrapFbEvent} event
   */
  function isMissingDetails(event) {
    return !event.detailsFetchedAt;
  }

  /** @deprecated Use shouldRefreshDetails */
  function needsDetailFetch(event, nowSec) {
    return shouldRefreshDetails(event, nowSec);
  }

  function ensurePageEventFetchInjected() {
    if (pageFetchInjected) {
      return Promise.resolve();
    }

    if (pageFetchInjectPromise) {
      return pageFetchInjectPromise;
    }

    pageFetchInjectPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("scripts/page-event-fetch.js");
      script.onload = () => {
        pageFetchInjected = true;
        script.remove();
        resolve();
      };
      script.onerror = () => {
        pageFetchInjectPromise = null;
        reject(new Error("Could not inject page event fetch script"));
      };
      (document.head || document.documentElement).appendChild(script);
    });

    return pageFetchInjectPromise;
  }

  /**
   * @param {string} url
   */
  async function fetchEventHtmlViaPage(url) {
    await ensurePageEventFetchInjected();

    const requestId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `fetch-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error(`Fetch timeout for ${url}`));
      }, FETCH_TIMEOUT_MS);

      /**
       * @param {MessageEvent} event
       */
      function handler(event) {
        if (event.source !== window) {
          return;
        }

        const data = event.data;
        if (
          data?.source !== "swing-scrap" ||
          data?.type !== "FETCH_EVENT_PAGE_RESULT" ||
          data.requestId !== requestId
        ) {
          return;
        }

        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        if (!data.ok) {
          reject(new Error(data.error ?? "Page fetch failed"));
          return;
        }

        if (typeof data.status === "number" && data.status >= 400) {
          reject(new Error(`HTTP ${data.status} fetching ${url}`));
          return;
        }

        if (typeof data.text !== "string" || data.text.length < 500) {
          reject(new Error("Event page response was too short or empty"));
          return;
        }

        resolve(data.text);
      }

      window.addEventListener("message", handler);
      window.postMessage(
        {
          source: "swing-scrap",
          type: "FETCH_EVENT_PAGE",
          requestId,
          url,
        },
        window.location.origin,
      );
    });
  }

  /**
   * @param {string} eventId
   * @param {string | null | undefined} eventUrl
   */
  function resolveEventUrl(eventId, eventUrl) {
    if (typeof eventUrl === "string" && eventUrl.includes("/events/")) {
      return eventUrl.split("?")[0].replace(/\/?$/, "/");
    }

    return `https://www.facebook.com/events/${eventId}/`;
  }

  /**
   * @param {string} html
   */
  function validateEventHtml(html) {
    if (/login_form|loginform|name="login"/i.test(html)) {
      throw new Error("Facebook returned a login page — refresh and try again");
    }

    if (!/"event"\s*:/.test(html) && !/"start_timestamp"\s*:/.test(html)) {
      throw new Error("Event page HTML has no embedded event JSON");
    }
  }

  /**
   * @param {string} eventId
   * @param {string | null | undefined} eventUrl
   */
  async function fetchEventHtml(eventId, eventUrl) {
    const url = resolveEventUrl(eventId, eventUrl);
    const html = await fetchEventHtmlViaPage(url);
    validateEventHtml(html);
    return html;
  }

  /**
   * @param {string} eventId
   * @param {string | null | undefined} [eventUrl]
   */
  async function fetchAndParseEventDetail(eventId, eventUrl) {
    const html = await fetchEventHtml(eventId, eventUrl);
    return global.ScrapExt.parseEventPageHtml(html);
  }

  /**
   * @param {ReturnType<typeof global.ScrapExt.parseEventPageHtml>} parsed
   */
  function parsedDetailsToEventPatch(parsed) {
    /** @type {Partial<ScrapFbEvent>} */
    const patch = {
      id: parsed.id,
      name: parsed.name,
      url: parsed.url ?? `https://www.facebook.com/events/${parsed.id}/`,
      description: parsed.description,
      location: parsed.location,
      onlineDetails: parsed.onlineDetails,
      isOnline: parsed.isOnline,
      isCanceled: parsed.isCanceled,
      startTimestamp: parsed.startTimestamp,
      endTimestamp: parsed.endTimestamp,
      dateText: parsed.dateText,
      timezone: parsed.timezone,
      ticketUrl: parsed.ticketUrl ?? null,
      hosts: parsed.hosts ?? [],
      detailsFetchedAt: new Date().toISOString(),
      detailsFetchError: null,
    };

    return patch;
  }

  /**
   * @param {string} eventId
   * @param {string | null | undefined} [eventUrl]
   */
  async function fetchEventDetailPatch(eventId, eventUrl) {
    const parsed = await fetchAndParseEventDetail(eventId, eventUrl);
    return parsedDetailsToEventPatch(parsed);
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.shouldRefreshDetails = shouldRefreshDetails;
  global.ScrapExt.isMissingDetails = isMissingDetails;
  global.ScrapExt.needsDetailFetch = needsDetailFetch;
  global.ScrapExt.fetchEventDetailPatch = fetchEventDetailPatch;
  global.ScrapExt.FETCH_DELAY_MS = FETCH_DELAY_MS;
})(globalThis);
