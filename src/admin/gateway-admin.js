// AI Gateway Admin UI JavaScript

const API_BASE = '/api/gateway/admin';
let adminToken = localStorage.getItem('gateway_admin_token') || '';

// Prompt for admin token if not set
if (!adminToken) {
  adminToken = prompt('Enter Admin Token:');
  if (adminToken) {
    localStorage.setItem('gateway_admin_token', adminToken);
  }
}

// API helper
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'X-Admin-Token': adminToken,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 403) {
      alert('Invalid admin token. Please refresh and enter the correct token.');
      localStorage.removeItem('gateway_admin_token');
      location.reload();
      return null;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    showAlert('keyAlert', err.message, 'error');
    throw err;
  }
}

// Tab switching
function showTab(tabName) {
  // Hide all panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Deactivate all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected panel
  document.getElementById(tabName).classList.add('active');

  // Activate selected tab
  event.target.classList.add('active');

  // Load data for the selected tab
  switch(tabName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'apikeys':
      loadApiKeys();
      break;
    case 'providers':
      loadProviders();
      break;
    case 'analytics':
      loadAnalytics();
      break;
    case 'pricing':
      loadPricing();
      break;
  }
}

// Show alert message
function showAlert(elementId, message, type = 'success') {
  const alertDiv = document.getElementById(elementId);
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('hidden');
  
  setTimeout(() => {
    alertDiv.classList.add('hidden');
  }, 5000);
}

// Dashboard
async function loadDashboard() {
  try {
    const [health, providers, apiKeys] = await Promise.all([
      apiCall('/health'),
      fetch('/api/gateway/providers').then(r => r.json()),
      apiCall('/api-keys')
    ]);

    // Update stats
    document.getElementById('totalKeys').textContent = apiKeys.total || 0;
    document.getElementById('activeProviders').textContent = providers.total || 0;

    // Health status
    const healthHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div>
          <strong>Database:</strong> 
          <span class="badge ${health.health.database === 'connected' ? 'badge-success' : 'badge-danger'}">
            ${health.health.database}
          </span>
        </div>
        <div>
          <strong>Redis:</strong> 
          <span class="badge ${health.health.redis === 'connected' ? 'badge-success' : 'badge-danger'}">
            ${health.health.redis}
          </span>
        </div>
        <div>
          <strong>Active Providers:</strong> 
          <span class="badge badge-success">${health.health.providers.active} / ${health.health.providers.total}</span>
        </div>
        <div>
          <strong>API Keys:</strong> 
          <span class="badge badge-success">${health.health.apiKeys.active} / ${health.health.apiKeys.total}</span>
        </div>
      </div>
    `;
    document.getElementById('healthStatus').innerHTML = healthHtml;

    // Provider status
    const providerHtml = providers.providers.map(p => `
      <div class="provider-status" style="margin-bottom: 10px;">
        <div class="status-indicator ${p.available ? 'online' : 'offline'}"></div>
        <div style="flex: 1;">
          <strong>${p.name}</strong> (Priority: ${p.priority})
          <br>
          <small>Models: ${p.models.join(', ')}</small>
        </div>
        <span class="badge ${p.available ? 'badge-success' : 'badge-danger'}">
          ${p.available ? 'Available' : 'Unavailable'}
        </span>
      </div>
    `).join('');
    document.getElementById('providerStatus').innerHTML = providerHtml || 'No providers configured';

  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

// API Keys Management
document.getElementById('createKeyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    user_id: document.getElementById('userId').value,
    description: document.getElementById('keyDescription').value,
    daily_quota: parseInt(document.getElementById('dailyQuota').value),
    monthly_quota: parseInt(document.getElementById('monthlyQuota').value)
  };

  try {
    const result = await apiCall('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (result.success) {
      showAlert('keyAlert', 'API Key created successfully!', 'success');
      
      // Show the API key in a modal-like alert
      const keyDisplay = `
        <strong>⚠️ IMPORTANT: Save this API key now. It will not be shown again!</strong>
        <div class="code-block" style="margin-top: 10px; user-select: all;">${result.apiKey}</div>
        <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${result.apiKey}'); alert('Copied to clipboard!');" style="margin-top: 10px;">
          Copy to Clipboard
        </button>
      `;
      document.getElementById('keyAlert').innerHTML = keyDisplay;
      document.getElementById('keyAlert').classList.remove('alert-error');
      document.getElementById('keyAlert').classList.add('alert-success');
      
      // Reset form and reload keys
      e.target.reset();
      setTimeout(() => loadApiKeys(), 2000);
    }
  } catch (err) {
    console.error('Failed to create API key:', err);
  }
});

async function loadApiKeys() {
  try {
    const data = await apiCall('/api-keys');
    const tbody = document.getElementById('apiKeysBody');
    
    if (!data.apiKeys || data.apiKeys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No API keys found</td></tr>';
      return;
    }

    tbody.innerHTML = data.apiKeys.map(key => `
      <tr>
        <td>${key.id}</td>
        <td><code>${key.key_prefix}...</code></td>
        <td>${key.user_id}</td>
        <td>${key.description || '-'}</td>
        <td>
          <span class="badge ${key.is_active ? 'badge-success' : 'badge-danger'}">
            ${key.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${key.today_requests || 0}</td>
        <td>${key.daily_quota || 'Unlimited'}</td>
        <td>
          <button class="btn btn-danger" onclick="revokeKey(${key.id})" style="padding: 5px 10px; font-size: 0.9em;">
            Revoke
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load API keys:', err);
  }
}

async function revokeKey(keyId) {
  if (!confirm('Are you sure you want to revoke this API key?')) {
    return;
  }

  try {
    await apiCall(`/api-keys/${keyId}`, { method: 'DELETE' });
    alert('API key revoked successfully');
    loadApiKeys();
  } catch (err) {
    console.error('Failed to revoke key:', err);
  }
}

// Providers Management
async function loadProviders() {
  try {
    const data = await apiCall('/providers');
    const tbody = document.getElementById('providersBody');
    
    if (!data.providers || data.providers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No providers found</td></tr>';
      return;
    }

    tbody.innerHTML = data.providers.map(p => `
      <tr>
        <td><strong>${p.display_name}</strong></td>
        <td>
          <span class="badge ${p.is_active ? 'badge-success' : 'badge-danger'}">
            ${p.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${p.priority}</td>
        <td><small>${p.config?.models?.join(', ') || 'N/A'}</small></td>
        <td>${p.timeout_ms}ms</td>
        <td>
          <button class="btn btn-primary" onclick="toggleProvider(${p.id}, ${!p.is_active})" 
                  style="padding: 5px 10px; font-size: 0.9em;">
            ${p.is_active ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load providers:', err);
  }
}

async function toggleProvider(providerId, isActive) {
  try {
    await apiCall(`/providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
    alert('Provider updated successfully');
    loadProviders();
  } catch (err) {
    console.error('Failed to update provider:', err);
  }
}

// Analytics
async function loadAnalytics() {
  try {
    // Load top users
    const topUsers = await apiCall('/analytics/top-users?limit=10&metric=requests');
    const topUsersBody = document.getElementById('topUsersBody');
    
    if (!topUsers.topUsers || topUsers.topUsers.length === 0) {
      topUsersBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No usage data available</td></tr>';
    } else {
      topUsersBody.innerHTML = topUsers.topUsers.map(u => `
        <tr>
          <td>${u.user_id}</td>
          <td><code>${u.key_prefix}...</code></td>
          <td>${u.total_requests}</td>
          <td>${u.total_tokens?.toLocaleString() || 0}</td>
          <td>$${parseFloat(u.total_cost || 0).toFixed(4)}</td>
          <td>${new Date(u.last_request).toLocaleString()}</td>
        </tr>
      `).join('');
    }

    // Load usage by provider
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const usage = await apiCall(`/analytics/usage?start_date=${startDate}&end_date=${endDate}`);
    const usageBody = document.getElementById('usageBody');
    
    if (!usage.analytics || usage.analytics.length === 0) {
      usageBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No usage data available</td></tr>';
    } else {
      usageBody.innerHTML = usage.analytics.map(u => `
        <tr>
          <td>${new Date(u.date).toLocaleDateString()}</td>
          <td>${u.provider}</td>
          <td>${u.request_count}</td>
          <td>${parseInt(u.total_tokens || 0).toLocaleString()}</td>
          <td>$${parseFloat(u.total_cost || 0).toFixed(4)}</td>
          <td>${Math.round(u.avg_response_time || 0)}ms</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

// Pricing
async function loadPricing() {
  try {
    const data = await apiCall('/pricing');
    const tbody = document.getElementById('pricingBody');
    
    if (!data.pricing || data.pricing.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pricing data available</td></tr>';
      return;
    }

    tbody.innerHTML = data.pricing.map(p => `
      <tr>
        <td><strong>${p.provider}</strong></td>
        <td>${p.model}</td>
        <td>$${parseFloat(p.input_cost_per_1m).toFixed(2)}</td>
        <td>$${parseFloat(p.output_cost_per_1m).toFixed(2)}</td>
        <td>${p.currency}</td>
        <td>${new Date(p.updated_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load pricing:', err);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
