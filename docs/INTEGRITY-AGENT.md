# BSU Integrity Agent

## Overview

The BSU Integrity Agent is a comprehensive repository health monitoring tool that validates structure, checks compliance, and ensures documentation completeness.

## Features

### 1. Repository Structure Validation
- Verifies presence of critical files (package.json, README.md, etc.)
- Validates agent configuration files
- Checks data/agents/index.json consistency
- Ensures all referenced agent YAML files exist

### 2. License Compliance
- Checks for LICENSE file presence
- Validates package.json license field
- Ensures legal compliance standards are met

### 3. Documentation Verification
- Validates critical documentation files (README.md, SECURITY.md)
- Checks optional documentation (CLAUDE.md, docs/README.md)
- Measures documentation completeness

### 4. Stale Resource Detection
- Identifies pull requests inactive for >30 days
- Finds issues open for >90 days
- Provides cleanup recommendations

### 5. Health Score Calculation
- Comprehensive scoring based on multiple factors
- Weighted penalties for missing components
- Clear status indicators (🟢 Excellent, 🟡 Good, 🟠 Needs Attention, 🔴 Critical)

## Usage

### Command Line

Run the integrity check from the repository root:

```bash
node scripts/run-integrity-check.js
```

The script will:
1. Perform comprehensive health checks
2. Generate a detailed report
3. Save the report to `reports/integrity-report-<timestamp>.md`
4. Exit with appropriate status code (0 for pass, 1 for critical issues)

### Programmatic Usage

```javascript
import { integrityAgent } from './src/agents/IntegrityAgent.js';

// Run basic health check
const result = await integrityAgent.check({
  prs: [], // Optional: array of PR objects
  issues: [] // Optional: array of issue objects
});

console.log('Health Score:', result.healthScore);
console.log('Recommendations:', result.recommendations);

// Generate full report
const report = await integrityAgent.generateHealthReport();
console.log(report);
```

## Health Score Breakdown

The health score is calculated from multiple components:

- **Structure Score** (100 points max): File presence and agent configuration
  - -10 points per missing critical file
  - -5 points per agent configuration error

- **License Score** (100 points max):
  - 100 points: LICENSE file present
  - 50 points: Only package.json license field
  - 0 points: No license information

- **Documentation Score** (100 points max):
  - -30 points per missing critical documentation
  - -10 points per missing optional documentation

- **Penalties**:
  - -5 points per stale PR (>30 days)
  - -2 points per old issue (>90 days)

**Final Score Calculation:**
The final health score averages the Structure, License, and Documentation scores, then applies PR/issue penalties. For example, a repository with perfect structure (100) and documentation (100) but no license (0) would have a base score of 67/100 before any PR/issue penalties are applied.

### Score Thresholds

- **90-100**: 🟢 Excellent - Repository is in great health
- **70-89**: 🟡 Good - Minor improvements recommended
- **50-69**: 🟠 Needs Attention - Several issues to address
- **0-49**: 🔴 Critical - Immediate action required

## Report Structure

Generated reports include:

1. **Overall Health Score**: Aggregate score with status indicator
2. **Structure Validation**: File checks and agent configuration status
3. **License Compliance**: License file and package.json verification
4. **Documentation**: Completeness check with file sizes
5. **Recommendations**: Prioritized action items

## Integration

### GitHub Actions

The integrity agent can be integrated into CI/CD workflows:

```yaml
- name: Run Integrity Check
  run: node scripts/run-integrity-check.js
```

### Agent Configuration

Located at: `data/agents/integrity-agent.yaml`

```yaml
id: integrity-agent
name: Repository Integrity Guardian
capabilities:
  - health_monitoring
  - data_validation
  - stale_resource_cleanup
  - performance_optimization
  - compliance_audit
```

## Best Practices

1. **Regular Checks**: Run integrity checks before major releases
2. **CI Integration**: Add to pull request validation workflows
3. **Monitoring**: Track health scores over time
4. **Remediation**: Address critical issues (score < 50) immediately
5. **Documentation**: Keep all critical docs up to date

## Troubleshooting

### Common Issues

**Low Health Score**
- Check for missing critical files
- Verify agent configurations
- Add missing documentation

**Agent Configuration Errors**
- Ensure all YAML files are valid
- Check data/agents/index.json references
- Verify agent file names match index

**License Compliance Issues**
- Add LICENSE file to repository root
- Add license field to package.json
- Use standard license identifiers (MIT, Apache-2.0, etc.)

## API Reference

### IntegrityAgent Class

#### Methods

- `check(payload)`: Run health check with optional PR/issue data
- `validateStructure()`: Validate repository structure
- `checkLicense()`: Verify license compliance
- `checkDocumentation()`: Check documentation completeness
- `generateHealthReport()`: Generate comprehensive markdown report
- `findStalePRs(prs)`: Identify stale pull requests
- `findOldIssues(issues)`: Find old open issues

#### Return Values

All methods return promises. Check results include:
- `healthScore`: Numeric score (0-100)
- `recommendations`: Array of action items
- Detailed breakdowns for each validation category

## Contributing

Improvements to the integrity agent are welcome! Please ensure:
- New validations maintain backward compatibility
- Health score calculations remain balanced
- Documentation stays up to date

## License

Part of the BSU (Business Service Management) platform.
