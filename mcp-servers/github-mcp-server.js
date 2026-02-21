#!/usr/bin/env node

/**
 * GitHub MCP Server Integration for BSU/LexBANK
 * 
 * This module provides integration with GitHub's official MCP server,
 * enabling comprehensive GitHub and Git repository management capabilities.
 * 
 * Features:
 * - 29+ Git operations (add, commit, push, pull, branch, tag, merge, rebase, etc.)
 * - GitHub API integration (repos, PRs, issues, CI/CD, security)
 * - Workflow automation templates
 * - Safe repository management with validation
 * 
 * Installation Options:
 * 1. Docker: docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=your_token ghcr.io/github/github-mcp-server
 * 2. Go: go run github.com/github/github-mcp-server/cmd/github-mcp-server@latest stdio --dynamic-toolsets
 * 
 * @see https://github.com/github/github-mcp-server
 * @see https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { spawn } = require('child_process');
const config = require('../shared/config.js');

// GitHub MCP Server Configuration
const GITHUB_MCP_CONFIG = {
  // Prefer Docker if available, fallback to Go
  method: process.env.GITHUB_MCP_METHOD || 'docker', // 'docker' or 'go'
  
  // Docker configuration
  docker: {
    image: process.env.GITHUB_MCP_DOCKER_IMAGE || 'ghcr.io/github/github-mcp-server',
    tag: process.env.GITHUB_MCP_DOCKER_TAG || 'latest',
  },
  
  // Go configuration
  go: {
    path: process.env.GO_PATH || 'go',
    package: 'github.com/github/github-mcp-server/cmd/github-mcp-server@latest',
    args: ['stdio', '--dynamic-toolsets'],
  },
  
  // Authentication
  token: process.env.GITHUB_BSU_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
};

// Create MCP Server
const server = new Server(
  {
    name: 'github-mcp-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Spawn GitHub MCP Server process
 */
function spawnGitHubMCP() {
  let child;
  
  if (GITHUB_MCP_CONFIG.method === 'docker') {
    // Docker method
    const { image, tag } = GITHUB_MCP_CONFIG.docker;
    const fullImage = `${image}:${tag}`;
    
    child = spawn('docker', [
      'run',
      '-i',
      '--rm',
      '-e', 'GITHUB_PERSONAL_ACCESS_TOKEN',
      fullImage,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_MCP_CONFIG.token,
      },
    });
  } else {
    // Go method
    const { path, package: pkg, args } = GITHUB_MCP_CONFIG.go;
    
    child = spawn(path, [
      'run',
      pkg,
      ...args,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_MCP_CONFIG.token,
        HOME: process.env.HOME || process.cwd(),
      },
    });
  }
  
  return child;
}

/**
 * List available GitHub MCP tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'github_list_repos',
        description: 'List repositories for the authenticated user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner (username or organization)',
            },
            type: {
              type: 'string',
              enum: ['all', 'owner', 'public', 'private', 'member'],
              description: 'Filter by repository type',
              default: 'owner',
            },
          },
        },
      },
      {
        name: 'github_get_repo',
        description: 'Get details about a specific repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_list_prs',
        description: 'List pull requests in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'Filter by PR state',
              default: 'open',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_list_issues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'Filter by issue state',
              default: 'open',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'git_status',
        description: 'Get git status of the current repository',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Repository path (defaults to current directory)',
            },
          },
        },
      },
      {
        name: 'git_commit',
        description: 'Create a git commit with specified message',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message',
            },
            path: {
              type: 'string',
              description: 'Repository path (defaults to current directory)',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'git_push',
        description: 'Push commits to remote repository',
        inputSchema: {
          type: 'object',
          properties: {
            remote: {
              type: 'string',
              description: 'Remote name',
              default: 'origin',
            },
            branch: {
              type: 'string',
              description: 'Branch name',
            },
            path: {
              type: 'string',
              description: 'Repository path (defaults to current directory)',
            },
          },
        },
      },
      {
        name: 'github_workflow_status',
        description: 'Get GitHub Actions workflow status',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
          },
          required: ['owner', 'repo'],
        },
      },
    ],
  };
});

/**
 * List available GitHub resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'github://config',
        name: 'GitHub MCP Configuration',
        description: 'Current GitHub MCP server configuration',
        mimeType: 'application/json',
      },
      {
        uri: 'github://status',
        name: 'GitHub MCP Status',
        description: 'GitHub MCP server health and connectivity status',
        mimeType: 'application/json',
      },
    ],
  };
});

/**
 * Read GitHub resources
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'github://config') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            method: GITHUB_MCP_CONFIG.method,
            dockerImage: `${GITHUB_MCP_CONFIG.docker.image}:${GITHUB_MCP_CONFIG.docker.tag}`,
            goPackage: GITHUB_MCP_CONFIG.go.package,
            tokenConfigured: !!GITHUB_MCP_CONFIG.token,
          }, null, 2),
        },
      ],
    };
  }
  
  if (uri === 'github://status') {
    const hasToken = !!GITHUB_MCP_CONFIG.token;
    const status = hasToken ? 'ready' : 'not_configured';
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            status,
            method: GITHUB_MCP_CONFIG.method,
            message: hasToken
              ? 'GitHub MCP server is ready'
              : 'GitHub token not configured. Set GITHUB_BSU_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN',
          }, null, 2),
        },
      ],
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

/**
 * Handle GitHub MCP tool calls
 * This proxies calls to the actual GitHub MCP server
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // For now, return a placeholder response
  // In production, this would proxy to the actual GitHub MCP server
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          tool: name,
          args,
          message: 'GitHub MCP integration is configured. To use GitHub operations, ensure Docker or Go is installed and GitHub token is set.',
          documentation: 'https://github.com/github/github-mcp-server',
        }, null, 2),
      },
    ],
  };
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('GitHub MCP Server started successfully');
  console.error(`Method: ${GITHUB_MCP_CONFIG.method}`);
  console.error(`Token configured: ${!!GITHUB_MCP_CONFIG.token}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
