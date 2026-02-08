import crypto from "crypto";
import { orchestrator } from "../runners/orchestrator.js";
import logger from "../utils/logger.js";

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

    const orchestrationPayload = transformGitHubEvent(event, data);
    const result = await orchestrator({
      event: `${event}.${data?.action || "unknown"}`,
      payload: orchestrationPayload
    });

    return res.status(202).json({
      status: "processing",
      jobId: result.jobId,
      message: "Agents are analyzing your request"
    });
  } catch (error) {
    logger.error({ error }, "Webhook processing failed");
    return next(error);
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
