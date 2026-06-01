# Facebook group events → iCal (Chrome extension)

Chrome extension that exports events from a Facebook **group events page** to an `.ics` file you can upload to Swing in Toulouse.

## How it works

1. Open a group **events list** (`…/groups/ID/events`) or **discussion feed** (`…/groups/ID`)
2. Click the extension icon → **Sync & export**
3. **Events list**: clicks **Show more** until the list is loaded
4. **Discussion feed**: scrolls the feed until no new events appear (or max date / stop)
5. New events are merged into storage; details are fetched for every saved event that needs them
6. A full `.ics` of **all saved events** is downloaded

Runs in your normal logged-in Chrome session — no headless browser, no server.

## Persistence

Events are saved in `chrome.storage.local` per Facebook group. Once scraped, an event stays in the store and is **always included** in the next iCal export — even if it no longer appears on the group page.

The popup **Scan from** option only controls where we look for **new** events (events list vs discussion feed). The saved count and export always include **every** stored event for that group.

After each sync the popup shows:

- **Scanned on page** — unique events collected from Facebook this run
- **New in storage** — first time saved for this group
- **Changed** — title, date, or URL updated since last sync
- **Unchanged** — seen again with the same data
- **Total saved** — all events in storage (unchanged when switching scan source)
- **Upcoming** — saved events with a future start time
- **Not on page this scan** — saved events not found in this scan pass

For **past events list** or **feed** scans, set **Stop when older than** to stop pagination when events before that date appear. The cutoff is saved per group.

### Discussion feed auto-scroll

The feed scraper scrolls the group timeline to load more posts, then collects event links from the DOM, embedded JSON, and a GraphQL sniffer.

It stops when any of these is true:

1. **End of feed** — five scrolls in a row with no new event IDs *and* the scroll position did not move (avoids stopping while the feed still loads but repeats known events).
2. **Max date** — an event older than **Stop when older than** appears (optional).
3. **Scroll limit** — 150 scroll steps (safety cap).
4. **Stop & save** — you clicked stop in the popup.

Scroll target: prefers `#scrollview`, otherwise the largest scrollable region inside `[role="main"]`, then falls back to other candidates. If one container does not move, the next candidate is tried.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `tools/scrap`

## Usage

1. Navigate to `/groups/{id}` (discussion) or `/groups/{id}/events` on Facebook
2. Refresh the page if you just installed the extension
3. Open the popup, choose **Scan from** (auto-matched to the current page when possible)
4. **Sync & export**
5. Upload the downloaded `.ics` in Swing admin (or add it as an iCal source)

## Project layout

```text
tools/scrap/
  manifest.json          MV3 manifest
  popup/                 Export UI
  scripts/
    content.js           Message routing (list vs feed)
    background.js        Merge, details, ICS download
    page-sniffer.js      GraphQL sniffer (MAIN world)
    page-event-fetch.js  Event page fetch (MAIN world)
  lib/
    scrape.js            Events list (“Show more”)
    scrape-feed.js       Discussion feed (scroll)
    json.js              Parse embedded Facebook JSON
    ics.js               iCal builder (Europe/Paris)
```

## Notes

- **Dates**: Uses `start_timestamp` when Facebook embeds it; otherwise parses `day_time_sentence` or falls back to a 2h default end time.
- **Show more**: Supports English and French button labels (`Show more`, `Voir plus`, …). Update `lib/scrape.js` if Facebook changes copy.
- **ToS**: Export only groups you’re allowed to use; avoid aggressive automation.

## Development

No build step — edit files and click **Reload** on `chrome://extensions`.

### Debugging

Logs are prefixed with `[Swing Scrap]`:

- **Popup**: right-click the extension popup → Inspect
- **Content script**: DevTools on the Facebook tab → Console
- **Background**: `chrome://extensions` → your extension → **Service worker** → Inspect

Optional: keep Bun in this folder for future scripts; the extension itself is plain JavaScript.
