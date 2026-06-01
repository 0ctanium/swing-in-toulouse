const pageStatus = document.getElementById("page-status");
const storeStatus = document.getElementById("store-status");
const listModeField = document.getElementById("list-mode-field");
const pastCutoffField = document.getElementById("past-cutoff-field");
const pastCutoffHint = document.getElementById("past-cutoff-hint");
const pastMaxDateInput = document.getElementById("past-max-date");
const exportButton = document.getElementById("export-btn");
const stopButton = document.getElementById("stop-btn");
const progressEl = document.getElementById("progress");
const resultEl = document.getElementById("result");
const statsSection = document.getElementById("stats");
const statScanned = document.getElementById("stat-scanned");
const statNew = document.getElementById("stat-new");
const statChanged = document.getElementById("stat-changed");
const statUnchanged = document.getElementById("stat-unchanged");
const statExportTotal = document.getElementById("stat-export-total");
const statUpcoming = document.getElementById("stat-upcoming");
const statKept = document.getElementById("stat-kept");

/** @type {chrome.tabs.Tab | null} */
let activeTab = null;

/** @type {string | null} */
let activeGroupId = null;

/** @type {"events-list" | "feed" | null} */
let pageKind = null;

/** @type {boolean} */
let syncInProgress = false;

function setResult(message, type) {
  resultEl.hidden = false;
  resultEl.textContent = message;
  resultEl.className = `result ${type}`;
}

function setProgress(message) {
  progressEl.hidden = !message;
  progressEl.textContent = message ?? "";
}

function hideStats() {
  statsSection.hidden = true;
}

function setSyncUi(active) {
  syncInProgress = active;
  exportButton.disabled = active;
  stopButton.hidden = !active;
}

/**
 * @param {{
 *   new: number;
 *   changed: number;
 *   unchanged: number;
 *   scannedOnPage?: number;
 *   exportTotal: number;
 *   totalStored?: number;
 *   upcomingCount?: number;
 *   notSeenThisRun: number;
 * }} stats
 */
function showStats(stats) {
  statScanned.textContent = String(stats.scannedOnPage ?? 0);
  statNew.textContent = String(stats.new);
  statChanged.textContent = String(stats.changed);
  statUnchanged.textContent = String(stats.unchanged);
  statExportTotal.textContent = String(stats.totalStored ?? stats.exportTotal);
  statUpcoming.textContent = String(stats.upcomingCount ?? 0);
  statKept.textContent = String(stats.notSeenThisRun);
  statsSection.hidden = false;
}

function formatStoreStatus(stats) {
  const totalStored = stats.totalStored ?? stats.exportTotal ?? 0;
  const upcomingCount = stats.upcomingCount ?? 0;

  if (totalStored === 0) {
    return "No events saved for this group yet.";
  }

  const updatedLabel = stats.updatedAt
    ? new Date(stats.updatedAt).toLocaleString("fr-FR")
    : "unknown";

  return `${totalStored} events saved (${upcomingCount} upcoming) · last sync ${updatedLabel}`;
}

function getSelectedSource() {
  const selected = document.querySelector('input[name="source"]:checked');
  return selected?.value === "feed" ? "feed" : "events-list";
}

function getSelectedMode() {
  const selected = document.querySelector('input[name="mode"]:checked');
  return selected?.value === "past" ? "past" : "upcoming";
}

function extractGroupId(url) {
  return url?.match(/facebook\.com\/groups\/(\d+)/)?.[1] ?? null;
}

/**
 * @param {string | undefined} url
 * @returns {"events-list" | "feed" | null}
 */
function detectPageKind(url) {
  const match = url?.match(/facebook\.com\/groups\/(\d+)(\/[^?#]*)?/);
  if (!match) {
    return null;
  }

  const path = match[2] ?? "/";

  if (/\/(members|photos|photo|media|files|about|announcements|reels)(\/|$)/i.test(path)) {
    return null;
  }

  if (/\/events(\/|$)/i.test(path)) {
    return "events-list";
  }

  return "feed";
}

function defaultPastMaxDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateScanOptionsUi() {
  const source = getSelectedSource();
  const isFeed = source === "feed";
  const isPastList = !isFeed && getSelectedMode() === "past";

  listModeField.hidden = isFeed;
  pastCutoffField.hidden = !(isFeed || isPastList);
  pastMaxDateInput.required = isPastList;

  if (isFeed) {
    pastCutoffHint.textContent =
      "Optional: stop scrolling when events older than this date appear.";
  } else if (isPastList) {
    pastCutoffHint.textContent =
      "Auto-stop when loading past events older than this date.";
  }

  if ((isFeed || isPastList) && !pastMaxDateInput.value) {
    pastMaxDateInput.value = defaultPastMaxDate();
  }
}

function getScanMaxDate() {
  const source = getSelectedSource();
  const isPastList = source === "events-list" && getSelectedMode() === "past";

  if (source === "feed" || isPastList) {
    return pastMaxDateInput.value || null;
  }

  return null;
}

function syncSourceWithPage() {
  if (pageKind === "feed") {
    const feedInput = document.querySelector('input[name="source"][value="feed"]');
    if (feedInput) {
      feedInput.checked = true;
    }
  } else if (pageKind === "events-list") {
    const listInput = document.querySelector(
      'input[name="source"][value="events-list"]',
    );
    if (listInput) {
      listInput.checked = true;
    }
  }

  updateScanOptionsUi();
}

async function refreshStoreStatus() {
  if (!activeGroupId) {
    storeStatus.hidden = true;
    return;
  }

  const response = await chrome.runtime.sendMessage({
    action: "GET_STORE_STATS",
    groupId: activeGroupId,
  });

  if (!response?.ok) {
    storeStatus.hidden = true;
    return;
  }

  const stats = response.stats;

  if (stats.pastMaxDate && !pastMaxDateInput.value) {
    pastMaxDateInput.value = stats.pastMaxDate;
  }

  storeStatus.textContent = formatStoreStatus(stats);
  storeStatus.hidden = false;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab ?? null;
  activeGroupId = extractGroupId(tab?.url ?? "");
  pageKind = detectPageKind(tab?.url);

  ScrapExt.log.info("Popup opened", {
    tabId: tab?.id,
    url: tab?.url,
    pageKind,
  });

  if (!tab?.id || !activeGroupId || !pageKind) {
    pageStatus.textContent =
      "Open a Facebook group discussion or events page (…/groups/ID or …/groups/ID/events).";
    exportButton.disabled = true;
    return;
  }

  pageStatus.textContent =
    pageKind === "feed"
      ? "Ready on the group discussion feed."
      : "Ready on the group events list.";

  exportButton.disabled = false;
  syncSourceWithPage();
  await refreshStoreStatus();
}

/**
 * @param {ScrapFbEvent[]} events
 * @param {{ groupId?: string | null; groupName?: string | null }} context
 * @param {"upcoming" | "past"} mode
 * @param {string | null} pastMaxDate
 * @param {string} [stopNote]
 */
async function syncAndExport(
  events,
  context,
  mode,
  pastMaxDate,
  stopNote = "",
  scannedOnPage = events.length,
) {
  setProgress(
    scannedOnPage > 0
      ? `Saving ${scannedOnPage} from page to storage…`
      : "No events on page — refreshing saved events…",
  );

  if (!activeTab?.id) {
    throw new Error("Missing active tab.");
  }

  const syncResult = await chrome.runtime.sendMessage({
    action: "SYNC_AND_EXPORT",
    scrapedEvents: events,
    groupId: context?.groupId ?? activeGroupId,
    groupName: context?.groupName,
    mode,
    pastMaxDate,
    tabId: activeTab.id,
    saveAs: true,
  });

  if (!syncResult?.ok) {
    const failureLines = (syncResult.failures ?? [])
      .slice(0, 5)
      .map((failure) => `• ${failure.name}: ${failure.error}`)
      .join("\n");
    const suffix = failureLines ? `\n${failureLines}` : "";
    throw new Error(`${syncResult?.error ?? "Sync failed."}${suffix}`);
  }

  showStats(syncResult.stats);
  setProgress("");
  const totalExported =
    syncResult.stats.totalStored ?? syncResult.stats.exportTotal;
  const detailsNote = syncResult.stats.details
    ? ` · ${syncResult.stats.details.fetched} detail page(s) fetched`
    : "";
  const stoppedNote = syncResult.stats.stoppedEarly
    ? "Stopped early — "
    : stopNote;
  const scanned =
    syncResult.stats.scannedOnPage ?? scannedOnPage ?? events.length;
  setResult(
    `${stoppedNote}Exported ${totalExported} saved events (${formatSyncSummary(scanned, syncResult.stats)})${detailsNote}. Upload the .ics in Swing admin.`,
    "ok",
  );
  await refreshStoreStatus();
}

function formatStopReasonLabel(reason, source) {
  if (reason === "max-date" || reason === "past-max-date") {
    return "Max date reached";
  }
  if (reason === "max-scrolls") {
    return "Scroll limit reached";
  }
  if (reason === "idle" && source === "feed") {
    return "End of feed";
  }
  if (reason === "manual") {
    return "Stopped manually";
  }
  return "Stopped";
}

function formatStopNote(stopReason, source) {
  if (!stopReason || (stopReason === "idle" && source !== "feed")) {
    return "";
  }
  const label = formatStopReasonLabel(stopReason, source);
  if (stopReason === "manual") {
    return "Stopped early — ";
  }
  if (
    stopReason === "max-date" ||
    stopReason === "past-max-date" ||
    stopReason === "max-scrolls" ||
    (stopReason === "idle" && source === "feed")
  ) {
    return `${label} — `;
  }
  return "";
}

function formatScannedProgress(count, newThisScroll) {
  const base = `${count ?? 0} on page`;
  if (typeof newThisScroll === "number" && newThisScroll > 0) {
    return `${base} (+${newThisScroll} new this scroll)`;
  }
  return base;
}

function formatSyncSummary(scannedOnPage, stats) {
  const parts = [`${scannedOnPage} scanned on page`];
  parts.push(
    `${stats.new} new in storage`,
    `${stats.changed} changed`,
    `${stats.unchanged} unchanged`,
  );
  return parts.join(" · ");
}

async function exportEvents() {
  if (!activeTab?.id) {
    return;
  }

  const source = getSelectedSource();
  const mode = getSelectedMode();
  const pastMaxDate = getScanMaxDate();

  if (source === "events-list" && mode === "past" && !pastMaxDate) {
    setResult("Choose a max date for past events.", "error");
    return;
  }

  resultEl.hidden = true;
  hideStats();
  setSyncUi(true);
  setProgress(
    source === "feed" ? "Scrolling discussion feed…" : "Expanding list…",
  );

  try {
    ScrapExt.log.info("Starting sync", {
      tabId: activeTab.id,
      source,
      mode,
      pastMaxDate,
    });

    const scrapeResult = await chrome.tabs.sendMessage(activeTab.id, {
      action: "SCRAPE_EVENTS",
      source,
      mode,
      pastMaxDate,
    });

    if (!scrapeResult?.ok) {
      throw new Error(scrapeResult?.error ?? "Could not scrape this page.");
    }

    const stopNote = formatStopNote(scrapeResult.stopReason, source);
    const scannedOnPage = scrapeResult.events.length;
    await syncAndExport(
      scrapeResult.events,
      scrapeResult.context ?? {},
      mode,
      pastMaxDate,
      stopNote,
      scannedOnPage,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    ScrapExt.log.error("Export failed", error);

    if (message.includes("Could not establish connection")) {
      setResult(
        "Content script not loaded. Refresh the Facebook page and try again.",
        "error",
      );
    } else {
      setResult(message, "error");
    }

    setProgress("");
  } finally {
    setSyncUi(false);
  }
}

async function stopAndSave() {
  if (!activeTab?.id || !syncInProgress) {
    return;
  }

  stopButton.disabled = true;
  setProgress("Stopping… saving collected events…");

  try {
    await chrome.runtime.sendMessage({ action: "STOP_SYNC" });
    await chrome.tabs.sendMessage(activeTab.id, { action: "STOP_SCRAPE" });
  } catch (error) {
    ScrapExt.log.error("Stop request failed", error);
    stopButton.disabled = false;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "DETAILS_PROGRESS" && message.phase === "fetching") {
    setProgress(
      `Fetching details ${message.current ?? 0}/${message.total ?? 0}…`,
    );
    return;
  }

  if (message.type !== "SCRAPE_PROGRESS") {
    return;
  }

  const source = message.source === "feed" ? "feed" : "events-list";

  if (message.phase === "scrolling") {
    setProgress(
      `Scrolling feed… ${message.scrolls ?? 0} scrolls · ${formatScannedProgress(message.count, message.newThisScroll)}`,
    );
    return;
  }

  if (message.phase === "expanding") {
    setProgress("Clicking “Voir plus”…");
    return;
  }

  if (message.phase === "loading") {
    setProgress(
      `Loading list… (${message.clicks ?? 0} clicks · ${formatScannedProgress(message.count)})`,
    );
    return;
  }

  if (message.phase === "parsing") {
    setProgress("Parsing events…");
    return;
  }

  if (message.phase === "stopped") {
    const reason = formatStopReasonLabel(message.reason, source);
    const unit = source === "feed" ? message.scrolls : message.clicks;
    const unitLabel = source === "feed" ? "scrolls" : "clicks";
    setProgress(
      `${reason} · ${formatScannedProgress(message.count)} · saving… (${unit ?? 0} ${unitLabel})`,
    );
    return;
  }

  if (message.phase === "done") {
    const reasonNote = formatStopNote(message.stopReason, source);
    const unitLabel = source === "feed" ? "scrolls" : "clicks";
    const unit = source === "feed" ? message.scrolls : message.clicks;
    setProgress(
      `${reasonNote}${formatScannedProgress(message.count)} (${unit ?? 0} ${unitLabel}) · saving to storage…`,
    );
  }
});

for (const input of document.querySelectorAll('input[name="source"]')) {
  input.addEventListener("change", () => {
    updateScanOptionsUi();
  });
}

for (const input of document.querySelectorAll('input[name="mode"]')) {
  input.addEventListener("change", () => {
    updateScanOptionsUi();
  });
}

exportButton.addEventListener("click", () => {
  void exportEvents();
});

stopButton.addEventListener("click", () => {
  void stopAndSave();
});

void init();
