// A2s Trade Guard - TopStepX Content Script

(async () => {
  await A2sGuard.init("topstepx");

  // TopStepX buy/sell button selectors
  const BUTTON_SELECTORS = [
    // Main trade buttons
    'button[class*="buy"]',
    'button[class*="sell"]',
    'button[class*="Buy"]',
    'button[class*="Sell"]',
    // Order submission
    'button[class*="order"]',
    'button[class*="Order"]',
    'button[class*="submit"]',
    'button[class*="Submit"]',
    // Flatten / close position
    'button[class*="flatten"]',
    'button[class*="Flatten"]',
    // Long/Short buttons
    'button[class*="long"]',
    'button[class*="Long"]',
    'button[class*="short"]',
    'button[class*="Short"]',
    // DOM ladder buttons
    '[class*="ladder"] button',
    '[class*="dom"] button',
    // Quick order buttons
    '[class*="quickOrder"] button',
    '[class*="quick-order"] button',
  ];

  function scanAndProtect() {
    for (const selector of BUTTON_SELECTORS) {
      try {
        document.querySelectorAll(selector).forEach((btn) => {
          A2sGuard.protectButton(btn);
        });
      } catch {
        // Invalid selector, skip
      }
    }

    // Scan by text content
    document.querySelectorAll("button").forEach((btn) => {
      const text = btn.textContent?.trim().toLowerCase() || "";
      if (
        (text.includes("buy") || text.includes("sell") ||
         text.includes("long") || text.includes("short") ||
         text.includes("place") || text.includes("submit") ||
         text.includes("flatten") || text.includes("market") ||
         text.includes("limit")) &&
        !btn.dataset.a2sProtected &&
        btn.offsetWidth > 0
      ) {
        A2sGuard.protectButton(btn);
      }
    });
  }

  // Initial scan (wait for app to load)
  setTimeout(scanAndProtect, 2000);

  // Watch for dynamic elements
  const observer = new MutationObserver(() => {
    scanAndProtect();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Periodic re-scan
  setInterval(scanAndProtect, 3000);

  console.log("[A2s Trade Guard] TopStepX protection active");
})();
