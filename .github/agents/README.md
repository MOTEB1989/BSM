# BSU Custom Agents

This directory contains custom agent definitions and configurations for the BSU platform orchestration system.

## Agent Definitions

Each `.agent.md` file defines a custom agent with its role, instructions, and capabilities:

- **bsu-audit.agent.md** - Configuration audit and validation agent
- **bsu-autonomous-architect.agent.md** - Architecture analysis and recommendations
- **code-review.agent.md** - Code quality and standards review
- **governance.agent.md** - Policy and compliance checks
- **integrity.agent.md** - Repository health and integrity monitoring
- **legal.agent.md** - Legal and regulatory analysis
- **orchestrator.agent.md** - Multi-agent coordination and reporting
- **pr-merge.agent.md** - Pull request merge automation
- **runner.agent.md** - Build, test, and deployment execution
- **security.agent.md** - Security vulnerability scanning

## Orchestrator Configuration

The `orchestrator.config.json` file defines how the orchestrator coordinates multiple agents:

### Configuration Structure

```json
{
  "name": "BSU Orchestrator",
  "version": "1.0.0",
  "execution": {
    "mode": "sequential",
    "timeout": 2400,
    "continueOnError": false
  },
  "agents": [
    {
      "id": "bsu-autonomous-architect",
      "name": "Architect",
      "order": 1,
      "enabled": true,
      "timeout": 600
    }
  ],
  "reporting": {
    "outputDir": "reports",
    "formats": ["markdown", "json"]
  }
}
```

### Key Configuration Sections

#### Execution Settings
- **mode**: `sequential` (run agents one after another) or `parallel` (run simultaneously)
- **timeout**: Maximum total execution time in seconds (configured: 2400s / 40 minutes)
  - Breakdown: 1800s agent execution (3×600s) + 600s orchestrator overhead
- **timeoutRationale**: Explanation for timeout value (optional documentation field)
- **continueOnError**: Whether to continue if an agent fails (default: false)

#### Agent Configuration
Each agent entry includes:
- **id**: Agent identifier (must match agent definition filename)
- **name**: Display name
- **order**: Execution order (for sequential mode)
- **enabled**: Whether to include this agent in orchestration
- **timeout**: Agent-specific timeout in seconds
- **outputs**: Expected output files
- **requiredEnvVars**: Environment variables required by this agent

#### Reporting
- **outputDir**: Directory for generated reports (default: `reports/`)
- **formats**: Output formats (`markdown`, `json`)
- **aggregatedReport**: Template for final summary report
- **timestampFormat**: Format for timestamps in filenames

#### Secrets Management
- **mode**: `env` (read from environment variables)
- **allowed**: List of allowed secret names
- **logging.logSecrets**: Never log actual secret values (always false)
- **logging.maskInOutput**: Mask secrets in reports (default: true)

#### CI Integration
- **enabled**: Enable CI workflow integration
- **scriptPath**: Path to orchestration script
- **workflowFile**: GitHub Actions workflow file
- **artifactRetention**: Days to keep artifacts

## Running the Orchestrator

### Local Execution

Using the copilot CLI (if available):
```bash
copilot agents run orchestrator --config .github/agents/orchestrator.config.json
```

Using the bash script directly:
```bash
./scripts/run_agents.sh reports false
```

### CI Execution

The orchestrator runs automatically in GitHub Actions via the workflow defined in `.github/workflows/run-bsu-agents.yml`.

Trigger manually:
1. Go to Actions tab in GitHub
2. Select "Run BSU Agents" workflow
3. Click "Run workflow"

### Environment Variables

Required environment variables (configured in CI secrets):
- `OPENAI_BSU_KEY` - OpenAI API key for agent execution
- `KM_ENDPOINT` - Knowledge management endpoint (optional)
- `KM_TOKEN` - Knowledge management API token (optional)
- `SNYK_TOKEN` - Snyk security scanning token (optional)

## Output Files

The orchestrator generates the following reports in the `reports/` directory:

### Summary Reports
- `agents-summary-{timestamp}.md` - Consolidated summary of all agent results
- `result_{timestamp}.json` - Structured JSON report with all agent outputs
- `report_{timestamp}.md` - Formatted markdown report

### Agent-Specific Reports
- **Architect**: Architecture analysis, recommendations JSON, executive summary
- **Runner**: Build test reports, runner summary, execution logs
- **Security**: Security audit, vulnerability summary, findings

### Logs
- `run_{timestamp}.log` - Detailed execution log with timestamps

## Customization

### Adding a New Agent to Orchestration

1. Create agent definition file: `.github/agents/my-agent.agent.md`
2. Add agent to `orchestrator.config.json`:

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "order": 4,
  "enabled": true,
  "timeout": 300,
  "description": "What this agent does",
  "outputs": ["reports/my-agent-output.md"]
}
```

3. Test locally:
```bash
./scripts/run_agents.sh reports false
```

### Disabling an Agent

Set `"enabled": false` in the agent configuration:

```json
{
  "id": "security",
  "enabled": false
}
```

### Changing Execution Order

Modify the `order` field for each agent. Lower numbers execute first.

### Adjusting Timeouts

Modify timeouts at the orchestrator level or per-agent:

```json
{
  "execution": {
    "timeout": 2400
  },
  "agents": [
    {
      "id": "runner",
      "timeout": 900
    }
  ]
}
```

## Security Best Practices

1. **Never commit secrets** to this repository
2. **Use environment variables** for all sensitive data
3. **Review generated reports** before sharing - they may contain sensitive information
4. **Limit agent permissions** to only what's necessary
5. **Monitor agent execution logs** for unusual activity
6. **Keep agent definitions updated** with current security practices

## Troubleshooting

### Agent Fails to Execute

1. Check logs in `reports/run_{timestamp}.log`
2. Verify environment variables are set correctly
3. Ensure agent timeout is sufficient
4. Check agent definition file exists and is valid

### Missing Reports

1. Verify `reports/` directory exists and is writable
2. Check agent completed successfully in logs
3. Verify output paths in agent configuration

### CI Workflow Fails

1. Check workflow logs in GitHub Actions
2. Verify secrets are configured in repository settings
3. Ensure `scripts/run_agents.sh` has execute permissions
4. Check for dependency installation issues

## Further Reading

- [GitHub Copilot Custom Agents Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [BSU Platform Documentation](../../README.md)
- [Security Guidelines](../../SECURITY.md)
- [Contributing Guide](../../docs/CONTRIBUTING.md)
