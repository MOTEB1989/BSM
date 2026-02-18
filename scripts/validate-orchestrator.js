#!/usr/bin/env node
/**
 * Validate orchestrator configuration file
 * Ensures the config is valid JSON and has required fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '..', '.github', 'agents', 'orchestrator.config.json');

function validateOrchestratorConfig() {
  console.log('Validating orchestrator configuration...');
  
  // Check file exists
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ Config file not found: ${CONFIG_PATH}`);
    process.exit(1);
  }
  
  // Read and parse JSON
  let config;
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = JSON.parse(content);
  } catch (err) {
    console.error(`❌ Invalid JSON in config file: ${err.message}`);
    process.exit(1);
  }
  
  // Validate required top-level fields
  const requiredFields = ['name', 'version', 'description', 'execution', 'agents', 'reporting'];
  for (const field of requiredFields) {
    if (!config[field]) {
      console.error(`❌ Missing required field: ${field}`);
      process.exit(1);
    }
  }
  
  // Validate execution settings
  if (!config.execution.mode || !['sequential', 'parallel'].includes(config.execution.mode)) {
    console.error(`❌ Invalid execution mode: ${config.execution.mode}. Must be 'sequential' or 'parallel'`);
    process.exit(1);
  }
  
  if (typeof config.execution.timeout !== 'number' || config.execution.timeout <= 0) {
    console.error(`❌ Invalid execution timeout: ${config.execution.timeout}. Must be a positive number`);
    process.exit(1);
  }
  
  // Validate agents array
  if (!Array.isArray(config.agents) || config.agents.length === 0) {
    console.error('❌ agents must be a non-empty array');
    process.exit(1);
  }
  
  // Validate each agent
  const agentIds = new Set();
  for (const agent of config.agents) {
    if (!agent.id) {
      console.error('❌ Agent missing required field: id');
      process.exit(1);
    }
    
    if (agentIds.has(agent.id)) {
      console.error(`❌ Duplicate agent id: ${agent.id}`);
      process.exit(1);
    }
    agentIds.add(agent.id);
    
    if (!agent.name) {
      console.error(`❌ Agent ${agent.id} missing required field: name`);
      process.exit(1);
    }
    
    if (typeof agent.order !== 'number') {
      console.error(`❌ Agent ${agent.id} has invalid order: ${agent.order}. Must be a number`);
      process.exit(1);
    }
    
    if (typeof agent.enabled !== 'boolean') {
      console.error(`❌ Agent ${agent.id} has invalid enabled: ${agent.enabled}. Must be boolean`);
      process.exit(1);
    }
    
    if (typeof agent.timeout !== 'number' || agent.timeout <= 0) {
      console.error(`❌ Agent ${agent.id} has invalid timeout: ${agent.timeout}. Must be positive number`);
      process.exit(1);
    }
    
    // Check if agent definition file exists
    const agentDefPath = path.join(__dirname, '..', '.github', 'agents', `${agent.id}.agent.md`);
    if (!fs.existsSync(agentDefPath)) {
      console.error(`❌ Agent definition file not found: ${agentDefPath}`);
      process.exit(1);
    }
  }
  
  // Validate reporting settings
  if (!config.reporting.outputDir) {
    console.error('❌ Missing reporting.outputDir');
    process.exit(1);
  }
  
  if (!Array.isArray(config.reporting.formats) || config.reporting.formats.length === 0) {
    console.error('❌ reporting.formats must be a non-empty array');
    process.exit(1);
  }
  
  // Validate secrets settings (if present)
  if (config.secrets) {
    if (!config.secrets.mode) {
      console.error('❌ secrets.mode is required and must be set to "env"');
      process.exit(1);
    }
    
    if (config.secrets.mode !== 'env') {
      console.error(`❌ Invalid secrets.mode: ${config.secrets.mode}. Must be 'env'`);
      process.exit(1);
    }
    
    if (config.secrets.logging && config.secrets.logging.logSecrets === true) {
      console.error('❌ Security violation: secrets.logging.logSecrets must never be true');
      process.exit(1);
    }
  }
  
  console.log('✅ Orchestrator configuration is valid');
  console.log(`   - Name: ${config.name} v${config.version}`);
  console.log(`   - Execution mode: ${config.execution.mode}`);
  console.log(`   - Agents configured: ${config.agents.length}`);
  console.log(`   - Enabled agents: ${config.agents.filter(a => a.enabled).length}`);
  console.log(`   - Output directory: ${config.reporting.outputDir}`);
  console.log(`   - Output formats: ${config.reporting.formats.join(', ')}`);
  
  return true;
}

validateOrchestratorConfig();
