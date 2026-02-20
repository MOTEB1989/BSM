#!/usr/bin/env node
/**
 * Test suite for Saffio Anti-Duplication System
 * Tests the DuplicationDetector and validates registry integrity
 */

import { DuplicationDetector } from '../scripts/prevent-duplicate-agents.js';
import fs from 'fs/promises';
import YAML from 'yaml';

async function runTests() {
  console.log('🧪 Testing Saffio Anti-Duplication System\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: DuplicationDetector can be instantiated
  try {
    const detector = new DuplicationDetector();
    console.log('✅ Test 1: DuplicationDetector instantiated');
    passed++;
  } catch (err) {
    console.log('❌ Test 1 failed:', err.message);
    failed++;
  }

  // Test 2: Registry file exists and is valid YAML
  try {
    const content = await fs.readFile('agents/registry.yaml', 'utf8');
    const registry = YAML.parse(content);
    console.log('✅ Test 2: Registry file is valid YAML');
    passed++;
  } catch (err) {
    console.log('❌ Test 2 failed:', err.message);
    failed++;
  }

  // Test 3: Registry has version 2.0
  try {
    const content = await fs.readFile('agents/registry.yaml', 'utf8');
    const registry = YAML.parse(content);
    if (registry.version === '2.0') {
      console.log('✅ Test 3: Registry version is 2.0');
      passed++;
    } else {
      throw new Error(`Expected version 2.0, got ${registry.version}`);
    }
  } catch (err) {
    console.log('❌ Test 3 failed:', err.message);
    failed++;
  }

  // Test 4: Registry has metadata
  try {
    const content = await fs.readFile('agents/registry.yaml', 'utf8');
    const registry = YAML.parse(content);
    if (registry.metadata && registry.metadata.governance) {
      console.log('✅ Test 4: Registry has metadata with governance');
      passed++;
    } else {
      throw new Error('Missing metadata or governance');
    }
  } catch (err) {
    console.log('❌ Test 4 failed:', err.message);
    failed++;
  }

  // Test 5: No duplicates detected
  try {
    const detector = new DuplicationDetector();
    const report = await detector.generateReport();
    if (report.status === 'clean') {
      console.log('✅ Test 5: No duplicates detected');
      passed++;
    } else {
      throw new Error(`Found ${report.duplicates.length} duplicates`);
    }
  } catch (err) {
    console.log('❌ Test 5 failed:', err.message);
    failed++;
  }

  // Test 6: Fingerprint calculation works
  try {
    const detector = new DuplicationDetector();
    const agent1 = { id: 'test-1', name: 'Test', category: 'test', contexts: [] };
    const fp1 = detector.calculateFingerprint(agent1);
    const fp2 = detector.calculateFingerprint(agent1);
    if (fp1 === fp2) {
      console.log('✅ Test 6: Fingerprint calculation is consistent');
      passed++;
    } else {
      throw new Error('Fingerprints do not match');
    }
  } catch (err) {
    console.log('❌ Test 6 failed:', err.message);
    failed++;
  }

  // Test 7: Similarity check works
  try {
    const detector = new DuplicationDetector();
    const agent1 = { id: 'test-1', name: 'Test Agent', category: 'test', contexts: { allowed: ['chat'] } };
    const agent2 = { id: 'test-2', name: 'Test Agent', category: 'test', contexts: { allowed: ['chat'] } };
    const similarity = detector.checkSimilarity(agent1, agent2);
    if (similarity === 100) {
      console.log('✅ Test 7: Similarity check detects high similarity');
      passed++;
    } else {
      throw new Error(`Expected 100% similarity, got ${similarity}%`);
    }
  } catch (err) {
    console.log('❌ Test 7 failed:', err.message);
    failed++;
  }

  // Summary
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
