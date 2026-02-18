import crypto from "crypto";
import { orchestrator } from "../runners/orchestrator.js";
import { executeDecision } from "../actions/githubActions.js";
import { intelligentCodeReviewAgent } from "../agents/IntelligentCodeReviewAgent.js";
import { reviewCacheService } from "../services/reviewCacheService.js";
import { reviewHistoryService } from "../services/reviewHistoryService.js";
import logger from "../utils/logger.js";
import fetch from "node-fetch";

export const handleGitHubWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const payload = JSON.stringify(req.body);

    if (!verifySignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      logger.warn("Invalid webhook signature");
      return res.status(401).send("Unauthorized");
    }

    const event = req.headers["x-github-event"];
    const data = req.body;

    logger.info({ event, action: data?.action }, "Webhook received");

    if (data?.pull_request?.draft) {
      logger.info({ prNumber: data.number }, "Skipping draft PR");
      return res.status(200).json({ status: "skipped", reason: "Draft PR" });
    }

    // Trigger intelligent code review for PRs
    if (event === "pull_request" && ["opened", "synchronize", "reopened"].includes(data.action)) {
      triggerIntelligentCodeReview(data);
    }

    const orchestrationPayload = transformGitHubEvent(event, data);
    const result = await orchestrator({
      event: `${event}.${data?.action || "unknown"}`,
      payload: orchestrationPayload
    });

    // respond immediately, then execute the decision asynchronously
    res.status(202).json({
      status: "processing",
      jobId: result.jobId,
      message: "Agents are analyzing your request"
    });

    // execute the decision (merge, approve, request changes, etc.)
    const prNumber = data?.pull_request?.number || data?.number;
    if (result.decision && prNumber && process.env.GITHUB_BSU_TOKEN) {
      const execution = await executeDecision(result.decision, prNumber);
      logger.info({ jobId: result.jobId, prNumber, execution }, "Decision executed");
    }
  } catch (error) {
    logger.error({ error }, "Webhook processing failed");
    if (!res.headersSent) {
      return next(error);
    }
  }
};

function transformGitHubEvent(event, data) {
  const transformers = {
    pull_request: () => ({
      prNumber: data.number,
      title: data.pull_request?.title,
      body: data.pull_request?.body,
      author: data.pull_request?.user?.login,
      branch: data.pull_request?.head?.ref,
      baseBranch: data.pull_request?.base?.ref,
      filesChanged: data.pull_request?.changed_files,
      additions: data.pull_request?.additions,
      deletions: data.pull_request?.deletions,
      diffUrl: data.pull_request?.diff_url,
      repo: data.repository?.full_name,
      isDraft: data.pull_request?.draft
    }),
    check_suite: () => ({
      commit: data.check_suite?.head_commit,
      status: data.check_suite?.status,
      conclusion: data.check_suite?.conclusion,
      prNumbers: (data.check_suite?.pull_requests || []).map(pr => pr.number)
    }),
    push: () => ({
      ref: data.ref,
      commits: data.commits,
      pusher: data.pusher?.name,
      forced: data.forced
    })
  };

  return transformers[event] ? transformers[event]() : data;
}

function verifySignature(payload, signature, secret) {
  if (!secret) {
    return true;
  }
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const digest = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Trigger intelligent code review asynchronously
 */
async function triggerIntelligentCodeReview(data) {
  try {
    const prNumber = data.number;
    const repo = data.repository?.full_name;
    const commitSha = data.pull_request?.head?.sha;

    if (!repo || !prNumber) {
      logger.warn("Missing repo or PR number for code review");
      return;
    }

    logger.info({ repo, prNumber, commitSha }, "Triggering intelligent code review");

    // Check cache first
    const cached = reviewCacheService.get(repo, prNumber, commitSha);
    if (cached) {
      logger.info({ repo, prNumber }, "Using cached review result");
      await postReviewCommentToGitHub(repo, prNumber, cached.report);
      return;
    }

    // Fetch PR diff
    const diffUrl = data.pull_request?.diff_url;
    const diff = diffUrl ? await fetchDiff(diffUrl) : "";

    // Perform review
    const reviewResult = await intelligentCodeReviewAgent.review({
      prNumber,
      repo,
      title: data.pull_request?.title,
      body: data.pull_request?.body,
      author: data.pull_request?.user?.login,
      files: [], // Will be fetched by agent if needed
      diff
    });

    // Cache the result
    reviewCacheService.set(repo, prNumber, reviewResult, commitSha);

    // Save to history
    await reviewHistoryService.saveReview(reviewResult);

    // Post comment to GitHub
    await postReviewCommentToGitHub(repo, prNumber, reviewResult.report);

    logger.info({ repo, prNumber, score: reviewResult.score }, "Code review completed and posted");
  } catch (error) {
    logger.error({ error: error.message }, "Intelligent code review failed");
  }
}

/**
 * Fetch diff from GitHub
 */
async function fetchDiff(diffUrl) {
  try {
    const response = await fetch(diffUrl, {
      headers: {
        Accept: "application/vnd.github.v3.diff"
      }
    });

    if (!response.ok) {
      logger.error({ diffUrl, status: response.status }, "Failed to fetch diff");
      return "";
    }

    return await response.text();
  } catch (error) {
    logger.error({ error: error.message }, "Error fetching diff");
    return "";
  }
}

/**
 * Post review comment to GitHub
 */
async function postReviewCommentToGitHub(repo, prNumber, body) {
  try {
    const token = process.env.GITHUB_BSU_TOKEN;
    if (!token) {
      logger.warn("GitHub token not configured, skipping comment post");
      return;
    }

    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({ body })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ repo, prNumber, error: errorText }, "Failed to post review comment");
      return;
    }

    const comment = await response.json();
    logger.info({ repo, prNumber, commentId: comment.id }, "Review comment posted successfully");
  } catch (error) {
    logger.error({ error: error.message }, "Error posting review comment");
  }
}
