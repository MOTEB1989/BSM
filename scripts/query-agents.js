#!/usr/bin/env node
/**
 * BSU Agent Status Query Tool
 * Quick CLI tool to query agent status and information
 * 
 * Usage:
 *   node scripts/query-agents.js list           # List all agents
 *   node scripts/query-agents.js status         # Get status summary
 *   node scripts/query-agents.js info <id>      # Get detailed agent info
 *   node scripts/query-agents.js validate       # Validate configurations
 */

import fs from "fs";
import path from "path";
import YAML from "yaml";

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function loadRegistry() {
  const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
  if (!fs.existsSync(registryPath)) {
    throw new Error("Registry not found at: " + registryPath);
  }
  const content = fs.readFileSync(registryPath, "utf8");
  return YAML.parse(content);
}

function loadDataAgents() {
  const indexPath = path.join(process.cwd(), "data", "agents", "index.json");
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  return index.agents.map(file => {
    const agentPath = path.join(process.cwd(), "data", "agents", file);
    const content = fs.readFileSync(agentPath, "utf8");
    return YAML.parse(content);
  });
}

function loadChatAgents() {
  const chatPath = path.join(process.cwd(), "api", "agents.chat.json");
  if (!fs.existsSync(chatPath)) {
    return [];
  }
  const config = JSON.parse(fs.readFileSync(chatPath, "utf8"));
  return config.agents || [];
}

function listAgents() {
  log("\n=== BSU Agents Inventory ===\n", "bright");
  
  // Registry Agents
  log("📋 Registry Agents (agents/registry.yaml):", "cyan");
  const registry = loadRegistry();
  registry.agents.forEach(agent => {
    const riskColor = agent.risk?.level === "high" ? "red" : 
                      agent.risk?.level === "medium" ? "yellow" : "green";
    log(`  • ${agent.id.padEnd(25)} [${agent.category.padEnd(8)}] Risk: ${agent.risk?.level || "N/A"}`, riskColor);
  });
  
  // Data Agents
  log("\n📦 Data Agents (data/agents/*.yaml):", "cyan");
  const dataAgents = loadDataAgents();
  dataAgents.forEach(agent => {
    const version = agent.version ? `v${agent.version}` : "";
    log(`  • ${agent.id.padEnd(25)} [${(agent.modelName || "N/A").padEnd(12)}] ${version}`);
  });
  
  // Chat Agents
  log("\n💬 LLM Chat Agents (api/agents.chat.json):", "cyan");
  const chatAgents = loadChatAgents();
  chatAgents.forEach(agent => {
    log(`  • ${agent.id.padEnd(25)} [${agent.model.padEnd(20)}] ${agent.provider}`, "green");
  });
  
  log(`\n✅ Total: ${registry.agents.length + dataAgents.length + chatAgents.length} agents found\n`);
}

function showStatus() {
  log("\n=== BSU Agents Status Summary ===\n", "bright");
  
  const registry = loadRegistry();
  const dataAgents = loadDataAgents();
  const chatAgents = loadChatAgents();
  
  log(`📊 Agent Distribution:`, "cyan");
  log(`   Registry Agents:     ${registry.agents.length}`);
  log(`   Data Agents:         ${dataAgents.length}`);
  log(`   LLM Chat Agents:     ${chatAgents.length}`);
  log(`   Total:               ${registry.agents.length + dataAgents.length + chatAgents.length}`);
  
  log(`\n🔐 Risk Distribution (Registry):`, "cyan");
  const riskCounts = {};
  registry.agents.forEach(agent => {
    const level = agent.risk?.level || "unknown";
    riskCounts[level] = (riskCounts[level] || 0) + 1;
  });
  Object.entries(riskCounts).forEach(([level, count]) => {
    const color = level === "high" ? "red" : level === "medium" ? "yellow" : "green";
    log(`   ${level.padEnd(8)}: ${count}`, color);
  });
  
  log(`\n⚙️  Startup Configuration:`, "cyan");
  const autoStart = registry.agents.filter(a => a.startup?.auto_start === true).length;
  const requiresApproval = registry.agents.filter(a => a.approval?.required === true).length;
  log(`   Auto-start enabled:  ${autoStart} (${autoStart === 0 ? "✅ Good - manual control" : "⚠️  Warning"})`);
  log(`   Requires approval:   ${requiresApproval}`);
  
  log(`\n🔌 API Endpoints:`, "cyan");
  log(`   GET  /api/agents                - List all agents`);
  log(`   POST /api/agents/run            - Execute agent`);
  log(`   GET  /api/agents/status         - Get all statuses`);
  log(`   GET  /api/agents/:id/status     - Get specific status`);
  log(`   POST /api/agents/start/:id      - Start agent`);
  log(`   POST /api/agents/stop/:id       - Stop agent`);
  
  log(`\n📝 Reports Generated:`, "cyan");
  const reportsDir = path.join(process.cwd(), "reports");
  if (fs.existsSync(path.join(reportsDir, "AGENTS-STATUS-REPORT.md"))) {
    log(`   ✅ reports/AGENTS-STATUS-REPORT.md`);
  }
  if (fs.existsSync(path.join(reportsDir, "agents-inventory.json"))) {
    log(`   ✅ reports/agents-inventory.json`);
  }
  
  log("");
}

function showAgentInfo(agentId) {
  log(`\n=== Agent Details: ${agentId} ===\n`, "bright");
  
  // Check registry
  const registry = loadRegistry();
  const registryAgent = registry.agents.find(a => a.id === agentId);
  
  if (registryAgent) {
    log("📋 Registry Configuration:", "cyan");
    log(`   ID:                  ${registryAgent.id}`);
    log(`   Name:                ${registryAgent.name}`);
    log(`   Category:            ${registryAgent.category}`);
    log(`   Risk Level:          ${registryAgent.risk?.level}`, 
        registryAgent.risk?.level === "high" ? "red" : "green");
    log(`   Risk Rationale:      ${registryAgent.risk?.rationale}`);
    log(`   Requires Approval:   ${registryAgent.approval?.required ? "Yes" : "No"}`);
    log(`   Auto-start:          ${registryAgent.startup?.auto_start ? "Yes" : "No"}`);
    log(`   Allowed Contexts:    ${registryAgent.contexts?.allowed?.join(", ")}`);
    log(`   Health Endpoint:     ${registryAgent.healthcheck?.endpoint}`);
    log(`   Health Interval:     ${registryAgent.healthcheck?.interval_seconds}s`);
  }
  
  // Check data agents
  const dataAgents = loadDataAgents();
  const dataAgent = dataAgents.find(a => a.id === agentId);
  
  if (dataAgent) {
    log("\n📦 Data Configuration:", "cyan");
    log(`   ID:                  ${dataAgent.id}`);
    log(`   Name:                ${dataAgent.name}`);
    log(`   Role:                ${dataAgent.role}`);
    log(`   Version:             ${dataAgent.version}`);
    log(`   Model:               ${dataAgent.modelName || "N/A"}`);
    log(`   Provider:            ${dataAgent.modelProvider || "N/A"}`);
    if (dataAgent.actions) {
      log(`   Actions:             ${dataAgent.actions.join(", ")}`);
    }
    if (dataAgent.capabilities) {
      log(`   Capabilities:        ${dataAgent.capabilities.join(", ")}`);
    }
  }
  
  // Check chat agents
  const chatAgents = loadChatAgents();
  const chatAgent = chatAgents.find(a => a.id === agentId);
  
  if (chatAgent) {
    log("\n💬 Chat Configuration:", "cyan");
    log(`   ID:                  ${chatAgent.id}`);
    log(`   Name:                ${chatAgent.name}`);
    log(`   Model:               ${chatAgent.model}`);
    log(`   Provider:            ${chatAgent.provider}`);
    log(`   Temperature:         ${chatAgent.temperature}`);
    log(`   Description:         ${chatAgent.description}`);
  }
  
  if (!registryAgent && !dataAgent && !chatAgent) {
    log(`❌ Agent '${agentId}' not found in any configuration`, "red");
    log(`\nAvailable agents:`, "yellow");
    const allIds = [
      ...registry.agents.map(a => a.id),
      ...dataAgents.map(a => a.id),
      ...chatAgents.map(a => a.id)
    ];
    allIds.forEach(id => log(`   • ${id}`));
  }
  
  log("");
}

function validate() {
  log("\n=== Validating Agent Configurations ===\n", "bright");
  
  try {
    log("🔍 Checking registry.yaml...", "cyan");
    const registry = loadRegistry();
    log(`   ✅ Registry loaded: ${registry.agents.length} agents`, "green");
    
    // Validate required fields
    registry.agents.forEach(agent => {
      if (!agent.risk || !agent.approval || !agent.startup || !agent.healthcheck) {
        throw new Error(`Agent ${agent.id} missing required governance fields`);
      }
    });
    log(`   ✅ All governance fields present`, "green");
    
    log("\n🔍 Checking data agents...", "cyan");
    const dataAgents = loadDataAgents();
    log(`   ✅ Data agents loaded: ${dataAgents.length} agents`, "green");
    
    log("\n🔍 Checking chat agents...", "cyan");
    const chatAgents = loadChatAgents();
    log(`   ✅ Chat agents loaded: ${chatAgents.length} agents`, "green");
    
    log("\n✅ All validations passed!", "green");
    log("\nRun 'npm test' for full validation including allowed actions.\n");
    
  } catch (error) {
    log(`\n❌ Validation failed: ${error.message}`, "red");
    process.exit(1);
  }
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "list":
    listAgents();
    break;
  case "status":
    showStatus();
    break;
  case "info":
    if (!arg) {
      log("❌ Please provide an agent ID", "red");
      log("Usage: node scripts/query-agents.js info <agent-id>", "yellow");
      process.exit(1);
    }
    showAgentInfo(arg);
    break;
  case "validate":
    validate();
    break;
  default:
    log("\n=== BSU Agent Query Tool ===\n", "bright");
    log("Usage:", "cyan");
    log("  node scripts/query-agents.js list           # List all agents");
    log("  node scripts/query-agents.js status         # Get status summary");
    log("  node scripts/query-agents.js info <id>      # Get detailed agent info");
    log("  node scripts/query-agents.js validate       # Validate configurations");
    log("\nExamples:", "cyan");
    log("  node scripts/query-agents.js list");
    log("  node scripts/query-agents.js info integrity-agent");
    log("  node scripts/query-agents.js status\n");
}
