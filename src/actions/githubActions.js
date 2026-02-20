import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { getCircuitBreaker } from "../utils/circuitBreaker.js";

const repo = process.env.GITHUB_REPO || "LexBANK/BSM";
const GITHUB_REQUEST_TIMEOUT_MS = 20000;
const githubApiCircuitBreaker = getCircuitBreaker("github-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const getToken = () => {
  const token = process.env.GITHUB_BSU_TOKEN;
  if (!token) {
    throw new AppError("Missing GITHUB_BSU_TOKEN", 500, "MISSING_GITHUB_TOKEN");
  }
  return token;
};

const githubAPI = async (endpoint, method = "GET", body = null) => {
  const token = getToken();
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.github.com/repos/${repo}/${endpoint}`;

  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json",
      "User-Agent": "BSU-Agent-Orchestrator"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return githubApiCircuitBreaker.execute(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GITHUB_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!res.ok) {
        const text = await res.text();
        throw new AppError(`GitHub API ${method} ${endpoint} failed: ${text}`, res.status, "GITHUB_API_FAILED");
      }

      if (res.status === 204) {
        return null;
      }

      return res.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AppError("GitHub API request timed out", 504, "GITHUB_TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  });
};

export const createFile = async (path, content) => {
  return githubAPI(`contents/${path}`, "PUT", {
    message: `Create ${path}`,
    content: Buffer.from(content).toString("base64")
  });
};

export const mergePullRequest = async (prNumber, mergeMethod = "squash") => {
  logger.info({ prNumber, mergeMethod }, "Merging pull request");

  const pr = await githubAPI(`pulls/${prNumber}`);

  if (pr.state !== "open") {
    logger.warn({ prNumber, state: pr.state }, "PR is not open, skipping merge");
    return { merged: false, reason: `PR is ${pr.state}` };
  }

  if (pr.mergeable === false) {
    logger.warn({ prNumber }, "PR has conflicts, cannot merge");
    return { merged: false, reason: "PR has merge conflicts" };
  }

  const result = await githubAPI(`pulls/${prNumber}/merge`, "PUT", {
    merge_method: mergeMethod,
    commit_title: `auto-merge: ${pr.title} (#${prNumber})`,
    commit_message: `Automated merge by BSU agents.\n\nAll quality gates passed: code review, security scan, and integrity check.`
  });

  logger.info({ prNumber, merged: result.merged }, "Pull request merge result");
  return result;
};

export const approvePullRequest = async (prNumber, body = "All quality gates passed. Auto-approved by BSU agents.") => {
  logger.info({ prNumber }, "Approving pull request");

  return githubAPI(`pulls/${prNumber}/reviews`, "POST", {
    event: "APPROVE",
    body
  });
};

export const requestChanges = async (prNumber, body) => {
  logger.info({ prNumber }, "Requesting changes on pull request");

  return githubAPI(`pulls/${prNumber}/reviews`, "POST", {
    event: "REQUEST_CHANGES",
    body
  });
};

export const addComment = async (prNumber, body) => {
  return githubAPI(`issues/${prNumber}/comments`, "POST", { body });
};

export const addLabels = async (prNumber, labels) => {
  return githubAPI(`issues/${prNumber}/labels`, "POST", { labels });
};

export const executeDecision = async (decision, prNumber) => {
  if (!prNumber) {
    logger.warn("No PR number provided, skipping decision execution");
    return { executed: false, reason: "No PR number" };
  }

  try {
    switch (decision.action) {
      case "approve_and_merge": {
        await addComment(prNumber, buildAgentReport(decision, "approve_and_merge"));
        await addLabels(prNumber, ["agent-approved", "auto-merge"]);
        const approveResult = await approvePullRequest(prNumber);
        const mergeResult = await mergePullRequest(prNumber);
        return { executed: true, action: "merged", approveResult, mergeResult };
      }

      case "request_changes": {
        await addComment(prNumber, buildAgentReport(decision, "request_changes"));
        await addLabels(prNumber, ["changes-requested"]);
        await requestChanges(prNumber, decision.reason);
        return { executed: true, action: "changes_requested" };
      }

      case "block_pr": {
        await addComment(prNumber, buildAgentReport(decision, "block_pr"));
        await addLabels(prNumber, ["blocked", "security-issue"]);
        await requestChanges(prNumber, `Blocked: ${decision.reason}`);
        return { executed: true, action: "blocked" };
      }

      case "manual_review": {
        await addComment(prNumber, buildAgentReport(decision, "manual_review"));
        await addLabels(prNumber, ["needs-review"]);
        return { executed: true, action: "manual_review_requested" };
      }

      default:
        logger.warn({ action: decision.action }, "Unknown decision action");
        return { executed: false, reason: `Unknown action: ${decision.action}` };
    }
  } catch (error) {
    logger.error({ prNumber, error: error.message }, "Failed to execute decision");
    return { executed: false, reason: error.message };
  }
};

function buildAgentReport(decision, action) {
  const icons = {
    approve_and_merge: "## ✅ BSU Agents: Auto-Merge Approved",
    request_changes: "## ⚠️ BSU Agents: Changes Requested",
    block_pr: "## 🚫 BSU Agents: PR Blocked",
    manual_review: "## 👀 BSU Agents: Manual Review Required"
  };

  return `${icons[action] || "## 🤖 BSU Agents Report"}

**Decision:** \`${decision.action}\`
**Reason:** ${decision.reason}
${decision.automated ? "\n> This decision was made automatically by BSU AI agents." : ""}

---
*Powered by BSU Agent Orchestrator*`;
}
