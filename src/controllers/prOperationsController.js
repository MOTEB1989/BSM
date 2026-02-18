import { PRMergeAgent } from "../agents/PRMergeAgent.js";
import logger from "../utils/logger.js";
import { success, badRequest, serverError } from "../utils/httpResponses.js";

const prMergeAgent = new PRMergeAgent();

/**
 * Evaluate PR merge readiness
 * POST /api/pr/evaluate
 * Body: { prNumber, mergeable, draft, approvals, updatedAt, ciStatus, otherResults }
 */
export async function evaluatePR(req, res) {
  try {
    const prData = req.body;

    if (!prData.prNumber) {
      return badRequest(res, "PR number is required", req.correlationId);
    }

    logger.info({ prNumber: prData.prNumber }, "Evaluating PR merge readiness");

    const decision = prMergeAgent.evaluate(prData, prData.otherResults || []);

    return success(res, {
      decision,
      prNumber: prData.prNumber,
      canMerge: decision.action === "approve",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error({ error: err }, "Failed to evaluate PR");
    return serverError(res, "Failed to evaluate PR", err.message);
  }
}

/**
 * Get PR merge recommendations for multiple PRs
 * POST /api/pr/batch-evaluate
 * Body: { prs: [{ prNumber, mergeable, draft, ... }] }
 */
export async function batchEvaluatePRs(req, res) {
  try {
    const { prs } = req.body;

    if (!Array.isArray(prs) || prs.length === 0) {
      return badRequest(res, "Array of PRs is required", req.correlationId);
    }

    logger.info({ count: prs.length }, "Batch evaluating PRs");

    const results = prs.map(prData => {
      const decision = prMergeAgent.evaluate(prData, prData.otherResults || []);
      return {
        prNumber: prData.prNumber,
        decision,
        canMerge: decision.action === "approve"
      };
    });

    const summary = {
      total: results.length,
      readyToMerge: results.filter(r => r.canMerge).length,
      needsChanges: results.filter(r => r.decision.action === "request_changes").length,
      blocked: results.filter(r => r.decision.action === "block").length
    };

    return success(res, {
      results,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error({ error: err }, "Failed to batch evaluate PRs");
    return serverError(res, "Failed to batch evaluate PRs", err.message);
  }
}

/**
 * Get PR merge agent configuration
 * GET /api/pr/config
 */
export function getConfig(req, res) {
  return success(res, {
    agentId: prMergeAgent.id,
    agentName: prMergeAgent.name,
    conditions: prMergeAgent.conditions,
    description: "Automated PR merge decision maker based on quality gates",
    actions: [
      "approve",
      "block",
      "hold",
      "request_changes",
      "request_review",
      "request_update"
    ]
  });
}

/**
 * Health check for PR operations
 * GET /api/pr/health
 */
export function healthCheck(req, res) {
  return success(res, {
    status: "healthy",
    agent: prMergeAgent.id,
    timestamp: new Date().toISOString()
  });
}
