# 🤖 Intelligent Code Review Agent - Quick Start

## What's New

A complete AI-powered code review system has been added to BSM with:
- ✅ OWASP Top 10 security analysis
- ✅ Multi-language support (JavaScript, Python, Solidity)
- ✅ Performance & quality analysis
- ✅ Intelligent caching system
- ✅ Review history & statistics
- ✅ Web dashboard
- ✅ GitHub webhook integration

## Quick Setup

### 1. Configure Environment

```bash
# .env file
GITHUB_BSU_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=your_secret_here
OPENAI_BSM_KEY=sk_your_key_here
```

### 2. Setup GitHub Webhook

Repository Settings → Webhooks → Add webhook:
- **URL**: `https://your-server.com/api/webhooks/github`
- **Content type**: `application/json`
- **Secret**: Same as `GITHUB_WEBHOOK_SECRET`
- **Events**: Pull requests
- **Active**: ✅

### 3. Start Server

```bash
npm ci
npm start
```

### 4. Access Dashboard

Open: `http://localhost:3000/dashboard`

## API Endpoints

### Review a PR
```bash
POST /api/code-review/review
{
  "repo": "owner/repo",
  "prNumber": 123
}
```

### Get Statistics
```bash
GET /api/code-review/statistics/owner/repo
```

### View History
```bash
GET /api/code-review/history/owner/repo?limit=50
```

## Features

### Security Analysis
- OWASP Top 10 vulnerability detection
- Language-specific security patterns
- AI-powered deep analysis

### Code Quality
- Design patterns (SOLID, DRY, KISS)
- Maintainability assessment
- Best practices enforcement

### Performance
- Nested loops detection
- Inefficient algorithms
- Blocking operations

### Multi-Language
- **JavaScript/TypeScript**: ES6+, React patterns
- **Python**: PEP 8, type hints
- **Solidity**: Smart contract security

## How It Works

```
PR Created/Updated
       ↓
GitHub Webhook
       ↓
Intelligent Code Review Agent
       ↓
Security + Quality + Performance Analysis
       ↓
Markdown Report Generated
       ↓
Posted as PR Comment
       ↓
Cached & Saved to History
```

## Report Example

```markdown
# 🤖 Intelligent Code Review Report

**PR:** #123 - Add new feature
**Overall Score:** ✅ 8.5/10

## Security Analysis
🟢 Low Risk - No critical issues found

## Code Quality
✅ 8/10 - Good maintainability

## Performance
⚡ No concerns detected

## Recommendation
✅ APPROVE - Code meets high quality standards.
```

## Documentation

Full documentation: `/docs/INTELLIGENT-CODE-REVIEW.md`

## Files Added

```
src/agents/IntelligentCodeReviewAgent.js
src/services/reviewCacheService.js
src/services/reviewHistoryService.js
src/controllers/codeReviewController.js
src/routes/codeReview.js
src/dashboard/index.html
data/agents/intelligent-code-review-agent.yaml
docs/INTELLIGENT-CODE-REVIEW.md
```

## Architecture

- **Agent**: IntelligentCodeReviewAgent.js
- **Cache**: In-memory with TTL (1 hour)
- **History**: File-based persistent storage
- **Dashboard**: React + Tailwind CSS
- **Integration**: GitHub Webhooks + API

## Next Steps

1. Configure environment variables
2. Set up GitHub webhook
3. Test with a PR
4. View dashboard statistics
5. Customize as needed

---

**Built with ❤️ for the BSM platform**
