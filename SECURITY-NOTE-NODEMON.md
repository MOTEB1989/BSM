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

- ✅ Production unaffected (nodemon not in dependencies)
- ✅ Development workflow continues to work correctly
- ⚠️ nodemon@3.1.11 (latest) still depends on minimatch@3.1.2
- 🔄 Waiting for upstream nodemon maintainers to update minimatch dependency

## Resolution Strategy

### Short-term (Current)
- **Accepted Risk**: Keep nodemon@3.1.11 as devDependency
- **Justification**: Dev-only dependency, no production impact
- **Monitoring**: Check for nodemon updates that resolve this issue

### Long-term Options
1. **Wait for upstream fix**: Monitor nodemon releases for minimatch update
2. **Alternative tool**: Consider switching to alternatives if fix is delayed
   - `tsx` - TypeScript execution with watch mode
   - `node --watch` - Native Node.js watch mode (Node.js 18.11+)
3. **Override resolution**: Force minimatch@10.2.1 via package.json overrides (if compatibility allows)

## Verification

```bash
# Verify nodemon is dev-only
npm ls --prod nodemon  # Should show: (empty)

# Verify production start doesn't use nodemon
npm start  # Uses: node src/server.js (not nodemon)

# Check vulnerability details
npm audit
```

## References

- GitHub Advisory: https://github.com/advisories/GHSA-3ppc-4f35-3m26
- nodemon GitHub: https://github.com/remy/nodemon
- minimatch GitHub: https://github.com/isaacs/minimatch

## Last Updated

2026-02-19

## Action Required

**None** - This is informational. The vulnerability does not affect production deployments.
