import logger from "../utils/logger.js";

export class PRMergeAgent {
  constructor() {
    this.id = "pr-merge-agent";
    this.name = "Merge Decision Maker";
    this.conditions = {
      minCodeScore: 7,
      maxCriticalVulns: 0
    };
  }

  evaluate(prData = {}, otherResults = []) {
    const { prNumber } = prData;
    logger.info({ prNumber }, `[${this.id}] Evaluating merge decision`);

    const codeReview = otherResults.find((result) => result?.agentId === "code-review-agent");
    const security = otherResults.find(
      (result) => result?.agentId === "security-agent" || result?.agentId === "securityScanner"
    );

    const codeScore = Number(codeReview?.score || 0);
    const criticalVulns = Number(security?.summary?.critical || 0);

    const meetsCodeScore = codeScore >= this.conditions.minCodeScore;
    const noCriticalVulns = criticalVulns <= this.conditions.maxCriticalVulns;

    const failedReasons = [];
    if (!meetsCodeScore) failedReasons.push(`Code score (${codeScore}) below ${this.conditions.minCodeScore}`);
    if (!noCriticalVulns) failedReasons.push(`Critical vulnerabilities found (${criticalVulns})`);

    return {
      agentId: this.id,
      prNumber,
      action: failedReasons.length === 0 ? "approve" : "request_changes",
      reason: failedReasons.length === 0 ? "All quality gates passed" : failedReasons.join("; "),
      conditions: {
        meetsCodeScore,
        noCriticalVulns,
        codeScore,
        criticalVulns
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const prMergeAgent = new PRMergeAgent();
export default prMergeAgent;
