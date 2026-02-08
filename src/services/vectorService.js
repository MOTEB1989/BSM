import logger from "../utils/logger.js";

const memory = [];

export class VectorMemory {
  async storeCodeReview(code, review, metadata = {}) {
    memory.push({
      id: `review_${Date.now()}`,
      type: "code_review",
      code: String(code || "").slice(0, 1000),
      review,
      metadata,
      createdAt: new Date().toISOString()
    });
  }

  async findSimilarReviews(code, topK = 5) {
    const query = String(code || "");
    const sorted = memory
      .filter(item => item.type === "code_review")
      .map(item => ({
        ...item,
        score: similarity(item.code, query)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return sorted;
  }

  async storeDecision(decision, context) {
    memory.push({
      id: `decision_${Date.now()}`,
      type: "orchestration_decision",
      decision,
      context,
      createdAt: new Date().toISOString()
    });
  }

  async analyzeRejectionPatterns() {
    const decisions = memory.filter(item => item.type === "orchestration_decision");
    const total = decisions.length;
    const rejected = decisions.filter(item => {
      const action = item.decision?.action;
      return action === "block_pr" || action === "request_changes";
    });

    const commonReasons = rejected.reduce((acc, item) => {
      const reason = item.decision?.reason || "unknown";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    logger.info({ total, rejected: rejected.length }, "Vector memory rejection analysis");

    return {
      total,
      rejections: rejected.length,
      rejectionRate: total ? `${((rejected.length / total) * 100).toFixed(2)}%` : "0.00%",
      commonReasons
    };
  }
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const aWords = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const bWords = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...aWords].filter(word => bWords.has(word)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union ? intersection / union : 0;
}
