#!/usr/bin/env node

/**
 * Performance test script to verify async optimizations
 */

import { performance } from 'perf_hooks';
import { loadAgents } from './src/services/agentsService.js';
import { loadKnowledgeIndex } from './src/services/knowledgeService.js';

async function testAgentLoading() {
  console.log('Testing agent loading performance...');
  
  const start = performance.now();
  const agents = await loadAgents();
  const end = performance.now();
  
  console.log(`✓ Loaded ${agents.length} agents in ${(end - start).toFixed(2)}ms`);
  
  // Test caching
  const cacheStart = performance.now();
  const cachedAgents = await loadAgents();
  const cacheEnd = performance.now();
  
  console.log(`✓ Cached load took ${(cacheEnd - cacheStart).toFixed(2)}ms (should be faster)`);
  
  if (cachedAgents.length !== agents.length) {
    throw new Error('Cache returned different number of agents');
  }
  
  return agents;
}

async function testKnowledgeLoading() {
  console.log('\nTesting knowledge loading performance...');
  
  const start = performance.now();
  const docs = await loadKnowledgeIndex();
  const end = performance.now();
  
  console.log(`✓ Loaded ${docs.length} documents in ${(end - start).toFixed(2)}ms`);
  
  // Test caching
  const cacheStart = performance.now();
  const cachedDocs = await loadKnowledgeIndex();
  const cacheEnd = performance.now();
  
  console.log(`✓ Cached load took ${(cacheEnd - cacheStart).toFixed(2)}ms (should be faster)`);
  
  if (cachedDocs.length !== docs.length) {
    throw new Error('Cache returned different number of documents');
  }
  
  return docs;
}

async function testParallelLoading() {
  console.log('\nTesting parallel loading...');
  
  const start = performance.now();
  const [agents, docs] = await Promise.all([
    loadAgents(),
    loadKnowledgeIndex()
  ]);
  const end = performance.now();
  
  console.log(`✓ Loaded agents and knowledge in parallel in ${(end - start).toFixed(2)}ms`);
  
  return { agents, docs };
}

async function main() {
  console.log('=== BSM Performance Test Suite ===\n');
  
  try {
    await testAgentLoading();
    await testKnowledgeLoading();
    await testParallelLoading();
    
    console.log('\n✅ All performance tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Performance test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
