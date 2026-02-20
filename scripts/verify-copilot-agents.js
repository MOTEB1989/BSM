#!/usr/bin/env node

/**
 * Copilot Agents Verification Script
 * Verifies synchronization between .github/agents/, data/agents/, and agents/registry.yaml
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE_DIR = process.cwd();

console.log('🔍 Verifying Copilot Agents Synchronization...\n');

// 1. Check .github/agents/ directory
console.log('📂 Checking .github/agents/...');
const githubAgentsDir = join(BASE_DIR, '.github', 'agents');
const githubAgents = readdirSync(githubAgentsDir)
  .filter(f => f.endsWith('.agent.md'))
  .map(f => f.replace('.agent.md', ''))
  .sort();

console.log(`   Found ${githubAgents.length} agents:`);
githubAgents.forEach(agent => console.log(`   ✓ ${agent}`));

// 2. Check data/agents/index.json
console.log('\n📂 Checking data/agents/index.json...');
const dataAgentsIndex = join(BASE_DIR, 'data', 'agents', 'index.json');
const dataAgentsContent = JSON.parse(readFileSync(dataAgentsIndex, 'utf-8'));
const dataAgents = dataAgentsContent.agents
  .map(a => a.replace('.yaml', ''))
  .sort();

console.log(`   Found ${dataAgents.length} agents:`);
dataAgents.forEach(agent => console.log(`   ✓ ${agent}`));

// 3. Check agents/registry.yaml
console.log('\n📂 Checking agents/registry.yaml...');
const registryPath = join(BASE_DIR, 'agents', 'registry.yaml');
const registryContent = readFileSync(registryPath, 'utf-8');
const registryAgents = registryContent
  .split('\n')
  .filter(line => line.trim().startsWith('- id:'))
  .map(line => line.split(':')[1].trim())
  .sort();

console.log(`   Found ${registryAgents.length} agents:`);
registryAgents.forEach(agent => console.log(`   ✓ ${agent}`));

// 4. Compare and find differences
console.log('\n🔄 Comparing agent lists...\n');

const allAgents = new Set([...githubAgents, ...dataAgents, ...registryAgents]);

console.log('┌─────────────────────────────────────┬──────────┬──────────┬──────────┐');
console.log('│ Agent Name                          │ GitHub   │ Data     │ Registry │');
console.log('├─────────────────────────────────────┼──────────┼──────────┼──────────┤');

let issuesFound = 0;

Array.from(allAgents).sort().forEach(agent => {
  const inGithub = githubAgents.includes(agent) ? '   ✅   ' : '   ❌   ';
  const inData = dataAgents.includes(agent) ? '   ✅   ' : '   ❌   ';
  const inRegistry = registryAgents.includes(agent) ? '   ✅   ' : '   ❌   ';
  
  const paddedAgent = agent.padEnd(35);
  console.log(`│ ${paddedAgent} │ ${inGithub} │ ${inData} │ ${inRegistry} │`);
  
  if (!githubAgents.includes(agent) || !dataAgents.includes(agent) || !registryAgents.includes(agent)) {
    issuesFound++;
  }
});

console.log('└─────────────────────────────────────┴──────────┴──────────┴──────────┘');

// 5. Summary
console.log('\n📊 Summary:\n');
console.log(`   GitHub Copilot (.github/agents/):  ${githubAgents.length} agents`);
console.log(`   Data Agents (data/agents/):        ${dataAgents.length} agents`);
console.log(`   Registry (agents/registry.yaml):   ${registryAgents.length} agents`);
console.log(`   Total unique agents:               ${allAgents.size}`);

// 6. Check for issues
console.log('\n🎯 Verification Result:\n');

if (issuesFound === 0) {
  console.log('   ✅ No synchronization issues found!');
  console.log('   ✅ All agents are properly registered across all locations.');
  process.exit(0);
} else {
  console.log(`   ⚠️  Found ${issuesFound} synchronization issue(s).`);
  console.log('   ❌ Please ensure all agents are registered in all three locations:');
  console.log('      1. .github/agents/*.agent.md');
  console.log('      2. data/agents/*.yaml + index.json');
  console.log('      3. agents/registry.yaml');
  process.exit(1);
}
