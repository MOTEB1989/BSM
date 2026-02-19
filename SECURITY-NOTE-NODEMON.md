# Security Note: nodemon Dependency - RESOLVED ✅

## Issue (RESOLVED)

The development dependency `nodemon@3.1.11` previously had a transitive dependency on `minimatch@3.1.2`, which had a known ReDoS (Regular Expression Denial of Service) vulnerability:

- **CVE**: GHSA-3ppc-4f35-3m26
- **Severity**: High
- **Affected Package**: minimatch < 10.2.1
- **Impact**: ReDoS via repeated wildcards with non-matching literal in pattern

## Resolution ✅

**Status**: **FIXED** (2026-02-19)

The vulnerability has been completely resolved using npm package overrides:

```json
"overrides": {
  "minimatch": "^10.2.1"
}
```

This forces all transitive dependencies (including nodemon) to use the secure version of minimatch (10.2.1+), eliminating the vulnerability.

**Verification**:
```bash
npm audit           # Result: found 0 vulnerabilities ✅
npm ls minimatch    # Result: minimatch@10.2.1 ✅
npm test            # Result: All tests pass ✅
```

## Risk Assessment

**Production Impact**: **None** (before and after fix)

- `nodemon` is a **devDependency** only used for development hot-reloading
- It is **not included in production builds** or deployments
- The vulnerability cannot be exploited in production environments
- The `npm start` command uses `node` directly, not `nodemon`

## Implementation Details

### Fix Applied
- Added `overrides` section to `package.json` to force `minimatch@^10.2.1`
- Ran `npm install` to apply the override across all transitive dependencies
- Verified with `npm audit` - zero vulnerabilities confirmed
- Verified with `npm ls minimatch` - version 10.2.1 confirmed

### Why This Approach
1. **Non-breaking**: Doesn't require waiting for upstream nodemon update
2. **Complete**: Fixes the issue for all transitive dependencies, not just nodemon
3. **Maintainable**: When nodemon updates, override can be safely removed
4. **Standard practice**: npm overrides is the recommended approach per npm documentation

## Current Status

- ✅ Vulnerability fixed using npm overrides
- ✅ Production unaffected (nodemon not in dependencies)
- ✅ Development workflow continues to work correctly
- ✅ Zero npm audit vulnerabilities
- ✅ All tests passing

## Verification Commands

```bash
# Verify no vulnerabilities
npm audit  # Should show: found 0 vulnerabilities

# Verify secure minimatch version
npm ls minimatch  # Should show: minimatch@10.2.1

# Verify production dependencies don't include nodemon
npm ls --prod nodemon  # Should show: (empty)

# Verify production start doesn't use nodemon
npm start  # Uses: node src/server.js (not nodemon)

# Run all tests
npm test  # All tests should pass
```

## References

- GitHub Advisory: https://github.com/advisories/GHSA-3ppc-4f35-3m26
- npm overrides documentation: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides
- nodemon GitHub: https://github.com/remy/nodemon
- minimatch GitHub: https://github.com/isaacs/minimatch

## Last Updated

2026-02-19

## Action Required

**None** - Vulnerability has been completely resolved. The fix is included in the PR and ready for deployment.

