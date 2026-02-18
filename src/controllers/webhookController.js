import crypto from "crypto";
import { orchestrator } from "../runners/orchestrator.js";
import { executeDecision } from "../actions/githubActions.js";
import logger from "../utils/logger.js";

export const handleGitHubWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const payload = JSON.stringify(req.body);
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!verifySignature(payload, signature, secret)) {
      logger.warn("Rejecting GitHub webhook request: signature validation failed");
      return res.status(401).json({
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "Unauthorized webhook request"
        }
      });
    }

    const event = req.headers["x-github-event"];
    const data = req.body;

    logger.info({ event, action: data?.action }, "Webhook received");

    if (data?.pull_request?.draft) {
      logger.info({ prNumber: data.number }, "Skipping draft PR");
      return res.status(200).json({ status: "skipped", reason: "Draft PR" });
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

export function verifySignature(payload, signature, secret) {
  if (!secret) {
    logger.error("Cannot verify GitHub webhook signature: missing GITHUB_WEBHOOK_SECRET security configuration");
    return false;
  }

  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const digest = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  if (signature.length !== digest.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
