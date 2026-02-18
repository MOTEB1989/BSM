# BSM Health Check System

## Overview

The BSM platform includes a comprehensive health check system that validates critical components, configurations, and runtime status. This system provides multiple levels of health monitoring from simple availability checks to detailed system diagnostics.

## Health Check Endpoints

### 1. Basic Health Check

**Endpoints:**
- `GET /health` - Top-level health endpoint
- `GET /api/health` - API health endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1770850384554,
  "correlationId": "8ed0b91c-afd0-40fa-b467-0e500667c166"
}
```

**Use Cases:**
- Load balancer health checks
- Container orchestration liveness probes
- Basic availability monitoring
- Quick status verification

### 2. Detailed Health Check

**Endpoint:** `GET /api/health/detailed`

**Response:**
```json
{
  "timestamp": "2026-02-11T22:52:44.201Z",
  "correlationId": "9fd3e1da-51bc-4622-9c23-03b6a3b0a70b",
  "status": "healthy",
  "checks": {
    "filesystem": {
      "status": "pass",
      "message": "File system accessible"
    },
    "agentRegistry": {
      "status": "pass",
      "message": "Agent registry valid (9 agents)",
      "count": 9
    },
    "environment": {
      "status": "pass",
      "message": "Environment configuration valid",
      "environment": "development"
    },
    "requiredFiles": {
      "status": "pass",
      "message": "All required files present"
    }
  }
}
```

**Health Checks Performed:**
1. **File System Access** - Validates data directory accessibility
2. **Agent Registry** - Verifies agent configuration integrity
3. **Environment Configuration** - Checks environment variables and settings
4. **Required Files** - Confirms critical files are present

**Status Values:**
- `healthy` - All checks passed (HTTP 200)
- `degraded` - Some warnings detected (HTTP 200)
- `unhealthy` - Critical failures detected (HTTP 503)

### 3. System Status

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2026-02-11T22:53:04.566Z",
  "environment": "development",
  "version": "1.0.0",
  "features": {
    "mobileMode": false,
    "lanOnly": false,
    "safeMode": false
  },
  "client": {
    "isMobile": false,
    "ip": "::1",
    "restrictions": []
  },
  "capabilities": {
    "chat": true,
    "agents": true,
    "admin": true,
    "externalApi": true
  }
}
```

**Use Cases:**
- Feature flag detection
- Client capability discovery
- Environment identification
- Operational mode verification

## Command-Line Health Checks

### Quick Health Check

Run a basic health check of the platform:

```bash
npm run health
```

**Output:**
```
╔════════════════════════════════════════╗
║   BSM Platform Health Check            ║
╚════════════════════════════════════════╝

✅ File System: PASS
✅ Agent Registry: PASS
✅ Server: ONLINE

✅ Overall Status: HEALTHY
```

### Detailed Health Check

Run a comprehensive health check with integrity report:

```bash
npm run health:detailed
```

**Additional Checks:**
- Complete integrity agent analysis
- Repository structure validation
- License compliance checking
- Documentation completeness
- Health score calculation (0-100)

### Custom Port

Check health on a custom port:

```bash
node scripts/health-check.js --port 8080
node scripts/health-check.js --detailed --port 8080
```

## Automated Health Monitoring

### Docker Health Checks

Add to `Dockerfile`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1
```

### Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: bsm
    image: bsm:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 30
    readinessProbe:
      httpGet:
        path: /api/health/detailed
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
```

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Health Check
  run: npm run health

- name: Detailed Health Check
  run: npm run health:detailed
  continue-on-error: true
```

## Health Check Scripts

### 1. Platform Health Check

**Script:** `scripts/health-check.js`

**Features:**
- File system validation
- Agent registry verification
- Server availability testing
- Optional detailed integrity report

**Usage:**
```bash
node scripts/health-check.js [--detailed] [--port PORT]
```

### 2. Audit Runner

**Script:** `scripts/audit-runner.js`

**Features:**
- Agent registration audit
- API configuration audit
- UI integration audit
- CI/CD safety audit

**Usage:**
```bash
node scripts/audit-runner.js --scope=full
node scripts/audit-runner.js --scope=agents
node scripts/audit-runner.js --scope=api
node scripts/audit-runner.js --scope=ui
node scripts/audit-runner.js --scope=ci
```

### 3. Integrity Check

**Script:** `scripts/run-integrity-check.js`

**Features:**
- Repository structure validation
- License compliance checking
- Documentation completeness
- Agent configuration validation
- Health score calculation

**Usage:**
```bash
node scripts/run-integrity-check.js
```

**Generates:**
- Console output with health report
- Timestamped report in `reports/` directory
- Health score (0-100)

## Health Status Codes

| Status | HTTP Code | Meaning |
|--------|-----------|---------|
| `ok` | 200 | Basic health check passed |
| `operational` | 200 | System is operational |
| `healthy` | 200 | All detailed checks passed |
| `degraded` | 200 | System operational with warnings |
| `unhealthy` | 503 | Critical failures detected |
| `error` | 503 | Health check failed to execute |

## Monitoring Best Practices

### 1. Load Balancer Configuration

Use the basic `/health` endpoint for:
- High-frequency checks (every 5-10 seconds)
- Quick availability verification
- Minimal overhead

### 2. Application Monitoring

Use `/api/health/detailed` for:
- Periodic deep checks (every 1-5 minutes)
- Alerting on specific component failures
- Diagnostic information gathering

### 3. Operational Status

Use `/api/status` for:
- Feature flag detection
- Client capability discovery
- Environment verification

### 4. Scheduled Reports

Run detailed checks:
- Daily via `npm run health:detailed`
- On deployment
- After configuration changes
- Before maintenance windows

## Troubleshooting

### Server Not Responding

```bash
# Check if server is running
ps aux | grep "node src/server.js"

# Check port availability
lsof -i :3000

# Start server
npm start
```

### Health Check Failures

```bash
# Run detailed diagnostics
npm run health:detailed

# Check specific components
node scripts/audit-runner.js --scope=agents
node scripts/run-integrity-check.js

# Verify file system
ls -la data/agents/
cat data/agents/index.json
```

### Integration Issues

```bash
# Test endpoints manually
curl http://localhost:3000/health
curl http://localhost:3000/api/health/detailed
curl http://localhost:3000/api/status

# Check logs
npm start | npx pino-pretty
```

## Security Considerations

1. **No Sensitive Data**: Health endpoints don't expose secrets or credentials
2. **Public Accessibility**: Basic health checks are safe for public access
3. **Detailed Checks**: Consider restricting `/api/health/detailed` in production
4. **Rate Limiting**: Health endpoints respect rate limiting configuration
5. **CORS**: Health endpoints follow CORS policies

## Related Documentation

- [Integrity Agent](./INTEGRITY-AGENT.md) - Repository health monitoring
- [Security](../SECURITY.md) - Security practices and guidelines
- [Architecture](./ARCHITECTURE.md) - System architecture overview
- [Deployment](./DEPLOYMENT.md) - Deployment configurations

## Health Check Evolution

Future enhancements planned:
- Database connectivity checks
- External service availability
- Memory and CPU usage metrics
- Disk space monitoring
- Agent execution health
- Queue depth monitoring
- Cache hit rates

---

**Note:** Health checks are designed to be lightweight and non-intrusive. They provide essential diagnostic information without impacting system performance.
