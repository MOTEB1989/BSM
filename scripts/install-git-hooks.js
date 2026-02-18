#!/usr/bin/env node

/**
 * Configure Git to use repository-managed hooks.
 * WHY: ensure all contributors use identical quality enforcement hooks.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'inherit',
});

if (result.error || result.status !== 0) {
  console.error('❌ Failed to configure Git hooks path. Run: git config core.hooksPath .githooks');
  process.exit(1);
}

console.log('✅ Git hooks installed (.githooks).');
