# Cursor MCP Configuration

This directory contains the Model Context Protocol (MCP) configuration for Cursor IDE.

## Configuration File

- **`mcp.json`** - MCP server configuration for Cursor

## Configured MCP Servers

### 1. lexbank-unified
Main BSU/LexBANK agent server providing:
- AI chat capabilities (GPT, Gemini, Claude, Perplexity, Kimi)
- Agent orchestration
- Knowledge base access
- System status

### 2. bsm-banking-agents
Banking-specific agent hub for specialized financial operations.

### 3. browser-devtools
Browser automation and debugging capabilities via MCP.

**Installation:**
```bash
cursor --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

## Usage

The MCP servers are automatically loaded by Cursor when you open this workspace. You can access them through:
- Cursor AI chat
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- MCP Tools integration

## Reload Servers

If you make changes to `mcp.json`, reload the servers:
1. Open Command Palette
2. Type "MCP: Reload Servers"
3. Select the command

## Documentation

See [Browser DevTools MCP Setup Guide](../docs/BROWSER-DEVTOOLS-MCP-SETUP.md) for detailed setup and usage instructions.
