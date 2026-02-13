import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { getAllCircuitBreakerStats } from "../utils/circuitBreaker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Basic health check endpoint
 */
export const getHealth = (req, res) => {
  res.json({ status: "ok", timestamp: Date.now(), correlationId: req.correlationId });
};

/**
 * Comprehensive health check endpoint
 * Validates critical system components
 */
export const getHealthDetailed = async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
    status: "healthy",
    checks: {}
  };

  try {
    // Check 1: File System Access
    checks.checks.filesystem = await checkFileSystem();

    // Check 2: Agent Registry
    checks.checks.agentRegistry = await checkAgentRegistry();

    // Check 3: Environment Configuration
    checks.checks.environment = checkEnvironment();

    // Check 4: Required Files
    checks.checks.requiredFiles = await checkRequiredFiles();

    // Check 5: Circuit Breakers
    checks.checks.circuitBreakers = checkCircuitBreakers();

    // Determine overall status
    const failedChecks = Object.values(checks.checks).filter(c => c.status !== "pass");
    if (failedChecks.length > 0) {
      checks.status = failedChecks.some(c => c.status === "fail") ? "unhealthy" : "degraded";
    }

    const statusCode = checks.status === "healthy" ? 200 : checks.status === "degraded" ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    checks.status = "error";
    checks.error = error.message;
    res.status(503).json(checks);
  }
};

/**
 * Check file system access
 */
async function checkFileSystem() {
  try {
    const testDir = path.join(process.cwd(), "data");
    await fs.access(testDir);
    return {
      status: "pass",
      message: "File system accessible"
    };
  } catch (error) {
    return {
      status: "fail",
      message: "File system not accessible",
      error: error.message
    };
  }
}

/**
 * Check agent registry integrity
 */
async function checkAgentRegistry() {
  try {
    const indexPath = path.join(process.cwd(), "data/agents/index.json");
    const content = await fs.readFile(indexPath, "utf-8");
    const index = JSON.parse(content);

    if (!index.agents || !Array.isArray(index.agents)) {
      return {
        status: "fail",
        message: "Agent index invalid",
        error: "Missing agents array"
      };
    }

    // Check if referenced agent files exist
    const missingFiles = [];
    for (const agentFile of index.agents) {
      const agentPath = path.join(process.cwd(), "data/agents", agentFile);
      try {
        await fs.access(agentPath);
      } catch {
        missingFiles.push(agentFile);
      }
    }

    if (missingFiles.length > 0) {
      return {
        status: "warn",
        message: "Some agent files missing",
        details: { missing: missingFiles }
      };
    }

    return {
      status: "pass",
      message: `Agent registry valid (${index.agents.length} agents)`,
      count: index.agents.length
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Agent registry check failed",
      error: error.message
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  const warnings = [];
  
  if (env.nodeEnv === "production" && !env.adminToken) {
    warnings.push("ADMIN_TOKEN not set in production");
  }
  
  if (env.nodeEnv === "production" && env.corsOrigins.length === 0) {
    warnings.push("CORS_ORIGINS not configured in production");
  }

  return {
    status: warnings.length > 0 ? "warn" : "pass",
    message: warnings.length > 0 ? "Configuration warnings detected" : "Environment configuration valid",
    environment: env.nodeEnv,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Check required files exist
 */
async function checkRequiredFiles() {
  const requiredFiles = [
    "package.json",
    "src/server.js",
    "src/app.js",
    ".env.example"
  ];

  const missing = [];
  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(process.cwd(), file));
    } catch {
      missing.push(file);
    }
  }

  return {
    status: missing.length > 0 ? "fail" : "pass",
    message: missing.length > 0 ? "Required files missing" : "All required files present",
    missing: missing.length > 0 ? missing : undefined
  };
}

/**
 * Check circuit breakers status
 */
function checkCircuitBreakers() {
  const stats = getAllCircuitBreakerStats();
  const openBreakers = Object.entries(stats).filter(([_, breaker]) => breaker.state === 'OPEN');
  
  if (openBreakers.length > 0) {
    return {
      status: "warn",
      message: `${openBreakers.length} circuit breaker(s) OPEN`,
      breakers: stats
    };
  }
  
  return {
    status: "pass",
    message: "All circuit breakers operational",
    breakers: stats
  };
}
