# Browser DevTools MCP - Quick Reference

## Installation Commands

### VS Code
```bash
code --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

### Cursor
```bash
cursor --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

### npm Package
```bash
npm install browser-devtools-mcp@^0.2.23
```

## Configuration Files

### GitHub Copilot MCP
- **File:** `.github/copilot/mcp.json`
- **Server:** `browser-devtools`
- **Command:** `npx -y browser-devtools-mcp`

### Cursor MCP
- **File:** `.cursor/mcp.json`
- **Server:** `browser-devtools`
- **Command:** `npx -y browser-devtools-mcp`

## Usage

### Activate in VS Code/Cursor
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "MCP: Reload Servers"
3. Select the command

### Basic Browser Automation
```javascript
// Navigate to page
await browser.navigate('https://lexprim.com/chat');

// Wait for element
await browser.waitForSelector('.chat-container');

// Check visibility
const visible = await browser.isVisible('.chat-container');

// Click element
await browser.click('.submit-button');

// Type text
await browser.type('#messageInput', 'test message');
```

### Network Inspection
```javascript
// Get all network requests
const requests = await browser.getNetworkRequests();

// Filter API calls
const apiCalls = requests.filter(r => r.url.includes('/api/'));

// Wait for specific response
await browser.waitForResponse('/api/submit');
```

### Performance Monitoring
```javascript
// Get performance metrics
const metrics = await browser.getPerformanceMetrics();
console.log('Load Time:', metrics.loadTime);
console.log('DOM Ready:', metrics.domContentLoaded);
```

### Debugging
```javascript
// Execute code in browser context
const result = await browser.evaluate(() => {
  return {
    title: document.title,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
});
```

## BSM-Specific Testing

### Test Chat Interface
```javascript
await browser.navigate('https://sr-bsm.onrender.com/chat');
await browser.type('#messageInput', 'مرحباً');
await browser.click('#sendButton');
await browser.waitForSelector('.message-response');
const response = await browser.getText('.message-response');
```

### Test Agent Status
```javascript
await browser.navigate('https://sr-bsm.onrender.com/api/status');
const status = await browser.evaluate(() => {
  return JSON.parse(document.body.textContent);
});
console.log('Providers:', status.providers);
```

## Troubleshooting

### Extension not showing
```bash
# Check installation
code --list-extensions | grep browser-devtools

# Reinstall
code --uninstall-extension serkan-ozal.browser-devtools-mcp-vscode
code --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

### MCP server not starting
```bash
# Check package
npm list browser-devtools-mcp

# Reinstall
cd mcp-servers && npm install browser-devtools-mcp
```

### Reload servers
```
Command Palette > MCP: Restart Servers
```

## Documentation

- **Full Setup Guide:** [docs/BROWSER-DEVTOOLS-MCP-SETUP.md](./BROWSER-DEVTOOLS-MCP-SETUP.md)
- **MCP Integration:** [docs/MCP-INTEGRATION.md](./MCP-INTEGRATION.md)
- **Cursor Config:** [.cursor/README.md](./.cursor/README.md)

## Package Info

- **Package:** `browser-devtools-mcp`
- **Version:** `0.2.23`
- **Registry:** https://www.npmjs.com/package/browser-devtools-mcp
- **VS Code Extension:** `serkan-ozal.browser-devtools-mcp-vscode`

## Status

✅ **Installed and Configured**
- VS Code extension recommendation added
- npm package installed in mcp-servers
- MCP configurations updated for GitHub Copilot and Cursor
- Documentation completed
- Tests passing

---

**Last Updated:** 2026-02-21  
**Status:** Active and Ready to Use
