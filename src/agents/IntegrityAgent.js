import logger from "../utils/logger.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IntegrityAgent {
  constructor() {
    this.id = "integrity-agent";
    this.name = "Repository Health Check";
    this.rootDir = path.resolve(__dirname, "../..");
  }

  async check(payload = {}) {
    const { prs = [], issues = [] } = payload;
    logger.info({ prs: prs.length, issues: issues.length }, `[${this.id}] Running health check`);

    const stalePRs = this.findStalePRs(prs);
    const oldIssues = this.findOldIssues(issues);
    const structureValidation = await this.validateStructure();
    const licenseCheck = await this.checkLicense();
    const docsCheck = await this.checkDocumentation();

    const health = this.calculateHealthScore({
      staleCount: stalePRs.length,
      oldCount: oldIssues.length,
      structureScore: structureValidation.score,
      licenseScore: licenseCheck.score,
      docsScore: docsCheck.score
    });

    return {
      agentId: this.id,
      healthScore: health.finalScore,
      health,
      stalePRs: stalePRs.length,
      oldIssues: oldIssues.length,
      structureValidation,
      licenseCheck,
      docsCheck,
      recommendations: this.generateRecommendations(
        stalePRs.length,
        oldIssues.length,
        structureValidation,
        licenseCheck,
        docsCheck
      ),
      timestamp: new Date().toISOString()
    };
  }

  async validateStructure() {
    const requiredPaths = [
      "package.json",
      "README.md",
      "src/server.js",
      "src/app.js",
      "data/agents/index.json",
      ".gitignore",
      ".env.example"
    ];

    const results = [];
    let missingCount = 0;

    for (const relativePath of requiredPaths) {
      const fullPath = path.join(this.rootDir, relativePath);
      try {
        await fs.access(fullPath);
        results.push({ path: relativePath, status: "OK" });
      } catch (error) {
        results.push({ path: relativePath, status: "MISSING" });
        missingCount++;
      }
    }

    const agentIndexPath = path.join(this.rootDir, "data/agents/index.json");
    let agentValidation = { valid: true, errors: [] };

    try {
      const agentIndexContent = await fs.readFile(agentIndexPath, "utf-8");
      const agentIndex = JSON.parse(agentIndexContent);

      if (!agentIndex.agents || !Array.isArray(agentIndex.agents)) {
        agentValidation.valid = false;
        agentValidation.errors.push("index.json missing 'agents' array");
      } else {
        for (const agentFile of agentIndex.agents) {
          const agentPath = path.join(this.rootDir, "data/agents", agentFile);
          try {
            await fs.access(agentPath);
          } catch {
            agentValidation.valid = false;
            agentValidation.errors.push(`Referenced agent file not found: ${agentFile}`);
          }
        }
      }
    } catch (error) {
      agentValidation.valid = false;
      agentValidation.errors.push(`Failed to validate agents: ${error.message}`);
    }

    const score = Math.max(0, 100 - (missingCount * 10) - (agentValidation.errors.length * 5));

    return {
      score,
      results,
      agentValidation,
      missingCount
    };
  }

  async checkLicense() {
    const licenseFiles = ["LICENSE", "LICENSE.md", "LICENSE.txt"];
    let licenseFound = false;
    let licensePath = null;

    for (const file of licenseFiles) {
      const fullPath = path.join(this.rootDir, file);
      try {
        await fs.access(fullPath);
        licenseFound = true;
        licensePath = file;
        break;
      } catch {
        // Continue checking
      }
    }

    const packageJsonPath = path.join(this.rootDir, "package.json");
    let packageLicense = null;

    try {
      const packageContent = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageContent);
      packageLicense = packageJson.license || null;
    } catch {
      // Package.json not found or invalid
    }

    // Consider compliant only if EITHER license file exists OR package.json has license field
    const compliant = licenseFound || (packageLicense != null);
    const score = licenseFound ? 100 : (packageLicense ? 50 : 0);

    return {
      score,
      licenseFileFound: licenseFound,
      licensePath,
      packageLicense,
      compliant
    };
  }

  async checkDocumentation() {
    const requiredDocs = [
      { path: "README.md", critical: true },
      { path: "CLAUDE.md", critical: false },
      { path: "SECURITY.md", critical: true },
      { path: "docs/README.md", critical: false }
    ];

    const results = [];
    let criticalMissing = 0;
    let totalMissing = 0;

    for (const doc of requiredDocs) {
      const fullPath = path.join(this.rootDir, doc.path);
      try {
        const stats = await fs.stat(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        results.push({
          path: doc.path,
          status: "OK",
          critical: doc.critical,
          size: `${sizeKB} KB`
        });
      } catch {
        results.push({
          path: doc.path,
          status: "MISSING",
          critical: doc.critical
        });
        totalMissing++;
        if (doc.critical) criticalMissing++;
      }
    }

    const score = Math.max(0, 100 - (criticalMissing * 30) - ((totalMissing - criticalMissing) * 10));

    return {
      score,
      results,
      criticalMissing,
      totalMissing
    };
  }

  calculateHealthScore({ staleCount, oldCount, structureScore, licenseScore, docsScore }) {
    const penalties = {
      prPenalty: staleCount * 5,
      issuePenalty: oldCount * 2
    };

    const componentScores = {
      structureScore,
      licenseScore,
      docsScore
    };

    const avgSystemScore = (structureScore + licenseScore + docsScore) / 3;
    const finalScore = Math.max(0, avgSystemScore - penalties.prPenalty - penalties.issuePenalty);

    return {
      finalScore: Math.round(finalScore),
      avgSystemScore: Math.round(avgSystemScore),
      penalties,
      componentScores
    };
  }

  findStalePRs(prs = []) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return prs.filter((pr) => {
      const updatedAt = pr?.updated_at || pr?.updatedAt;
      if (!updatedAt) return false;
      return new Date(updatedAt) < thirtyDaysAgo && pr?.state === "open";
    });
  }

  findOldIssues(issues = []) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return issues.filter((issue) => {
      const createdAt = issue?.created_at || issue?.createdAt;
      if (!createdAt) return false;
      return new Date(createdAt) < ninetyDaysAgo && issue?.state === "open";
    });
  }

  generateRecommendations(staleCount, oldCount, structure, license, docs) {
    const recommendations = [];

    if (staleCount > 0) {
      recommendations.push(`Close or re-triage ${staleCount} stale PR(s) (>30 days)`);
    }

    if (oldCount > 0) {
      recommendations.push(`Archive or prioritize ${oldCount} old open issue(s) (>90 days)`);
    }

    if (structure.missingCount > 0) {
      recommendations.push(`Fix ${structure.missingCount} missing critical file(s)`);
    }

    if (structure.agentValidation && !structure.agentValidation.valid) {
      recommendations.push(`Resolve ${structure.agentValidation.errors.length} agent configuration error(s)`);
    }

    if (!license.compliant) {
      recommendations.push("Add LICENSE file for legal compliance");
    }

    if (docs.criticalMissing > 0) {
      recommendations.push(`Add ${docs.criticalMissing} critical documentation file(s)`);
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Repository health is excellent - no issues found");
    }

    return recommendations;
  }

  async generateHealthReport() {
    logger.info(`[${this.id}] Generating comprehensive health report`);

    const report = await this.check({ prs: [], issues: [] });

    const reportLines = [
      "# Repository Health Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      `## Overall Health Score: ${report.healthScore}/100`,
      "",
      "### Health Score Breakdown",
      `- Base System Score: ${report.health.avgSystemScore}/100`,
      `- Penalties: PRs -${report.health.penalties.prPenalty}, Issues -${report.health.penalties.issuePenalty}`,
      `- Component Scores: Structure ${report.health.componentScores.structureScore}, License ${report.health.componentScores.licenseScore}, Docs ${report.health.componentScores.docsScore}`,
      "",
      "### Status:",
      report.healthScore >= 90 ? "🟢 Excellent" :
      report.healthScore >= 70 ? "🟡 Good" :
      report.healthScore >= 50 ? "🟠 Needs Attention" :
      "🔴 Critical",
      "",
      "## Structure Validation",
      `Score: ${report.structureValidation.score}/100`,
      `Missing Files: ${report.structureValidation.missingCount}`,
      "",
      "### File Check Results:",
      ...report.structureValidation.results.map(r =>
        `- [${r.status === "OK" ? "✓" : "✗"}] ${r.path}`
      ),
      "",
      "### Agent Configuration:",
      report.structureValidation.agentValidation.valid
        ? "✅ All agent configurations are valid"
        : `❌ Issues found:\n${report.structureValidation.agentValidation.errors.map(e => `  - ${e}`).join("\n")}`,
      "",
      "## License Compliance",
      `Score: ${report.licenseCheck.score}/100`,
      `Status: ${report.licenseCheck.compliant ? "✅ Compliant" : "❌ Not Compliant"}`,
      report.licenseCheck.licenseFileFound ? `License File: ${report.licenseCheck.licensePath}` : "License File: Not found",
      report.licenseCheck.packageLicense ? `Package License: ${report.licenseCheck.packageLicense}` : "Package License: Not specified",
      "",
      "## Documentation",
      `Score: ${report.docsCheck.score}/100`,
      `Critical Missing: ${report.docsCheck.criticalMissing}`,
      `Total Missing: ${report.docsCheck.totalMissing}`,
      "",
      "### Documentation Files:",
      ...report.docsCheck.results.map(r =>
        `- [${r.status === "OK" ? "✓" : "✗"}] ${r.path} ${r.critical ? "(Critical)" : "(Optional)"} ${r.size ? `- ${r.size}` : ""}`
      ),
      "",
      "## Recommendations",
      ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      "---",
      `Report generated by ${this.name} (${this.id})`,
    ];

    return reportLines.filter(line => line !== "").join("\n");
  }
}

export const integrityAgent = new IntegrityAgent();
export default integrityAgent;
