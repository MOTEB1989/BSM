/**
 * Auto-display AI key status in UI
 * Updates every 30 seconds
 */
class KeyStatusDisplay {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.createStatusBar();
    this.startAutoUpdate();
  }

  createStatusBar() {
    const existing = document.getElementById("ai-key-status");
    if (existing) {
      this.container = existing;
      return;
    }

    const header = document.querySelector("header") || document.body;
    this.container = document.createElement("div");
    this.container.id = "ai-key-status";
    this.container.className = "key-status-bar";
    this.container.innerHTML = '<div class="status-loading">🔄 Checking AI keys...</div>';
    header.prepend(this.container);

    if (!document.getElementById("ai-key-status-style")) {
      const style = document.createElement("style");
      style.id = "ai-key-status-style";
      style.textContent = `
        .key-status-bar {
          background: #1a1a2e;
          color: #fff;
          padding: 8px 16px;
          font-size: 12px;
          display: flex;
          gap: 16px;
          align-items: center;
          border-bottom: 1px solid #333;
        }
        .key-status-bar .provider {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .key-status-bar .provider.active {
          color: #4ade80;
        }
        .key-status-bar .provider.failed {
          color: #f87171;
        }
        .key-status-bar .last-check {
          margin-left: auto;
          color: #9ca3af;
        }
      `;
      document.head.appendChild(style);
    }
  }

  async update() {
    try {
      const response = await fetch("/api/chat/key-status", {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const html = Object.entries(data.ui || {})
        .map(([provider, text]) => {
          const providerStatus = data.status?.[provider];
          const isActive = typeof providerStatus === "boolean"
            ? providerStatus
            : providerStatus === "true";
          return `<span class="provider ${isActive ? "active" : "failed"}">${text}</span>`;
        })
        .join("");

      this.container.innerHTML = `
        ${html}
        <span class="last-check">Updated: ${new Date(data.timestamp).toLocaleTimeString("ar-SA")}</span>
      `;
    } catch (error) {
      this.container.innerHTML = '<span class="provider failed">⚠️ Could not load key status</span>';
    }
  }

  startAutoUpdate() {
    this.update();
    setInterval(() => this.update(), 30000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.keyStatusDisplay = new KeyStatusDisplay();
});
