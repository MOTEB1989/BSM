/**
 * Smart Key Manager - Auto-rotation & Failover
 * No human intervention needed
 */
class SmartKeyManager {
  constructor() {
    this.keys = {
      openai: {
        primary: process.env.OPENAI_BSM_KEY,
        fallback: process.env.OPENAI_FALLBACK_KEY,
        status: "unknown",
        lastUsed: null,
        failCount: 0
      },
      anthropic: {
        primary: process.env.ANTHROPIC_KEY,
        fallback: process.env.ANTHROPIC_FALLBACK_KEY,
        status: "unknown",
        lastUsed: null,
        failCount: 0
      },
      perplexity: {
        primary: process.env.PERPLEXITY_KEY,
        fallback: null,
        status: "unknown",
        lastUsed: null,
        failCount: 0
      },
      google: {
        primary: process.env.GOOGLE_AI_KEY,
        fallback: null,
        status: "unknown",
        lastUsed: null,
        failCount: 0
      }
    };

    this.currentProvider = "openai";
    this.usageStats = new Map();
  }

  /**
   * Get best available key with auto-failover
   */
  async getKey(provider) {
    const keyData = this.keys[provider];
    if (!keyData) {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    if (keyData.primary && keyData.status !== "failed" && keyData.failCount < 3) {
      keyData.lastUsed = Date.now();
      return keyData.primary;
    }

    if (keyData.fallback && keyData.status !== "failed") {
      keyData.lastUsed = Date.now();
      console.log(`🔄 Using fallback key for ${provider}`);
      return keyData.fallback;
    }

    console.warn(`⚠️ All ${provider} keys failed or missing, switching provider...`);
    return this.switchProvider(provider);
  }

  /**
   * Auto-switch to alternative provider
   */
  switchProvider(failedProvider) {
    const alternatives = {
      openai: ["anthropic", "google"],
      anthropic: ["openai", "google"],
      perplexity: ["openai", "google"],
      google: ["openai", "anthropic"]
    };

    for (const alt of alternatives[failedProvider] || []) {
      const provider = this.keys[alt];
      if (provider && provider.status !== "failed" && provider.primary) {
        this.currentProvider = alt;
        provider.lastUsed = Date.now();
        console.log(`✅ Switched to ${alt}`);
        return provider.primary;
      }
    }

    throw new Error("All AI providers failed or are missing credentials");
  }

  /**
   * Report key failure (auto-rotation trigger)
   */
  reportFailure(provider) {
    const keyData = this.keys[provider];
    if (!keyData) {
      return;
    }

    keyData.failCount += 1;
    if (keyData.failCount >= 3) {
      keyData.status = "failed";
      this.notifyFailure(provider);
    }
  }

  /**
   * Report key success (reset counter)
   */
  reportSuccess(provider) {
    const keyData = this.keys[provider];
    if (!keyData) {
      return;
    }

    keyData.failCount = 0;
    keyData.status = "active";
    keyData.lastUsed = Date.now();
  }

  /**
   * Auto-notify on failure (placeholder for Slack/Email)
   */
  notifyFailure(provider) {
    console.error(`🚨 ${provider} key failed after 3 attempts`);
    // Integrate with external Key Management Layer + alerting channel.
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      providers: Object.entries(this.keys).map(([name, data]) => ({
        name,
        status: data.status,
        failCount: data.failCount,
        hasPrimary: Boolean(data.primary),
        hasFallback: Boolean(data.fallback),
        lastUsed: data.lastUsed
      })),
      currentProvider: this.currentProvider
    };
  }

  /**
   * Fetch latest status from GitHub-generated JSON
   */
  async fetchRemoteStatus() {
    try {
      const response = await fetch("https://corehub.nexus/status/ai-keys.json", {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const status = await response.json();
      Object.entries(status.status || {}).forEach(([provider, isValid]) => {
        if (this.keys[provider]) {
          this.keys[provider].status = String(isValid) === "true" ? "active" : "failed";
        }
      });

      return status;
    } catch (error) {
      console.warn("Could not fetch remote status:", error.message);
      return null;
    }
  }
}

export const keyManager = new SmartKeyManager();

const interval = setInterval(() => {
  keyManager.fetchRemoteStatus();
}, 5 * 60 * 1000);

if (typeof interval.unref === "function") {
  interval.unref();
}
