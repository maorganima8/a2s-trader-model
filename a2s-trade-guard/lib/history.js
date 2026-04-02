// History & logging for A2s Trade Guard

const A2sHistory = {
  // Log an event
  async log(type, platform, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      platform,
      details,
    };

    const result = await chrome.storage.local.get("history");
    const history = result.history || [];
    history.unshift(event); // newest first

    // Keep last 500 events
    if (history.length > 500) history.length = 500;

    await chrome.storage.local.set({ history });

    // Notify service worker
    chrome.runtime.sendMessage({ action: "logEvent", event });

    return event;
  },

  // Get all history
  async getAll() {
    const result = await chrome.storage.local.get("history");
    return result.history || [];
  },

  // Get history filtered by type
  async getByType(type) {
    const all = await this.getAll();
    return all.filter((e) => e.type === type);
  },

  // Get today's history
  async getToday() {
    const today = new Date().toISOString().slice(0, 10);
    const all = await this.getAll();
    return all.filter((e) => e.timestamp.startsWith(today));
  },

  // Clear all history
  async clear() {
    await chrome.storage.local.set({ history: [] });
  },

  // Event types
  TYPES: {
    CHECKLIST_COMPLETED: "checklist_completed",
    TRADE_BLOCKED: "trade_attempted_blocked",
    BYPASS_DETECTED: "bypass_detected",
    GUARD_DISABLED: "guard_disabled",
    GUARD_ENABLED: "guard_enabled",
    UNLOCKED: "unlocked",
  },
};
