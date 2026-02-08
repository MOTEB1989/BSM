import logger from "../utils/logger.js";

export class IntegrityAgent {
  constructor() {
    this.id = "integrity-agent";
    this.name = "Repository Health Check";
  }

  check(payload = {}) {
    const { prs = [], issues = [] } = payload;
    logger.info({ prs: prs.length, issues: issues.length }, `[${this.id}] Running health check`);

    const stalePRs = this.findStalePRs(prs);
    const oldIssues = this.findOldIssues(issues);
    const healthScore = Math.max(0, 100 - stalePRs.length * 5 - oldIssues.length * 2);

    return {
      agentId: this.id,
      healthScore,
      stalePRs: stalePRs.length,
      oldIssues: oldIssues.length,
      recommendations: this.generateRecommendations(stalePRs.length, oldIssues.length),
      timestamp: new Date().toISOString()
    };
  }

  findStalePRs(prs = []) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return prs.filter((pr) => {
      const updatedAt = pr?.updated_at || pr?.updatedAt;
      if (!updatedAt) return false;
      return new Date(updatedAt) < thirtyDaysAgo && pr?.state === "open";
    });
  }

  findOldIssues(issues = []) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return issues.filter((issue) => {
      const createdAt = issue?.created_at || issue?.createdAt;
      if (!createdAt) return false;
      return new Date(createdAt) < ninetyDaysAgo && issue?.state === "open";
    });
  }

  generateRecommendations(staleCount, oldCount) {
    const recommendations = [];
    if (staleCount > 0) recommendations.push(`Close or re-triage ${staleCount} stale PR(s)`);
    if (oldCount > 0) recommendations.push(`Archive or prioritize ${oldCount} old open issue(s)`);
    return recommendations.length > 0 ? recommendations : ["Repository health is good"];
  }
}

export const integrityAgent = new IntegrityAgent();
export default integrityAgent;
