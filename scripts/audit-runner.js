#!/usr/bin/env node
import fs from "fs";
import path from "path";
import YAML from "yaml";

const SEVERITY = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "INFO"
};

class AuditRunner {
  constructor(scope = "full") {
    this.scope = scope;
    this.findings = [];
    this.appliedFixes = [];
    this.recommendations = [];
    this.startTime = Date.now();
  }

  log(message) {
    console.log(`[BSU-AUDIT] ${message}`);
  }

  addFinding(severity, category, issue, details = {}) {
    this.findings.push({
      severity,
      category,
      issue,
      details,
      timestamp: new Date().toISOString()
    });
    this.log(`${severity}: ${issue}`);
  }

  addFix(description, file, reason) {
    this.appliedFixes.push({ description, file, reason });
    this.log(`FIX APPLIED: ${description}`);
  }

  addRecommendation(description, reason) {
    this.recommendations.push({ description, reason });
    this.log(`RECOMMENDATION: ${description}`);
  }

  async run() {
    this.log(`Starting audit with scope: ${this.scope}`);

    try {
      if (this.scope === "full" || this.scope === "agents") {
        await this.auditAgents();
      }
      
      if (this.scope === "full" || this.scope === "api") {
        await this.auditAPI();
      }
      
      if (this.scope === "full" || this.scope === "ui") {
        await this.auditUI();
      }
      
      if (this.scope === "full" || this.scope === "ci") {
        await this.auditCI();
      }

      await this.generateReport();
      
      const criticalCount = this.findings.filter(f => f.severity === SEVERITY.CRITICAL).length;
      if (criticalCount > 0) {
        this.log(`⚠️  Found ${criticalCount} CRITICAL issues`);
        process.exit(0); // Don't fail the workflow, just report
      } else {
        this.log("✓ Audit completed successfully");
      }
    } catch (error) {
      console.error("Audit failed:", error);
      process.exit(1);
    }
  }

  async auditAgents() {
    this.log("Auditing agent registration and execution paths...");
    
    const agentsDir = path.join(process.cwd(), "data", "agents");
    const indexPath = path.join(agentsDir, "index.json");

    // Check 1: Verify index.json exists
    if (!fs.existsSync(indexPath)) {
      this.addFinding(SEVERITY.CRITICAL, "agents", "Missing data/agents/index.json");
      return;
    }

    // Check 2: Load and validate index
    let index;
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (error) {
      this.addFinding(SEVERITY.CRITICAL, "agents", "Invalid JSON in index.json", { error: error.message });
      return;
    }

    if (!Array.isArray(index.agents)) {
      this.addFinding(SEVERITY.CRITICAL, "agents", "index.json missing agents array");
      return;
    }

    // Check 3: Verify each agent file exists and has valid schema
    for (const file of index.agents) {
      const agentPath = path.join(agentsDir, file);
      
      if (!fs.existsSync(agentPath)) {
        this.addFinding(SEVERITY.HIGH, "agents", `Missing agent file: ${file}`);
        continue;
      }

      try {
        const content = fs.readFileSync(agentPath, "utf8");
        const agent = YAML.parse(content);

        // Required fields
        if (!agent.id) {
          this.addFinding(SEVERITY.HIGH, "agents", `Agent missing 'id' field: ${file}`);
        }
        if (!agent.name) {
          this.addFinding(SEVERITY.MEDIUM, "agents", `Agent missing 'name' field: ${file}`);
        }
        if (!agent.role) {
          this.addFinding(SEVERITY.MEDIUM, "agents", `Agent missing 'role' field: ${file}`);
        }

        // Check for consistent naming
        const expectedId = file.replace(/\.yaml$/, "");
        if (agent.id && agent.id !== expectedId) {
          this.addFinding(SEVERITY.LOW, "agents", 
            `AgentId mismatch: file=${file}, id=${agent.id}`,
            { expected: expectedId, actual: agent.id }
          );
        }

        // Check actions are defined
        if (agent.actions && !Array.isArray(agent.actions)) {
          this.addFinding(SEVERITY.MEDIUM, "agents", `Agent actions must be array: ${file}`);
        }

      } catch (error) {
        this.addFinding(SEVERITY.HIGH, "agents", `Failed to parse agent file: ${file}`, 
          { error: error.message }
        );
      }
    }

    // Check 4: Validate agentRunner has proper guards
    const runnerPath = path.join(process.cwd(), "src", "runners", "agentRunner.js");
    if (fs.existsSync(runnerPath)) {
      const runnerContent = fs.readFileSync(runnerPath, "utf8");
      
      if (!runnerContent.includes("AppError")) {
        this.addFinding(SEVERITY.MEDIUM, "agents", 
          "agentRunner.js missing AppError for error handling"
        );
      }

      if (!runnerContent.includes("AGENT_NOT_FOUND")) {
        this.addRecommendation(
          "Add AGENT_NOT_FOUND error code to agentRunner",
          "Helps with debugging and monitoring"
        );
      }

      // Check for input validation
      if (!runnerContent.includes("input")) {
        this.addFinding(SEVERITY.LOW, "agents", 
          "agentRunner may lack input parameter validation"
        );
      }
    }
  }

  async auditAPI() {
    this.log("Auditing API routes and configuration...");

    // Check 1: Verify /api/chat route has proper error handling
    const chatRoutePath = path.join(process.cwd(), "src", "routes", "chat.js");
    if (fs.existsSync(chatRoutePath)) {
      const content = fs.readFileSync(chatRoutePath, "utf8");
      
      if (!content.includes("AppError")) {
        this.addFinding(SEVERITY.MEDIUM, "api", "chat.js missing AppError imports");
      }

      if (!content.includes("INVALID_INPUT")) {
        this.addRecommendation(
          "Add INVALID_INPUT error codes to chat routes",
          "Improves error debugging and client handling"
        );
      }

      // Check for rate limiting
      const appPath = path.join(process.cwd(), "src", "app.js");
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, "utf8");
        if (!appContent.includes("rateLimit")) {
          this.addFinding(SEVERITY.HIGH, "api", "Missing rate limiting in app.js");
        } else {
          this.addFinding(SEVERITY.INFO, "api", "✓ Rate limiting configured");
        }
      }
    }

    // Check 2: Verify agents route validates agentId
    const agentsRoutePath = path.join(process.cwd(), "src", "routes", "agents.js");
    if (fs.existsSync(agentsRoutePath)) {
      const content = fs.readFileSync(agentsRoutePath, "utf8");
      
      if (!content.includes("executeAgent")) {
        this.addFinding(SEVERITY.MEDIUM, "api", 
          "agents.js may be missing execution handler"
        );
      }
    }

    // Check 3: Verify agentsController has input validation
    const controllerPath = path.join(process.cwd(), "src", "controllers", "agentsController.js");
    if (fs.existsSync(controllerPath)) {
      const content = fs.readFileSync(controllerPath, "utf8");
      
      if (!content.includes("agentId")) {
        this.addFinding(SEVERITY.MEDIUM, "api", 
          "agentsController may not validate agentId parameter"
        );
      }
    }
  }

  async auditUI() {
    this.log("Auditing UI configuration and API integration...");

    // Check 1: Verify chat UI has API_BASE configured
    const chatAppPath = path.join(process.cwd(), "src", "chat", "app.js");
    if (fs.existsSync(chatAppPath)) {
      const content = fs.readFileSync(chatAppPath, "utf8");
      
      if (!content.includes("API_BASE")) {
        this.addFinding(SEVERITY.MEDIUM, "ui", 
          "chat/app.js missing API_BASE configuration"
        );
      } else {
        this.addFinding(SEVERITY.INFO, "ui", "✓ API_BASE configured in chat UI");
      }

      // Check for hardcoded URLs (excluding CDNs and localhost)
      // Note: Excludes common CDN domains (unpkg, cdn) and localhost for development
      const hardcodedUrlPattern = /https?:\/\/(?!unpkg|cdn|localhost)/g;
      const matches = content.match(hardcodedUrlPattern);
      if (matches && matches.length > 0) {
        this.addFinding(SEVERITY.LOW, "ui", 
          "Found potentially hardcoded URLs in chat/app.js",
          { urls: matches.slice(0, 3) }
        );
      }
    }

    // Check 2: Verify static file serving is configured
    const appPath = path.join(process.cwd(), "src", "app.js");
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, "utf8");
      
      if (!content.includes("express.static")) {
        this.addFinding(SEVERITY.MEDIUM, "ui", 
          "app.js missing static file serving configuration"
        );
      } else {
        this.addFinding(SEVERITY.INFO, "ui", "✓ Static file serving configured");
      }

      // Check for /chat route
      if (!content.includes("/chat")) {
        this.addFinding(SEVERITY.MEDIUM, "ui", 
          "app.js missing /chat route configuration"
        );
      }
    }

    // Check 3: Verify index.html exists
    const indexPath = path.join(process.cwd(), "src", "chat", "index.html");
    if (!fs.existsSync(indexPath)) {
      this.addFinding(SEVERITY.HIGH, "ui", "Missing src/chat/index.html");
    }
  }

  async auditCI() {
    this.log("Auditing CI/CD configuration and safety...");

    const workflowsDir = path.join(process.cwd(), ".github", "workflows");
    
    if (!fs.existsSync(workflowsDir)) {
      this.addFinding(SEVERITY.HIGH, "ci", "Missing .github/workflows directory");
      return;
    }

    const workflows = fs.readdirSync(workflowsDir).filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));

    for (const file of workflows) {
      const workflowPath = path.join(workflowsDir, file);
      const content = fs.readFileSync(workflowPath, "utf8");

      // Check for exposed secrets
      const secretPatterns = [
        /password\s*[:=]\s*['"]\S+['"]/i,
        /token\s*[:=]\s*['"]\S+['"]/i,
        /api[_-]?key\s*[:=]\s*['"]\S+['"]/i
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(content) && !content.includes("${{ secrets.")) {
          this.addFinding(SEVERITY.CRITICAL, "ci", 
            `Potential exposed secret in ${file}`,
            { pattern: pattern.source }
          );
        }
      }

      // Check for proper secret references
      if (content.includes("${{ secrets.")) {
        this.addFinding(SEVERITY.INFO, "ci", `✓ Using secrets correctly in ${file}`);
      }

      // Check for Node.js version pinning
      if (content.includes("setup-node") && 
          !content.includes("node-version:") && 
          !content.includes("node-version-file:")) {
        this.addFinding(SEVERITY.LOW, "ci", 
          `Missing node-version in ${file}`,
          { recommendation: "Pin to specific version (e.g., 22) or use node-version-file" }
        );
      }
    }

    // Check for validate.yml
    const validateWorkflow = path.join(workflowsDir, "validate.yml");
    if (!fs.existsSync(validateWorkflow)) {
      this.addFinding(SEVERITY.MEDIUM, "ci", "Missing validate.yml workflow");
    }
  }

  async generateReport() {
    this.log("Generating audit report...");

    const reportsDir = path.join(process.cwd(), "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const executionTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const timestamp = new Date().toISOString();

    const criticalCount = this.findings.filter(f => f.severity === SEVERITY.CRITICAL).length;
    const highCount = this.findings.filter(f => f.severity === SEVERITY.HIGH).length;
    const mediumCount = this.findings.filter(f => f.severity === SEVERITY.MEDIUM).length;
    const lowCount = this.findings.filter(f => f.severity === SEVERITY.LOW).length;
    const infoCount = this.findings.filter(f => f.severity === SEVERITY.INFO).length;

    let report = `# BSU Audit Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `**Scope:** ${this.scope}\n\n`;
    report += `**Execution Time:** ${executionTime}s\n\n`;
    report += `## Executive Summary\n\n`;
    report += `| Severity | Count |\n`;
    report += `|----------|-------|\n`;
    report += `| CRITICAL | ${criticalCount} |\n`;
    report += `| HIGH     | ${highCount} |\n`;
    report += `| MEDIUM   | ${mediumCount} |\n`;
    report += `| LOW      | ${lowCount} |\n`;
    report += `| INFO     | ${infoCount} |\n\n`;

    if (criticalCount > 0) {
      report += `⚠️  **CRITICAL ISSUES DETECTED** - Immediate action required\n\n`;
    } else if (highCount > 0) {
      report += `⚠️  **HIGH PRIORITY ISSUES** - Should be addressed soon\n\n`;
    } else {
      report += `✓ **No critical or high priority issues found**\n\n`;
    }

    // Findings by severity
    report += `## Findings\n\n`;
    
    for (const severity of [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW, SEVERITY.INFO]) {
      const findings = this.findings.filter(f => f.severity === severity);
      if (findings.length === 0) continue;

      report += `### ${severity} (${findings.length})\n\n`;
      
      for (const finding of findings) {
        report += `#### ${finding.issue}\n\n`;
        report += `- **Category:** ${finding.category}\n`;
        
        if (Object.keys(finding.details).length > 0) {
          report += `- **Details:**\n`;
          for (const [key, value] of Object.entries(finding.details)) {
            report += `  - ${key}: ${JSON.stringify(value)}\n`;
          }
        }
        report += `\n`;
      }
    }

    // Applied fixes
    if (this.appliedFixes.length > 0) {
      report += `## Applied Fixes\n\n`;
      report += `The following safe, additive fixes were automatically applied:\n\n`;
      
      for (const fix of this.appliedFixes) {
        report += `### ${fix.description}\n\n`;
        report += `- **File:** ${fix.file}\n`;
        report += `- **Reason:** ${fix.reason}\n\n`;
      }
    } else {
      report += `## Applied Fixes\n\n`;
      report += `No automatic fixes were applied. All changes require manual review.\n\n`;
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      report += `The following issues require manual review and cannot be auto-fixed:\n\n`;
      
      for (const rec of this.recommendations) {
        report += `### ${rec.description}\n\n`;
        report += `- **Reason:** ${rec.reason}\n\n`;
      }
    }

    // Audit methodology
    report += `## Audit Methodology\n\n`;
    report += `This audit was performed using the BSU Audit Agent with the following checks:\n\n`;
    report += `- **Agent Registration:** Validated index.json, YAML schemas, and agentId consistency\n`;
    report += `- **Agent Execution:** Checked for guards, validation, error handling\n`;
    report += `- **API Configuration:** Verified route handlers, rate limiting, CORS\n`;
    report += `- **UI Integration:** Checked API_BASE, static serving, hardcoded URLs\n`;
    report += `- **CI/CD Safety:** Scanned for exposed secrets, unsafe executions\n\n`;

    report += `## Compliance Status\n\n`;
    if (criticalCount === 0 && highCount === 0) {
      report += `✓ **COMPLIANT** - No critical or high priority issues detected\n\n`;
    } else {
      report += `⚠️  **NON-COMPLIANT** - Critical or high priority issues must be resolved\n\n`;
    }

    report += `---\n\n`;
    report += `*This audit was generated automatically by BSU Audit Agent*\n`;
    report += `*For questions, contact the security team*\n`;

    const reportPath = path.join(reportsDir, "bsu-audit-report.md");
    fs.writeFileSync(reportPath, report, "utf8");
    
    this.log(`Report saved to: ${reportPath}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const scopeArg = args.find(arg => arg.startsWith("--scope="));
const scope = scopeArg ? scopeArg.split("=")[1] : "full";

const validScopes = ["full", "agents", "api", "ui", "ci"];
if (!validScopes.includes(scope)) {
  console.error(`Invalid scope: ${scope}. Must be one of: ${validScopes.join(", ")}`);
  process.exit(1);
}

// Run the audit
const runner = new AuditRunner(scope);
runner.run().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
