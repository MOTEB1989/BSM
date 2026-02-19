# Claude Assistant Known Issues

## Overview

This document tracks known issues and limitations with the Claude Assistant workflow (`claude-assistant.yml`).

## Issue #1: Branch Comparison 404 Error

### Description
The Claude Code Action may fail with a 404 error when attempting to compare branches in certain scenarios.

**Error Message:**
```
HttpError: Not Found - https://docs.github.com/rest/commits/commits#compare-two-commits
status: 404
url: "https://api.github.com/repos/LexBANK/BSM/compare/main...claude%2Fissue-XXX-YYYYMMDD-HHMM"
```

### Root Cause
The `anthropics/claude-code-action@beta` action attempts to compare the base branch with the Claude working branch before the Claude branch has been created. This results in a 404 error from the GitHub API.

### Impact
- **Severity:** Low
- The workflow job fails, but this is a transient issue
- Subsequent runs typically succeed once the branch is created
- Does not affect repository functionality

### Affected Workflows
- `claude-assistant.yml` (Claude Assistant)

### Workaround
1. **For users:** Simply re-comment `@claude` on the issue/PR to trigger a new workflow run
2. **For maintainers:** This is an upstream issue in the Claude Code Action itself

### Related Issues
- Issue #215: Workflow permissions (resolved - permissions already properly configured)
- Issue #217: Claude encountered an error (this 404 error)
- Workflow Run: https://github.com/LexBANK/BSM/actions/runs/21967948180

### Status
**Open** - This is a limitation of the `anthropics/claude-code-action@beta` action.

### Tracking
- Reported: 2026-02-12
- PR: #316 (Documentation and investigation)

## Issue #2: Permissions Configuration

### Description
CodeQL initially reported that the workflow didn't have explicit permissions configured.

### Resolution
✅ **Resolved** - Permissions are now explicitly configured in the workflow (lines 26-29):
```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

### Status
**Resolved** - No action needed.

---

## General Best Practices

When working with the Claude Assistant:

1. **API Key Setup**: Ensure `ANTHROPIC_API_KEY` is configured in repository secrets
2. **Graceful Degradation**: The workflow automatically skips if the API key is not configured
3. **Retry on Failure**: If you encounter a 404 error, simply re-trigger by commenting `@claude` again
4. **Monitor Logs**: Check workflow logs in the Actions tab for detailed error information

## Reporting New Issues

If you encounter a new issue with the Claude Assistant:

1. Check the Actions tab for detailed logs
2. Review this document for known issues
3. Check if the issue is reproducible
4. Open a new issue with:
   - Workflow run link
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior

---

**Last Updated:** 2026-02-19  
**Maintainer:** BSM Team
