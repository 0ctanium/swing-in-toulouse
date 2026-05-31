const pageStatus = document.getElementById("page-status");
const storeStatus = document.getElementById("store-status");
const pastCutoffField = document.getElementById("past-cutoff-field");
const pastMaxDateInput = document.getElementById("past-max-date");
const exportButton = document.getElementById("export-btn");
const stopButton = document.getElementById("stop-btn");
const progressEl = document.getElementById("progress");
const resultEl = document.getElementById("result");
const statsSection = document.getElementById("stats");
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
 *   exportTotal: number;
 *   totalStored?: number;
 *   upcomingCount?: number;
 *   notSeenThisRun: number;
 *   pastMaxDate?: string | null;
 * }} stats
 */
function showStats(stats) {
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

function getSelectedMode() {
  const selected = document.querySelector('input[name="mode"]:checked');
  return selected?.value === "past" ? "past" : "upcoming";
}

function isGroupEventsUrl(url) {
  return /^https:\/\/www\.facebook\.com\/groups\/(\d+)\/events/.test(url ?? "");
}

function extractGroupId(url) {
  return url?.match(/^https:\/\/www\.facebook\.com\/groups\/(\d+)\/events/)?.[1] ?? null;
}

function defaultPastMaxDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updatePastCutoffVisibility() {
  const isPast = getSelectedMode() === "past";
  pastCutoffField.hidden = !isPast;
  pastMaxDateInput.required = isPast;

  if (isPast && !pastMaxDateInput.value) {
    pastMaxDateInput.value = defaultPastMaxDate();
  }
}

function getPastMaxDate() {
  if (getSelectedMode() !== "past") {
    return null;
  }

  return pastMaxDateInput.value || null;
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

  ScrapExt.log.info("Popup opened", { tabId: tab?.id, url: tab?.url });

  if (!tab?.id || !isGroupEventsUrl(tab.url)) {
    pageStatus.textContent =
      "Open a Facebook group events page first (…/groups/ID/events).";
    exportButton.disabled = true;
    return;
  }

  pageStatus.textContent = "Ready on the current group events page.";
  exportButton.disabled = false;
  updatePastCutoffVisibility();
  await refreshStoreStatus();
}

/**
 * @param {ScrapFbEvent[]} events
 * @param {{ groupId?: string | null; groupName?: string | null }} context
 * @param {"upcoming" | "past"} mode
 * @param {string | null} pastMaxDate
 * @param {string} [stopNote]
 */
async function syncAndExport(events, context, mode, pastMaxDate, stopNote = "") {
  setProgress(
    events.length > 0
      ? `Syncing ${events.length} scraped from page…`
      : "No new events on page — loading saved events…",
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
  setResult(
    `${stoppedNote}Exported ${totalExported} saved events${detailsNote}. Upload the .ics in Swing admin.`,
    "ok",
  );
  await refreshStoreStatus();
}

async function exportEvents() {
  if (!activeTab?.id) {
    return;
  }

  const mode = getSelectedMode();
  const pastMaxDate = getPastMaxDate();

  if (mode === "past" && !pastMaxDate) {
    setResult("Choose a max date for past events.", "error");
    return;
  }

  resultEl.hidden = true;
  hideStats();
  setSyncUi(true);
  setProgress("Expanding list…");

  try {
    ScrapExt.log.info("Starting sync", {
      tabId: activeTab.id,
      mode,
      pastMaxDate,
    });

    const scrapeResult = await chrome.tabs.sendMessage(activeTab.id, {
      action: "SCRAPE_EVENTS",
      mode,
      pastMaxDate,
    });

    if (!scrapeResult?.ok) {
      throw new Error(scrapeResult?.error ?? "Could not scrape this page.");
    }

    const stopNote =
      scrapeResult.stopReason === "manual"
        ? "Stopped early — "
        : scrapeResult.stopReason === "past-max-date"
          ? "Max date reached — "
          : "";
    await syncAndExport(
      scrapeResult.events,
      scrapeResult.context ?? {},
      mode,
      pastMaxDate,
      stopNote,
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

  if (message.phase === "expanding") {
    setProgress("Clicking “Voir plus”…");
    return;
  }

  if (message.phase === "loading") {
    setProgress(`Loading… (${message.clicks ?? 0} clicks)`);
    return;
  }

  if (message.phase === "parsing") {
    setProgress("Parsing events…");
    return;
  }

  if (message.phase === "stopped") {
    const reason =
      message.reason === "past-max-date"
        ? "Max date reached"
        : "Stopped manually";
    setProgress(`${reason} · saving… (${message.clicks ?? 0} clicks)`);
    return;
  }

  if (message.phase === "done") {
    const reasonNote =
      message.stopReason === "past-max-date"
        ? "Max date reached · "
        : message.stopReason === "manual"
          ? "Stopped · "
          : "";
    setProgress(
      `${reasonNote}${message.count ?? 0} on page · updating all saved events…`,
    );
  }
});

for (const input of document.querySelectorAll('input[name="mode"]')) {
  input.addEventListener("change", () => {
    updatePastCutoffVisibility();
  });
}

exportButton.addEventListener("click", () => {
  void exportEvents();
});

stopButton.addEventListener("click", () => {
  void stopAndSave();
});

void init();
