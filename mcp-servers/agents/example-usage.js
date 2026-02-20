#!/usr/bin/env node

/**
 * Example usage of Supreme Unrestricted Master Agent
 * 
 * ⚠️ WARNING: This is for educational purposes only!
 * Only run in isolated test environments.
 */

import { SupremeUnrestrictedAgent } from './supreme-unrestricted-agent.js';

async function main() {
  console.log('='.repeat(70));
  console.log('🔴 SUPREME UNRESTRICTED AGENT - EXAMPLE USAGE');
  console.log('='.repeat(70));
  console.log();
  
  // Create agent instance (dry-run mode by default)
  const agent = new SupremeUnrestrictedAgent({
    dryRun: true  // ALWAYS start with dry-run!
  });
  
  // Check agent status
  console.log('📊 Agent Status:');
  console.log(JSON.stringify(agent.getStatus(), null, 2));
  console.log();
  
  if (!agent.enabled) {
    console.log('❌ Agent is DISABLED');
    console.log('To enable, set environment variable: SUPREME_AGENT_ENABLED=true');
    console.log();
    console.log('Example:');
    console.log('  SUPREME_AGENT_ENABLED=true node example-usage.js');
    console.log();
    return;
  }
  
  console.log('✅ Agent is ENABLED');
  console.log(`🔵 Running in ${agent.dryRun ? 'DRY-RUN' : 'LIVE'} mode`);
  console.log();
  
  try {
    // Example 1: Execute a safe shell command
    console.log('📝 Example 1: Shell Command');
    console.log('-'.repeat(70));
    const lsOutput = agent.execShell('ls -la');
    console.log('Output:', lsOutput);
    console.log();
    
    // Example 2: Fetch a website
    console.log('📝 Example 2: Fetch Website');
    console.log('-'.repeat(70));
    const webData = await agent.fetchWeb('https://example.com');
    console.log('Fetched:', typeof webData === 'string' ? `${webData.length} bytes` : webData);
    console.log();
    
    // Example 3: Audit files in current directory
    console.log('📝 Example 3: Audit Files');
    console.log('-'.repeat(70));
    const auditResults = await agent.auditAndFixFiles(process.cwd());
    console.log('Audit Results:', JSON.stringify(auditResults, null, 2));
    console.log();
    
    // Example 4: Full health check
    console.log('📝 Example 4: Full Health Check');
    console.log('-'.repeat(70));
    const healthResults = await agent.fullHealthCheck();
    console.log('Health Check completed');
    console.log();
    
    // Example 5: Supreme Sweep (all operations)
    console.log('📝 Example 5: Supreme Sweep');
    console.log('-'.repeat(70));
    const sweepResults = await agent.supremeSweep();
    console.log('Supreme Sweep completed');
    console.log();
    
    // Show audit log
    console.log('📋 Audit Log:');
    console.log('-'.repeat(70));
    const auditLog = agent.getAuditLog();
    auditLog.forEach((entry, index) => {
      console.log(`${index + 1}. [${entry.timestamp}] ${entry.action}`);
      if (entry.details) {
        console.log(`   Details:`, JSON.stringify(entry.details, null, 2));
      }
    });
    console.log();
    
    console.log('✅ All examples completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
  
  console.log();
  console.log('='.repeat(70));
  console.log('⚠️ Remember: This agent bypasses ALL security controls!');
  console.log('Only use in isolated test environments.');
  console.log('='.repeat(70));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
