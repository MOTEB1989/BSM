# BSU/LexBANK MCP Servers

This directory contains Model Context Protocol (MCP) servers for the BSM/LexBANK platform.

## Overview

MCP (Model Context Protocol) is a standard protocol that enables AI agents and tools to interact with various services. BSM provides multiple MCP servers:

1. **BSU Agent Server** - Unified access to all BSU AI agents
2. **Banking Hub** - Banking and financial services
3. **GitHub MCP Server** - Comprehensive GitHub and Git management

## Available Servers

### 1. BSU Agent Server (`bsu-agent-server.js`)

**Main unified MCP server for BSU AI agents**

Provides access to multiple AI providers:
- **GPT-4** (OpenAI)
- **Gemini** (Google)
- **Claude** (Anthropic)
- **Perplexity** (with web search and citations)
- **Kimi** (Moonshot AI)

**Tools (7):**
- `list_agents` - List all available AI agents
- `chat_gpt` - Chat with GPT-4 (Arabic/English)
- `chat_gemini` - Chat with Google Gemini
- `chat_claude` - Chat with Anthropic Claude
- `chat_perplexity` - Chat with Perplexity (includes citations)
- `chat_kimi` - Chat with Moonshot Kimi
- `get_key_status` - Check API key status

**Resources (3):**
- `bsu://config` - Platform configuration
- `bsu://agents` - Agent list
- `bsu://status` - System status

**Start:** `npm run mcp:start`

### 2. Banking Hub (`banking-hub.js`)

**Specialized MCP server for banking operations**

**Start:** `npm run mcp:banking`

### 3. GitHub MCP Server (`github-mcp-server.js`)

**Integration with GitHub's official MCP server**

Provides comprehensive GitHub and Git repository management:
- **29+ Git Operations**: add, commit, push, pull, branch, merge, rebase, tag, stash, etc.
- **GitHub API Integration**: repos, PRs, issues, workflows, security alerts
- **Workflow Automation**: automated releases, PR reviews, issue triage
- **CI/CD Visibility**: workflow status, logs

**Methods:**
- Docker: `npm run mcp:github:docker` (recommended)
- Go: Via `github-mcp-go` configuration
- Node.js wrapper: `npm run mcp:github`

**See:** `docs/GITHUB-MCP-INTEGRATION.md` for complete setup guide

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

## Platform Endpoints

The BSM platform is accessible through multiple endpoints:

- **Backend API**: https://sr-bsm.onrender.com
- **Frontend (GitHub Pages)**: https://moteb1989.github.io/BSM/
- **Primary Chat Interface**: https://lexprim.com
- **Agent Management Hub**: https://corehub.nexus
- **Cloudflare Pages**: https://9e71cbf3.lexbank.pages.dev/

All endpoints are configured with proper CORS settings and API routing.

## Version

Current version: **2.0.0**

## Support

For issues or questions:
- Repository: https://github.com/MOTEB1989/BSM
- Documentation: See main README.md
