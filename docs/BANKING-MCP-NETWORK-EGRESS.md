# Banking MCP Server - Network Egress Documentation

## Overview

The BSM Banking Agents MCP server (`mcp-servers/banking-hub.js`) provides intelligent routing logic for banking queries to appropriate AI agents. This document describes the network egress requirements and security controls.

## Current Implementation Status

**Status**: Routing Only (No Active Network Calls)

The current implementation:
- ✅ Provides agent selection logic based on query content, language, and category
- ✅ Returns routing metadata and agent information
- ❌ Does NOT make actual API calls to external services
- ❌ Does NOT send user queries to AI providers

## Planned External Services

The server is configured for future integration with the following AI providers:

### 1. OpenAI (GPT-4 Turbo)
- **Purpose**: Technical coding, data analysis, and integration queries
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Status**: Planned (not yet implemented)
- **Use Cases**: API development, code review, technical documentation

### 2. Anthropic (Claude-3 Haiku)
- **Purpose**: Legal analysis, compliance review, and risk assessment
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Status**: Planned (not yet implemented)
- **Use Cases**: Contract review, regulatory compliance, policy analysis

### 3. Google Gemini Pro
- **Purpose**: Arabic language support, general banking, and customer support
- **Endpoint**: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent`
- **Status**: Planned (not yet implemented)
- **Use Cases**: Arabic customer queries, general banking information

### 4. Perplexity Sonar
- **Purpose**: Real-time search, market updates, and fact verification
- **Endpoint**: `https://api.perplexity.ai/chat/completions`
- **Status**: Planned (not yet implemented)
- **Use Cases**: Exchange rates, market indices, financial news

## Security Controls (Required for Future Implementation)

When network calls are implemented, the following security controls MUST be enforced:

### 1. Circuit Breaker Pattern
- **Implementation**: Use `src/utils/circuitBreaker.js`
- **Configuration**: 5-failure threshold, 30-second reset timeout
- **States**: CLOSED → OPEN → HALF_OPEN
- **Purpose**: Prevent cascade failures from external API outages

### 2. Timeout Enforcement
- **Default**: 10 seconds per request
- **Maximum**: 30 seconds
- **Configuration**: Per-provider timeout settings
- **Purpose**: Prevent hung connections and resource exhaustion

### 3. API Key Sanitization
- **Implementation**: Use `sanitizeApiKey()` from `src/utils/errors.js`
- **Validation**: Remove whitespace, invisible characters, check for placeholder values
- **Purpose**: Prevent misconfigurations and security issues

### 4. Egress Policy Control
- **Default**: `EGRESS_POLICY=deny_by_default` (recommended for production)
- **Allowlist**: `EGRESS_ALLOWED_HOSTS` environment variable
- **Required Hosts**:
  ```
  api.openai.com
  api.anthropic.com
  generativelanguage.googleapis.com
  api.perplexity.ai
  ```

### 5. Rate Limiting
- **Per-provider**: Configurable rate limits
- **Global**: Shared token bucket across all providers
- **Purpose**: Prevent cost overruns and API quota exhaustion

### 6. Audit Logging
- **Requirements**: Log all external API calls with:
  - Timestamp
  - Provider
  - Query (sanitized, no sensitive data)
  - Response status
  - Latency
  - Error details (if any)

## Environment Variables

When implementing network calls, ensure these environment variables are configured:

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PERPLEXITY_KEY=pplx-...

# Network Security
EGRESS_POLICY=deny_by_default
EGRESS_ALLOWED_HOSTS=api.openai.com,api.anthropic.com,generativelanguage.googleapis.com,api.perplexity.ai

# Safety Controls
SAFE_MODE=true  # Set to false only when external API calls are needed
```

## Implementation Checklist

Before enabling network calls, verify:

- [ ] Circuit breaker implemented for each provider
- [ ] Timeout configuration in place
- [ ] API key validation and sanitization
- [ ] Egress policy configured (deny-by-default)
- [ ] Allowed hosts explicitly listed
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] Error handling and retry logic
- [ ] Integration tests with mock providers
- [ ] Security review completed
- [ ] GOVERNANCE.md approval obtained
- [ ] Network egress justification documented in PR

## References

- Circuit Breaker: `src/utils/circuitBreaker.js`
- GPT Service Pattern: `src/services/gptService.js`
- Error Utilities: `src/utils/errors.js`
- Security Policy: `SECURITY.md`
- Governance: `GOVERNANCE.md`
- Environment Configuration: `src/config/env.js`

## Change Log

- **2026-02-21**: Initial documentation - routing-only implementation, no active network calls
