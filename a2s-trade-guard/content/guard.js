// A2s Trade Guard - Core guard logic (shared between platforms)

const A2sGuard = {
  isUnlocked: false,
  modalOpen: false,
  checklist: {},
  overlays: [],

  // Initialize the guard
  async init(platform) {
    this.platform = platform;
    this.checklist = await A2sStorage.getTodayChecklist();
    this.isUnlocked = await A2sStorage.isUnlocked();

    // Start heartbeat
    this.startHeartbeat();

    // Listen for storage changes (e.g., unlock from popup)
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.unlockUntil) {
        this.isUnlocked = Date.now() < (changes.unlockUntil.newValue || 0);
        this.updateOverlays();
      }
    });

    // Set up bypass detection (detect overlay removal)
    this.setupBypassDetection();

    console.log(`[A2s Trade Guard] Initialized on ${platform}`);
  },

  // Heartbeat to service worker
  startHeartbeat() {
    const sendHeartbeat = () => {
      chrome.runtime.sendMessage({ action: "heartbeat", platform: this.platform });
    };
    sendHeartbeat();
    setInterval(sendHeartbeat, 30000);
  },

  // Protect a trade button by adding an overlay
  protectButton(button) {
    if (button.dataset.a2sProtected) return;
    button.dataset.a2sProtected = "true";

    // Make button's parent relative for overlay positioning
    const parent = button.parentElement;
    const computedStyle = window.getComputedStyle(parent);
    if (computedStyle.position === "static") {
      parent.style.position = "relative";
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "a2s-guard-overlay";
    if (this.isUnlocked) overlay.classList.add("a2s-unlocked");

    overlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (this.isUnlocked) {
        // Let the click through
        overlay.style.pointerEvents = "none";
        button.click();
        setTimeout(() => { overlay.style.pointerEvents = ""; }, 100);
        return;
      }

      // Log blocked attempt
      A2sHistory.log(A2sHistory.TYPES.TRADE_BLOCKED, this.platform, {
        buttonText: button.textContent?.trim().slice(0, 50),
      });

      // Show toast
      this.showToast();

      // Open checklist modal
      this.openModal();
    }, true);

    parent.appendChild(overlay);
    this.overlays.push({ overlay, button });
  },

  // Update all overlays based on unlock state
  updateOverlays() {
    this.overlays.forEach(({ overlay }) => {
      if (this.isUnlocked) {
        overlay.classList.add("a2s-unlocked");
      } else {
        overlay.classList.remove("a2s-unlocked");
      }
    });
  },

  // Show blocked trade toast
  showToast() {
    // Remove existing toast
    document.querySelector(".a2s-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = "a2s-toast";
    toast.innerHTML = `
      <span class="a2s-toast-icon">🔒</span>
      <div>
        <div class="a2s-toast-text">עסקה חסומה - השלם את הצ'קליסט</div>
        <div class="a2s-toast-sub">לחץ כדי לפתוח את הצ'קליסט</div>
      </div>
    `;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add("a2s-toast-show");
    });

    // Auto-hide after 4s
    setTimeout(() => {
      toast.classList.remove("a2s-toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Open checklist modal
  openModal() {
    if (this.modalOpen) return;
    this.modalOpen = true;

    const backdrop = document.createElement("div");
    backdrop.className = "a2s-modal-backdrop";

    const doneCount = A2S_CHECKLIST_STEPS.filter((s) => this.checklist[s.id]).length;
    const total = A2S_CHECKLIST_STEPS.length;
    const pct = Math.round((doneCount / total) * 100);
    const allDone = doneCount === total;

    backdrop.innerHTML = `
      <div class="a2s-modal">
        <div class="a2s-modal-header">
          <div>
            <div class="a2s-modal-title">צ'קליסט לפני עסקה</div>
            <div class="a2s-modal-subtitle">השלם את כל השלבים כדי לסחור</div>
          </div>
          <button class="a2s-modal-close">&times;</button>
        </div>

        <div class="a2s-progress-container">
          <div class="a2s-progress-header">
            <span class="a2s-progress-label">התקדמות</span>
            <span class="a2s-progress-count ${allDone ? "a2s-complete" : ""}" id="a2s-progress-text">${doneCount}/${total}</span>
          </div>
          <div class="a2s-progress-bar">
            <div class="a2s-progress-fill" id="a2s-progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="a2s-ready-banner ${allDone ? "a2s-visible" : ""}" id="a2s-ready-banner">
          <span>✓ מוכן לסשן!</span>
        </div>

        <div class="a2s-steps" id="a2s-steps">
          ${A2S_CHECKLIST_STEPS.map((step, i) => `
            <div class="a2s-step ${this.checklist[step.id] ? "a2s-step-done" : ""}" data-step="${step.id}">
              <div class="a2s-step-circle">
                <span class="a2s-step-number">${i + 1}</span>
                <span class="a2s-step-check">✓</span>
              </div>
              <div class="a2s-step-content">
                <div class="a2s-step-title-row">
                  <span class="a2s-step-title">${step.title}</span>
                  <span class="a2s-step-tf">${step.tf}</span>
                </div>
                <div class="a2s-step-desc">${step.description}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="a2s-confirm-container">
          <button class="a2s-confirm-btn" id="a2s-confirm-btn" ${allDone ? "" : "disabled"}>
            ${allDone ? "אישור - פתח למסחר" : `השלם את כל ${total} השלבים`}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Close button
    backdrop.querySelector(".a2s-modal-close").addEventListener("click", () => {
      this.closeModal(backdrop);
    });

    // Backdrop click to close
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this.closeModal(backdrop);
    });

    // Step click handlers
    backdrop.querySelectorAll(".a2s-step").forEach((stepEl) => {
      stepEl.addEventListener("click", () => {
        const stepId = stepEl.dataset.step;
        this.checklist[stepId] = !this.checklist[stepId];
        A2sStorage.saveTodayChecklist(this.checklist);

        // Update UI
        stepEl.classList.toggle("a2s-step-done", this.checklist[stepId]);
        this.updateModalProgress(backdrop);
      });
    });

    // Confirm button
    backdrop.querySelector("#a2s-confirm-btn").addEventListener("click", async () => {
      const allChecked = A2S_CHECKLIST_STEPS.every((s) => this.checklist[s.id]);
      if (!allChecked) return;

      // Get unlock duration from settings
      const settings = await A2sStorage.getSettings();
      const durationMin = settings.unlockDurationMin || 30;

      // Unlock trading
      const unlockUntil = Date.now() + durationMin * 60 * 1000;
      await A2sStorage.setUnlockUntil(unlockUntil);
      this.isUnlocked = true;
      this.updateOverlays();

      // Log events
      await A2sHistory.log(A2sHistory.TYPES.CHECKLIST_COMPLETED, this.platform, {
        items: { ...this.checklist },
      });
      await A2sHistory.log(A2sHistory.TYPES.UNLOCKED, this.platform, {
        durationMin,
        unlockUntil: new Date(unlockUntil).toISOString(),
      });

      // Notify service worker
      chrome.runtime.sendMessage({ action: "unlockTrading", durationMin });

      this.closeModal(backdrop);
    });

    // Escape to close
    const escHandler = (e) => {
      if (e.key === "Escape") {
        this.closeModal(backdrop);
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  },

  // Update progress in modal
  updateModalProgress(backdrop) {
    const doneCount = A2S_CHECKLIST_STEPS.filter((s) => this.checklist[s.id]).length;
    const total = A2S_CHECKLIST_STEPS.length;
    const pct = Math.round((doneCount / total) * 100);
    const allDone = doneCount === total;

    backdrop.querySelector("#a2s-progress-text").textContent = `${doneCount}/${total}`;
    backdrop.querySelector("#a2s-progress-text").classList.toggle("a2s-complete", allDone);
    backdrop.querySelector("#a2s-progress-fill").style.width = `${pct}%`;
    backdrop.querySelector("#a2s-ready-banner").classList.toggle("a2s-visible", allDone);

    const btn = backdrop.querySelector("#a2s-confirm-btn");
    btn.disabled = !allDone;
    btn.textContent = allDone ? "אישור - פתח למסחר" : `השלם את כל ${total} השלבים`;
  },

  // Close modal
  closeModal(backdrop) {
    this.modalOpen = false;
    backdrop.style.opacity = "0";
    backdrop.style.transition = "opacity 0.2s ease";
    setTimeout(() => backdrop.remove(), 200);
  },

  // Detect overlay removal (bypass attempt via DevTools)
  setupBypassDetection() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed.classList?.contains("a2s-guard-overlay")) {
            // Overlay was removed externally
            A2sHistory.log(A2sHistory.TYPES.BYPASS_DETECTED, this.platform, {
              method: "overlay_removed",
            });

            // Re-protect the button
            const button = this.overlays.find((o) => o.overlay === removed)?.button;
            if (button) {
              button.dataset.a2sProtected = "";
              this.protectButton(button);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
};
