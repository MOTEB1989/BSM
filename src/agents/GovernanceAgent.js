import logger from "../utils/logger.js";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Governance Agent
 * 
 * Enforces governance policies and compliance requirements for BSM platform.
 * Validates PRs, changes, and operations against governance rules.
 */
export class GovernanceAgent {
  constructor() {
    this.id = "governance-review-agent";
    this.name = "Governance Compliance Officer";
    this.version = "1.0";
    
    // Governance rules configuration
    this.rules = {
      riskLevels: ["low", "medium", "high", "critical"],
      minApprovals: {
        low: 1,
        medium: 1,
        high: 2,
        critical: 3
      },
      requiredDocumentation: {
        security: ["SECURITY.md"],
        architecture: ["ARCHITECTURE.md", "docs/ARCHITECTURE.md"],
        mobile: ["MOBILE_MODE.md"],
        governance: ["GOVERNANCE.md"],
        api: ["README.md"]
      }
    };
  }

  /**
   * Review PR for governance compliance
   * 
   * @param {Object} prData - PR information
   * @param {number} prData.prNumber - PR number
   * @param {string} prData.title - PR title
   * @param {string} prData.description - PR description
   * @param {Array} prData.files - Changed files
   * @param {Object} prData.metadata - Additional metadata
   * @returns {Object} Review result with decision and recommendations
   */
  async review(prData = {}) {
    const { prNumber, title = "", description = "", files = [], metadata = {} } = prData;
    
    logger.info({ prNumber, filesCount: files.length }, `[${this.id}] Starting governance review`);
    
    const violations = [];
    const warnings = [];
    const recommendations = [];
    
    // 1. Scope & Process Checks
    const scopeCheck = this.checkScope(prData);
    if (!scopeCheck.passed) violations.push(...scopeCheck.violations);
    warnings.push(...scopeCheck.warnings);
    
    // 2. Risk Assessment
    const riskCheck = this.checkRiskLevel(prData);
    if (!riskCheck.passed) violations.push(...riskCheck.violations);
    
    // 3. Ownership & Approval
    const ownershipCheck = this.checkOwnership(prData);
    if (!ownershipCheck.passed) violations.push(...ownershipCheck.violations);
    warnings.push(...ownershipCheck.warnings);
    
    // 4. Documentation Requirements
    const docsCheck = await this.checkDocumentation(files, metadata);
    if (!docsCheck.passed) violations.push(...docsCheck.violations);
    warnings.push(...docsCheck.warnings);
    
    // 5. Security Governance
    const securityCheck = this.checkSecurityGovernance(prData);
    if (!securityCheck.passed) violations.push(...securityCheck.violations);
    
    // 6. Privilege Escalation
    const privilegeCheck = this.checkPrivilegeEscalation(files);
    if (!privilegeCheck.passed) violations.push(...privilegeCheck.violations);
    
    // 7. Red Flags
    const redFlagCheck = this.checkRedFlags(prData);
    if (!redFlagCheck.passed) violations.push(...redFlagCheck.violations);
    
    // Calculate compliance score
    const totalChecks = 7;
    const passedChecks = [scopeCheck, riskCheck, ownershipCheck, docsCheck, securityCheck, privilegeCheck, redFlagCheck]
      .filter(check => check.passed).length;
    const complianceScore = Math.round((passedChecks / totalChecks) * 100);
    
    // Determine decision
    const decision = this.makeDecision(violations, warnings, complianceScore);
    
    const result = {
      agentId: this.id,
      prNumber,
      decision: decision.action,
      reason: decision.reason,
      complianceScore,
      violations,
      warnings,
      recommendations,
      summary: {
        totalChecks,
        passedChecks,
        violations: violations.length,
        warnings: warnings.length
      },
      timestamp: new Date().toISOString()
    };
    
    logger.info(
      { prNumber, decision: decision.action, complianceScore, violations: violations.length },
      `[${this.id}] Review completed`
    );
    
    return result;
  }

  /**
   * Check scope and process compliance
   */
  checkScope(prData) {
    const violations = [];
    const warnings = [];
    const { description = "", title = "", metadata = {} } = prData;
    
    // Check for issue link
    const hasIssueLink = /(?:closes|fixes|resolves)\s+#\d+/i.test(description);
    if (!hasIssueLink) {
      violations.push({
        rule: "scope.issue_link",
        severity: "error",
        message: "PR must link to exactly one Issue using 'Closes #123', 'Fixes #456', etc."
      });
    }
    
    // Check for multiple issue links (should only link to one)
    const issueLinks = description.match(/(?:closes|fixes|resolves)\s+#\d+/gi);
    if (issueLinks && issueLinks.length > 1) {
      violations.push({
        rule: "scope.single_issue",
        severity: "error",
        message: "PR should link to exactly ONE issue. Found multiple issue references."
      });
    }
    
    // Check for milestone mention
    const hasMilestone = /milestone/i.test(description) || metadata.milestone;
    if (!hasMilestone) {
      warnings.push({
        rule: "scope.milestone",
        severity: "warning",
        message: "Issue should belong to an approved milestone"
      });
    }
    
    // Check for unrelated changes indicators
    const hasRefactorMention = /refactor/i.test(title) || /refactor/i.test(description);
    if (hasRefactorMention) {
      warnings.push({
        rule: "scope.refactoring",
        severity: "warning",
        message: "Refactoring detected. Ensure it's related to the primary issue."
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Check risk level and justification
   */
  checkRiskLevel(prData) {
    const violations = [];
    const { description = "", files = [] } = prData;
    
    // Check if risk level is defined
    const riskLevelMatch = description.match(/\*\*Risk Level\*\*:\s*(low|medium|high|critical)/i);
    
    if (!riskLevelMatch) {
      // Check if this is a registry change (requires risk level)
      const isRegistryChange = files.some(f => 
        f.includes("data/agents/") || 
        f.includes(".github/workflows/") ||
        f.includes("config/")
      );
      
      if (isRegistryChange) {
        violations.push({
          rule: "governance.risk_level",
          severity: "error",
          message: "Registry changes must declare risk.level (low/medium/high/critical) with justification"
        });
      }
    } else {
      const riskLevel = riskLevelMatch[1].toLowerCase();
      
      // Check if justification is provided
      const hasJustification = description.includes("Justification") || description.includes("justification");
      if (!hasJustification) {
        violations.push({
          rule: "governance.risk_justification",
          severity: "error",
          message: `Risk level "${riskLevel}" declared but justification is missing`
        });
      }
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Check ownership and lifecycle
   */
  checkOwnership(prData) {
    const violations = [];
    const warnings = [];
    const { description = "" } = prData;
    
    // Check for team ownership
    const hasTeam = /\*\*Team\*\*:/i.test(description);
    if (!hasTeam) {
      warnings.push({
        rule: "governance.ownership_team",
        severity: "warning",
        message: "ownership.team should be defined (Platform Engineering / Security / Data / DevOps)"
      });
    }
    
    // Check for owner
    const hasOwner = /\*\*Owner\*\*:\s*@\w+/i.test(description);
    if (!hasOwner) {
      warnings.push({
        rule: "governance.ownership_owner",
        severity: "warning",
        message: "Owner (GitHub username) should be specified"
      });
    }
    
    // Check for review date
    const hasReviewDate = /\*\*Review By\*\*:\s*\d{4}-\d{2}-\d{2}/i.test(description);
    if (!hasReviewDate) {
      warnings.push({
        rule: "governance.lifecycle_review",
        severity: "warning",
        message: "lifecycle.review_by date should be specified (within 90 days)"
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Check documentation requirements
   */
  async checkDocumentation(files, metadata) {
    const violations = [];
    const warnings = [];
    
    // Determine what type of change this is
    const hasSecurityChange = files.some(f => 
      f.includes("middleware/auth") || 
      f.includes("security") ||
      f.includes("secrets")
    );
    
    const hasArchitectureChange = files.some(f => 
      f.includes("src/app.js") || 
      f.includes("src/server.js") ||
      files.length > 10 // Significant change
    );
    
    const hasAPIChange = files.some(f => 
      f.includes("routes/") || 
      f.includes("controllers/")
    );
    
    const hasMobileChange = files.some(f => 
      f.includes("mobile") || 
      f.includes("mobileMode")
    );
    
    // Check if corresponding documentation was updated
    const docFiles = files.filter(f => f.endsWith(".md"));
    
    if (hasSecurityChange && !docFiles.some(f => f.includes("SECURITY"))) {
      warnings.push({
        rule: "documentation.security",
        severity: "warning",
        message: "Security-related changes should update SECURITY.md"
      });
    }
    
    if (hasArchitectureChange && !docFiles.some(f => f.includes("ARCHITECTURE"))) {
      warnings.push({
        rule: "documentation.architecture",
        severity: "warning",
        message: "Significant architectural changes should update ARCHITECTURE.md"
      });
    }
    
    if (hasAPIChange && !docFiles.some(f => f.includes("README"))) {
      warnings.push({
        rule: "documentation.api",
        severity: "warning",
        message: "API changes should update README.md"
      });
    }
    
    if (hasMobileChange && !docFiles.some(f => f.includes("MOBILE_MODE"))) {
      violations.push({
        rule: "documentation.mobile",
        severity: "error",
        message: "Mobile Mode changes MUST update MOBILE_MODE.md"
      });
    }
    
    return {
      passed: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Check security governance compliance
   */
  checkSecurityGovernance(prData) {
    const violations = [];
    const { files = [], description = "" } = prData;
    
    // Check for admin token requirement
    const hasAuthChange = files.some(f => f.includes("middleware/auth"));
    if (hasAuthChange) {
      const mentionsAdminToken = /ADMIN_TOKEN/i.test(description);
      if (!mentionsAdminToken) {
        violations.push({
          rule: "security.admin_token",
          severity: "error",
          message: "Authentication changes must document ADMIN_TOKEN requirements"
        });
      }
    }
    
    // Check for network egress justification
    const hasNetworkCode = files.some(f => 
      f.includes("gpt") || 
      f.includes("github") ||
      f.includes("http") ||
      f.includes("fetch")
    );
    
    if (hasNetworkCode) {
      const hasNetworkJustification = /network|egress|outbound/i.test(description);
      if (!hasNetworkJustification) {
        violations.push({
          rule: "security.network_egress",
          severity: "error",
          message: "Network/API calls must be justified in PR description"
        });
      }
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Check for privilege escalation
   */
  checkPrivilegeEscalation(files) {
    const violations = [];
    
    // Sensitive files that could lead to privilege escalation
    const sensitiveFiles = [
      "scripts/validate.js",
      "src/middleware/auth.js",
      "src/config/models.js"
    ];
    
    const touchesSensitive = files.some(f => 
      sensitiveFiles.some(sf => f.includes(sf))
    );
    
    if (touchesSensitive) {
      // This requires manual review
      violations.push({
        rule: "governance.privilege_check",
        severity: "warning",
        message: "Sensitive files modified. Manual review required for privilege escalation check."
      });
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Check for red flags
   */
  checkRedFlags(prData) {
    const violations = [];
    const { description = "", title = "" } = prData;
    
    // Check for bypass language
    const bypassIndicators = [
      /skip.*validation/i,
      /bypass.*check/i,
      /disable.*security/i,
      /remove.*validation/i,
      /temporary.*fix/i // Temporary fixes often become permanent
    ];
    
    for (const pattern of bypassIndicators) {
      if (pattern.test(title) || pattern.test(description)) {
        violations.push({
          rule: "red_flag.bypass",
          severity: "error",
          message: "Red Flag: PR description suggests bypassing governance or security checks"
        });
        break;
      }
    }
    
    // Check for "works locally" without tests
    const worksLocally = /works?\s+locally/i.test(description);
    const hasTests = /test/i.test(description) || description.includes("✅");
    
    if (worksLocally && !hasTests) {
      violations.push({
        rule: "red_flag.verifiability",
        severity: "error",
        message: 'Red Flag: Claims "works locally" but no tests provided for verification'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Make final decision based on checks
   */
  makeDecision(violations, warnings, complianceScore) {
    // Critical violations = Block
    const criticalViolations = violations.filter(v => v.severity === "error");
    
    if (criticalViolations.length > 0) {
      return {
        action: "block",
        reason: `Governance violations detected: ${criticalViolations.map(v => v.rule).join(", ")}`
      };
    }
    
    // Warnings but no errors = Request Changes
    if (warnings.length > 0) {
      return {
        action: "request_changes",
        reason: `Minor governance issues found: ${warnings.length} warnings to address`
      };
    }
    
    // All checks passed
    if (complianceScore >= 90) {
      return {
        action: "approve",
        reason: `All governance checks passed (${complianceScore}% compliance)`
      };
    }
    
    // Low compliance score
    return {
      action: "request_changes",
      reason: `Compliance score (${complianceScore}%) below threshold. Address governance requirements.`
    };
  }
}

export const governanceAgent = new GovernanceAgent();
export default governanceAgent;
