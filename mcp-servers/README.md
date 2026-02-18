# BSU/LexBANK MCP Server

Model Context Protocol (MCP) server for GitHub Copilot integration with BSU/LexBANK AI agents.

## Overview

This MCP server provides unified access to multiple AI agents through GitHub Copilot:
- **GPT-4** (OpenAI)
- **Gemini** (Google)
- **Claude** (Anthropic)
- **Perplexity** (with web search and citations)
- **Kimi** (Moonshot AI)

## Installation

```bash
cd mcp-servers
npm install
```

## Configuration

The server is configured in `.github/copilot/mcp.json`:

```json
{
  "mcpServers": {
    "lexbank-unified": {
      "command": "node",
      "args": ["mcp-servers/bsu-agent-server.js"],
      "env": {
        "BSM_API_URL": "https://sr-bsm.onrender.com/api"
      }
    }
  }
}
```

## Available Tools

### 1. list_agents
List all available AI agents.

### 2. chat_gpt
Chat with GPT-4 directly (supports Arabic and English).

**Parameters:**
- `message` (required): User message
- `language` (optional): 'ar' or 'en', default: 'ar'
- `history` (optional): Conversation history array

### 3. chat_gemini
Chat with Google Gemini AI.

**Parameters:**
- `message` (required): User message
- `language` (optional): 'ar' or 'en', default: 'ar'

### 4. chat_claude
Chat with Anthropic Claude AI.

**Parameters:**
- `message` (required): User message
- `language` (optional): 'ar' or 'en', default: 'ar'

### 5. chat_perplexity
Chat with Perplexity AI (includes web search and citations).

**Parameters:**
- `message` (required): User message
- `language` (optional): 'ar' or 'en', default: 'ar'

### 6. chat_kimi
Chat with Moonshot Kimi AI.

**Parameters:**
- `message` (required): User message
- `language` (optional): 'ar' or 'en', default: 'ar'

### 7. get_key_status
Check status of all AI service API keys.

## Available Resources

### 1. bsu://config
Unified configuration for BSU/LexBANK platform.

### 2. bsu://agents
List of all available AI agents.

### 3. bsu://status
Current system status and API key availability.

## Usage with GitHub Copilot

Once configured, you can use these tools directly in GitHub Copilot Chat:

```
@workspace /chat_gpt message="ما هي أفضل ممارسات البرمجة؟" language="ar"
```

```
@workspace /chat_perplexity message="Latest AI developments" language="en"
```

```
@workspace /get_key_status
```

## Testing

Test the MCP server locally:

```bash
node bsu-agent-server.js
```

The server communicates via stdio, so you'll need an MCP client to interact with it.

## Security

- Uses secure HTTPS connections to backend API
- No API keys stored in MCP server (proxied through backend)
- Supports CORS and rate limiting via backend

## Backend API

The MCP server connects to: `https://sr-bsm.onrender.com/api`

## Version

Current version: **2.0.0**

## Support

For issues or questions:
- Repository: https://github.com/MOTEB1989/BSM
- Documentation: See main README.md
