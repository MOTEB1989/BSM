/**
 * AI Provider Status Dashboard Component
 * 
 * Real-time status monitoring for all 5 AI providers:
 * - OpenAI (GPT-4)
 * - Google Gemini
 * - Anthropic Claude
 * - Perplexity
 * - Moonshot Kimi
 * 
 * Features:
 * - Real-time health checks
 * - Performance metrics
 * - Bilingual display (Arabic/English)
 * - Auto-refresh
 */

class ProviderStatusDashboard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.language = options.language || 'ar';
    this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
    this.apiUrl = options.apiUrl || '/api/chat/key-status';
    this.providers = {
      openai: {
        name: { ar: 'OpenAI GPT-4', en: 'OpenAI GPT-4' },
        icon: '🤖',
        color: '#10a37f'
      },
      gemini: {
        name: { ar: 'Google Gemini', en: 'Google Gemini' },
        icon: '✨',
        color: '#4285f4'
      },
      anthropic: {
        name: { ar: 'Anthropic Claude', en: 'Anthropic Claude' },
        icon: '🧠',
        color: '#d97706'
      },
      perplexity: {
        name: { ar: 'Perplexity AI', en: 'Perplexity AI' },
        icon: '🔍',
        color: '#7c3aed'
      },
      kimi: {
        name: { ar: 'Moonshot Kimi', en: 'Moonshot Kimi' },
        icon: '🌙',
        color: '#ec4899'
      }
    };
    
    this.init();
  }

  async init() {
    this.render();
    await this.updateStatus();
    this.startAutoRefresh();
  }

  render() {
    const isRTL = this.language === 'ar';
    
    this.container.innerHTML = `
      <div class="provider-status-dashboard" dir="${isRTL ? 'rtl' : 'ltr'}">
        <div class="dashboard-header">
          <h2>
            ${isRTL ? 'حالة مزودي الذكاء الاصطناعي' : 'AI Provider Status'}
          </h2>
          <button id="refresh-status" class="refresh-btn" title="${isRTL ? 'تحديث' : 'Refresh'}">
            🔄
          </button>
        </div>
        
        <div class="providers-grid" id="providers-grid">
          ${Object.entries(this.providers).map(([key, provider]) => `
            <div class="provider-card" data-provider="${key}">
              <div class="provider-icon">${provider.icon}</div>
              <div class="provider-info">
                <h3>${provider.name[this.language]}</h3>
                <div class="status-indicator loading">
                  <span class="status-dot"></span>
                  <span class="status-text">${isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
                </div>
                <div class="provider-metrics hidden">
                  <div class="metric">
                    <span class="metric-label">${isRTL ? 'زمن الاستجابة' : 'Latency'}</span>
                    <span class="metric-value latency">-</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">${isRTL ? 'آخر فحص' : 'Last Check'}</span>
                    <span class="metric-value last-check">-</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="dashboard-footer">
          <div class="overall-status">
            <span id="overall-status-text">${isRTL ? 'الحالة العامة:' : 'Overall Status:'}</span>
            <span id="overall-status-badge" class="status-badge loading">
              ${isRTL ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
          <div class="last-updated">
            ${isRTL ? 'آخر تحديث:' : 'Last Updated:'} <span id="last-updated-time">-</span>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('refresh-status')?.addEventListener('click', () => {
      this.updateStatus();
    });
  }

  async updateStatus() {
    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();
      
      this.displayStatus(data);
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
      this.displayError();
    }
  }

  displayStatus(data) {
    const isRTL = this.language === 'ar';
    
    // Update individual providers
    Object.entries(data.providers || {}).forEach(([key, status]) => {
      const card = this.container.querySelector(`[data-provider="${key}"]`);
      if (!card) return;

      const statusIndicator = card.querySelector('.status-indicator');
      const metrics = card.querySelector('.provider-metrics');
      
      // Update status
      const isActive = status.configured && status.status === 'active';
      statusIndicator.className = `status-indicator ${isActive ? 'active' : 'inactive'}`;
      
      const statusText = isActive 
        ? (isRTL ? 'نشط' : 'Active')
        : (isRTL ? 'غير نشط' : 'Inactive');
      
      statusIndicator.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">${statusText}</span>
      `;

      // Update metrics
      if (isActive && metrics) {
        metrics.classList.remove('hidden');
        
        const latency = status.latency || 'N/A';
        const lastCheck = status.lastChecked 
          ? new Date(status.lastChecked).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')
          : '-';
        
        metrics.querySelector('.latency').textContent = latency;
        metrics.querySelector('.last-check').textContent = lastCheck;
      }
    });

    // Update overall status
    const overallBadge = document.getElementById('overall-status-badge');
    const overall = data.overall || 'unknown';
    
    if (overallBadge) {
      overallBadge.className = `status-badge ${overall}`;
      overallBadge.textContent = overall === 'healthy'
        ? (isRTL ? 'صحي' : 'Healthy')
        : (isRTL ? 'متدهور' : 'Degraded');
    }

    // Update timestamp
    const timestamp = document.getElementById('last-updated-time');
    if (timestamp) {
      timestamp.textContent = new Date().toLocaleTimeString(
        isRTL ? 'ar-SA' : 'en-US'
      );
    }
  }

  displayError() {
    const isRTL = this.language === 'ar';
    const cards = this.container.querySelectorAll('.provider-card');
    
    cards.forEach(card => {
      const statusIndicator = card.querySelector('.status-indicator');
      statusIndicator.className = 'status-indicator error';
      statusIndicator.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">${isRTL ? 'خطأ' : 'Error'}</span>
      `;
    });
  }

  startAutoRefresh() {
    this.intervalId = setInterval(() => {
      this.updateStatus();
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setLanguage(language) {
    this.language = language;
    this.render();
    this.updateStatus();
  }

  destroy() {
    this.stopAutoRefresh();
    this.container.innerHTML = '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProviderStatusDashboard;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ProviderStatusDashboard = ProviderStatusDashboard;
}
