import logger from "../utils/logger.js";

export class PRMergeAgent {
  constructor() {
    this.id = "pr-merge-agent";
    this.name = "Merge Decision Maker";
    this.conditions = {
      minCodeScore: 7,
      maxCriticalVulns: 0,
      minApprovals: 1,
      maxInactiveDays: 14
    };
  }

  evaluate(prData = {}, otherResults = []) {
    const { prNumber, mergeable, draft, approvals = 0, updatedAt, ciStatus } = prData;
    logger.info({ prNumber }, `[${this.id}] Evaluating merge decision`);

    // Check for conflicts
    if (mergeable === false) {
      return {
        agentId: this.id,
        prNumber,
        action: "block",
        reason: "PR has merge conflicts that must be resolved",
        conditions: {
          hasConflicts: true,
          mergeable: false
        },
        recommendation: "Resolve merge conflicts by rebasing or merging main branch",
        timestamp: new Date().toISOString()
      };
    }

    // Check if draft
    if (draft === true) {
      return {
        agentId: this.id,
        prNumber,
        action: "hold",
        reason: "PR is in draft state",
        conditions: {
          isDraft: true
        },
        recommendation: "Mark PR as ready for review when complete",
        timestamp: new Date().toISOString()
      };
    }

    // Check staleness
    if (updatedAt) {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > this.conditions.maxInactiveDays) {
        return {
          agentId: this.id,
          prNumber,
          action: "request_update",
          reason: `PR has been inactive for ${daysSinceUpdate} days`,
          conditions: {
            isStale: true,
            daysSinceUpdate
          },
          recommendation: "Update PR with latest changes or close if no longer needed",
          timestamp: new Date().toISOString()
        };
      }
    }

    // Check CI status
    if (ciStatus && ciStatus !== "success") {
      return {
        agentId: this.id,
        prNumber,
        action: "request_changes",
        reason: `CI checks ${ciStatus}`,
        conditions: {
          ciPassed: false,
          ciStatus
        },
        recommendation: "Fix failing CI checks before merge",
        timestamp: new Date().toISOString()
      };
    }

    // Check approvals
    if (approvals < this.conditions.minApprovals) {
      return {
        agentId: this.id,
        prNumber,
        action: "request_review",
        reason: `Needs ${this.conditions.minApprovals - approvals} more approval(s)`,
        conditions: {
          hasApprovals: false,
          currentApprovals: approvals,
          requiredApprovals: this.conditions.minApprovals
        },
        recommendation: "Request reviews from team members",
        timestamp: new Date().toISOString()
      };
    }

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
        recommendation: "Address governance compliance issues",
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
        complianceScore: governanceReview?.complianceScore,
        mergeable,
        hasApprovals: approvals >= this.conditions.minApprovals,
        ciPassed: ciStatus === "success"
      },
      recommendation: failedReasons.length === 0 ? "Safe to merge" : "Address quality issues before merge",
      timestamp: new Date().toISOString()
    };
  }
}

export const prMergeAgent = new PRMergeAgent();
export default prMergeAgent;
