#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

async function testAgentAuto() {
  console.log('🧪 Testing agent-auto activation...\n');
  
  // Test 1: Check YAML file exists and is valid
  try {
    const yamlPath = join(repoRoot, 'data/agents/agent-auto.yaml');
    const yamlContent = await readFile(yamlPath, 'utf8');
    const agentConfig = yaml.parse(yamlContent);
    
    console.log('✅ Test 1: agent-auto.yaml exists and is valid YAML');
    console.log(`   - ID: ${agentConfig.id}`);
    console.log(`   - Name: ${agentConfig.name}`);
    console.log(`   - Version: ${agentConfig.version}`);
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
    return false;
  }
  
  // Test 2: Check if agent is in index.json
  try {
    const indexPath = join(repoRoot, 'data/agents/index.json');
    const indexContent = await readFile(indexPath, 'utf8');
    const index = JSON.parse(indexContent);
    
    const hasAgentAuto = index.agents.includes('agent-auto.yaml');
    if (hasAgentAuto) {
      console.log('✅ Test 2: agent-auto is registered in index.json');
    } else {
      console.log('❌ Test 2: agent-auto NOT found in index.json');
      return false;
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
    return false;
  }
  
  // Test 3: Check if agent is in registry.yaml
  try {
    const registryPath = join(repoRoot, 'agents/registry.yaml');
    const registryContent = await readFile(registryPath, 'utf8');
    
    if (registryContent.includes('id: agent-auto')) {
      console.log('✅ Test 3: agent-auto is registered in registry.yaml');
      
      // Check required fields
      const registry = yaml.parse(registryContent);
      const agentAuto = registry.agents.find(a => a.id === 'agent-auto');
      
      if (agentAuto) {
        console.log('   ✓ risk.level:', agentAuto.risk?.level);
        console.log('   ✓ expose.selectable:', agentAuto.expose?.selectable);
        console.log('   ✓ contexts.allowed:', agentAuto.contexts?.allowed?.join(', '));
      }
    } else {
      console.log('❌ Test 3: agent-auto NOT found in registry.yaml');
      return false;
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
    return false;
  }
  
  // Test 4: Check Copilot agent file
  try {
    const copilotPath = join(repoRoot, '.github/agents/agent-auto.agent.md');
    await readFile(copilotPath, 'utf8');
    console.log('✅ Test 4: Copilot agent file exists (.github/agents/agent-auto.agent.md)');
  } catch (error) {
    console.log('❌ Test 4 failed:', error.message);
    return false;
  }
  
  // Test 5: Count total agents
  try {
    const registryPath = join(repoRoot, 'agents/registry.yaml');
    const registryContent = await readFile(registryPath, 'utf8');
    const matches = registryContent.match(/^  - id:/gm);
    const agentCount = matches ? matches.length : 0;
    
    console.log(`✅ Test 5: Total agents in registry: ${agentCount}`);
    if (agentCount === 17) {
      console.log('   ✓ Expected count (17) matches actual count');
    } else {
      console.log(`   ⚠ Expected 17, got ${agentCount}`);
    }
  } catch (error) {
    console.log('❌ Test 5 failed:', error.message);
    return false;
  }
  
  console.log('\n🎉 All tests passed! agent-auto is successfully activated.\n');
  return true;
}

testAgentAuto().catch(console.error);
