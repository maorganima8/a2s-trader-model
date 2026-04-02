// A2s Trade Guard - Popup Logic

document.addEventListener("DOMContentLoaded", async () => {
  await loadChecklist();
  await loadStatus();
  await loadTodayStats();
  setupTabs();
  setupSettings();

  // Refresh every 10 seconds
  setInterval(loadStatus, 10000);
});

// --- Checklist ---

async function loadChecklist() {
  const todayKey = `checklist_${new Date().toISOString().slice(0, 10)}`;
  const result = await chrome.storage.local.get(todayKey);
  const checklist = result[todayKey] || {};

  const container = document.getElementById("checklist");
  const doneCount = A2S_CHECKLIST_STEPS.filter((s) => checklist[s.id]).length;
  const total = A2S_CHECKLIST_STEPS.length;

  document.getElementById("checklist-count").textContent = `${doneCount}/${total}`;
  document.getElementById("checklist-count").classList.toggle("complete", doneCount === total);

  container.innerHTML = A2S_CHECKLIST_STEPS.map((step, i) => `
    <div class="check-item ${checklist[step.id] ? "done" : ""}" data-step="${step.id}">
      <div class="check-circle">
        <span class="check-number">${i + 1}</span>
        <span class="check-mark">✓</span>
      </div>
      <span class="check-label">${step.title}</span>
      <span class="check-tf">${step.tf}</span>
    </div>
  `).join("");

  // Click handlers
  container.querySelectorAll(".check-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const stepId = item.dataset.step;
      checklist[stepId] = !checklist[stepId];
      await chrome.storage.local.set({ [todayKey]: checklist });
      await loadChecklist();
      await updateUnlockButton();
    });
  });

  await updateUnlockButton();
}

async function updateUnlockButton() {
  const todayKey = `checklist_${new Date().toISOString().slice(0, 10)}`;
  const result = await chrome.storage.local.get(todayKey);
  const checklist = result[todayKey] || {};
  const allDone = A2S_CHECKLIST_STEPS.every((s) => checklist[s.id]);

  const unlockResult = await chrome.storage.local.get("unlockUntil");
  const isUnlocked = Date.now() < (unlockResult.unlockUntil || 0);

  const btn = document.getElementById("btn-unlock");

  if (isUnlocked) {
    btn.disabled = true;
    btn.textContent = "✓ מסחר פתוח";
    btn.style.background = "rgba(34, 197, 94, 0.15)";
    btn.style.color = "#22c55e";
  } else if (allDone) {
    btn.disabled = false;
    btn.textContent = "פתח למסחר";
    btn.style.background = "";
    btn.style.color = "";
  } else {
    btn.disabled = true;
    btn.textContent = "השלם צ'קליסט כדי לפתוח";
    btn.style.background = "";
    btn.style.color = "";
  }

  btn.onclick = async () => {
    if (btn.disabled) return;
    const settings = await chrome.storage.local.get("settings");
    const durationMin = (settings.settings?.unlockDurationMin) || 30;

    const unlockUntil = Date.now() + durationMin * 60 * 1000;
    await chrome.storage.local.set({ unlockUntil });

    // Log
    const event = {
      timestamp: new Date().toISOString(),
      type: "checklist_completed",
      platform: "popup",
      details: { items: { ...checklist } },
    };
    const histResult = await chrome.storage.local.get("history");
    const history = histResult.history || [];
    history.unshift(event);
    if (history.length > 500) history.length = 500;
    await chrome.storage.local.set({ history });

    chrome.runtime.sendMessage({ action: "unlockTrading", durationMin });

    await loadStatus();
    await updateUnlockButton();
    await loadTodayStats();
  };
}

// --- Status ---

async function loadStatus() {
  const result = await chrome.storage.local.get("unlockUntil");
  const unlockUntil = result.unlockUntil || 0;
  const isUnlocked = Date.now() < unlockUntil;

  const card = document.getElementById("status-card");
  const label = document.getElementById("status-label");
  const timer = document.getElementById("status-timer");
  const dot = document.getElementById("status-dot");
  const sub = document.getElementById("status-text");

  card.className = `status-card ${isUnlocked ? "unlocked" : "locked"}`;

  if (isUnlocked) {
    label.textContent = "מסחר פתוח";
    sub.textContent = "הצ'קליסט הושלם - מוכן לסשן";

    const remaining = Math.ceil((unlockUntil - Date.now()) / 60000);
    timer.textContent = `נסגר בעוד ${remaining} דקות`;
  } else {
    label.textContent = "מסחר חסום";
    sub.textContent = "השלם את הצ'קליסט כדי לסחור";
    timer.textContent = "";
  }
}

// --- Today Stats ---

async function loadTodayStats() {
  const result = await chrome.storage.local.get("history");
  const history = result.history || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = history.filter((e) => e.timestamp.startsWith(today));

  const blocked = todayEvents.filter((e) => e.type === "trade_attempted_blocked").length;
  const completed = todayEvents.filter((e) => e.type === "checklist_completed").length;
  const bypasses = todayEvents.filter((e) =>
    e.type === "bypass_detected" || e.type === "guard_disabled"
  ).length;

  document.getElementById("stat-blocked").textContent = blocked;
  document.getElementById("stat-completed").textContent = completed;
  document.getElementById("stat-bypasses").textContent = bypasses;

  // Events list
  const eventsContainer = document.getElementById("today-events");

  if (todayEvents.length === 0) {
    eventsContainer.innerHTML = '<div class="empty-state">אין אירועים היום</div>';
    return;
  }

  eventsContainer.innerHTML = todayEvents.slice(0, 20).map((e) => `
    <div class="event-item">
      <span class="event-icon">${getEventIcon(e.type)}</span>
      <div class="event-info">
        <div class="event-text">${getEventText(e.type)}</div>
        <div class="event-time">${formatTime(e.timestamp)}</div>
      </div>
      ${e.platform ? `<span class="event-platform">${e.platform}</span>` : ""}
    </div>
  `).join("");
}

// --- History Tab ---

async function loadHistory() {
  const result = await chrome.storage.local.get("history");
  const history = result.history || [];
  const container = document.getElementById("history-events");

  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">אין היסטוריה</div>';
    return;
  }

  container.innerHTML = history.slice(0, 50).map((e) => `
    <div class="event-item">
      <span class="event-icon">${getEventIcon(e.type)}</span>
      <div class="event-info">
        <div class="event-text">${getEventText(e.type)}</div>
        <div class="event-time">${formatDateTime(e.timestamp)}</div>
      </div>
      ${e.platform ? `<span class="event-platform">${e.platform}</span>` : ""}
    </div>
  `).join("");
}

// --- Tabs ---

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");

      if (tab.dataset.tab === "history") loadHistory();
    });
  });
}

// --- Settings ---

function setupSettings() {
  const input = document.getElementById("setting-duration");

  chrome.storage.local.get("settings").then((result) => {
    const settings = result.settings || {};
    input.value = settings.unlockDurationMin || 30;
  });

  input.addEventListener("change", async () => {
    const value = Math.max(5, Math.min(480, parseInt(input.value) || 30));
    input.value = value;
    await chrome.storage.local.set({
      settings: { unlockDurationMin: value },
    });
  });
}

// --- Helpers ---

function getEventIcon(type) {
  const icons = {
    checklist_completed: "✅",
    trade_attempted_blocked: "🔒",
    bypass_detected: "⚠️",
    guard_disabled: "🚨",
    guard_enabled: "🛡️",
    unlocked: "🔓",
  };
  return icons[type] || "📌";
}

function getEventText(type) {
  const texts = {
    checklist_completed: "צ'קליסט הושלם",
    trade_attempted_blocked: "ניסיון עסקה נחסם",
    bypass_detected: "זוהתה עקיפה",
    guard_disabled: "התוסף הושבת",
    guard_enabled: "התוסף הופעל",
    unlocked: "מסחר נפתח",
  };
  return texts[type] || type;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
