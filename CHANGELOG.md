# Changelog

All notable changes to the BSM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-20

### Added - Saffio Anti-Duplication System
- **Duplication Detection System** (`scripts/prevent-duplicate-agents.js`)
  - SHA-256 fingerprint calculation for each agent
  - Exact duplicate detection (100% match)
  - Similarity detection (70%+ threshold)
  - Comprehensive reporting with Arabic language support
  
- **Smart Merge System** (`scripts/merge-agents.js`)
  - Intelligent merging from multiple sources
  - Automatic duplicate prevention during merge
  - Similarity checking before adding new agents
  
- **GitHub Workflows**
  - `registry-validation.yml`: Validates registry on every PR
  - `sync-repos.yml`: Bi-directional sync between MOTEB1989/BSM and LexBANK/BSM
  - Automatic PR commenting on duplicate detection
  - Scheduled sync every 6 hours
  
- **Git Hooks**
  - `pre-commit-saffio`: Prevents commits with duplicates
  - `install.sh`: Automated hook installation
  
- **Package Scripts**
  - `npm run check:duplicates`: Check for duplicate agents
  - `npm run merge:agents`: Merge agents from secondary sources
  - `npm run precommit`: Pre-commit validation
  - `npm run install:hooks`: Install git hooks
  
- **Documentation**
  - `docs/SAFFIO-SYSTEM.md`: Complete Saffio system documentation
  - `agents/README.md`: Registry structure and usage guide
  
- **Tests**
  - `tests/saffio-system.test.js`: Comprehensive test suite for anti-duplication system
  - 7 automated tests covering all core functionality

### Changed - Registry v2.0
- Upgraded registry from v1.0 to v2.0
- Added metadata section with governance controls
- Added validation rules section
- Maintained all 16 existing agents with no breaking changes
- Enhanced documentation and structure

### Fixed
- Registry integrity validation
- Duplicate prevention across multiple repositories
- Automated quality gates in CI/CD

### Security
- All agents maintain `auto_start: false` for security
- Governance rules enforced automatically
- No high-risk agents allowed in mobile context

## [1.0.0] - Prior to 2026-02-20

### Initial Release
- 16 registered agents across 4 categories
- Basic registry structure (v1.0)
- Agent validation system
- GitHub Actions integration
