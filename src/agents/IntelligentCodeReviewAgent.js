import { modelRouter } from "../config/modelRouter.js";
import logger from "../utils/logger.js";

const MAX_DIFF_CHARS = 8000;

/**
 * OWASP Top 10 Security Checks
 */
const OWASP_CHECKS = [
  {
    id: "A01",
    name: "Broken Access Control",
    patterns: [/auth|permission|role|admin|sudo/i],
    keywords: ["authentication", "authorization", "access control", "privilege"]
  },
  {
    id: "A02",
    name: "Cryptographic Failures",
    patterns: [/encrypt|decrypt|hash|password|secret|key|crypto/i],
    keywords: ["encryption", "hashing", "cryptography", "secrets management"]
  },
  {
    id: "A03",
    name: "Injection",
    patterns: [/sql|query|exec|eval|system|shell|command/i],
    keywords: ["SQL injection", "command injection", "XSS", "code injection"]
  },
  {
    id: "A04",
    name: "Insecure Design",
    patterns: [/design|architecture|pattern|security/i],
    keywords: ["threat modeling", "secure design patterns", "defense in depth"]
  },
  {
    id: "A05",
    name: "Security Misconfiguration",
    patterns: [/config|settings|env|cors|helmet|security/i],
    keywords: ["configuration", "default settings", "security headers", "error messages"]
  },
  {
    id: "A06",
    name: "Vulnerable Components",
    patterns: [/package|dependency|import|require|npm|pip/i],
    keywords: ["dependencies", "outdated packages", "known vulnerabilities"]
  },
  {
    id: "A07",
    name: "Authentication Failures",
    patterns: [/login|signin|password|session|token|jwt/i],
    keywords: ["weak passwords", "session management", "credential stuffing"]
  },
  {
    id: "A08",
    name: "Data Integrity Failures",
    patterns: [/serialize|deserialize|json|xml|yaml|parse/i],
    keywords: ["insecure deserialization", "data validation", "integrity checks"]
  },
  {
    id: "A09",
    name: "Logging Failures",
    patterns: [/log|audit|monitor|trace|debug/i],
    keywords: ["insufficient logging", "log injection", "monitoring"]
  },
  {
    id: "A10",
    name: "SSRF",
    patterns: [/fetch|request|http|url|redirect|proxy/i],
    keywords: ["server-side request forgery", "URL validation", "internal services"]
  }
];

/**
 * Language-specific patterns and checks
 */
const LANGUAGE_CONFIGS = {
  javascript: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs"],
    securityPatterns: [
      { pattern: /eval\s*\(/, severity: "high", message: "Dangerous use of eval()" },
      { pattern: /innerHTML\s*=/, severity: "medium", message: "Potential XSS via innerHTML" },
      { pattern: /document\.write/, severity: "medium", message: "Unsafe document.write usage" },
      { pattern: /exec\s*\(/, severity: "high", message: "Command execution detected" },
      { pattern: /new\s+Function\s*\(/, severity: "high", message: "Dynamic function creation" },
      { pattern: /dangerouslySetInnerHTML/, severity: "high", message: "XSS risk with dangerouslySetInnerHTML" }
    ],
    bestPractices: [
      "Use strict mode",
      "Avoid global variables",
      "Use const/let instead of var",
      "Implement error handling",
      "Add input validation"
    ]
  },
  python: {
    extensions: [".py"],
    securityPatterns: [
      { pattern: /eval\s*\(/, severity: "high", message: "Dangerous use of eval()" },
      { pattern: /exec\s*\(/, severity: "high", message: "Dangerous use of exec()" },
      { pattern: /pickle\.loads?/, severity: "high", message: "Unsafe deserialization with pickle" },
      { pattern: /os\.system/, severity: "high", message: "Command injection risk" },
      { pattern: /subprocess\.call.*shell\s*=\s*True/, severity: "high", message: "Shell injection risk" },
      { pattern: /\.format\s*\(.*\[/, severity: "medium", message: "Format string vulnerability" }
    ],
    bestPractices: [
      "Use type hints",
      "Follow PEP 8 style guide",
      "Implement proper exception handling",
      "Use context managers for resources",
      "Validate all inputs"
    ]
  },
  solidity: {
    extensions: [".sol"],
    securityPatterns: [
      { pattern: /\.call\.value/, severity: "high", message: "Reentrancy risk with call.value" },
      { pattern: /tx\.origin/, severity: "high", message: "Phishing risk with tx.origin" },
      { pattern: /block\.timestamp/, severity: "medium", message: "Timestamp dependence" },
      { pattern: /selfdestruct/, severity: "high", message: "Self-destruct usage detected" },
      { pattern: /delegatecall/, severity: "high", message: "Dangerous delegatecall usage" },
      { pattern: /\.transfer\(/, severity: "low", message: "Consider using call instead of transfer" }
    ],
    bestPractices: [
      "Use ReentrancyGuard",
      "Check-Effects-Interactions pattern",
      "Use SafeMath or Solidity 0.8+",
      "Implement access control",
      "Add comprehensive events"
    ]
  }
};

export class IntelligentCodeReviewAgent {
  constructor() {
    this.id = "intelligent-code-review-agent";
    this.name = "Intelligent Code Review Agent";
    this.version = "1.0.0";
  }

  /**
   * Main review method
   */
  async review(payload = {}) {
    const {
      prNumber,
      files = [],
      diff = "",
      author = "unknown",
      repo = "",
      title = "",
      body = ""
    } = payload;

    logger.info({ prNumber, filesCount: files.length, repo }, `[${this.id}] Starting intelligent review`);

    try {
      // Analyze files by language
      const filesByLanguage = this.categorizeFiles(files);

      // Run security analysis
      const securityAnalysis = await this.analyzeSecurityRisks(diff, files, filesByLanguage);

      // Run quality analysis
      const qualityAnalysis = await this.analyzeCodeQuality(diff, files, filesByLanguage);

      // Run performance analysis
      const performanceAnalysis = await this.analyzePerformance(diff, files);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        securityAnalysis,
        qualityAnalysis,
        performanceAnalysis
      );

      // Generate detailed markdown report
      const report = this.generateMarkdownReport({
        prNumber,
        title,
        author,
        repo,
        files,
        filesByLanguage,
        securityAnalysis,
        qualityAnalysis,
        performanceAnalysis,
        overallScore
      });

      return {
        agentId: this.id,
        prNumber,
        repo,
        score: overallScore,
        report,
        securityAnalysis,
        qualityAnalysis,
        performanceAnalysis,
        filesByLanguage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message, prNumber }, `[${this.id}] Review failed`);
      throw error;
    }
  }

  /**
   * Categorize files by programming language
   */
  categorizeFiles(files) {
    const categorized = {
      javascript: [],
      python: [],
      solidity: [],
      other: []
    };

    files.forEach(file => {
      const fileName = file.filename || file.name || "";
      let matched = false;

      for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
        if (config.extensions.some(ext => fileName.endsWith(ext))) {
          categorized[lang].push(file);
          matched = true;
          break;
        }
      }

      if (!matched) {
        categorized.other.push(file);
      }
    });

    return categorized;
  }

  /**
   * Analyze security risks (OWASP Top 10)
   */
  async analyzeSecurityRisks(diff, files, filesByLanguage) {
    const findings = [];
    const owaspRisks = [];

    // Pattern-based detection
    for (const check of OWASP_CHECKS) {
      for (const pattern of check.patterns) {
        if (pattern.test(diff)) {
          owaspRisks.push({
            id: check.id,
            name: check.name,
            detected: true,
            keywords: check.keywords
          });
          break;
        }
      }
    }

    // Language-specific security patterns
    for (const [lang, langFiles] of Object.entries(filesByLanguage)) {
      if (langFiles.length === 0 || !LANGUAGE_CONFIGS[lang]) continue;

      const config = LANGUAGE_CONFIGS[lang];
      for (const secPattern of config.securityPatterns) {
        if (secPattern.pattern.test(diff)) {
          findings.push({
            language: lang,
            severity: secPattern.severity,
            message: secPattern.message,
            files: langFiles.map(f => f.filename || f.name)
          });
        }
      }
    }

    // AI-powered deep security analysis
    const aiAnalysis = await this.performAISecurityAnalysis(diff, owaspRisks);

    return {
      owaspRisks,
      findings,
      aiAnalysis,
      riskLevel: this.calculateRiskLevel(findings),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * AI-powered security analysis
   */
  async performAISecurityAnalysis(diff, owaspRisks) {
    const truncatedDiff = diff.slice(0, MAX_DIFF_CHARS);
    const owaspContext = owaspRisks.map(r => `${r.id}: ${r.name}`).join(", ");

    try {
      const result = await modelRouter.execute(
        {
          system: "You are a senior security engineer specializing in OWASP Top 10 vulnerabilities. Analyze code changes for security risks.",
          user: `Analyze this code diff for security vulnerabilities. Focus on OWASP Top 10 risks: ${owaspContext}

Diff:
${truncatedDiff}

Provide:
1. Critical security issues (if any)
2. Medium/Low severity issues
3. Recommended fixes
4. Security score (0-10, where 10 is most secure)`
        },
        {
          task: "security_scan",
          complexity: "high",
          requiresSearch: false
        }
      );

      return {
        analysis: result.output,
        score: this.extractScore(result.output),
        modelUsed: result.modelUsed
      };
    } catch (error) {
      logger.error({ error: error.message }, "AI security analysis failed");
      return {
        analysis: "AI analysis unavailable",
        score: 5,
        error: error.message
      };
    }
  }

  /**
   * Analyze code quality
   */
  async analyzeCodeQuality(diff, files, filesByLanguage) {
    const issues = [];
    const recommendations = [];

    // Add language-specific best practices
    for (const [lang, langFiles] of Object.entries(filesByLanguage)) {
      if (langFiles.length === 0 || !LANGUAGE_CONFIGS[lang]) continue;

      const config = LANGUAGE_CONFIGS[lang];
      recommendations.push({
        language: lang,
        practices: config.bestPractices,
        fileCount: langFiles.length
      });
    }

    // AI-powered quality analysis
    const aiAnalysis = await this.performAIQualityAnalysis(diff, filesByLanguage);

    return {
      issues,
      recommendations,
      aiAnalysis,
      complexity: this.calculateComplexity(files),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * AI-powered code quality analysis
   */
  async performAIQualityAnalysis(diff, filesByLanguage) {
    const truncatedDiff = diff.slice(0, MAX_DIFF_CHARS);
    const languages = Object.entries(filesByLanguage)
      .filter(([_, files]) => files.length > 0)
      .map(([lang, _]) => lang)
      .join(", ");

    try {
      const result = await modelRouter.execute(
        {
          system: "You are an expert code reviewer specializing in code quality, maintainability, and best practices.",
          user: `Review this code for quality issues. Languages: ${languages}

Diff:
${truncatedDiff}

Evaluate:
1. Code maintainability
2. Design patterns usage
3. Code duplication
4. Error handling
5. Documentation quality
6. Testing coverage considerations
7. Quality score (0-10)`
        },
        {
          task: "code_review",
          complexity: "high",
          requiresSearch: false
        }
      );

      return {
        analysis: result.output,
        score: this.extractScore(result.output),
        modelUsed: result.modelUsed
      };
    } catch (error) {
      logger.error({ error: error.message }, "AI quality analysis failed");
      return {
        analysis: "AI analysis unavailable",
        score: 5,
        error: error.message
      };
    }
  }

  /**
   * Analyze performance issues
   */
  async analyzePerformance(diff, files) {
    const performancePatterns = [
      { pattern: /for\s*\(.*\)\s*\{[\s\S]*?for\s*\(/g, issue: "Nested loops detected", severity: "medium" },
      { pattern: /\.map\([\s\S]*?\.map\(/g, issue: "Nested array operations", severity: "low" },
      { pattern: /while\s*\(true\)/g, issue: "Infinite loop risk", severity: "high" },
      { pattern: /sleep|delay|setTimeout.*\d{4,}/g, issue: "Long blocking operation", severity: "medium" },
      { pattern: /SELECT \* FROM/gi, issue: "SELECT * usage (SQL)", severity: "medium" }
    ];

    const issues = [];
    for (const { pattern, issue, severity } of performancePatterns) {
      if (pattern.test(diff)) {
        issues.push({ issue, severity });
      }
    }

    return {
      issues,
      hasPerformanceConcerns: issues.length > 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(securityAnalysis, qualityAnalysis, performanceAnalysis) {
    const securityScore = securityAnalysis.aiAnalysis?.score || 5;
    const qualityScore = qualityAnalysis.aiAnalysis?.score || 5;
    const performanceScore = performanceAnalysis.hasPerformanceConcerns ? 6 : 8;

    // Weighted average: Security 40%, Quality 40%, Performance 20%
    const overall = (securityScore * 0.4) + (qualityScore * 0.4) + (performanceScore * 0.2);
    return Math.round(overall * 10) / 10;
  }

  /**
   * Generate detailed markdown report
   */
  generateMarkdownReport(data) {
    const {
      prNumber,
      title,
      author,
      repo,
      files,
      filesByLanguage,
      securityAnalysis,
      qualityAnalysis,
      performanceAnalysis,
      overallScore
    } = data;

    const timestamp = new Date().toISOString();
    const scoreEmoji = this.getScoreEmoji(overallScore);
    const riskBadge = this.getRiskBadge(securityAnalysis.riskLevel);

    let report = `# 🤖 Intelligent Code Review Report

**PR:** #${prNumber} - ${title}
**Author:** @${author}
**Repository:** ${repo}
**Reviewed:** ${timestamp}
**Overall Score:** ${scoreEmoji} **${overallScore}/10**

---

## 📊 Summary

| Category | Score | Status |
|----------|-------|--------|
| Security | ${securityAnalysis.aiAnalysis?.score || 'N/A'}/10 | ${riskBadge} |
| Quality | ${qualityAnalysis.aiAnalysis?.score || 'N/A'}/10 | ${this.getQualityBadge(qualityAnalysis.aiAnalysis?.score)} |
| Performance | ${performanceAnalysis.hasPerformanceConcerns ? '⚠️ Concerns' : '✅ Good'} | - |

**Files Changed:** ${files.length}
**Languages:** ${Object.entries(filesByLanguage).filter(([_, f]) => f.length > 0).map(([lang, f]) => `${lang} (${f.length})`).join(", ")}

---

## 🔒 Security Analysis

### OWASP Top 10 Detection
`;

    if (securityAnalysis.owaspRisks.length > 0) {
      report += "\n**Detected Risks:**\n";
      securityAnalysis.owaspRisks.forEach(risk => {
        report += `- **${risk.id}**: ${risk.name}\n`;
        report += `  - Focus areas: ${risk.keywords.join(", ")}\n`;
      });
    } else {
      report += "\n✅ No obvious OWASP Top 10 patterns detected in diff.\n";
    }

    if (securityAnalysis.findings.length > 0) {
      report += "\n### Security Findings\n\n";
      securityAnalysis.findings.forEach(finding => {
        const severityEmoji = { high: "🔴", medium: "🟡", low: "🟢" }[finding.severity];
        report += `${severityEmoji} **${finding.severity.toUpperCase()}**: ${finding.message}\n`;
        report += `  - Language: ${finding.language}\n`;
        report += `  - Files: ${finding.files.slice(0, 3).join(", ")}${finding.files.length > 3 ? "..." : ""}\n\n`;
      });
    }

    report += "\n### AI Security Analysis\n\n";
    report += securityAnalysis.aiAnalysis?.analysis || "Not available";
    report += "\n\n---\n\n";

    report += "## 💎 Code Quality Analysis\n\n";
    report += qualityAnalysis.aiAnalysis?.analysis || "Not available";
    report += "\n\n";

    if (qualityAnalysis.recommendations.length > 0) {
      report += "### Best Practices by Language\n\n";
      qualityAnalysis.recommendations.forEach(rec => {
        report += `**${rec.language.toUpperCase()}** (${rec.fileCount} files):\n`;
        rec.practices.forEach(practice => {
          report += `- ${practice}\n`;
        });
        report += "\n";
      });
    }

    report += "---\n\n";

    if (performanceAnalysis.issues.length > 0) {
      report += "## ⚡ Performance Concerns\n\n";
      performanceAnalysis.issues.forEach(issue => {
        const severityEmoji = { high: "🔴", medium: "🟡", low: "🟢" }[issue.severity];
        report += `${severityEmoji} **${issue.issue}**\n`;
      });
      report += "\n---\n\n";
    }

    report += `## 🎯 Recommendation

`;

    if (overallScore >= 8) {
      report += "✅ **APPROVE** - Code meets high quality standards. Minor improvements suggested above.";
    } else if (overallScore >= 6) {
      report += "⚠️ **REQUEST CHANGES** - Code is acceptable but requires improvements in the areas noted above.";
    } else {
      report += "❌ **REQUEST CHANGES** - Significant issues found. Please address critical concerns before merging.";
    }

    report += `

---

*🤖 Generated by ${this.name} v${this.version}*
*Powered by AI-driven code analysis*
`;

    return report;
  }

  /**
   * Helper: Calculate risk level
   */
  calculateRiskLevel(findings) {
    const highCount = findings.filter(f => f.severity === "high").length;
    if (highCount >= 2) return "critical";
    if (highCount >= 1) return "high";
    if (findings.length >= 3) return "medium";
    return "low";
  }

  /**
   * Helper: Calculate complexity
   */
  calculateComplexity(files) {
    if (files.length === 0) return "low";
    const totalChanges = files.reduce((acc, file) => acc + Number(file?.changes || 0), 0);
    if (totalChanges > 500) return "critical";
    if (totalChanges > 200) return "high";
    if (totalChanges > 50) return "medium";
    return "low";
  }

  /**
   * Helper: Extract score from AI response
   */
  extractScore(text = "") {
    const scorePattern = /(?:score\s*[:=]?\s*)?(10|[0-9])(?:\s*\/\s*10|\s*out of\s*10)?/i;
    const match = String(text).match(scorePattern);
    if (!match) return 5;
    const score = Number.parseInt(match[1], 10);
    return Number.isNaN(score) ? 5 : Math.min(10, Math.max(0, score));
  }

  /**
   * Helper: Get score emoji
   */
  getScoreEmoji(score) {
    if (score >= 9) return "🌟";
    if (score >= 7) return "✅";
    if (score >= 5) return "⚠️";
    return "❌";
  }

  /**
   * Helper: Get risk badge
   */
  getRiskBadge(level) {
    const badges = {
      critical: "🔴 Critical",
      high: "🟠 High",
      medium: "🟡 Medium",
      low: "🟢 Low"
    };
    return badges[level] || "⚪ Unknown";
  }

  /**
   * Helper: Get quality badge
   */
  getQualityBadge(score) {
    if (!score) return "⚪ Unknown";
    if (score >= 8) return "🟢 Excellent";
    if (score >= 6) return "🟡 Good";
    return "🔴 Needs Work";
  }
}

export const intelligentCodeReviewAgent = new IntelligentCodeReviewAgent();
export default intelligentCodeReviewAgent;
