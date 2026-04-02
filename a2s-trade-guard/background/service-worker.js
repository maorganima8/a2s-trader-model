// A2s Trade Guard - Background Service Worker

// Track heartbeats from content scripts
const heartbeats = {};

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "heartbeat":
      handleHeartbeat(sender.tab?.id, message.platform);
      sendResponse({ ok: true });
      break;

    case "logEvent":
      updateBadge();
      break;

    case "checkUnlock":
      checkUnlockStatus().then(sendResponse);
      return true; // async response

    case "getStatus":
      getFullStatus().then(sendResponse);
      return true;

    case "unlockTrading":
      unlockTrading(message.durationMin).then(sendResponse);
      return true;
  }
});

// Heartbeat tracking for bypass detection
function handleHeartbeat(tabId, platform) {
  if (!tabId) return;
  heartbeats[tabId] = { timestamp: Date.now(), platform };
}

// Check for stale heartbeats every 60 seconds
setInterval(async () => {
  const now = Date.now();
  for (const [tabId, info] of Object.entries(heartbeats)) {
    // If no heartbeat for 90 seconds, the guard might have been disabled
    if (now - info.timestamp > 90000) {
      // Verify tab still exists
      try {
        await chrome.tabs.get(Number(tabId));
        // Tab exists but heartbeat stopped → possible bypass
        await logBypass(info.platform);
      } catch {
        // Tab closed, clean up
      }
      delete heartbeats[tabId];
    }
  }
}, 60000);

async function logBypass(platform) {
  const event = {
    timestamp: new Date().toISOString(),
    type: "guard_disabled",
    platform,
    details: { reason: "heartbeat_stopped" },
  };
  const result = await chrome.storage.local.get("history");
  const history = result.history || [];
  history.unshift(event);
  if (history.length > 500) history.length = 500;
  await chrome.storage.local.set({ history });
  updateBadge();
}

async function checkUnlockStatus() {
  const result = await chrome.storage.local.get("unlockUntil");
  const unlockUntil = result.unlockUntil || 0;
  return { unlocked: Date.now() < unlockUntil, unlockUntil };
}

async function unlockTrading(durationMin = 30) {
  const unlockUntil = Date.now() + durationMin * 60 * 1000;
  await chrome.storage.local.set({ unlockUntil });
  updateBadge();

  // Schedule re-lock
  setTimeout(() => updateBadge(), durationMin * 60 * 1000);

  return { unlocked: true, unlockUntil };
}

async function getFullStatus() {
  const [unlockData, todayKey] = await Promise.all([
    chrome.storage.local.get("unlockUntil"),
    chrome.storage.local.get(`checklist_${new Date().toISOString().slice(0, 10)}`),
  ]);

  const unlockUntil = unlockData.unlockUntil || 0;
  const checklist = todayKey[`checklist_${new Date().toISOString().slice(0, 10)}`] || {};
  const allDone = A2S_CHECKLIST_STEPS_IDS.every((id) => checklist[id]);

  return {
    unlocked: Date.now() < unlockUntil,
    unlockUntil,
    checklist,
    allDone,
  };
}

const A2S_CHECKLIST_STEPS_IDS = ["step1", "step2", "step3", "step4", "step5", "step6"];

// Update extension badge
async function updateBadge() {
  const { unlocked } = await checkUnlockStatus();

  if (unlocked) {
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
    chrome.action.setBadgeText({ text: "✓" });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    chrome.action.setBadgeText({ text: "!" });
  }
}

// Initial badge state
updateBadge();

// Update badge when storage changes
chrome.storage.onChanged.addListener(() => updateBadge());
