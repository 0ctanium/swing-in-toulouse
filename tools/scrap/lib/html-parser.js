/**
 * Parse embedded JSON from Facebook event page HTML.
 * Ported from facebook-event-scraper htmlParser.
 */
(function initHtmlParser(global) {
  /**
   * @param {string} html
   */
  function getDescription(html) {
    const { jsonData } = global.ScrapExt.findJsonInString(
      html,
      "event_description",
    );
    if (!jsonData) {
      return null;
    }
    return typeof jsonData.text === "string" ? jsonData.text : null;
  }

  /**
   * @param {Record<string, unknown>} jsonData
   */
  function mapBasicData(jsonData) {
    const coverRenderer = jsonData.cover_media_renderer;

    return {
      id: String(jsonData.id),
      name: String(jsonData.name),
      formattedDate:
        typeof jsonData.day_time_sentence === "string"
          ? jsonData.day_time_sentence
          : null,
      startTimestamp:
        typeof jsonData.start_timestamp === "number"
          ? jsonData.start_timestamp
          : null,
      isOnline: Boolean(jsonData.is_online),
      isCanceled: Boolean(jsonData.is_canceled),
      url: typeof jsonData.url === "string" ? jsonData.url : null,
      siblingEvents:
        jsonData.comet_neighboring_siblings?.map((sibling) => ({
          id: sibling.id,
          startTimestamp: sibling.start_timestamp,
          endTimestamp: sibling.end_timestamp,
          parentEvent: sibling.parent_event
            ? { id: sibling.parent_event.id }
            : null,
        })) ?? [],
      parentEvent:
        jsonData.parent_if_exists_or_self &&
        jsonData.parent_if_exists_or_self.id !== jsonData.id
          ? { id: jsonData.parent_if_exists_or_self.id }
          : null,
      coverPhoto: coverRenderer?.cover_photo
        ? {
            url: coverRenderer.cover_photo.photo?.url,
            id: coverRenderer.cover_photo.photo?.id,
          }
        : null,
    };
  }

  /**
   * @param {string} html
   */
  function getBasicData(html) {
    const matchers = [
      (candidate) =>
        "day_time_sentence" in candidate && "start_timestamp" in candidate,
      (candidate) => "day_time_sentence" in candidate,
      (candidate) =>
        "start_timestamp" in candidate && typeof candidate.name === "string",
      (candidate) =>
        typeof candidate.name === "string" &&
        (typeof candidate.id === "string" || typeof candidate.id === "number"),
    ];

    for (const matcher of matchers) {
      const { jsonData } = global.ScrapExt.findJsonInString(
        html,
        "event",
        matcher,
      );
      if (jsonData) {
        return mapBasicData(jsonData);
      }
    }

    const allEvents = global.ScrapExt.findAllJsonInString(html, "event");
    for (const jsonData of allEvents) {
      if (typeof jsonData.name === "string" && jsonData.id != null) {
        return mapBasicData(jsonData);
      }
    }

    return null;
  }

  /**
   * @param {string} html
   */
  function getTicketUrl(html) {
    const { jsonData } = global.ScrapExt.findJsonInString(
      html,
      "event",
      (candidate) => "event_buy_ticket_url" in candidate,
    );
    return jsonData?.event_buy_ticket_url ?? null;
  }

  /**
   * @param {string} html
   */
  function getLocation(html) {
    const { jsonData, startIndex } = global.ScrapExt.findJsonInString(
      html,
      "event_place",
      (candidate) => "location" in candidate,
    );

    if (startIndex === -1) {
      return null;
    }

    if (jsonData === null) {
      return null;
    }

    return {
      id: jsonData.id,
      name: jsonData.name ?? null,
      description: jsonData.best_description?.text ?? null,
      url: jsonData.url ?? null,
      coordinates: jsonData.location
        ? {
            latitude: jsonData.location.latitude,
            longitude: jsonData.location.longitude,
          }
        : null,
      countryCode:
        jsonData.location?.reverse_geocode?.country_alpha_two ?? null,
      type: jsonData.place_type ?? null,
      address: jsonData.address?.street ?? null,
      city: jsonData.city
        ? {
            name: jsonData.city.contextual_name,
            id: jsonData.city.id,
          }
        : null,
    };
  }

  /**
   * @param {string} html
   */
  function getHosts(html) {
    const { jsonData } = global.ScrapExt.findJsonInString(
      html,
      "event_hosts_that_can_view_guestlist",
      (candidate) => candidate?.[0]?.profile_picture,
    );

    if (!jsonData) {
      return [];
    }

    return jsonData.map((host) => ({
      id: host.id,
      name: host.name,
      url: host.url,
      type: host.__typename,
    }));
  }

  /**
   * @param {string} html
   */
  function getOnlineDetails(html) {
    const { jsonData } = global.ScrapExt.findJsonInString(
      html,
      "online_event_setup",
      (candidate) =>
        "third_party_url" in candidate && "type" in candidate,
    );

    if (!jsonData) {
      return null;
    }

    return {
      url: jsonData.third_party_url ?? null,
      type: jsonData.type ?? null,
    };
  }

  /**
   * @param {string} html
   * @param {number} expectedStartTimestamp
   */
  function getEndTimestampAndTimezone(html, expectedStartTimestamp) {
    if (expectedStartTimestamp != null) {
      const { jsonData } = global.ScrapExt.findJsonInString(
        html,
        "data",
        (candidate) =>
          "end_timestamp" in candidate &&
          "tz_display_name" in candidate &&
          candidate.start_timestamp === expectedStartTimestamp,
      );

      if (jsonData) {
        return {
          endTimestamp: jsonData.end_timestamp || null,
          timezone: jsonData.tz_display_name ?? null,
        };
      }
    }

    const { jsonData } = global.ScrapExt.findJsonInString(
      html,
      "data",
      (candidate) =>
        "end_timestamp" in candidate && "tz_display_name" in candidate,
    );

    if (!jsonData) {
      return { endTimestamp: null, timezone: null };
    }

    return {
      endTimestamp: jsonData.end_timestamp || null,
      timezone: jsonData.tz_display_name ?? null,
    };
  }

  /**
   * @param {string} html
   */
  function parseEventPage(html) {
    const basic = getBasicData(html);
    if (!basic) {
      throw new Error("No event data found in page HTML");
    }

    let location = null;
    let onlineDetails = null;

    if (basic.isOnline) {
      onlineDetails = getOnlineDetails(html);
    } else {
      location = getLocation(html);
    }

    const description = getDescription(html);
    const { endTimestamp, timezone } = getEndTimestampAndTimezone(
      html,
      basic.startTimestamp,
    );

    return {
      id: basic.id,
      name: basic.name,
      description,
      location,
      onlineDetails,
      isOnline: basic.isOnline,
      isCanceled: basic.isCanceled,
      url: basic.url,
      startTimestamp: basic.startTimestamp,
      endTimestamp,
      dateText: basic.formattedDate,
      timezone,
      ticketUrl: getTicketUrl(html),
      hosts: getHosts(html),
    };
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.parseEventPageHtml = parseEventPage;
})(globalThis);
