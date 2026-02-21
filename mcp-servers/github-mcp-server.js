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
 * Spawn the GitHub MCP server process based on configuration.
 * Returns a ChildProcess instance with stdio pipes.
 */
function spawnGitHubMCPProcess() {
  const method = GITHUB_MCP_CONFIG.method;

  if (method === 'docker') {
    const image = `${GITHUB_MCP_CONFIG.docker.image}:${GITHUB_MCP_CONFIG.docker.tag}`;
    const envArgs = [];

    // Pass token through environment if configured
    const env = { ...process.env };
    if (GITHUB_MCP_CONFIG.token) {
      env.GITHUB_PERSONAL_ACCESS_TOKEN = GITHUB_MCP_CONFIG.token;
    }

    const args = [
      'run',
      '-i',
      '--rm',
      ...(GITHUB_MCP_CONFIG.token ? ['-e', 'GITHUB_PERSONAL_ACCESS_TOKEN'] : []),
      image,
      ...GITHUB_MCP_CONFIG.docker.args,
    ];

    return spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });
  }

  if (method === 'go') {
    const env = { ...process.env };
    if (GITHUB_MCP_CONFIG.token) {
      env.GITHUB_PERSONAL_ACCESS_TOKEN = GITHUB_MCP_CONFIG.token;
    }

    const args = [
      'run',
      GITHUB_MCP_CONFIG.go.package,
      ...GITHUB_MCP_CONFIG.go.args,
    ];

    return spawn('go', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });
  }

  throw new Error(`Unsupported GitHub MCP method: ${method}`);
}

/**
 * Call the GitHub MCP server over stdio using MCP/JSON-RPC framing.
 *
 * @param {string} method - JSON-RPC method name (e.g., "tools/call").
 * @param {object} params - JSON-RPC params object.
 * @returns {Promise<any>} - Resolves with the "result" field of the JSON-RPC response.
 */
async function callGitHubMCP(method, params) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnGitHubMCPProcess();
    } catch (err) {
      return reject(err);
    }

    let stdoutBuffer = Buffer.alloc(0);
    let stderrBuffer = Buffer.alloc(0);

    const requestId = 1;
    const requestPayload = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    const body = Buffer.from(JSON.stringify(requestPayload), 'utf8');
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timed out waiting for response from GitHub MCP server'));
    }, 60000);

    function cleanup() {
      clearTimeout(timeout);
      if (child) {
        child.removeAllListeners();
        if (!child.killed) {
          child.kill();
        }
      }
    }

    child.stdout.on('data', (data) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, data]);

      const text = stdoutBuffer.toString('utf8');
      const headerEnd = text.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        return;
      }

      const headerText = text.slice(0, headerEnd);
      const match = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        return;
      }

      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      const totalLength = bodyStart + contentLength;

      if (stdoutBuffer.length < totalLength) {
        return;
      }

      const bodyBuffer = stdoutBuffer.slice(bodyStart, totalLength);
      const bodyString = bodyBuffer.toString('utf8');

      try {
        const response = JSON.parse(bodyString);
        if (response.id !== requestId) {
          return;
        }
        cleanup();
        if (response.error) {
          const err = new Error(
            `GitHub MCP server error: ${response.error.message || 'Unknown error'}`
          );
          err.code = response.error.code;
          err.data = response.error.data;
          reject(err);
        } else {
          resolve(response.result);
        }
      } catch (e) {
        cleanup();
        reject(e);
      }
    });

    child.stderr.on('data', (data) => {
      stderrBuffer = Buffer.concat([stderrBuffer, data]);
    });

    child.on('error', (err) => {
      cleanup();
      reject(err);
    });

    child.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        const stderrText = stderrBuffer.toString('utf8');
        const msg = `GitHub MCP process exited with code ${code}${
          stderrText ? `: ${stderrText}` : ''
        }`;
        cleanup();
        reject(new Error(msg));
      } else if (signal && !stdoutBuffer.length) {
        cleanup();
        reject(new Error(`GitHub MCP process was terminated by signal ${signal}`));
      }
    });

    // Send the framed request
    try {
      child.stdin.write(header);
      child.stdin.write(body);
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}

/**
 * Handle GitHub MCP tool calls
 * This proxies calls to the actual GitHub MCP server
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Forward the original tool call as an MCP "tools/call" request
    const result = await callGitHubMCP('tools/call', request.params);
    return result;
  } catch (error) {
    console.error('Error calling GitHub MCP server:', error);
    // Return a tool error response so callers see a clear message
    return {
      content: [
        {
          type: 'text',
          text: `Failed to execute GitHub MCP tool call: ${
            error && error.message ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
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
