#!/usr/bin/env node

/**
 * Quick PR Status Check
 * A lightweight script to quickly check the status of open PRs
 * without requiring external dependencies beyond what's already installed
 */

import https from 'https';

const OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'LexBANK';
const REPO = process.env.GITHUB_REPOSITORY_NAME || 'BSM';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.error('   Get a token from: https://github.com/settings/tokens');
  console.error('   Usage: GITHUB_TOKEN=your_token node scripts/pr-status-check.js');
  process.exit(1);
}

function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'BSM-PR-Manager',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking open pull requests...\n');

  try {
    const prs = await githubRequest(`/repos/${OWNER}/${REPO}/pulls?state=open&per_page=100`);
    
    if (prs.length === 0) {
      console.log('✅ No open pull requests!');
      return;
    }

    console.log(`Found ${prs.length} open pull request(s)\n`);

    const stats = {
      total: prs.length,
      draft: 0,
      conflicts: 0,
      ready: 0,
      needsReview: 0,
      stale: 0
    };

    const now = Date.now();
    const staleDays = 14;

    console.log('PR Status Summary:');
    console.log('─'.repeat(80));

    for (const pr of prs) {
      const daysSince = Math.floor((now - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      const isDraft = pr.draft;
      const hasConflicts = pr.mergeable === false;
      const isStale = daysSince >= staleDays;

      let status = '🟢 Ready';
      let details = [];

      if (isDraft) {
        status = '📝 Draft';
        stats.draft++;
        details.push('draft');
      } else if (hasConflicts) {
        status = '⚔️ Conflicts';
        stats.conflicts++;
        details.push('has conflicts');
      } else if (isStale) {
        status = '🕰️ Stale';
        stats.stale++;
        details.push(`${daysSince}d old`);
      } else {
        // Would need to check reviews/CI for accurate status
        status = '👀 Needs Review';
        stats.needsReview++;
      }

      if (daysSince > 0) {
        details.push(`updated ${daysSince}d ago`);
      }

      console.log(`${status} #${pr.number}: ${pr.title}`);
      if (details.length > 0) {
        console.log(`   └─ ${details.join(', ')}`);
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('📊 Statistics:');
    console.log(`   Total Open: ${stats.total}`);
    console.log(`   Draft: ${stats.draft}`);
    console.log(`   Conflicts: ${stats.conflicts}`);
    console.log(`   Stale (${staleDays}+ days): ${stats.stale}`);
    console.log(`   Needs Review: ${stats.needsReview}`);

    console.log('\n💡 Recommended Actions:');
    
    if (stats.conflicts > 0) {
      console.log(`   ⚔️  ${stats.conflicts} PR(s) need conflict resolution`);
      console.log('      Run: gh workflow run pr-management.yml -f action=triage');
    }
    
    if (stats.stale > 0) {
      console.log(`   🕰️  ${stats.stale} stale PR(s) need attention`);
      console.log('      Run: gh workflow run pr-management.yml -f action=close-stale');
    }
    
    if (stats.needsReview > 0) {
      console.log(`   👀 ${stats.needsReview} PR(s) need review`);
      console.log('      Action: Assign reviewers and conduct reviews');
    }

    console.log('\n📚 For detailed analysis, run:');
    console.log('   GITHUB_TOKEN=xxx node scripts/pr-manager.js');
    console.log('\n🔧 To manage PRs automatically, run:');
    console.log('   gh workflow run pr-management.yml');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
