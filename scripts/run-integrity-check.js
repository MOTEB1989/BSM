#!/usr/bin/env node

/**
 * Run Integrity Check Script
 * Executes the BSU Integrity Agent to validate repository health
 */

import { integrityAgent } from "../src/agents/IntegrityAgent.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  BSU Integrity Agent - Repository Health Check");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    // Generate comprehensive health report
    const report = await integrityAgent.generateHealthReport();
    
    // Save report to file
    const reportsDir = path.join(rootDir, "reports");
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join(reportsDir, `integrity-report-${timestamp}.md`);
    
    await fs.writeFile(reportPath, report, "utf-8");
    
    // Display report to console
    console.log(report);
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Parse the health score from the report
    const scoreMatch = report.match(/Overall Health Score: (\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    
    // Exit with appropriate code
    if (score >= 70) {
      console.log("\n✅ Repository health check PASSED");
      process.exit(0);
    } else if (score >= 50) {
      console.log("\n⚠️  Repository health needs attention");
      process.exit(0); // Non-critical warning
    } else {
      console.log("\n❌ Repository health check FAILED - Critical issues found");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error running integrity check:", error);
    process.exit(1);
  }
}

main();
