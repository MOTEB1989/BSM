# Intelligent Code Review Agent System

## Overview

The Intelligent Code Review Agent System is an AI-powered code analysis platform that automatically reviews GitHub pull requests. It provides comprehensive security analysis (OWASP Top 10), code quality assessment, performance evaluation, and generates detailed markdown reports.

## Features

### 1. **Security Analysis (OWASP Top 10)**
- ✅ A01: Broken Access Control
- ✅ A02: Cryptographic Failures
- ✅ A03: Injection (SQL, Command, XSS)
- ✅ A04: Insecure Design
- ✅ A05: Security Misconfiguration
- ✅ A06: Vulnerable Components
- ✅ A07: Authentication Failures
- ✅ A08: Data Integrity Failures
- ✅ A09: Logging & Monitoring Failures
- ✅ A10: Server-Side Request Forgery (SSRF)

### 2. **Multi-Language Support**
- **JavaScript/TypeScript**: ES6+ patterns, async/await, React best practices
- **Python**: PEP 8 compliance, type hints, context managers
- **Solidity**: Smart contract security, reentrancy protection, gas optimization

### 3. **Code Quality Analysis**
- Maintainability and readability
- Design patterns usage (SOLID, DRY, KISS)
- Code duplication detection
- Error handling practices
- Documentation quality

### 4. **Performance Analysis**
- Nested loops detection
- Inefficient algorithms
- Blocking operations
- Database query optimization

### 5. **Caching System**
- In-memory caching with TTL (1 hour default)
- Cache key based on repo, PR number, and commit SHA
- Automatic cleanup of expired entries
- Hit/miss statistics tracking

### 6. **Review History & Analytics**
- Persistent storage of review results
- Statistical analysis per repository
- Trend detection (improving/declining/stable)
- Security risk distribution
- Score distribution charts

### 7. **Web Dashboard**
- Real-time statistics visualization
- Repository selector
- Review history table
- Cache performance metrics
- Responsive design with Tailwind CSS

### 8. **GitHub Integration**
- Webhook-based automatic triggering
- PR comment posting
- Real-time diff fetching
- GitHub API integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Webhooks                          │
│              (PR opened/updated/reopened)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Controller                              │
│         (src/controllers/webhookController.js)               │
│  - Verify signature                                          │
│  - Trigger intelligent code review                           │
│  - Post results as PR comments                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Intelligent Code Review Agent                        │
│    (src/agents/IntelligentCodeReviewAgent.js)               │
│  - Categorize files by language                             │
│  - Run OWASP security checks                                │
│  - Analyze code quality                                      │
│  - Detect performance issues                                 │
│  - Generate markdown report                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐   ┌────────────────┐
│ Cache Service│   │ History Service│
│   (Memory)   │   │  (File-based)  │
└──────────────┘   └────────────────┘
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Dashboard                             │
│              (src/dashboard/index.html)                      │
│  - Repository statistics                                     │
│  - Review history                                            │
│  - Trend analysis                                            │
│  - Cache performance                                         │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Code Review APIs

#### `POST /api/code-review/review`
Review a GitHub pull request.

**Request Body:**
```json
{
  "repo": "owner/repo-name",
  "prNumber": 123,
  "forceRefresh": false
}
```

**Response:**
```json
{
  "agentId": "intelligent-code-review-agent",
  "prNumber": 123,
  "repo": "owner/repo-name",
  "score": 8.5,
  "report": "# 🤖 Intelligent Code Review Report\n...",
  "securityAnalysis": { ... },
  "qualityAnalysis": { ... },
  "performanceAnalysis": { ... },
  "cached": false,
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

#### `GET /api/code-review/history/:repo`
Get review history for a repository.

**Query Parameters:**
- `limit` (optional): Number of reviews to return (default: 50)

**Response:**
```json
{
  "repo": "owner/repo-name",
  "count": 10,
  "history": [
    {
      "prNumber": 123,
      "score": 8.5,
      "securityScore": 9,
      "qualityScore": 8,
      "securityRiskLevel": "low",
      "securityFindings": 0,
      "performanceConcerns": 0,
      "timestamp": "2026-02-18T21:00:00.000Z",
      "agentId": "intelligent-code-review-agent"
    }
  ]
}
```

#### `GET /api/code-review/statistics/:repo`
Get statistics for a repository.

**Response:**
```json
{
  "repo": "owner/repo-name",
  "statistics": {
    "totalReviews": 50,
    "averageScore": 7.8,
    "averageSecurityScore": 8.2,
    "averageQualityScore": 7.5,
    "securityRiskDistribution": {
      "low": 40,
      "medium": 8,
      "high": 2,
      "critical": 0
    },
    "scoreDistribution": {
      "0-3": 2,
      "4-6": 10,
      "7-8": 25,
      "9-10": 13
    },
    "recentTrend": "improving"
  }
}
```

#### `GET /api/code-review/repositories`
Get all repositories with reviews.

**Response:**
```json
{
  "count": 5,
  "repositories": [
    "owner/repo-1",
    "owner/repo-2",
    "owner/repo-3"
  ]
}
```

#### `POST /api/code-review/comment`
Post a review comment to a GitHub PR.

**Request Body:**
```json
{
  "repo": "owner/repo-name",
  "prNumber": 123,
  "body": "# Review Report\n..."
}
```

#### `GET /api/code-review/cache/stats` (Admin only)
Get cache statistics.

**Headers:**
- `x-admin-token`: Admin authentication token

**Response:**
```json
{
  "cache": {
    "hits": 150,
    "misses": 50,
    "sets": 50,
    "hitRate": "75.00%",
    "size": 25,
    "memoryUsage": "125.50 KB"
  }
}
```

#### `POST /api/code-review/cache/clear` (Admin only)
Clear cache (optionally for specific PR).

**Request Body:**
```json
{
  "repo": "owner/repo-name",
  "prNumber": 123
}
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# GitHub Integration (Required for PR review)
GITHUB_BSU_TOKEN=ghp_your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI API Key (Required for AI analysis)
OPENAI_BSM_KEY=sk-your_openai_key_here

# Admin Token (Required for admin endpoints)
ADMIN_TOKEN=your_admin_token_here
```

### 2. GitHub Webhook Configuration

1. Go to your repository Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-server.com/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Use the same value as `GITHUB_WEBHOOK_SECRET`
5. **Events**: Select "Pull requests"
6. **Active**: ✅ Check this box
7. Click "Add webhook"

### 3. Start the Server

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Start production server
npm start
```

### 4. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000/dashboard
```

## Usage Examples

### Automatic Review via Webhook

When you create or update a PR, the webhook automatically triggers:

1. ✅ Webhook received
2. ✅ Review triggered
3. ✅ Code analyzed (security, quality, performance)
4. ✅ Report generated
5. ✅ Comment posted to PR
6. ✅ Results cached
7. ✅ History saved

### Manual Review via API

```bash
curl -X POST http://localhost:3000/api/code-review/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "owner/repo-name",
    "prNumber": 123
  }'
```

### View Statistics

```bash
curl http://localhost:3000/api/code-review/statistics/owner/repo-name
```

## Report Format

The agent generates detailed markdown reports with the following sections:

### 1. **Summary**
- Overall score (0-10)
- Security, Quality, and Performance scores
- Files changed and languages detected

### 2. **Security Analysis**
- OWASP Top 10 detection
- Language-specific security findings
- AI-powered security analysis
- Risk level assessment

### 3. **Code Quality Analysis**
- Maintainability assessment
- Best practices recommendations
- AI-powered quality analysis
- Language-specific guidelines

### 4. **Performance Concerns**
- Detected performance issues
- Severity levels
- Optimization suggestions

### 5. **Recommendation**
- Overall assessment
- Action required (Approve/Request Changes)

## Caching Strategy

The system uses intelligent caching to reduce API calls and improve response times:

- **Cache Key**: `review:{repo}:{prNumber}:{commitSha}`
- **TTL**: 1 hour (configurable)
- **Invalidation**: Automatic on new commits
- **Storage**: In-memory (can be upgraded to Redis)

## Language-Specific Patterns

### JavaScript/TypeScript
```javascript
// Detected patterns:
- eval() usage (HIGH severity)
- innerHTML assignment (MEDIUM severity)
- document.write (MEDIUM severity)
- Command execution (HIGH severity)
- Dynamic function creation (HIGH severity)
```

### Python
```python
# Detected patterns:
- eval() usage (HIGH severity)
- exec() usage (HIGH severity)
- pickle.loads (HIGH severity)
- os.system (HIGH severity)
- subprocess with shell=True (HIGH severity)
```

### Solidity
```solidity
// Detected patterns:
- call.value reentrancy (HIGH severity)
- tx.origin usage (HIGH severity)
- block.timestamp dependence (MEDIUM severity)
- selfdestruct (HIGH severity)
- delegatecall (HIGH severity)
```

## Scoring System

### Overall Score Calculation
```
Overall Score = (Security × 40%) + (Quality × 40%) + (Performance × 20%)
```

### Score Ranges
- **9-10**: 🌟 Excellent - Minimal issues
- **7-8**: ✅ Good - Minor improvements needed
- **5-6**: ⚠️ Fair - Several issues to address
- **0-4**: ❌ Poor - Critical issues present

### Risk Levels
- **🟢 Low**: No significant issues
- **🟡 Medium**: Some concerns, review recommended
- **🟠 High**: Multiple issues, changes required
- **🔴 Critical**: Severe issues, immediate action needed

## Future Enhancements

- [ ] Redis integration for distributed caching
- [ ] Real-time WebSocket updates
- [ ] More language support (Java, Go, Rust, C++)
- [ ] Custom rule configuration
- [ ] Integration with SonarQube/ESLint
- [ ] Machine learning model training
- [ ] Vulnerability database integration
- [ ] Automated fix suggestions
- [ ] Team collaboration features
- [ ] Slack/Discord notifications

## Troubleshooting

### Issue: Reviews not triggering automatically
**Solution**: Check webhook configuration and `GITHUB_WEBHOOK_SECRET`

### Issue: AI analysis failing
**Solution**: Verify `OPENAI_BSM_KEY` is valid and has sufficient credits

### Issue: Dashboard not loading statistics
**Solution**: Ensure at least one review has been completed

### Issue: Cache not working
**Solution**: Check server logs for cache initialization errors

## Support

For issues or questions:
1. Check logs: `npm run dev` (with verbose logging)
2. Verify environment variables
3. Test API endpoints manually
4. Check GitHub webhook delivery logs

## License

Part of the BSM (Business Service Management) platform.
