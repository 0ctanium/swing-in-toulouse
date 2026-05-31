# Facebook group events → iCal (Chrome extension)

Chrome extension that exports events from a Facebook **group events page** to an `.ics` file you can upload to Swing in Toulouse.

## How it works

1. Open a group events page, e.g. `https://www.facebook.com/groups/20393438108/events`
2. Click the extension icon → **Export to iCal**
3. The content script clicks **Show more** until the list is fully loaded
4. Events are parsed from Facebook’s embedded JSON (DOM fallback if needed)
5. An `.ics` file is downloaded via `chrome.downloads`

Runs in your normal logged-in Chrome session — no headless browser, no server.

## Persistence

Events are saved in `chrome.storage.local` per Facebook group. Once scraped, an event stays in the store and is **always included** in the next iCal export — even if it no longer appears on the group page.

After each sync the popup shows:

- **New** — first time seen
- **Changed** — title, date, or URL updated since last sync
- **Unchanged** — seen again with the same data
- **Total in iCal** — all saved events for the selected mode (upcoming / past)
- **Kept from earlier syncs** — saved events not found on the page this time

Storage is per group and per mode flag (`isPast`). Upcoming and past events are stored together but exported separately.

For **past events**, set a **max date** before syncing. Pagination stops automatically when Facebook loads events older than that date, and the export only includes events on or after it. The cutoff is saved per group.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `tools/scrap`

## Usage

1. Navigate to `/groups/{id}/events` on Facebook
2. Refresh the page if you just installed the extension
3. Open the popup and export
4. Upload the downloaded `.ics` in Swing admin (or add it as an iCal source)

## Project layout

```text
tools/scrap/
  manifest.json          MV3 manifest
  popup/                 Export UI
  scripts/
    content.js           Runs on group events pages
    background.js        Builds ICS + triggers download
  lib/
    json.js              Parse embedded Facebook JSON
    scrape.js            “Show more” + event extraction
    ics.js                 iCal builder (Europe/Paris)
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
