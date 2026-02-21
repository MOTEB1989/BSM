# GitHub MCP Integration - Quick Reference

**Status:** ✅ Fully Integrated  
**Version:** 2.0.0  
**Date:** 2026-02-21

## What is GitHub MCP?

GitHub's official Model Context Protocol server providing comprehensive Git and GitHub management capabilities through AI agents.

## Quick Start

### 1. Set GitHub Token
```bash
export GITHUB_BSU_TOKEN=ghp_your_token_here
```

### 2. Test Connection
```bash
npm run mcp:github:test
```

### 3. Start Server
```bash
# Docker method (recommended)
npm run mcp:github:docker

# Node.js wrapper
npm run mcp:github
```

## Key Features

### Git Operations (29+)
- Basic: add, commit, push, pull, fetch, clone
- Branches: create, delete, switch, merge, rebase
- Advanced: cherry-pick, bisect, blame, stash, tag
- State: status, log, diff, show

### GitHub API
- Repositories: list, create, update
- Pull Requests: list, create, review, merge
- Issues: list, create, update, close
- Workflows: status, runs, logs
- Security: alerts, scanning, Dependabot

## npm Scripts

```bash
npm run mcp:github              # Node.js wrapper
npm run mcp:github:docker       # Docker (recommended)
npm run mcp:github:test         # Test connection
```

## Configuration

### Environment Variables (.env)
```bash
GITHUB_BSU_TOKEN=ghp_...                    # Required
GITHUB_MCP_METHOD=docker                    # docker or go
GITHUB_MCP_DOCKER_IMAGE=ghcr.io/github/github-mcp-server
GITHUB_MCP_DOCKER_TAG=latest
GO_PATH=/usr/local/go/bin/go                # For 'go' method
```

### MCP Config (.github/copilot/mcp.json)
```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", 
               "ghcr.io/github/github-mcp-server:latest"]
    }
  }
}
```

## Usage Examples

### With GitHub Copilot
```
"List all open pull requests in MOTEB1989/BSM"
"Show me the status of CI workflows"
"What issues are assigned to me?"
"Create a new branch called feature/xyz"
"Show git status and recent commits"
```

### With BSU Agents
```javascript
POST /api/agents/run
{
  "agentId": "github-mcp",
  "input": "list all open PRs",
  "language": "en"
}
```

## Available Tools

### Repository Management
- `github_list_repos` - List repositories
- `github_get_repo` - Get repo details
- `github_create_repo` - Create new repo
- `github_update_repo` - Update repo settings

### Pull Requests
- `github_list_prs` - List PRs
- `github_get_pr` - Get PR details
- `github_create_pr` - Create PR
- `github_review_pr` - Review PR
- `github_merge_pr` - Merge PR

### Issues
- `github_list_issues` - List issues
- `github_get_issue` - Get issue details
- `github_create_issue` - Create issue
- `github_update_issue` - Update issue
- `github_close_issue` - Close issue

### Git Operations
- `git_status` - Repository status
- `git_add` - Stage changes
- `git_commit` - Create commit
- `git_push` - Push to remote
- `git_pull` - Pull from remote
- `git_branch` - Branch operations
- `git_merge` - Merge branches
- `git_rebase` - Rebase branches
- `git_tag` - Tag operations

### Workflows
- `github_workflow_status` - Workflow status
- `github_workflow_runs` - List runs
- `github_workflow_logs` - Get logs

### Security
- `github_security_alerts` - Security alerts
- `github_dependabot_alerts` - Dependabot alerts
- `github_code_scanning_alerts` - Code scanning alerts

## Common Issues

### Docker not found
```bash
# Check Docker is running
docker ps

# Start Docker
sudo systemctl start docker  # Linux
open -a Docker              # macOS
```

### Permission denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Bad credentials
```bash
# Verify token
echo $GITHUB_BSU_TOKEN

# Test token
curl -H "Authorization: token $GITHUB_BSU_TOKEN" \
     https://api.github.com/user
```

### Go not found
```bash
# Install Go 1.21+
wget https://go.dev/dl/go1.21.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

## Files Added/Modified

### New Files
- `mcp-servers/github-mcp-server.js` - GitHub MCP Node.js wrapper
- `docs/GITHUB-MCP-INTEGRATION.md` - Complete integration guide
- `docs/GITHUB-MCP-QUICK-REFERENCE.md` - This file

### Modified Files
- `.github/copilot/mcp.json` - Added GitHub MCP configurations
- `.env.example` - Added GitHub MCP environment variables
- `package.json` - Added GitHub MCP scripts
- `CLAUDE.md` - Added GitHub MCP integration section
- `mcp-servers/README.md` - Updated with all MCP servers

## Integration with BSU Agents

### agent-auto (my-agent)
- Repository health checks
- Automated maintenance
- CI/CD monitoring

### code-review-agent
- PR reviews
- Code quality checks
- Automated suggestions

### security-agent
- Security alert monitoring
- Dependency scanning
- Vulnerability reporting

### pr-merge-agent
- Automated PR merging
- Branch cleanup
- Release management

## Performance Tips

- **Rate Limits**: 5,000 req/hour with token
- **Caching**: GitHub MCP caches responses locally
- **Batch Operations**: Use batch operations when possible
- **Webhooks**: Use webhooks for real-time updates

## Security Best Practices

1. Never commit tokens to repository
2. Use `.env` file (in `.gitignore`)
3. Limit token scope to necessary permissions
4. Rotate tokens regularly
5. Monitor token usage
6. Use read-only mode when possible

## Resources

- **GitHub MCP Server**: https://github.com/github/github-mcp-server
- **Official Docs**: https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server
- **Complete Guide**: `docs/GITHUB-MCP-INTEGRATION.md`
- **BSM MCP Integration**: `docs/MCP-INTEGRATION.md`
- **Model Context Protocol**: https://modelcontextprotocol.io/

## Support

- **BSM Issues**: https://github.com/MOTEB1989/BSM/issues
- **GitHub MCP Issues**: https://github.com/github/github-mcp-server/issues
- **MCP Protocol**: https://github.com/modelcontextprotocol/specification

## Validation

```bash
# Run all validation tests
npm test

# Specific validations
npm run validate:registry
npm run validate:agent-sync

# Health checks
npm run health
npm run health:detailed
```

## Status Check

Current integration status:
- ✅ GitHub MCP server configured
- ✅ Docker support enabled
- ✅ Go runtime support enabled
- ✅ Environment variables documented
- ✅ npm scripts added
- ✅ Documentation complete
- ✅ All tests passing
- ✅ Ready for production

---

**Last Updated:** 2026-02-21  
**Maintainer:** BSU/LexBANK Team  
**Status:** Production Ready ✅
