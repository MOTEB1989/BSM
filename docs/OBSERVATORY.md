# AI Agent Observatory

A comprehensive monitoring and analytics platform for BSM AI agents with real-time dashboards, cost tracking, A/B testing, and automated alerting.

## Features

### 🎯 Real-time Monitoring Dashboard
- Live metrics for all AI agents
- Response time tracking
- Success rate monitoring
- Cost per agent analysis
- Real-time updates via WebSocket

### 📊 Token Usage Tracking
- Per-agent token consumption
- Per-user token analytics
- Prompt vs completion token breakdown
- Cost analysis by model (GPT-4, Claude, Gemini)

### 🧠 Conversation Analytics
- Sentiment analysis
- Topic clustering
- Average messages per conversation
- User engagement metrics

### 🔬 A/B Testing Framework
- Compare different AI models
- Test prompt variations
- Statistical analysis of results
- Variant performance tracking

### 🚨 Alert System
- Configurable thresholds
- Response time alerts
- Cost monitoring
- Success rate warnings
- Real-time notifications

### 📑 Report Generation
- Export to PDF
- Export to Excel
- Management-ready summaries
- Customizable time ranges

### 🌙 Dark Mode UI
- Grafana-style dashboard
- Real-time Chart.js visualizations
- Responsive design
- Tailwind CSS styling

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Database**: PostgreSQL 15
- **Frontend**: Vanilla JS, Chart.js, Tailwind CSS
- **Real-time**: Socket.io for live updates
- **Reports**: PDFKit, ExcelJS
- **Analytics**: Sentiment analysis library
- **Containerization**: Docker, Docker Compose

## Installation

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

1. **Start the services**:
```bash
docker-compose -f docker-compose.observatory.yml up -d
```

This will start:
- PostgreSQL database on port 5432
- BSM application with Observatory on port 3000
- Adminer (database UI) on port 8080

2. **Access the Observatory**:
```
http://localhost:3000/observatory
```

3. **Access the API**:
```
http://localhost:3000/api/observatory/*
```

### Option 2: Manual Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Set up PostgreSQL**:
```bash
# Install PostgreSQL 15
# Create database
createdb bsm_observatory

# Create user
psql -c "CREATE USER bsm_user WITH PASSWORD 'bsm_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE bsm_observatory TO bsm_user;"
```

3. **Configure environment variables**:
```bash
cp .env.example .env

# Edit .env and set:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bsm_observatory
DB_USER=bsm_user
DB_PASSWORD=bsm_password
```

4. **Start the application**:
```bash
npm start
```

The database schema will be automatically initialized on first run.

5. **Access the Observatory**:
```
http://localhost:3000/observatory
```

## API Endpoints

### Metrics

- `GET /api/observatory/metrics` - Get all agent metrics
- `GET /api/observatory/metrics/:agentId` - Get specific agent metrics
- `GET /api/observatory/metrics/:agentId/timeseries` - Get time series data

### Token Usage

- `GET /api/observatory/tokens/agents` - Token usage by agent
- `GET /api/observatory/tokens/users` - Token usage by user

### Analytics

- `GET /api/observatory/analytics/conversations` - Conversation analytics

### A/B Testing

- `POST /api/observatory/ab-tests` - Create A/B test
- `GET /api/observatory/ab-tests` - List active tests
- `GET /api/observatory/ab-tests/:testId` - Get test details
- `GET /api/observatory/ab-tests/:testId/results` - Get test results
- `PATCH /api/observatory/ab-tests/:testId` - Update test status

### Alerts

- `POST /api/observatory/alerts` - Create alert
- `GET /api/observatory/alerts` - List active alerts
- `GET /api/observatory/alerts/history` - Get alert history
- `PATCH /api/observatory/alerts/:alertId` - Update alert
- `POST /api/observatory/alerts/history/:historyId/resolve` - Resolve alert

### Reports

- `GET /api/observatory/reports/pdf` - Download PDF report
- `GET /api/observatory/reports/excel` - Download Excel report

All endpoints support `timeRange` query parameter: `1h`, `6h`, `24h`, `7d`, `30d`

## Database Schema

The Observatory uses PostgreSQL with the following tables:

- **agent_metrics** - Core performance metrics
- **conversation_analytics** - Conversation-level analytics
- **ab_test_configs** - A/B test configurations
- **ab_test_results** - A/B test results
- **alert_configs** - Alert configurations
- **alert_history** - Alert trigger history

See `src/services/observatoryDbService.js` for complete schema.

## WebSocket Events

The Observatory uses Socket.io for real-time updates:

### Client → Server

- `subscribe:agent` - Subscribe to specific agent metrics
- `unsubscribe:agent` - Unsubscribe from agent
- `request:dashboard` - Request dashboard data

### Server → Client

- `metrics:update` - Real-time metrics update (every 5s)
- `dashboard:data` - Initial dashboard data
- `alerts:triggered` - Alert notifications
- `agent:metrics` - Specific agent metrics

## Integration with AI Providers

The Observatory automatically tracks costs for:

- **OpenAI**: GPT-4, GPT-4o-mini, GPT-3.5-turbo
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku)
- **Google**: Gemini Pro
- **Perplexity**: All models

Cost calculation is automatic based on token usage and model pricing.

## Usage

### Dashboard

1. Navigate to `http://localhost:3000/observatory`
2. Select time range (1h, 6h, 24h, 7d, 30d)
3. View real-time metrics for all agents
4. Monitor charts for trends

### Creating an A/B Test

```bash
curl -X POST http://localhost:3000/api/observatory/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "GPT4 vs Claude",
    "agentId": "legal-research",
    "variantA": { "model": "gpt-4" },
    "variantB": { "model": "claude-3-opus" }
  }'
```

### Creating an Alert

```bash
curl -X POST http://localhost:3000/api/observatory/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alertName": "High Response Time",
    "agentId": "legal-research",
    "alertType": "response_time",
    "thresholdValue": 1000,
    "condition": "greater_than",
    "notificationChannels": ["email", "slack"]
  }'
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Development Mode

```bash
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Observatory UI                         │
│              (React-like Vanilla JS)                     │
│              WebSocket + REST API                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Socket.io Server                            │
│         (Real-time metric broadcasting)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│          Observatory Services                            │
│   ┌─────────────┬─────────────┬─────────────┐          │
│   │  Metrics    │ A/B Testing │   Alerts    │          │
│   │  Service    │   Service   │   Service   │          │
│   └─────────────┴─────────────┴─────────────┘          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│         PostgreSQL Database                              │
│   (Metrics, Analytics, Tests, Alerts)                   │
└──────────────────────────────────────────────────────────┘
```

## Performance

- **Real-time updates**: 5-second intervals
- **Alert checking**: 30-second intervals
- **Database**: Indexed for fast queries
- **Caching**: In-memory caching for frequent queries
- **Connection pooling**: Up to 20 concurrent connections

## Security

- ✅ Rate limiting on API endpoints
- ✅ Input validation
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Non-root Docker user

## Troubleshooting

### Database connection fails

Check PostgreSQL is running:
```bash
docker-compose -f docker-compose.observatory.yml ps
```

View logs:
```bash
docker-compose -f docker-compose.observatory.yml logs postgres
```

### No metrics appearing

Ensure the database schema is initialized:
```bash
docker-compose -f docker-compose.observatory.yml logs bsm_app | grep "Observatory database"
```

### WebSocket not connecting

Check CORS settings in `.env`:
```
CORS_ORIGINS=http://localhost:3000
```

## License

Same as BSM project

## Support

For issues and questions, please open an issue in the BSM repository.
