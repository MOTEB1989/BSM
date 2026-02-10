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

    const governanceReview = otherResults.find((result) => result?.agentId === "governance-review-agent");
    const codeReview = otherResults.find((result) => result?.agentId === "code-review-agent");
    const security = otherResults.find(
      (result) => result?.agentId === "security-agent" || result?.agentId === "securityScanner"
    );

    // Governance check is mandatory
    if (governanceReview && governanceReview.decision === "block") {
      return {
        agentId: this.id,
        prNumber,
        action: "block",
        reason: `Governance blocked: ${governanceReview.reason || "Compliance violations detected"}`,
        conditions: {
          governanceCompliance: false,
          complianceScore: governanceReview.complianceScore || 0
        },
        timestamp: new Date().toISOString()
      };
    }

    const codeScore = Number(codeReview?.score || 0);
    const criticalVulns = Number(security?.summary?.critical || 0);

    const meetsCodeScore = codeScore >= this.conditions.minCodeScore;
    const noCriticalVulns = criticalVulns <= this.conditions.maxCriticalVulns;
    const governancePassed = !governanceReview || governanceReview.decision === "approve";

    const failedReasons = [];
    if (!meetsCodeScore) failedReasons.push(`Code score (${codeScore}) below ${this.conditions.minCodeScore}`);
    if (!noCriticalVulns) failedReasons.push(`Critical vulnerabilities found (${criticalVulns})`);
    if (!governancePassed) failedReasons.push(`Governance issues: ${governanceReview?.reason || "review required"}`);

    return {
      agentId: this.id,
      prNumber,
      action: failedReasons.length === 0 ? "approve" : "request_changes",
      reason: failedReasons.length === 0 ? "All quality gates passed" : failedReasons.join("; "),
      conditions: {
        meetsCodeScore,
        noCriticalVulns,
        governancePassed,
        codeScore,
        criticalVulns,
        complianceScore: governanceReview?.complianceScore
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const prMergeAgent = new PRMergeAgent();
export default prMergeAgent;
