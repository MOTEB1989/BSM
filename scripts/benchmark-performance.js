#!/usr/bin/env node
/**
 * Performance Benchmark Script
 * Measures improvements from optimizations
 */

import { performance } from "perf_hooks";
import fs from "fs/promises";
import path from "path";

const ITERATIONS = 10;

// Color codes for terminal output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m"
};

function formatDuration(ms) {
  return `${ms.toFixed(2)}ms`;
}

function formatImprovement(baseline, optimized) {
  const improvement = ((baseline - optimized) / baseline * 100);
  const color = improvement > 0 ? colors.green : colors.red;
  const sign = improvement > 0 ? "↓" : "↑";
  return `${color}${sign} ${Math.abs(improvement).toFixed(1)}%${colors.reset}`;
}

/**
 * Benchmark parallel vs sequential file access
 */
async function benchmarkFileAccess() {
  console.log(`\n${colors.blue}📁 File Access Benchmark${colors.reset}`);
  const testFiles = [
    "package.json",
    "README.md",
    "src/server.js",
    "src/app.js",
    ".env.example"
  ];

  // Sequential approach (old way)
  const sequentialTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    for (const file of testFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
      } catch {}
    }
    sequentialTimes.push(performance.now() - start);
  }

  // Parallel approach (new way)
  const parallelTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await Promise.all(
      testFiles.map(file => 
        fs.access(path.join(process.cwd(), file)).catch(() => {})
      )
    );
    parallelTimes.push(performance.now() - start);
  }

  const avgSequential = sequentialTimes.reduce((a, b) => a + b) / ITERATIONS;
  const avgParallel = parallelTimes.reduce((a, b) => a + b) / ITERATIONS;

  console.log(`  Sequential: ${formatDuration(avgSequential)}`);
  console.log(`  Parallel:   ${formatDuration(avgParallel)} ${formatImprovement(avgSequential, avgParallel)}`);
  
  return { sequential: avgSequential, parallel: avgParallel };
}

/**
 * Benchmark JSON serialization caching
 */
async function benchmarkJsonSerialization() {
  console.log(`\n${colors.blue}📦 JSON Serialization Benchmark${colors.reset}`);
  
  const largeObject = {
    agents: Array(50).fill(null).map((_, i) => ({
      id: `agent-${i}`,
      name: `Agent ${i}`,
      description: "A".repeat(100),
      config: { nested: { data: Array(10).fill("value") } }
    }))
  };

  // Without caching (repeated serialization)
  const withoutCacheTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    for (let j = 0; j < 5; j++) {
      JSON.stringify(largeObject);
    }
    withoutCacheTimes.push(performance.now() - start);
  }

  // With caching (serialize once, reuse)
  const withCacheTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    const cached = JSON.stringify(largeObject);
    let checksum = 0;
    for (let j = 0; j < 5; j++) {
      // Use cached value in a meaningful way to prevent optimization
      checksum += cached.length;
    }
    withCacheTimes.push(performance.now() - start);
  }

  const avgWithout = withoutCacheTimes.reduce((a, b) => a + b) / ITERATIONS;
  const avgWith = withCacheTimes.reduce((a, b) => a + b) / ITERATIONS;

  console.log(`  Without cache: ${formatDuration(avgWithout)}`);
  console.log(`  With cache:    ${formatDuration(avgWith)} ${formatImprovement(avgWithout, avgWith)}`);
  
  return { withoutCache: avgWithout, withCache: avgWith };
}

/**
 * Benchmark parallel vs sequential Promise execution
 */
async function benchmarkPromiseExecution() {
  console.log(`\n${colors.blue}⚡ Promise Execution Benchmark${colors.reset}`);
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const tasks = [10, 15, 20, 12, 18]; // Task durations in ms

  // Sequential execution
  const sequentialTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    for (const taskMs of tasks) {
      await delay(taskMs);
    }
    sequentialTimes.push(performance.now() - start);
  }

  // Parallel execution
  const parallelTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await Promise.all(tasks.map(taskMs => delay(taskMs)));
    parallelTimes.push(performance.now() - start);
  }

  const avgSequential = sequentialTimes.reduce((a, b) => a + b) / ITERATIONS;
  const avgParallel = parallelTimes.reduce((a, b) => a + b) / ITERATIONS;

  console.log(`  Sequential: ${formatDuration(avgSequential)}`);
  console.log(`  Parallel:   ${formatDuration(avgParallel)} ${formatImprovement(avgSequential, avgParallel)}`);
  
  return { sequential: avgSequential, parallel: avgParallel };
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log(`${colors.yellow}🚀 BSM Performance Benchmarks${colors.reset}`);
  console.log(`Running ${ITERATIONS} iterations per test...\n`);

  const results = {
    fileAccess: await benchmarkFileAccess(),
    jsonSerialization: await benchmarkJsonSerialization(),
    promiseExecution: await benchmarkPromiseExecution()
  };

  // Summary
  console.log(`\n${colors.blue}📊 Summary${colors.reset}`);
  const totalBaselineTime = 
    results.fileAccess.sequential +
    results.jsonSerialization.withoutCache +
    results.promiseExecution.sequential;
  
  const totalOptimizedTime = 
    results.fileAccess.parallel +
    results.jsonSerialization.withCache +
    results.promiseExecution.parallel;

  const overallImprovement = ((totalBaselineTime - totalOptimizedTime) / totalBaselineTime * 100);

  console.log(`  Total baseline time:  ${formatDuration(totalBaselineTime)}`);
  console.log(`  Total optimized time: ${formatDuration(totalOptimizedTime)}`);
  console.log(`  Overall improvement:  ${colors.green}${overallImprovement.toFixed(1)}%${colors.reset}`);

  console.log(`\n${colors.green}✅ Benchmarks complete!${colors.reset}\n`);
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error(`${colors.red}❌ Benchmark failed:${colors.reset}`, error);
  process.exit(1);
});
