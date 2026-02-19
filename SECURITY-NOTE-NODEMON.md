# Security Note: nodemon Dependency

## Issue

The development dependency `nodemon@3.1.11` has a transitive dependency on `minimatch@3.1.2`, which has a known ReDoS (Regular Expression Denial of Service) vulnerability:

- **CVE**: GHSA-3ppc-4f35-3m26
- **Severity**: High
- **Affected Package**: minimatch < 10.2.1
- **Impact**: ReDoS via repeated wildcards with non-matching literal in pattern

## Risk Assessment

**Production Impact**: **None**

- `nodemon` is a **devDependency** only used for development hot-reloading
- It is **not included in production builds** or deployments
- The vulnerability cannot be exploited in production environments
- The `npm start` command uses `node` directly, not `nodemon`

## Current Status

- ✅ **Vulnerability Fixed**: Using npm overrides to force minimatch@10.2.1+
- ✅ Production unaffected (nodemon not in dependencies)
- ✅ Development workflow continues to work correctly
- ✅ All security audits pass with 0 vulnerabilities

## Resolution Applied

### Current Solution
- **npm Overrides**: Added `"overrides": { "minimatch": "^10.2.1" }` to package.json
- **Effect**: Forces all transitive dependencies to use secure minimatch version
- **Verification**: `npm audit` shows 0 vulnerabilities
- **Compatibility**: nodemon@3.1.11 works correctly with minimatch@10.2.1

### Why This Works
- npm overrides allow forcing specific versions of nested dependencies
- minimatch@10.2.1 is backward compatible with nodemon's usage
- No breaking changes in development workflow
- Upstream fix from nodemon maintainers no longer required (though still welcome)

## Verification

```bash
# Verify no vulnerabilities
npm audit  # Should show: found 0 vulnerabilities

# Verify minimatch version
npm ls minimatch  # Should show: minimatch@10.2.1

# Verify nodemon is dev-only
npm ls --prod nodemon  # Should show: (empty)

# Verify production start doesn't use nodemon
npm start  # Uses: node src/server.js (not nodemon)
```

## References

- GitHub Advisory: https://github.com/advisories/GHSA-3ppc-4f35-3m26
- nodemon GitHub: https://github.com/remy/nodemon
- minimatch GitHub: https://github.com/isaacs/minimatch

## Last Updated

2026-02-19

## Action Required

**None** - The vulnerability has been fixed. All security checks pass.
