#!/usr/bin/env node

/**
 * Verify required CLI tools before running quality gates.
 * WHY: fail fast with a human-readable message instead of cryptic command-not-found errors.
 */
import { spawnSync } from 'node:child_process';

const requiredTools = [
  {
    name: 'node',
    args: ['--version'],
    reason: 'Runtime for all project scripts.',
  },
  {
    name: 'npm',
    args: ['--version'],
    reason: 'Package manager used by local and CI quality commands.',
  },
  {
    name: 'git',
    args: ['--version'],
    reason: 'Required for commit hooks and repository checks.',
  },
];

const missingTools = [];

for (const tool of requiredTools) {
  const check = spawnSync(tool.name, tool.args, { stdio: 'ignore' });
  if (check.error || check.status !== 0) {
    missingTools.push(tool);
  }
}

if (missingTools.length > 0) {
  console.error('\n❌ Missing required development tools:');
  for (const tool of missingTools) {
    console.error(`- ${tool.name}: ${tool.reason}`);
  }
  console.error('\nPlease install the missing tool(s) and re-run: npm run ci:check\n');
  process.exit(1);
}

console.log('✅ Required tools are available.');
