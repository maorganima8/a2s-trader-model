// Chrome Storage API wrapper for A2s Trade Guard

const A2sStorage = {
  // Get checklist state for today
  async getTodayChecklist() {
    const todayKey = `checklist_${new Date().toISOString().slice(0, 10)}`;
    const result = await chrome.storage.local.get(todayKey);
    return result[todayKey] || {};
  },

  // Save checklist state for today
  async saveTodayChecklist(checklist) {
    const todayKey = `checklist_${new Date().toISOString().slice(0, 10)}`;
    await chrome.storage.local.set({ [todayKey]: checklist });
  },

  // Get unlock timestamp
  async getUnlockUntil() {
    const result = await chrome.storage.local.get("unlockUntil");
    return result.unlockUntil || 0;
  },

  // Set unlock timestamp
  async setUnlockUntil(timestamp) {
    await chrome.storage.local.set({ unlockUntil: timestamp });
  },

  // Check if currently unlocked
  async isUnlocked() {
    const unlockUntil = await this.getUnlockUntil();
    return Date.now() < unlockUntil;
  },

  // Get settings
  async getSettings() {
    const result = await chrome.storage.local.get("settings");
    return result.settings || { unlockDurationMin: A2S_UNLOCK_DURATION_MIN };
  },

  // Save settings
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  },
};
