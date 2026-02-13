#!/usr/bin/env node
import { performance } from 'perf_hooks';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// Test different validation patterns
async function testFileReadPerformance() {
  console.log('\n=== File Read Performance ===');
  const agentsDir = join(process.cwd(), 'data', 'agents');
  
  // Sequential reads
  const seqStart = performance.now();
  const files = readdirSync(agentsDir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    const content = readFileSync(join(agentsDir, file), 'utf8');
    YAML.parse(content);
  }
  const seqEnd = performance.now();
  console.log(`Sequential reads: ${(seqEnd - seqStart).toFixed(2)}ms (${files.length} files)`);
  
  // Parallel reads (simulated)
  const parStart = performance.now();
  await Promise.all(files.map(async (file) => {
    const content = readFileSync(join(agentsDir, file), 'utf8');
    return YAML.parse(content);
  }));
  const parEnd = performance.now();
  console.log(`Parallel reads: ${(parEnd - parStart).toFixed(2)}ms (${files.length} files)`);
}

async function testValidationPatterns() {
  console.log('\n=== Validation Pattern Performance ===');
  
  const testData = Array.from({ length: 1000 }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i}`,
    category: 'test',
    contexts: { allowed: ['chat', 'api'] }
  }));
  
  // Array.forEach
  const forEachStart = performance.now();
  testData.forEach(item => {
    if (!item.id || !item.name) throw new Error('Invalid');
  });
  const forEachEnd = performance.now();
  console.log(`Array.forEach: ${(forEachEnd - forEachStart).toFixed(2)}ms`);
  
  // for...of
  const forOfStart = performance.now();
  for (const item of testData) {
    if (!item.id || !item.name) throw new Error('Invalid');
  }
  const forOfEnd = performance.now();
  console.log(`for...of: ${(forOfEnd - forOfStart).toFixed(2)}ms`);
  
  // Traditional for
  const forStart = performance.now();
  for (let i = 0; i < testData.length; i++) {
    if (!testData[i].id || !testData[i].name) throw new Error('Invalid');
  }
  const forEnd = performance.now();
  console.log(`Traditional for: ${(forEnd - forStart).toFixed(2)}ms`);
}

async function main() {
  console.log('=== BSM Validation Performance Analysis ===');
  await testFileReadPerformance();
  await testValidationPatterns();
  console.log('\n=== Analysis Complete ===\n');
}

main();
