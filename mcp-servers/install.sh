#!/bin/bash

# MCP Server Installation Script for LexBANK
# Usage: ./install.sh

set -e

echo "🚀 Installing LexBANK MCP Server..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Error: Node.js 22+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Verify installation
if [ ! -d "node_modules" ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if server file is executable
if [ ! -x "bsu-agent-server.js" ]; then
    echo "🔧 Making server executable..."
    chmod +x bsu-agent-server.js
fi

echo "✅ Server is executable"

# Test syntax
echo "🧪 Testing server syntax..."
node -c bsu-agent-server.js

echo "✅ Syntax check passed"

# Get absolute path
ABSOLUTE_PATH=$(cd "$(dirname "$0")" && pwd)
SERVER_PATH="$ABSOLUTE_PATH/bsu-agent-server.js"

echo ""
echo "✨ Installation completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Add this configuration to your VS Code settings.json:"
echo ""
echo '{
  "github.copilot.chat.mcp.servers": {
    "lexbank": {
      "command": "node",
      "args": ["'$SERVER_PATH'"],
      "env": {
        "API_BASE": "https://sr-bsm.onrender.com/api"
      }
    }
  }
}'
echo ""
echo "2. Restart VS Code"
echo "3. Test with: @lexbank use check_agents_status"
echo ""
echo "📖 For more information, see README.md"
