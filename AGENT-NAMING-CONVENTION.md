# Agent Naming Convention & Synchronization Guide

## 🔍 Overview

The BSM system has **three different agent storage locations** with **intentionally different naming conventions**:

1. **GitHub Copilot Agents** (`.github/agents/*.agent.md`) - 19 agents
2. **Data Agents** (`data/agents/*.yaml` + `index.json`) - 17 agents  
3. **Agent Registry** (`agents/registry.yaml`) - 16 agents

## 📋 Naming Conventions

### GitHub Copilot Agents (Shorter Names)
Used by GitHub Copilot interface. Names are shorter for better UX:
- `legal` (not `legal-agent`)
- `governance` (not `governance-agent`)
- `code-review` (not `code-review-agent`)
- `security` (not `security-agent`)

### Data Agents (With -agent suffix)
Used by BSM API backend. Follow strict naming:
- `legal-agent`
- `governance-agent`
- `code-review-agent`
- `security-agent`

### Registry (With -agent suffix)
Central registry for platform agents, follows data agent naming.

## 🔄 Mapping Table

| GitHub Copilot | Data Agents | Registry | Purpose |
|----------------|-------------|----------|---------|
| `agent-auto` | `my-agent` | `my-agent` | Platform management |
| `legal` | `legal-agent` | `legal-agent` | Legal analysis |
| `governance` | `governance-agent` | `governance-agent` | Governance |
| `code-review` | `code-review-agent` | `code-review-agent` | Code review |
| `security` | `security-agent` | `security-agent` | Security |
| `integrity` | `integrity-agent` | `integrity-agent` | Integrity |
| `pr-merge` | `pr-merge-agent` | `pr-merge-agent` | PR merge |
| `bsu-audit` | `bsu-audit-agent` | `bsu-audit-agent` | Audit |
| `repository-review-agent` | `repository-review` | `repository-review-agent` | Repository review |
| `governance-review-agent` | `governance-review-agent` | `governance-review-agent` | Gov review |
| `ios-chat-integration-agent` | `ios-chat-integration-agent` | `ios-chat-integration-agent` | iOS chat |
| `kimi-agent` | `kimi-agent` | `kimi-agent` | Kimi AI |
| `gemini-agent` | `gemini-agent` | `gemini-agent` | Gemini AI |
| `claude-agent` | `claude-agent` | `claude-agent` | Claude AI |
| `perplexity-agent` | `perplexity-agent` | `perplexity-agent` | Perplexity |
| `groq-agent` | `groq-agent` | `groq-agent` | Groq |

## 🎯 Copilot-Only Agents

These agents exist **only in GitHub Copilot** and are not backend API agents:

1. **bsu-autonomous-architect** - Architecture analysis
2. **orchestrator** - Multi-agent coordination
3. **runner** - Build/test execution

These are meta-agents that coordinate other agents or provide development tools.

## ✅ Why Different Names?

### 1. **User Experience**
GitHub Copilot agents use shorter names for better UX:
```
@workspace استخدم وكيل legal    # ✅ Easy to type
@workspace استخدم وكيل legal-agent  # ❌ Longer
```

### 2. **API Consistency**
Backend APIs need consistent naming:
```javascript
POST /api/agents/run
{
  "agentId": "legal-agent"  // ✅ Standard format
}
```

### 3. **Registry Structure**
The central registry maintains strict naming for governance and auditing.

## 📊 Current State

### GitHub Copilot (.github/agents/)
**19 agents total:**
- 11 Core platform agents
- 5 AI model agents
- 3 Meta/orchestration agents

### Data Agents (data/agents/)
**17 agents total:**
- Excludes: `orchestrator`, `runner` (Copilot-only)
- Includes: All API-accessible agents

### Registry (agents/registry.yaml)
**16 agents total:**
- Excludes: `orchestrator`, `runner`, `bsu-autonomous-architect` (meta-agents)
- Excludes: `agent-auto` (aliased as `my-agent`)
- All registered agents have governance fields

## 🔍 Verification

To verify synchronization, run:

```bash
node scripts/verify-copilot-agents.js
```

**Expected behavior:**
- ⚠️ Shows naming differences (this is intentional)
- ✅ All functional agents are accessible via their respective interfaces

## 📝 Adding New Agents

### For GitHub Copilot + Backend API:

1. Create `.github/agents/my-new-agent.agent.md`
2. Create `data/agents/my-new-agent.yaml`
3. Add to `data/agents/index.json`
4. Add to `agents/registry.yaml` with governance fields
5. Update `.github/agents/README.md`

### For Copilot-Only (Meta-agents):

1. Create `.github/agents/my-meta-agent.agent.md`
2. Update `.github/agents/README.md`
3. No need to add to data/agents or registry

## 🎯 Summary

✅ **This is by design, not a bug!**

- GitHub Copilot: 19 agents (includes 3 meta-agents)
- Data Agents: 17 agents (excludes meta-agents, includes my-agent)
- Registry: 16 agents (excludes meta-agents, agent-auto)

All agents are accessible and functioning correctly through their respective interfaces.

---

**Last Updated:** 2026-02-20  
**Verified By:** KARIM (BSU Lead Architect)
