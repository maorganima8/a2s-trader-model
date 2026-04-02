// A2s Trade Guard - TradingView Content Script

(async () => {
  await A2sGuard.init("tradingview");

  // TradingView buy/sell button selectors
  const BUTTON_SELECTORS = [
    // Order panel buttons
    '[data-name="submit-button"]',
    // Buy/Sell buttons in the trading panel
    '.js-buy-sell-short-button',
    '.js-buy-sell-long-button',
    // DOM trading panel
    'button[class*="buyButton"]',
    'button[class*="sellButton"]',
    // Order dialog buttons
    '.order-dialog button[class*="submitButton"]',
    // Quick trade buttons
    'button[class*="shortButton"]',
    'button[class*="longButton"]',
    // Generic trade execution buttons
    '[data-name="place-order-button"]',
    '[data-name="buy-button"]',
    '[data-name="sell-button"]',
    // Paper trading buttons
    'button[class*="paperBuy"]',
    'button[class*="paperSell"]',
    // DOM (Depth of Market) buttons
    '.dom-panel button[class*="buy"]',
    '.dom-panel button[class*="sell"]',
  ];

  function scanAndProtect() {
    for (const selector of BUTTON_SELECTORS) {
      document.querySelectorAll(selector).forEach((btn) => {
        A2sGuard.protectButton(btn);
      });
    }

    // Also scan by text content for buttons containing buy/sell text
    document.querySelectorAll("button").forEach((btn) => {
      const text = btn.textContent?.trim().toLowerCase() || "";
      if (
        (text.includes("buy") || text.includes("sell") ||
         text.includes("long") || text.includes("short") ||
         text.includes("place order") || text.includes("submit order")) &&
        !btn.dataset.a2sProtected &&
        btn.offsetWidth > 0 // visible
      ) {
        // Verify it's likely a trade button (has certain parent classes or is in a trade panel)
        const parent = btn.closest('[class*="order"], [class*="trade"], [class*="dom"], [class*="panel"]');
        if (parent) {
          A2sGuard.protectButton(btn);
        }
      }
    });
  }

  // Initial scan
  scanAndProtect();

  // Watch for new buttons (TradingView loads elements dynamically)
  const observer = new MutationObserver(() => {
    scanAndProtect();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Re-scan periodically as TradingView can re-render panels
  setInterval(scanAndProtect, 3000);

  console.log("[A2s Trade Guard] TradingView protection active");
})();
