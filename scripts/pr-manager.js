#!/usr/bin/env node

import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "LexBANK";
const REPO = "BSM";

if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// PR Status Classifications
const STATUS = {
  READY_TO_MERGE: "ready-to-merge",
  NEEDS_REVIEW: "needs-review",
  NEEDS_CHANGES: "needs-changes",
  CONFLICTING: "conflicting",
  STALE: "stale",
  BLOCKED: "blocked",
  DRAFT: "draft"
};

async function getAllOpenPRs() {
  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner: OWNER,
    repo: REPO,
    state: "open",
    per_page: 100
  });
  return prs;
}



async function getPRWithMergeable(prNumber) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await octokit.rest.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: prNumber
    });

    const detailedPR = response.data;
    if (detailedPR.mergeable !== null || attempt === maxAttempts) {
      return detailedPR;
    }

    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }

  return null;
}

async function getPRReviews(prNumber) {
  const reviews = await octokit.paginate(octokit.rest.pulls.listReviews, {
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    per_page: 100
  });
  return reviews;
}

async function getCombinedStatus(ref) {
  try {
    const response = await octokit.rest.repos.getCombinedStatusForRef({
      owner: OWNER,
      repo: REPO,
      ref
    });
    return response.data;
  } catch (error) {
    return { state: "pending", statuses: [] };
  }
}

async function getCheckRuns(ref) {
  try {
    const response = await octokit.rest.checks.listForRef({
      owner: OWNER,
      repo: REPO,
      ref
    });
    return response.data.check_runs;
  } catch (error) {
    return [];
  }
}

function daysSinceUpdate(dateString) {
  const updated = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - updated) / (1000 * 60 * 60 * 24));
}

async function classifyPR(pr) {
  const detailedPR = await getPRWithMergeable(pr.number);
  const reviews = await getPRReviews(pr.number);
  const combinedStatus = await getCombinedStatus(pr.head.sha);
  const checkRuns = await getCheckRuns(pr.head.sha);

  const daysSince = daysSinceUpdate(pr.updated_at);
  const hasApproval = reviews.some(r => r.state === "APPROVED");
  const hasChangesRequested = reviews.some(r => r.state === "CHANGES_REQUESTED");
  const mergeable = detailedPR?.mergeable;
  const isConflicting = mergeable === false;
  const isDraft = pr.draft;
  
  // Check CI status
  const allChecksPass = 
    combinedStatus.state === "success" &&
    checkRuns.every(run => run.conclusion === "success" || run.conclusion === "skipped" || run.conclusion === null);

  // Classification logic
  if (isDraft) {
    return { status: STATUS.DRAFT, reason: "PR is in draft state" };
  }

  if (isConflicting) {
    return { status: STATUS.CONFLICTING, reason: "PR has merge conflicts" };
  }

  if (mergeable === null) {
    return { status: STATUS.BLOCKED, reason: "Mergeability still being calculated by GitHub" };
  }

  if (daysSince >= 14) {
    return { status: STATUS.STALE, reason: `No activity for ${daysSince} days` };
  }

  if (hasChangesRequested) {
    return { status: STATUS.NEEDS_CHANGES, reason: "Changes requested by reviewers" };
  }

  if (!allChecksPass) {
    return { status: STATUS.NEEDS_CHANGES, reason: "CI checks failing or pending" };
  }

  if (hasApproval && allChecksPass && !isConflicting) {
    return { status: STATUS.READY_TO_MERGE, reason: "All conditions met for merge" };
  }

  if (!hasApproval) {
    return { status: STATUS.NEEDS_REVIEW, reason: "Waiting for approvals" };
  }

  return { status: STATUS.BLOCKED, reason: "Unknown blocking condition" };
}

async function generateReport() {
  console.log("🔍 Analyzing open pull requests...\n");

  const prs = await getAllOpenPRs();
  console.log(`Found ${prs.length} open pull requests\n`);

  const classifications = {
    [STATUS.READY_TO_MERGE]: [],
    [STATUS.NEEDS_REVIEW]: [],
    [STATUS.NEEDS_CHANGES]: [],
    [STATUS.CONFLICTING]: [],
    [STATUS.STALE]: [],
    [STATUS.BLOCKED]: [],
    [STATUS.DRAFT]: []
  };

  // Classify each PR
  for (const pr of prs) {
    process.stdout.write(`Analyzing #${pr.number}...`);
    const classification = await classifyPR(pr);
    classifications[classification.status].push({
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      updated: pr.updated_at,
      reason: classification.reason,
      url: pr.html_url
    });
    process.stdout.write(` ${classification.status}\n`);
  }

  // Generate summary report
  console.log("\n" + "=".repeat(80));
  console.log("📊 PULL REQUEST MANAGEMENT REPORT");
  console.log("=".repeat(80) + "\n");

  for (const [status, items] of Object.entries(classifications)) {
    if (items.length === 0) continue;

    const icons = {
      [STATUS.READY_TO_MERGE]: "✅",
      [STATUS.NEEDS_REVIEW]: "👀",
      [STATUS.NEEDS_CHANGES]: "⚠️",
      [STATUS.CONFLICTING]: "⚔️",
      [STATUS.STALE]: "🕰️",
      [STATUS.BLOCKED]: "🚫",
      [STATUS.DRAFT]: "📝"
    };

    console.log(`${icons[status]} ${status.toUpperCase()} (${items.length})`);
    console.log("-".repeat(80));

    for (const pr of items) {
      const days = daysSinceUpdate(pr.updated);
      console.log(`  #${pr.number}: ${pr.title}`);
      console.log(`    Author: ${pr.author} | Updated: ${days}d ago`);
      console.log(`    Reason: ${pr.reason}`);
      console.log(`    URL: ${pr.url}`);
      console.log();
    }
  }

  // Summary statistics
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total PRs: ${prs.length}`);
  console.log(`Ready to merge: ${classifications[STATUS.READY_TO_MERGE].length}`);
  console.log(`Needs review: ${classifications[STATUS.NEEDS_REVIEW].length}`);
  console.log(`Needs changes: ${classifications[STATUS.NEEDS_CHANGES].length}`);
  console.log(`Conflicting: ${classifications[STATUS.CONFLICTING].length}`);
  console.log(`Stale (14+ days): ${classifications[STATUS.STALE].length}`);
  console.log(`Draft: ${classifications[STATUS.DRAFT].length}`);
  console.log(`Blocked: ${classifications[STATUS.BLOCKED].length}`);

  // Recommendations
  console.log("\n" + "=".repeat(80));
  console.log("💡 RECOMMENDATIONS");
  console.log("=".repeat(80));

  if (classifications[STATUS.READY_TO_MERGE].length > 0) {
    console.log(`\n✅ ${classifications[STATUS.READY_TO_MERGE].length} PR(s) ready to merge:`);
    console.log("   Action: Review and merge these PRs");
    classifications[STATUS.READY_TO_MERGE].forEach(pr => {
      console.log(`   - #${pr.number}: ${pr.title}`);
    });
  }

  if (classifications[STATUS.CONFLICTING].length > 0) {
    console.log(`\n⚔️ ${classifications[STATUS.CONFLICTING].length} PR(s) have conflicts:`);
    console.log("   Action: Resolve merge conflicts");
    classifications[STATUS.CONFLICTING].forEach(pr => {
      console.log(`   - #${pr.number}: ${pr.title}`);
    });
  }

  if (classifications[STATUS.STALE].length > 0) {
    console.log(`\n🕰️ ${classifications[STATUS.STALE].length} stale PR(s):`);
    console.log("   Action: Consider closing or requesting update");
    classifications[STATUS.STALE].forEach(pr => {
      console.log(`   - #${pr.number}: ${pr.title} (${daysSinceUpdate(pr.updated)}d)`);
    });
  }

  if (classifications[STATUS.NEEDS_REVIEW].length > 0) {
    console.log(`\n👀 ${classifications[STATUS.NEEDS_REVIEW].length} PR(s) need review:`);
    console.log("   Action: Assign reviewers and conduct reviews");
  }

  console.log("\n");
}

// Main execution
try {
  await generateReport();
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
