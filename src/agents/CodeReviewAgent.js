import { modelRouter } from "../config/modelRouter.js";
import logger from "../utils/logger.js";

const MAX_DIFF_CHARS = 6000;

export class CodeReviewAgent {
  constructor() {
    this.id = "code-review-agent";
    this.name = "Code Review Specialist";
    this.version = "2.0";
  }

  async review(payload = {}) {
    const { prNumber, files = [], diff = "", author = "unknown" } = payload;

    logger.info({ prNumber, filesCount: files.length }, `[${this.id}] Starting review`);

    const complexity = this.calculateComplexity(files);

    try {
      const result = await modelRouter.execute(
        {
          system: "You are an expert code reviewer. Review for logic bugs, security risks, and maintainability.",
          user: `Review PR #${prNumber} by ${author}.\n\nFiles changed: ${files.length}\nDiff:\n${diff.slice(0, MAX_DIFF_CHARS)}\n\nProvide:\n1) Overall score from 0 to 10\n2) Critical issues\n3) Actionable suggestions`
        },
        {
          task: "code_review",
          complexity,
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        prNumber,
        score: this.extractScore(result.output),
        comments: result.output,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message, prNumber }, `[${this.id}] Review failed`);
      throw error;
    }
  }

  calculateComplexity(files = []) {
    if (files.length === 0) return "medium";

    const totalChanges = files.reduce((acc, file) => acc + Number(file?.changes || 0), 0);

    if (totalChanges > 300) return "critical";
    if (totalChanges > 100) return "high";
    return "medium";
  }

  extractScore(text = "") {
    const normalized = String(text);

    const scorePattern = /(?:score\s*[:=]?\s*)?(10|[0-9])(?:\s*\/\s*10|\s*out of\s*10)?/i;
    const match = normalized.match(scorePattern);
    if (!match) return 5;

    const score = Number.parseInt(match[1], 10);
    if (Number.isNaN(score)) return 5;

    return Math.min(10, Math.max(0, score));
  }
}

export const codeReviewAgent = new CodeReviewAgent();
export default codeReviewAgent;
