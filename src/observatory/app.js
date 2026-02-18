// Observatory Dashboard JavaScript

const API_BASE = window.location.origin + '/api/observatory';
let socket = null;
let charts = {};
let currentTimeRange = '24h';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeSocket();
  loadDashboard();
  
  // Set up time range selector
  document.getElementById('time-range').addEventListener('change', (e) => {
    currentTimeRange = e.target.value;
    loadDashboard();
  });
});

// Tab navigation
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      // Show selected tab content
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.remove('hidden');
      
      // Load data for specific tabs
      if (tabName === 'tokens') loadTokenUsage();
      if (tabName === 'analytics') loadAnalytics();
    });
  });
}

// Initialize Socket.io connection
function initializeSocket() {
  socket = io();
  
  socket.on('connect', () => {
    console.log('Connected to Observatory');
    socket.emit('request:dashboard');
  });
  
  socket.on('metrics:update', (metrics) => {
    updateMetricsGrid(metrics);
    updateLastUpdated();
  });
  
  socket.on('dashboard:data', ({ metrics, tokenUsage }) => {
    updateMetricsGrid(metrics);
    updateLastUpdated();
  });
  
  socket.on('alerts:triggered', (alerts) => {
    showAlertNotification(alerts);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from Observatory');
  });
}

// Load dashboard data
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/metrics?timeRange=${currentTimeRange}`);
    const data = await response.json();
    
    updateMetricsGrid(data.metrics);
    updateCharts();
    updateLastUpdated();
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Update metrics grid
function updateMetricsGrid(metrics) {
  const grid = document.getElementById('metrics-grid');
  
  if (!metrics || metrics.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No metrics available for the selected time range</div>';
    return;
  }
  
  grid.innerHTML = metrics.map(metric => `
    <div class="metric-card">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold">${metric.agentId}</h3>
        <span class="status-indicator ${getStatusClass(metric.successRate)}"></span>
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-gray-400">Total Requests:</span>
          <span class="font-semibold">${metric.totalRequests}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-400">Success Rate:</span>
          <span class="font-semibold text-${getSuccessColor(metric.successRate)}-400">${metric.successRate}%</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-400">Avg Response:</span>
          <span class="font-semibold">${metric.avgResponseTime}ms</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-400">Total Tokens:</span>
          <span class="font-semibold">${formatNumber(metric.totalTokens)}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-400">Total Cost:</span>
          <span class="font-semibold text-yellow-400">$${metric.totalCost}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Update charts with time series data
async function updateCharts() {
  try {
    // For demo purposes, we'll create sample data
    // In production, fetch actual time series from API
    const labels = generateTimeLabels(currentTimeRange);
    
    updateResponseTimeChart(labels);
    updateSuccessRateChart(labels);
    updateRequestVolumeChart(labels);
    updateCostChart();
  } catch (error) {
    console.error('Failed to update charts:', error);
  }
}

// Update response time chart
function updateResponseTimeChart(labels) {
  const ctx = document.getElementById('response-time-chart').getContext('2d');
  
  if (charts.responseTime) {
    charts.responseTime.destroy();
  }
  
  charts.responseTime = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Response Time (ms)',
        data: generateRandomData(labels.length, 50, 500),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Update success rate chart
function updateSuccessRateChart(labels) {
  const ctx = document.getElementById('success-rate-chart').getContext('2d');
  
  if (charts.successRate) {
    charts.successRate.destroy();
  }
  
  charts.successRate = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Success Rate (%)',
        data: generateRandomData(labels.length, 85, 100),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Update request volume chart
function updateRequestVolumeChart(labels) {
  const ctx = document.getElementById('request-volume-chart').getContext('2d');
  
  if (charts.requestVolume) {
    charts.requestVolume.destroy();
  }
  
  charts.requestVolume = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Request Count',
        data: generateRandomData(labels.length, 10, 100),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Update cost distribution chart
function updateCostChart() {
  const ctx = document.getElementById('cost-chart').getContext('2d');
  
  if (charts.cost) {
    charts.cost.destroy();
  }
  
  charts.cost = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['GPT-4', 'Claude', 'Gemini', 'Others'],
      datasets: [{
        data: [45, 30, 15, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// Load token usage data
async function loadTokenUsage() {
  try {
    const [agentResponse, userResponse] = await Promise.all([
      fetch(`${API_BASE}/tokens/agents?timeRange=${currentTimeRange}`),
      fetch(`${API_BASE}/tokens/users?timeRange=${currentTimeRange}`)
    ]);
    
    const agentData = await agentResponse.json();
    const userData = await userResponse.json();
    
    updateTokensAgentChart(agentData.tokenUsage);
    updateTokensUserList(userData.tokenUsage);
  } catch (error) {
    console.error('Failed to load token usage:', error);
  }
}

// Update tokens by agent chart
function updateTokensAgentChart(tokenUsage) {
  const ctx = document.getElementById('tokens-agent-chart').getContext('2d');
  
  if (charts.tokensAgent) {
    charts.tokensAgent.destroy();
  }
  
  charts.tokensAgent = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tokenUsage.map(t => t.agentId),
      datasets: [{
        label: 'Total Tokens',
        data: tokenUsage.map(t => t.totalTokens),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          labels: { color: '#e2e8f0' }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
  
  // Update token list
  const list = document.getElementById('tokens-agent-list');
  list.innerHTML = tokenUsage.map(t => `
    <div class="flex justify-between p-2 bg-gray-800 rounded">
      <span>${t.agentId}</span>
      <span class="text-blue-400">${formatNumber(t.totalTokens)} tokens</span>
    </div>
  `).join('');
}

// Update tokens by user list
function updateTokensUserList(tokenUsage) {
  const list = document.getElementById('tokens-user-list');
  
  if (!tokenUsage || tokenUsage.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-400 py-8">No user data available</div>';
    return;
  }
  
  list.innerHTML = tokenUsage.map(t => `
    <div class="flex justify-between p-3 bg-gray-800 rounded">
      <div>
        <div class="font-semibold">${t.userId}</div>
        <div class="text-sm text-gray-400">${t.requestCount} requests · ${t.agentsUsed} agents</div>
      </div>
      <div class="text-right">
        <div class="text-blue-400">${formatNumber(t.totalTokens)} tokens</div>
        <div class="text-sm text-yellow-400">$${t.totalCost}</div>
      </div>
    </div>
  `).join('');
}

// Load analytics data
async function loadAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/analytics/conversations?timeRange=${currentTimeRange}`);
    const data = await response.json();
    
    updateConversationStats(data.analytics);
    updateSentimentChart(data.analytics.sentimentDistribution);
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// Update conversation stats
function updateConversationStats(analytics) {
  const stats = document.getElementById('conversation-stats');
  
  stats.innerHTML = `
    <div class="p-4 bg-gray-800 rounded">
      <div class="text-2xl font-bold text-blue-400">${formatNumber(analytics.totalConversations)}</div>
      <div class="text-sm text-gray-400">Total Conversations</div>
    </div>
    
    <div class="p-4 bg-gray-800 rounded">
      <div class="text-2xl font-bold text-green-400">${analytics.avgMessagesPerConversation}</div>
      <div class="text-sm text-gray-400">Avg Messages per Conversation</div>
    </div>
    
    <div class="p-4 bg-gray-800 rounded">
      <div class="text-2xl font-bold text-purple-400">${analytics.avgSentimentScore}</div>
      <div class="text-sm text-gray-400">Avg Sentiment Score</div>
    </div>
  `;
}

// Update sentiment chart
function updateSentimentChart(sentimentDist) {
  const ctx = document.getElementById('sentiment-chart').getContext('2d');
  
  if (charts.sentiment) {
    charts.sentiment.destroy();
  }
  
  charts.sentiment = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [sentimentDist.positive, sentimentDist.neutral, sentimentDist.negative],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// Download report
async function downloadReport(format) {
  const timeRange = document.getElementById('report-time-range').value;
  const url = `${API_BASE}/reports/${format}?timeRange=${timeRange}`;
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `observatory-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    link.click();
  } catch (error) {
    console.error('Failed to download report:', error);
    alert('Failed to download report. Please try again.');
  }
}

// Helper functions
function getStatusClass(successRate) {
  const rate = parseFloat(successRate);
  if (rate >= 95) return 'status-online';
  if (rate >= 80) return 'status-warning';
  return 'status-offline';
}

function getSuccessColor(successRate) {
  const rate = parseFloat(successRate);
  if (rate >= 95) return 'green';
  if (rate >= 80) return 'yellow';
  return 'red';
}

function formatNumber(num) {
  return parseInt(num).toLocaleString();
}

function updateLastUpdated() {
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

function generateTimeLabels(range) {
  const now = new Date();
  const labels = [];
  let count, interval;
  
  switch (range) {
    case '1h':
      count = 12;
      interval = 5;
      break;
    case '6h':
      count = 12;
      interval = 30;
      break;
    case '24h':
      count = 24;
      interval = 60;
      break;
    case '7d':
      count = 7;
      interval = 1440;
      break;
    case '30d':
      count = 30;
      interval = 1440;
      break;
    default:
      count = 24;
      interval = 60;
  }
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60000);
    labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }
  
  return labels;
}

function generateRandomData(length, min, max) {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function showAlertNotification(alerts) {
  // Simple notification - in production, use a proper notification library
  console.log('Alerts triggered:', alerts);
  
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded shadow-lg z-50';
  notification.innerHTML = `
    <div class="font-semibold">⚠️ Alert Triggered</div>
    <div class="text-sm">${alerts.length} alert(s) require attention</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
