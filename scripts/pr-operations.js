#!/usr/bin/env node

/**
 * PR Operations Script
 * Handles review, approve, merge, and close operations for PRs
 * Usage: node scripts/pr-operations.js <command> [options]
 */

import fetch from "node-fetch";
import { PRMergeAgent } from "../src/agents/PRMergeAgent.js";
import logger from "../src/utils/logger.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_BSU_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || process.env.GITHUB_REPO || "LexBANK/BSM";

if (!GITHUB_TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN or GITHUB_BSU_TOKEN environment variable is required");
  process.exit(1);
}

/**
 * Helper to call GitHub API
 */
async function githubAPI(endpoint, method = "GET", body = null) {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.github.com/repos/${REPO}/${endpoint}`;

  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
const prMergeAgent = new PRMergeAgent();

// Command definitions
const COMMANDS = {
  review: "Review a PR and provide decision",
  approve: "Approve a PR if it meets quality gates",
  merge: "Merge a PR (requires approval)",
  close: "Close a PR with optional comment",
  list: "List all open PRs with status",
  auto: "Auto-merge all ready PRs"
};

/**
 * Get PR details with all metadata
 */
async function getPRDetails(prNumber) {
  const pr = await githubAPI(`pulls/${prNumber}`);
  const reviews = await githubAPI(`pulls/${prNumber}/reviews`);
  const combinedStatus = await githubAPI(`commits/${pr.head.sha}/status`);
  
  let checkRuns = [];
  try {
    const checkRunsResponse = await githubAPI(`commits/${pr.head.sha}/check-runs`);
    checkRuns = checkRunsResponse.check_runs || [];
  } catch (e) {
    // Check runs API might not be available or enabled
    logger.debug({ error: e.message }, "Check runs API unavailable, continuing without checks");
    checkRuns = [];
  }

  // Count approvals
  const approvalCount = reviews.filter(r => r.state === "APPROVED").length;
  const hasChangesRequested = reviews.some(r => r.state === "CHANGES_REQUESTED");

  return {
    pr,
    reviews,
    approvals: approvalCount,
    hasChangesRequested,
    ciStatus: combinedStatus.state,
    checkRuns,
    allChecksPass: combinedStatus.state === "success" &&
      checkRuns.every(run => 
        run.conclusion === "success" || 
        run.conclusion === "skipped" || 
        run.conclusion === null
      )
  };
}

/**
 * Review PR command - evaluates PR and provides decision
 */
async function reviewPR(prNumber) {
  console.log(`\n🔍 Reviewing PR #${prNumber}...\n`);

  const details = await getPRDetails(prNumber);
  const { pr, approvals, ciStatus, allChecksPass } = details;

  // Prepare data for PRMergeAgent
  const prData = {
    prNumber: pr.number,
    mergeable: pr.mergeable,
    draft: pr.draft,
    approvals,
    updatedAt: pr.updated_at,
    ciStatus: allChecksPass ? "success" : ciStatus
  };

  // Get merge decision from agent
  const decision = prMergeAgent.evaluate(prData);

  // Display results
  console.log("📊 PR Details:");
  console.log(`   Title: ${pr.title}`);
  console.log(`   Author: ${pr.user.login}`);
  console.log(`   State: ${pr.state}`);
  console.log(`   Draft: ${pr.draft ? "Yes" : "No"}`);
  console.log(`   Mergeable: ${pr.mergeable === null ? "Unknown" : pr.mergeable ? "Yes" : "No (conflicts)"}`);
  console.log(`   Approvals: ${approvals}`);
  console.log(`   CI Status: ${ciStatus}`);
  console.log(`   All Checks: ${allChecksPass ? "✅ Pass" : "❌ Fail"}`);

  console.log("\n🤖 Agent Decision:");
  console.log(`   Action: ${decision.action}`);
  console.log(`   Reason: ${decision.reason}`);
  console.log(`   Recommendation: ${decision.recommendation}`);

  console.log("\n📋 Conditions:");
  Object.entries(decision.conditions).forEach(([key, value]) => {
    const icon = typeof value === "boolean" ? (value ? "✅" : "❌") : "ℹ️";
    console.log(`   ${icon} ${key}: ${value}`);
  });

  return decision;
}

/**
 * Approve PR command - creates approval review if quality gates pass
 */
async function approvePR(prNumber, comment = null) {
  console.log(`\n✅ Approving PR #${prNumber}...\n`);

  const decision = await reviewPR(prNumber);

  if (decision.action === "approve") {
    try {
      await githubAPI(`pulls/${prNumber}/reviews`, "POST", {
        event: "APPROVE",
        body: comment || `✅ Auto-approved by BSU PR Merge Agent\n\n${decision.reason}\n\n**Conditions Met:**\n${Object.entries(decision.conditions)
          .filter(([_, v]) => typeof v === "boolean" && v)
          .map(([k]) => `- ✅ ${k}`)
          .join("\n")}`
      });

      // Add labels
      await githubAPI(`issues/${prNumber}/labels`, "POST", {
        labels: ["agent-approved", "ready"]
      });

      console.log(`\n✅ PR #${prNumber} approved successfully`);
      return true;
    } catch (error) {
      console.error(`\n❌ Failed to approve PR: ${error.message}`);
      return false;
    }
  } else {
    console.log(`\n⚠️ Cannot approve: ${decision.reason}`);
    console.log(`   Recommended action: ${decision.action}`);
    return false;
  }
}

/**
 * Merge PR command - merges PR if approved
 */
async function mergePR(prNumber, method = "squash", comment = null) {
  console.log(`\n🔀 Merging PR #${prNumber}...\n`);

  const details = await getPRDetails(prNumber);
  const { pr, approvals } = details;

  if (pr.draft) {
    console.log("❌ Cannot merge: PR is in draft state");
    return false;
  }

  if (pr.mergeable === false) {
    console.log("❌ Cannot merge: PR has conflicts");
    return false;
  }

  if (approvals < 1) {
    console.log("⚠️ Warning: No approvals found. Consider approving first.");
  }

  try {
    const result = await githubAPI(`pulls/${prNumber}/merge`, "PUT", {
      merge_method: method,
      commit_title: `${pr.title} (#${prNumber})`,
      commit_message: comment || `Merged by BSU PR Merge Agent\n\nApprovals: ${approvals}\nAgent Decision: All quality gates passed`
    });

    console.log(`\n✅ PR #${prNumber} merged successfully`);
    console.log(`   SHA: ${result.sha}`);
    console.log(`   Method: ${method}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Failed to merge PR: ${error.message}`);
    
    // Note: Auto-merge enable requires GraphQL API which we don't use here
    // This would need to be enabled through GitHub UI or workflow
    console.log("💡 If checks are still running, enable auto-merge through GitHub UI");
    return false;
  }
}

/**
 * Close PR command - closes PR with optional comment
 */
async function closePR(prNumber, reason = null) {
  console.log(`\n🚫 Closing PR #${prNumber}...\n`);

  try {
    if (reason) {
      await githubAPI(`issues/${prNumber}/comments`, "POST", {
        body: `🚫 Closing PR\n\n**Reason:** ${reason}\n\n---\n*Closed by BSU PR Merge Agent*`
      });
    }

    await githubAPI(`pulls/${prNumber}`, "PATCH", {
      state: "closed"
    });

    console.log(`\n✅ PR #${prNumber} closed successfully`);
    return true;
  } catch (error) {
    console.error(`\n❌ Failed to close PR: ${error.message}`);
    return false;
  }
}

/**
 * List all open PRs with status
 */
async function listPRs() {
  console.log("\n📋 Listing open PRs...\n");

  const prs = await githubAPI(`pulls?state=open&per_page=100`);

  if (prs.length === 0) {
    console.log("No open PRs found.");
    return [];
  }

  console.log(`Found ${prs.length} open PR(s):\n`);

  const results = [];

  for (const pr of prs) {
    const details = await getPRDetails(pr.number);
    const prData = {
      prNumber: pr.number,
      mergeable: pr.mergeable,
      draft: pr.draft,
      approvals: details.approvals,
      updatedAt: pr.updated_at,
      ciStatus: details.allChecksPass ? "success" : details.ciStatus
    };

    const decision = prMergeAgent.evaluate(prData);

    const statusIcon = {
      approve: "✅",
      request_changes: "⚠️",
      block: "🚫",
      hold: "⏸️",
      request_review: "👀",
      request_update: "🔄"
    }[decision.action] || "❓";

    console.log(`${statusIcon} #${pr.number}: ${pr.title}`);
    console.log(`   Author: ${pr.user.login} | Updated: ${new Date(pr.updated_at).toLocaleDateString()}`);
    console.log(`   Status: ${decision.action} - ${decision.reason}`);
    console.log(`   Approvals: ${details.approvals} | CI: ${details.ciStatus} | Mergeable: ${pr.mergeable ?? "unknown"}`);
    console.log();

    results.push({
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      decision,
      details
    });
  }

  return results;
}

/**
 * Auto-merge all ready PRs
 */
async function autoMergeReady() {
  console.log("\n🤖 Auto-merging ready PRs...\n");

  const allPRs = await listPRs();
  const readyPRs = allPRs.filter(pr => pr.decision.action === "approve");

  if (readyPRs.length === 0) {
    console.log("No PRs ready for auto-merge.");
    return { merged: [], failed: [] };
  }

  console.log(`\nFound ${readyPRs.length} PR(s) ready for auto-merge:\n`);

  const merged = [];
  const failed = [];

  for (const pr of readyPRs) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing PR #${pr.number}: ${pr.title}`);
    console.log("=".repeat(60));

    // Approve first if not already approved
    if (pr.details.approvals < 1) {
      const approved = await approvePR(pr.number);
      if (!approved) {
        failed.push({ number: pr.number, reason: "Failed to approve" });
        continue;
      }
      // Wait a bit for GitHub to process the approval
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Merge
    const success = await mergePR(pr.number);
    if (success) {
      merged.push(pr.number);
    } else {
      failed.push({ number: pr.number, reason: "Failed to merge" });
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Auto-Merge Summary");
  console.log("=".repeat(60));
  console.log(`✅ Merged: ${merged.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (merged.length > 0) {
    console.log(`\nMerged PRs: ${merged.join(", ")}`);
  }

  if (failed.length > 0) {
    console.log("\nFailed PRs:");
    failed.forEach(f => console.log(`  - #${f.number}: ${f.reason}`));
  }

  return { merged, failed };
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const prNumber = parseInt(args[1]);

  if (!command || command === "help") {
    console.log("\n📖 BSU PR Operations Script");
    console.log("\nUsage: node scripts/pr-operations.js <command> [options]\n");
    console.log("Commands:");
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    console.log("\nExamples:");
    console.log("  node scripts/pr-operations.js list");
    console.log("  node scripts/pr-operations.js review 123");
    console.log("  node scripts/pr-operations.js approve 123");
    console.log("  node scripts/pr-operations.js merge 123");
    console.log("  node scripts/pr-operations.js close 123 'No longer needed'");
    console.log("  node scripts/pr-operations.js auto");
    console.log();
    return;
  }

  try {
    switch (command) {
      case "review":
        if (!prNumber) {
          console.error("❌ PR number required");
          process.exit(1);
        }
        await reviewPR(prNumber);
        break;

      case "approve":
        if (!prNumber) {
          console.error("❌ PR number required");
          process.exit(1);
        }
        await approvePR(prNumber, args[2]);
        break;

      case "merge":
        if (!prNumber) {
          console.error("❌ PR number required");
          process.exit(1);
        }
        await mergePR(prNumber, args[2] || "squash", args[3]);
        break;

      case "close":
        if (!prNumber) {
          console.error("❌ PR number required");
          process.exit(1);
        }
        await closePR(prNumber, args[2]);
        break;

      case "list":
        await listPRs();
        break;

      case "auto":
        await autoMergeReady();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/pr-operations.js help" for usage');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    logger.error({ error }, "PR operation failed");
    process.exit(1);
  }
}

main();
