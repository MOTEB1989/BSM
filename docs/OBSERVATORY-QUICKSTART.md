# AI Agent Observatory - Quick Start Guide

## 🚀 5-Minute Setup

### Option 1: Docker Compose (Recommended)

```bash
# 1. Start the stack
docker-compose -f docker-compose.observatory.yml up -d

# 2. Wait for services to be ready (about 30 seconds)
docker-compose -f docker-compose.observatory.yml ps

# 3. Open your browser
# Observatory Dashboard: http://localhost:3000/observatory
# Database UI (Adminer): http://localhost:8080
# API Health Check: http://localhost:3000/api/health

# 4. View logs
docker-compose -f docker-compose.observatory.yml logs -f bsm_app
```

### Option 2: Local Development

```bash
# 1. Install PostgreSQL
brew install postgresql@15  # macOS
sudo apt-get install postgresql-15  # Ubuntu

# 2. Create database
createdb bsm_observatory
psql -c "CREATE USER bsm_user WITH PASSWORD 'bsm_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE bsm_observatory TO bsm_user;"

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
# Edit .env and set DB_HOST, DB_USER, DB_PASSWORD, etc.

# 5. Start the server
npm run dev

# 6. Open browser
# http://localhost:3000/observatory
```

## 📊 Using the Dashboard

### Dashboard Tab

The main dashboard shows real-time metrics for all agents:

- **Agent Cards**: Each card shows:
  - Total requests
  - Success rate (with color coding)
  - Average response time
  - Total tokens used
  - Total cost
  
- **Live Charts**:
  - Response Time Trends (line chart)
  - Success Rate (line chart)
  - Request Volume (bar chart)
  - Cost Distribution (doughnut chart)

**Auto-refresh**: Metrics update every 5 seconds via WebSocket

### Token Usage Tab

Monitor token consumption:

- **By Agent**: Horizontal bar chart showing token usage per agent
- **By User**: List of top users with their token consumption and costs
- **Breakdown**: Prompt vs completion tokens for each agent

### Analytics Tab

Understand conversation quality:

- **Total Conversations**: Overall count
- **Avg Messages**: Messages per conversation
- **Sentiment Score**: Average sentiment (-5 to +5)
- **Sentiment Distribution**: Pie chart of positive/neutral/negative

### Reports Tab

Generate management reports:

1. Select time range (1h, 6h, 24h, 7d, 30d)
2. Click "Download PDF Report" or "Download Excel Report"
3. Report includes all metrics, charts, and analytics

## 🔬 A/B Testing

### Create a Test

```bash
curl -X POST http://localhost:3000/api/observatory/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "GPT-4 vs Claude Sonnet",
    "agentId": "legal-advisor",
    "variantA": {
      "model": "gpt-4",
      "temperature": 0.7
    },
    "variantB": {
      "model": "claude-3-sonnet",
      "temperature": 0.7
    }
  }'
```

### View Test Results

```bash
# Get test ID from creation response, then:
curl http://localhost:3000/api/observatory/ab-tests/1/results
```

Results include:
- Sample size per variant
- Average response time
- Success rate
- Average tokens used
- Average cost
- User ratings (if provided)

## 🚨 Setting Up Alerts

### Create an Alert

```bash
# Alert when response time exceeds 1000ms
curl -X POST http://localhost:3000/api/observatory/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alertName": "High Response Time - Legal Advisor",
    "agentId": "legal-advisor",
    "alertType": "response_time",
    "thresholdValue": 1000,
    "condition": "greater_than",
    "notificationChannels": ["email", "slack"]
  }'

# Alert when cost exceeds $10
curl -X POST http://localhost:3000/api/observatory/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alertName": "Daily Cost Threshold",
    "alertType": "cost",
    "thresholdValue": 10,
    "condition": "greater_than",
    "notificationChannels": ["email"]
  }'

# Alert when success rate drops below 95%
curl -X POST http://localhost:3000/api/observatory/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alertName": "Low Success Rate",
    "agentId": "legal-advisor",
    "alertType": "success_rate",
    "thresholdValue": 95,
    "condition": "less_than",
    "notificationChannels": ["slack"]
  }'
```

### View Alert History

```bash
curl http://localhost:3000/api/observatory/alerts/history
```

## 📈 API Usage Examples

### Get Real-time Metrics

```bash
# All agents, last 24 hours
curl http://localhost:3000/api/observatory/metrics?timeRange=24h

# Specific agent, last hour
curl http://localhost:3000/api/observatory/metrics/legal-advisor?timeRange=1h

# Time series for charts
curl http://localhost:3000/api/observatory/metrics/legal-advisor/timeseries?timeRange=24h
```

### Token Usage

```bash
# By agent
curl http://localhost:3000/api/observatory/tokens/agents?timeRange=7d

# By user
curl http://localhost:3000/api/observatory/tokens/users?timeRange=7d
```

### Analytics

```bash
# Conversation analytics
curl http://localhost:3000/api/observatory/analytics/conversations?timeRange=7d
```

## 🔌 WebSocket Integration

### JavaScript Example

```javascript
// Connect to Observatory
const socket = io();

// Subscribe to real-time updates
socket.on('connect', () => {
  console.log('Connected to Observatory');
  socket.emit('request:dashboard');
});

// Receive metrics updates (every 5s)
socket.on('metrics:update', (metrics) => {
  console.log('Updated metrics:', metrics);
  updateDashboard(metrics);
});

// Receive alert notifications
socket.on('alerts:triggered', (alerts) => {
  console.log('Alerts triggered:', alerts);
  showNotification(alerts);
});

// Subscribe to specific agent
socket.emit('subscribe:agent', 'legal-advisor');

socket.on('agent:metrics', ({ agentId, metrics }) => {
  console.log(`Metrics for ${agentId}:`, metrics);
});
```

## 🎯 Monitoring Best Practices

### 1. Set Appropriate Time Ranges

- **1h**: For debugging and immediate issues
- **24h**: For daily operations monitoring
- **7d**: For weekly trends and patterns
- **30d**: For monthly reports and long-term analysis

### 2. Configure Critical Alerts

Recommended alerts:
- Response time > 2000ms (critical)
- Success rate < 90% (critical)
- Daily cost > $50 (warning)
- Token usage spike > 200% of average (warning)

### 3. Regular Reporting

Generate weekly reports for stakeholders:

```bash
# Every Monday morning
curl http://localhost:3000/api/observatory/reports/excel?timeRange=7d \
  > weekly-report-$(date +%Y-%m-%d).xlsx
```

### 4. A/B Testing Workflow

1. Create test with clear hypothesis
2. Let it run for at least 100 samples per variant
3. Analyze results statistically
4. Make decision based on:
   - Response time
   - Success rate
   - Cost
   - User satisfaction

### 5. Database Maintenance

```bash
# Clean old data (optional - run monthly)
docker exec bsm_observatory_db psql -U bsm_user -d bsm_observatory -c \
  "DELETE FROM agent_metrics WHERE timestamp < NOW() - INTERVAL '90 days';"

# Vacuum database
docker exec bsm_observatory_db psql -U bsm_user -d bsm_observatory -c "VACUUM ANALYZE;"
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.observatory.yml ps

# View database logs
docker-compose -f docker-compose.observatory.yml logs postgres

# Test connection manually
docker exec -it bsm_observatory_db psql -U bsm_user -d bsm_observatory
```

### No Metrics Appearing

1. Check if database is connected (server logs should show "Observatory database initialized")
2. Make some API calls to generate metrics:
   ```bash
   curl -X POST http://localhost:3000/api/chat/direct \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello","language":"en"}'
   ```
3. Refresh the Observatory dashboard

### WebSocket Not Connecting

1. Check CORS settings in `.env`
2. Ensure Socket.io is loaded (check browser console)
3. Verify server logs show "Observatory Socket.io initialized"

### Charts Not Displaying

1. Open browser console for JavaScript errors
2. Ensure Chart.js loaded from CDN
3. Check if data is being received (Network tab)

## 📚 Additional Resources

- [Full Documentation](OBSERVATORY.md)
- [API Reference](OBSERVATORY.md#api-endpoints)
- [Database Schema](OBSERVATORY.md#database-schema)
- [Architecture](OBSERVATORY.md#architecture)

## 🆘 Getting Help

1. Check the logs: `docker-compose logs bsm_app`
2. Review the documentation: `docs/OBSERVATORY.md`
3. Open an issue on GitHub with:
   - Error messages from logs
   - Steps to reproduce
   - Environment details (OS, Node.js version, Docker version)

## 🎉 Next Steps

After getting familiar with the Observatory:

1. Set up your own alerts
2. Create A/B tests for your agents
3. Generate weekly reports for stakeholders
4. Monitor costs to optimize spending
5. Use analytics to improve agent prompts
6. Track user engagement patterns

Happy monitoring! 🚀
