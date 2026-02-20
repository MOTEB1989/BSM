# Supreme Unrestricted Master Agent

## ⚠️⚠️⚠️ CRITICAL SECURITY WARNING ⚠️⚠️⚠️

### 🔴 EXTREME DANGER - READ THIS BEFORE USING 🔴

This agent has **UNRESTRICTED ACCESS** to your system and bypasses ALL security controls. It can:

- Execute **ANY** shell command
- Access **ANY** website
- Modify **ANY** file
- Delete data
- Install/uninstall packages
- Change system configuration
- No approval workflows
- No rate limiting
- No security boundaries

## ⛔ DO NOT USE IN:

- ❌ Production environments
- ❌ Client systems
- ❌ Shared hosting
- ❌ Any system with real users or data
- ❌ Public-facing servers
- ❌ CI/CD pipelines
- ❌ Containerized environments with sensitive data

## ✅ ONLY USE IN:

- ✅ Personal development machines (isolated)
- ✅ Test VMs that can be destroyed
- ✅ Sandboxed development environments
- ✅ Throwaway containers

---

## Duplication Analysis

**This agent is NOT a duplicate** of existing BSM agents:

### Existing BSM Agents with Shell Execution:
1. **my-agent** (BSU Smart Agent) - Uses controlled `execute_command` action
2. **gemini-agent** - Uses whitelisted `execute_command`
3. **groq-agent** - Uses whitelisted `execute_command`
4. **perplexity-agent** - Uses whitelisted `execute_command`

### Key Differences:
| Feature | Existing Agents | Supreme Agent |
|---------|----------------|---------------|
| Execution | BSM `execute_command` action | Direct `execSync()` calls |
| Security | Action whitelisting, approval workflows | **NO restrictions** |
| Registry | In `agents/registry.yaml` | **NOT registered** (security risk) |
| Egress Policy | Enforced | **Bypassed** |
| Rate Limiting | Enforced | **Bypassed** |
| Circuit Breakers | Protected | **Bypassed** |
| Audit Logging | Centralized | Local only |
| Safe Mode | Respected | **Ignored** |

**Conclusion**: This is an intentionally unrestricted agent for educational/personal testing purposes, clearly separated from production agents.

---

## Purpose

This agent was created for **personal experimentation only** in response to a specific user request. It demonstrates what a truly unrestricted agent would look like, but **should never be used in any real scenario**.

The BSM (Business Service Management) platform is designed with multiple layers of security controls. This agent intentionally bypasses ALL of them for educational/experimental purposes.

## Features

### 1. Shell Command Execution
```javascript
agent.execShell('ls -la')
agent.execShell('npm install')
agent.execShell('git status')
```

**Danger**: Can execute ANY command with your user permissions.

### 2. Internet Access
```javascript
await agent.fetchWeb('https://example.com')
```

**Danger**: No URL restrictions, no egress policy enforcement.

### 3. Automatic Code Fixing
```javascript
await agent.auditAndFixFiles()
await agent.auditAndFixFiles('/path/to/directory')
```

**Danger**: Automatically modifies your code files without confirmation.

### 4. Full Health Check
```javascript
await agent.fullHealthCheck()
```

Runs: npm audit --fix, eslint --fix, file audit, npm test

**Danger**: Automatically "fixes" issues which may break your code.

### 5. Supreme Sweep
```javascript
await agent.supremeSweep()
```

Runs all operations in sequence.

**Danger**: Maximum automation with minimal human oversight.

---

## Installation & Setup

### Prerequisites

1. **Isolated test environment** (VM, container, or dedicated machine)
2. Node.js 22+ installed
3. BSM repository cloned
4. Understanding of the risks

### Step 1: Enable the Agent

Add to your `.env` file:

```bash
# ⚠️ DANGER: Only enable in personal test environments
SUPREME_AGENT_ENABLED=true

# Optional: Override dry-run mode (NOT RECOMMENDED)
# SUPREME_AGENT_DRY_RUN=false
```

**Default behavior**: Agent is DISABLED unless explicitly enabled.

### Step 2: Import and Use

Create a test script (e.g., `test-supreme-agent.js`):

```javascript
import { SupremeUnrestrictedAgent } from './mcp-servers/agents/supreme-unrestricted-agent.js';

// Create agent instance
const agent = new SupremeUnrestrictedAgent({
  dryRun: true  // ALWAYS start with dry-run enabled!
});

// Check status
console.log('Agent Status:', agent.getStatus());

// Test in dry-run mode first
try {
  // Safe testing
  const results = await agent.supremeSweep();
  console.log('Sweep Results:', results);
  
  // View audit log
  console.log('Audit Log:', agent.getAuditLog());
} catch (error) {
  console.error('Error:', error);
}
```

### Step 3: Run with Dry-Run Mode

```bash
# ALWAYS test with dry-run first
SUPREME_AGENT_ENABLED=true node test-supreme-agent.js
```

Dry-run mode will:
- Show what WOULD happen
- Not execute any commands
- Not modify any files
- Generate audit logs

### Step 4: (Optional) Live Mode

⚠️ **ONLY if you're absolutely sure and in a disposable environment**:

```javascript
const agent = new SupremeUnrestrictedAgent({
  dryRun: false  // 🔴 DANGER: Live mode enabled
});
```

---

## Safety Features

Even though this agent is "unrestricted", it includes some basic safety:

### 1. Environment Variable Gate
- Agent is **disabled by default**
- Requires `SUPREME_AGENT_ENABLED=true`
- Logs warnings if enabled

### 2. Dry-Run Mode
- **Enabled by default**
- Must be explicitly disabled to run live
- Shows what would happen without doing it

### 3. Command Sanitization
- Blocks extremely dangerous commands:
  - `rm -rf /`
  - `rm -rf ~`
  - `mkfs`
  - Fork bombs
  - Direct disk writes
  
### 4. Production Warnings
- Logs critical error if enabled in NODE_ENV=production
- Recommends against production use

### 5. Audit Logging
- All operations are logged
- Timestamps included
- View with `agent.getAuditLog()`

---

## Usage Examples

### Example 1: Check Agent Status
```javascript
const agent = new SupremeUnrestrictedAgent();
console.log(agent.getStatus());
// Shows: enabled, dryRun, environment, etc.
```

### Example 2: Run Shell Command (Dry-Run)
```javascript
const agent = new SupremeUnrestrictedAgent({ dryRun: true });
agent.execShell('ls -la');
// Output: [DRY-RUN] Command execution skipped
```

### Example 3: Fetch Website (Dry-Run)
```javascript
const agent = new SupremeUnrestrictedAgent({ dryRun: true });
const data = await agent.fetchWeb('https://example.com');
// Returns: { dryRun: true, url: '...' }
```

### Example 4: Audit Files (Dry-Run)
```javascript
const agent = new SupremeUnrestrictedAgent({ dryRun: true });
const results = await agent.auditAndFixFiles();
console.log(`Scanned: ${results.scanned}, Would modify: ${results.files.length}`);
```

### Example 5: Full Health Check
```javascript
const agent = new SupremeUnrestrictedAgent({ dryRun: true });
const health = await agent.fullHealthCheck();
console.log('Health Check Results:', health);
```

### Example 6: View Audit Log
```javascript
const agent = new SupremeUnrestrictedAgent({ dryRun: true });
await agent.supremeSweep();

// View all operations
const log = agent.getAuditLog();
log.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.action}`);
});
```

---

## How It Bypasses BSM Security

Normal BSM agents have:

1. **Action Whitelisting**: Only ~45 approved actions allowed
   - **Bypassed**: Can execute any operation
   
2. **Registry Validation**: Must have governance fields (risk, approval)
   - **Bypassed**: Not in registry, operates independently
   
3. **Circuit Breakers**: External calls are protected
   - **Bypassed**: Direct execSync and fetch calls
   
4. **Rate Limiting**: Max requests per time window
   - **Bypassed**: No rate limiting applied
   
5. **Egress Policy**: Outbound network calls restricted
   - **Bypassed**: Direct fetch without egress checks
   
6. **Approval Workflows**: High-risk actions require approval
   - **Bypassed**: No approval mechanism
   
7. **Safe Mode**: Can disable external APIs
   - **Bypassed**: Ignores SAFE_MODE flag
   
8. **Audit Trail**: Centralized audit logging
   - **Partial**: Has own audit log, not centralized

This demonstrates why unrestricted agents are dangerous!

---

## Troubleshooting

### Agent Won't Start
```
Error: Supreme Unrestricted Agent is disabled
```

**Solution**: Set `SUPREME_AGENT_ENABLED=true` in your environment.

### "Dangerous command detected"
```
Error: Dangerous command detected and blocked: rm -rf /
```

**Solution**: This is intentional. The agent blocks extremely dangerous commands.

### Commands Not Executing
**Check**: Are you in dry-run mode?
- Agent defaults to `dryRun: true`
- Set `dryRun: false` to execute (NOT RECOMMENDED)

### Logger Import Error
```
Error: Cannot find module '../../src/utils/logger.js'
```

**Solution**: Run from BSM repository root, ensure all dependencies installed.

---

## Responsible Usage

If you choose to use this agent:

1. **✅ DO**: Use in isolated, throwaway environments
2. **✅ DO**: Keep dry-run mode enabled for testing
3. **✅ DO**: Review audit logs after operations
4. **✅ DO**: Understand every command before running
5. **✅ DO**: Have backups of important data
6. **✅ DO**: Run in VMs or containers that can be destroyed
7. **❌ DON'T**: Use in production
8. **❌ DON'T**: Use on shared systems
9. **❌ DON'T**: Grant network access in production
10. **❌ DON'T**: Run without understanding the code

---

## Legal Disclaimer

This agent is provided AS-IS for educational purposes only. The authors and BSM project:

- **DO NOT RECOMMEND** using this agent in any scenario
- **ARE NOT LIABLE** for any damage, data loss, or security breaches
- **DO NOT SUPPORT** this agent in production environments
- **STRONGLY ADVISE** using normal BSM agents with proper security controls

By using this agent, you acknowledge:
- You understand the risks
- You accept full responsibility
- You are using it in a personal, isolated environment only
- You will not hold anyone liable for consequences

---

## Alternative Recommendations

Instead of using this unrestricted agent, consider:

1. **Normal BSM Agents**: Use the 16+ secure agents in BSM
2. **Custom Actions**: Extend existing agents with approved actions
3. **Manual Operations**: Run commands manually with human oversight
4. **Controlled Automation**: Use BSM's orchestrator with governance
5. **Proper CI/CD**: Implement secure automation pipelines

---

## Questions?

If you need powerful automation but with security:

- Review: `/src/agents/` for secure agent examples
- Check: `agents/registry.yaml` for governance model
- Read: `CLAUDE.md` for BSM architecture
- Use: Normal agent system with proper controls

**Remember**: With great power comes great responsibility. This agent has too much power and too little responsibility!

---

## Acknowledgments

This agent was created in response to a user request for educational purposes. It demonstrates what NOT to do in a production system.

The BSM project maintains strong security practices. This agent intentionally violates them to show the importance of proper security controls.

**Status: Experimental - Not for Production Use**

Last Updated: 2026-02-20
