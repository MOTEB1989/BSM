# GitHub MCP Server Integration

## Overview

The BSM/LexBANK platform now includes integration with GitHub's official MCP (Model Context Protocol) server, providing comprehensive GitHub and Git repository management capabilities directly through AI agents and GitHub Copilot.

## Features

### Git Operations (29+ commands)
- **Basic Operations**: add, commit, push, pull, fetch, clone
- **Branch Management**: create, delete, switch, merge, rebase
- **Advanced Operations**: cherry-pick, bisect, blame, stash
- **Tag Management**: create, list, delete tags
- **Remote Management**: add, remove, list remotes
- **Repository State**: status, log, diff, show

### GitHub API Integration
- **Repository Management**: list, create, update repositories
- **Pull Requests**: list, create, review, merge PRs
- **Issues**: list, create, update, close issues
- **CI/CD**: workflow status, run history, logs
- **Security**: Dependabot alerts, code scanning results
- **Projects**: manage GitHub Projects and milestones

### Workflow Automation
- **Quick Actions**: add→commit→push sequences
- **Release Management**: automated release workflows
- **Hotfix Workflows**: emergency fix procedures
- **Team Collaboration**: automated PR reviews, issue triage

## Installation

### Prerequisites

You need **ONE** of the following:
1. **Docker** (recommended) - cross-platform, no additional setup
2. **Go 1.21+** - if Docker is not available

### Option 1: Docker (Recommended)

```bash
# Pull the GitHub MCP server image
docker pull ghcr.io/github/github-mcp-server:latest

# Test the installation
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=your_token ghcr.io/github/github-mcp-server
```

### Option 2: Go

```bash
# Ensure Go is installed
go version  # Should show Go 1.21+

# Test the installation
go run github.com/github/github-mcp-server/cmd/github-mcp-server@latest stdio --dynamic-toolsets
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Required: GitHub Personal Access Token
GITHUB_BSU_TOKEN=ghp_your_token_here
# OR
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# Optional: Choose installation method
GITHUB_MCP_METHOD=docker  # Options: 'docker' or 'go'

# Optional: Docker configuration
GITHUB_MCP_DOCKER_IMAGE=ghcr.io/github/github-mcp-server
GITHUB_MCP_DOCKER_TAG=latest

# Optional: Go configuration
GO_PATH=/usr/local/go/bin/go
```

### GitHub Token Setup

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `read:org` (Read org and team membership)
4. Copy the token and add to your `.env` file

### MCP Server Configuration

The GitHub MCP server is configured in `.github/copilot/mcp.json`:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server:latest"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_BSU_TOKEN}"
      }
    }
  }
}
```

## Usage

### With GitHub Copilot

Once configured, you can use natural language commands in your IDE:

```
# Repository operations
"List all open pull requests in MOTEB1989/BSM"
"Show me the status of CI workflows"
"What issues are assigned to me?"

# Git operations
"Show me the git status"
"Commit all changes with message 'Fix bug'"
"Push to origin main"

# Advanced queries
"Show me all security alerts in this repo"
"List PRs that need review"
"What's the latest release?"
```

### With BSU Agents

You can also use GitHub operations through BSU agents:

```javascript
// Via MCP server
POST /api/agents/run
{
  "agentId": "github-mcp",
  "input": "list all open PRs in MOTEB1989/BSM",
  "language": "en"
}
```

### Direct Node.js Integration

```javascript
const { spawn } = require('child_process');

// Start GitHub MCP server
const githubMCP = spawn('docker', [
  'run', '-i', '--rm',
  '-e', 'GITHUB_PERSONAL_ACCESS_TOKEN',
  'ghcr.io/github/github-mcp-server:latest'
], {
  env: {
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_BSU_TOKEN
  }
});

githubMCP.stdout.on('data', (data) => {
  console.log(`GitHub MCP: ${data}`);
});
```

## Available Tools

### Repository Management
- `github_list_repos` - List repositories
- `github_get_repo` - Get repository details
- `github_create_repo` - Create new repository
- `github_update_repo` - Update repository settings

### Pull Requests
- `github_list_prs` - List pull requests
- `github_get_pr` - Get PR details
- `github_create_pr` - Create new PR
- `github_review_pr` - Review PR
- `github_merge_pr` - Merge PR

### Issues
- `github_list_issues` - List issues
- `github_get_issue` - Get issue details
- `github_create_issue` - Create new issue
- `github_update_issue` - Update issue
- `github_close_issue` - Close issue

### Git Operations
- `git_status` - Get repository status
- `git_add` - Stage changes
- `git_commit` - Create commit
- `git_push` - Push to remote
- `git_pull` - Pull from remote
- `git_branch` - Branch operations
- `git_merge` - Merge branches
- `git_rebase` - Rebase branches
- `git_tag` - Tag operations

### Workflows
- `github_workflow_status` - Get workflow status
- `github_workflow_runs` - List workflow runs
- `github_workflow_logs` - Get workflow logs

### Security
- `github_security_alerts` - List security alerts
- `github_dependabot_alerts` - List Dependabot alerts
- `github_code_scanning_alerts` - List code scanning alerts

## Examples

### Example 1: List Open PRs

```javascript
{
  "tool": "github_list_prs",
  "args": {
    "owner": "MOTEB1989",
    "repo": "BSM",
    "state": "open"
  }
}
```

### Example 2: Create and Push Commit

```javascript
// 1. Add files
{
  "tool": "git_add",
  "args": {
    "files": ["."]
  }
}

// 2. Commit
{
  "tool": "git_commit",
  "args": {
    "message": "feat: Add GitHub MCP integration"
  }
}

// 3. Push
{
  "tool": "git_push",
  "args": {
    "remote": "origin",
    "branch": "main"
  }
}
```

### Example 3: Get CI/CD Status

```javascript
{
  "tool": "github_workflow_status",
  "args": {
    "owner": "MOTEB1989",
    "repo": "BSM"
  }
}
```

## Troubleshooting

### Docker Issues

**Error: Cannot connect to Docker daemon**
```bash
# Check Docker is running
docker ps

# Start Docker service
sudo systemctl start docker  # Linux
open -a Docker              # macOS
```

**Error: Permission denied**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Go Issues

**Error: Go not found**
```bash
# Install Go
wget https://go.dev/dl/go1.21.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

### Token Issues

**Error: Bad credentials**
- Verify token is correct and not expired
- Ensure token has required scopes
- Check token is properly set in environment

**Error: Rate limit exceeded**
- Wait for rate limit to reset
- Use token with higher rate limits
- Contact GitHub support for enterprise limits

### MCP Issues

**Error: MCP server not responding**
```bash
# Test GitHub MCP directly
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_BSU_TOKEN ghcr.io/github/github-mcp-server:latest

# Check logs
docker logs <container_id>
```

## Security Best Practices

1. **Never commit tokens to repository**
   - Use `.env` file (in `.gitignore`)
   - Use environment variables
   - Use secrets manager in production

2. **Limit token scope**
   - Only grant necessary permissions
   - Use separate tokens for different purposes
   - Regularly rotate tokens

3. **Use read-only mode when possible**
   - Configure tools with minimal permissions
   - Use repository-scoped tokens

4. **Monitor token usage**
   - Review token access logs
   - Set up alerts for unusual activity
   - Revoke unused tokens

## Integration with BSU Agents

The GitHub MCP server integrates seamlessly with existing BSU agents:

### Agent-Auto (my-agent)
Can use GitHub operations for:
- Repository health checks
- Automated maintenance tasks
- CI/CD monitoring

### Code Review Agent
Can use GitHub operations for:
- PR reviews
- Code quality checks
- Automated suggestions

### Security Agent
Can use GitHub operations for:
- Security alert monitoring
- Dependency scanning
- Vulnerability reporting

### PR Merge Agent
Can use GitHub operations for:
- Automated PR merging
- Branch cleanup
- Release management

## Performance Considerations

- **Rate Limits**: GitHub API has rate limits (5,000 req/hour with token)
- **Caching**: GitHub MCP server caches responses locally
- **Batch Operations**: Use batch operations when possible
- **Webhooks**: Use webhooks for real-time updates instead of polling

## Resources

- [GitHub MCP Server Repository](https://github.com/github/github-mcp-server)
- [GitHub MCP Documentation](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [BSM MCP Integration](./MCP-INTEGRATION.md)

## Support

For issues and questions:
- GitHub MCP: https://github.com/github/github-mcp-server/issues
- BSM/LexBANK: Create issue in MOTEB1989/BSM repository
- General MCP: https://github.com/modelcontextprotocol/specification

## License

GitHub MCP Server: MIT License
BSM/LexBANK Integration: UNLICENSED (private)
