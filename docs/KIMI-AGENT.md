# KIMI Agent Integration

## Overview

The KIMI agent is now integrated into the BSM platform, providing access to Moonshot AI's KIMI model. KIMI (by Moonshot AI) is a Chinese AI model that excels in Chinese language understanding, long-context processing, and conversational AI.

## Features

- **Chinese Language Expertise**: Native Chinese language understanding and generation
- **Long Context Understanding**: Supports extended context windows (8K tokens with moonshot-v1-8k)
- **Conversational AI**: Multi-turn dialogue capabilities
- **Knowledge Retrieval**: Advanced information retrieval and synthesis

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Moonshot AI (Kimi)
# Get your API key from https://platform.moonshot.cn/
KIMI_API_KEY=your-api-key-here
```

### Agent Registration

The KIMI agent is registered in:
- **Agent Definition**: `data/agents/kimi-agent.yaml`
- **Agent Index**: `data/agents/index.json`
- **Registry**: `agents/registry.yaml`
- **API Client**: `src/api/kimi-client.ts`
- **Models Config**: `src/config/models.js`

## Usage

### Via Chat Interface

The KIMI agent can be accessed through the existing chat interfaces:
- Main chat UI: `/chat`
- KIMI-specific chat: `/kimi-chat.html` (in docs/)

### Via API

```bash
# Execute KIMI agent via API
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "kimi-agent",
    "input": "你好，请介绍一下BSM平台的主要功能"
  }'
```

### Agent Selection

The KIMI agent is exposed for user selection and can be used in:
- Chat interfaces
- API calls
- Mobile applications

## Security & Governance

- **Risk Level**: Low
- **Approval**: Not required
- **Safety Mode**: Safe (no system modifications)
- **Auto-start**: Disabled
- **Contexts**: Chat, API, Mobile

## Model Configuration

- **Provider**: kimi
- **Model**: moonshot-v1-8k
- **Context Window**: 8,000 tokens
- **API Base**: Moonshot AI Platform

## Files Modified/Created

1. **src/api/kimi-client.ts** - KIMI API client implementation
2. **src/api/client-factory.ts** - Added KIMI to provider map
3. **src/api/index.ts** - Exported KIMI client
4. **src/config/models.js** - Added KIMI model configuration
5. **data/agents/kimi-agent.yaml** - Agent definition
6. **data/agents/index.json** - Added KIMI to agent list
7. **agents/registry.yaml** - Registered KIMI agent with governance
8. **.env.example** - Added KIMI_API_KEY configuration

## Getting Started

1. Sign up at [Moonshot AI Platform](https://platform.moonshot.cn/)
2. Generate an API key
3. Add the key to your `.env` file as `KIMI_API_KEY`
4. Restart the BSM server
5. Select KIMI agent from the chat interface

## Capabilities

The KIMI agent supports the following actions:
- `create_file` - Create files based on conversation

The agent is designed as a conversational assistant and does not perform destructive operations or system modifications.

## Health Check

Monitor KIMI agent health via:
```bash
curl http://localhost:3000/api/agents/kimi-agent/health
```

Health checks run every 60 seconds when the agent is active.

## Notes

- The KIMI agent is particularly well-suited for Chinese language tasks
- It integrates with the existing multi-provider architecture
- The implementation follows BSM's standard agent patterns
- No special permissions or approvals are required for use

## Related Documentation

- [BSM Agent Architecture](../docs/AGENTS.md)
- [API Providers](../docs/API-PROVIDERS.md)
- [Moonshot AI Documentation](https://platform.moonshot.cn/docs)
