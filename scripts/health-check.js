#!/usr/bin/env node

/**
 * BSM Health Check Script
 * Comprehensive health check for the BSM platform
 * 
 * Usage:
 *   node scripts/health-check.js [--detailed] [--port PORT]
 */

import { integrityAgent } from "../src/agents/IntegrityAgent.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const detailed = args.includes("--detailed");
const portIndex = args.indexOf("--port");
const port = portIndex !== -1 ? args[portIndex + 1] : process.env.PORT || "3000";

async function checkServerHealth() {
  console.log("Checking server health endpoints...\n");
  
  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    const data = await response.json();
    
    if (data.status === "ok") {
      console.log("✅ Server is responding");
      console.log(`   Status: ${data.status}`);
      console.log(`   Timestamp: ${new Date(data.timestamp).toISOString()}\n`);
      
      if (detailed) {
        console.log("Fetching detailed health information...\n");
        const detailedResponse = await fetch(`http://localhost:${port}/api/health/detailed`);
        const detailedData = await detailedResponse.json();
        
        console.log("Detailed Health Check Results:");
        console.log(`   Overall Status: ${detailedData.status}`);
        console.log(`   Timestamp: ${detailedData.timestamp}\n`);
        
        for (const [checkName, result] of Object.entries(detailedData.checks)) {
          const icon = result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
          console.log(`   ${icon} ${checkName}: ${result.message}`);
          if (result.count !== undefined) {
            console.log(`      Count: ${result.count}`);
          }
          if (result.warnings) {
            result.warnings.forEach(w => console.log(`      ⚠️  ${w}`));
          }
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }
      }
      
      return true;
    } else {
      console.log("❌ Server health check failed");
      console.log(`   Status: ${data.status}\n`);
      return false;
    }
  } catch (error) {
    console.log("❌ Server is not responding");
    console.log(`   Error: ${error.message}`);
    console.log(`   Ensure server is running on port ${port}\n`);
    return false;
  }
}

async function checkFileSystem() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("File System Health Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  const requiredPaths = [
    "package.json",
    "README.md",
    "src/server.js",
    "src/app.js",
    "data/agents/index.json",
    ".gitignore",
    ".env.example"
  ];
  
  let allPresent = true;
  for (const relativePath of requiredPaths) {
    const fullPath = path.join(rootDir, relativePath);
    try {
      await fs.access(fullPath);
      console.log(`✅ ${relativePath}`);
    } catch (error) {
      console.log(`❌ ${relativePath} - MISSING`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function checkAgents() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Agent Registry Health Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  try {
    const indexPath = path.join(rootDir, "data/agents/index.json");
    const content = await fs.readFile(indexPath, "utf-8");
    const index = JSON.parse(content);
    
    if (!index.agents || !Array.isArray(index.agents)) {
      console.log("❌ Agent index invalid - missing agents array");
      return false;
    }
    
    console.log(`✅ Agent registry valid`);
    console.log(`   Found ${index.agents.length} registered agents\n`);
    
    let allValid = true;
    for (const agentFile of index.agents) {
      const agentPath = path.join(rootDir, "data/agents", agentFile);
      try {
        await fs.access(agentPath);
        console.log(`   ✅ ${agentFile}`);
      } catch {
        console.log(`   ❌ ${agentFile} - FILE MISSING`);
        allValid = false;
      }
    }
    
    return allValid;
  } catch (error) {
    console.log(`❌ Agent registry check failed: ${error.message}`);
    return false;
  }
}

async function runIntegrityCheck() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Integrity Agent Full Report");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  try {
    const result = await integrityAgent.check({ prs: [], issues: [] });
    const report = await integrityAgent.generateHealthReport();
    console.log(report);

    return result.healthScore >= 70;
  } catch (error) {
    console.log(`❌ Integrity check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   BSM Platform Health Check            ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  const results = {
    filesystem: false,
    agents: false,
    server: false,
    integrity: false
  };
  
  // Run file system check
  results.filesystem = await checkFileSystem();
  
  // Run agent registry check
  results.agents = await checkAgents();
  
  // Try to check server health
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Server Health Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  results.server = await checkServerHealth();
  
  // Run detailed integrity check if requested
  if (detailed) {
    results.integrity = await runIntegrityCheck();
  }
  
  // Summary
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   Health Check Summary                 ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  const icon = (result) => result ? "✅" : "❌";
  console.log(`${icon(results.filesystem)} File System: ${results.filesystem ? "PASS" : "FAIL"}`);
  console.log(`${icon(results.agents)} Agent Registry: ${results.agents ? "PASS" : "FAIL"}`);
  console.log(`${icon(results.server)} Server: ${results.server ? "ONLINE" : "OFFLINE"}`);
  
  if (detailed) {
    console.log(`${icon(results.integrity)} Integrity: ${results.integrity ? "PASS" : "NEEDS ATTENTION"}`);
  }
  
  const allPassed = results.filesystem && results.agents;
  console.log(`\n${allPassed ? "✅" : "❌"} Overall Status: ${allPassed ? "HEALTHY" : "ISSUES DETECTED"}\n`);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error("\n❌ Fatal error during health check:", error);
  process.exit(1);
});
