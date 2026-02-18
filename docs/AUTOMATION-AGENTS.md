# BSM Automation Agents

## Overview
Three new GitHub Actions automation agents have been added to streamline the development workflow.

## The Three Automation Agents

### 1. 🧹 The Cleaner Agent (`agent-1-fixer.yml`)

**Purpose:** Automatically formats and cleans code on every pull request.

**Actions:**
- Formats Python code using Black
- Formats JS/JSON/YAML/MD files using Prettier
- Auto-commits the formatting changes

**Trigger:** Runs on every pull request
**Risk Level:** Low (read-only formatting operations)

**Benefits:**
- Ensures consistent code style across the repository
- Eliminates manual formatting work
- Prevents style-related PR comments

---

### 2. 🚀 The Auto-Merger (`agent-2-merger.yml`)

**Purpose:** Automatically merges PRs after successful validation by The Cleaner Agent.

**Actions:**
- Waits for The Cleaner Agent to complete successfully
- Automatically merges the most recent open PR
- Uses squash merge to maintain clean history

**Trigger:** Runs after The Cleaner Agent completes successfully
**Risk Level:** High (can merge code automatically)

**Safety Features:**
- Only merges if The Cleaner Agent succeeds
- Requires approval configuration in registry
- Only runs in production profile

**Benefits:**
- Reduces manual merge operations
- Speeds up development workflow
- Ensures only validated code is merged

---

### 3. 📝 The README Architect (`agent-3-readme.yml`)

**Purpose:** Automatically updates README.md after every merge to main branch.

**Actions:**
- Generates file tree structure
- Updates README with system status
- Adds timestamp of last update

**Trigger:** Runs on every push to main branch
**Risk Level:** Low (documentation-only updates)

**Benefits:**
- Keeps documentation always up-to-date
- Provides automatic file structure view
- Shows system health status

---

## Workflow Chain

```
Pull Request Created
    ↓
🧹 Cleaner Agent
    ├─ Format Python (Black)
    ├─ Format JS/JSON (Prettier)
    └─ Commit changes
    ↓
🚀 Auto-Merger
    ├─ Wait for Cleaner success
    ├─ Merge PR (squash)
    └─ Push to main
    ↓
📝 README Architect
    ├─ Generate file tree
    ├─ Update README
    └─ Commit documentation
```

---

## Configuration

All three agents are registered in `agents/registry.yaml` with proper governance fields:

| Agent | ID | Risk | Approval Required | Auto-Start |
|-------|-----|------|-------------------|------------|
| Cleaner | cleaner-agent | low | ❌ | ❌ |
| Merger | auto-merger | high | ✅ | ❌ |
| README | readme-architect | low | ❌ | ❌ |

---

## Usage

### Enable/Disable Agents

**Enable:** The workflows are automatically enabled once the files are merged to main.

**Disable:** To disable an agent, rename the workflow file with `.disabled` extension:
```bash
mv .github/workflows/agent-1-fixer.yml .github/workflows/agent-1-fixer.yml.disabled
```

### Monitor Agent Activity

View agent runs in GitHub Actions:
```
Repository → Actions → Select Workflow
```

### Query Agent Status

Use the CLI tool:
```bash
node scripts/query-agents.js status
node scripts/query-agents.js info cleaner-agent
node scripts/query-agents.js info auto-merger
node scripts/query-agents.js info readme-architect
```

---

## Safety Considerations

### The Cleaner Agent
- ✅ Safe: Only formats code, no logic changes
- ✅ Automatic commits are clearly labeled
- ✅ Can be reviewed before merge

### The Auto-Merger
- ⚠️ High Risk: Automatically merges code
- ✅ Only runs after successful validation
- ✅ Requires governance approval
- ✅ Restricted to production profile
- 💡 **Recommendation:** Add additional checks (tests, security scans) before enabling auto-merge

### The README Architect
- ✅ Safe: Documentation-only changes
- ✅ Non-intrusive updates
- ✅ Easy to revert if needed

---

## Future Enhancements

1. **Add test validation to Auto-Merger**
   - Require all tests to pass before merge
   - Integrate with CodeQL security scan

2. **Add notification system**
   - Notify team when auto-merge occurs
   - Send alerts for failed auto-merges

3. **Add PR review requirements**
   - Require minimum number of approvals
   - Require specific reviewers based on files changed

4. **Enhance README Architect**
   - Add contributor statistics
   - Include recent changes summary
   - Generate badges for build status

---

## Troubleshooting

### Cleaner Agent not running
- Check PR is from a branch (not fork)
- Verify workflow file syntax
- Check repository permissions

### Auto-Merger not triggering
- Ensure Cleaner Agent completed successfully
- Verify workflow_run permissions
- Check if approval requirements are met

### README not updating
- Verify push to main branch occurred
- Check file permissions
- Ensure git-auto-commit-action has write access

---

## Related Files

- Workflows: `.github/workflows/agent-{1,2,3}-*.yml`
- Registry: `agents/registry.yaml`
- Query Tool: `scripts/query-agents.js`
- Documentation: `reports/AGENTS-STATUS-REPORT.md`

---

**Created:** 2026-02-18  
**Status:** ✅ Active  
**Version:** 1.0
