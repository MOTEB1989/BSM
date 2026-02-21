import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const ROOT_MCP_SETTINGS_REL = "mcp-settings.json";
const COPILOT_MCP_SETTINGS_REL = ".github/copilot/mcp.json";
const BANKING_HUB_PATH_REL = "mcp-servers/banking-hub.js";

const ROOT_MCP_SETTINGS = path.join(ROOT_DIR, ROOT_MCP_SETTINGS_REL);
const COPILOT_MCP_SETTINGS = path.join(ROOT_DIR, ".github", "copilot", "mcp.json");
const BANKING_HUB_PATH = path.join(ROOT_DIR, "mcp-servers", "banking-hub.js");

const TARGET_SERVER_NAME = "bsm-banking-agents";

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const readJsonIfExists = async (filePath) => {
  const exists = await fileExists(filePath);
  if (!exists) {
    return {
      path: filePath,
      exists: false,
      validJson: false,
      error: "File not found",
      data: null
    };
  }

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return {
      path: filePath,
      exists: true,
      validJson: true,
      error: null,
      data: JSON.parse(raw)
    };
  } catch (error) {
    return {
      path: filePath,
      exists: true,
      validJson: false,
      error: error.message,
      data: null
    };
  }
};

const hasBankingServerConfig = (configRoot, keyName) =>
  Boolean(configRoot?.[keyName] && configRoot[keyName][TARGET_SERVER_NAME]);

const hasPerplexityKeyEnv = (serverConfig) =>
  Boolean(serverConfig?.env && typeof serverConfig.env === "object" && "PERPLEXITY_KEY" in serverConfig.env);

const normalizeArgsPath = (argPath) => String(argPath || "").replace(/\\/g, "/");

const isBankingHubArg = (argPath) => {
  const normalized = normalizeArgsPath(argPath);
  return normalized.endsWith("mcp-servers/banking-hub.js");
};

const getStatusLevel = ({
  rootConfigReady,
  copilotConfigReady,
  bankingHubExists,
  rootCommandReady,
  copilotCommandReady
}) => {
  const allReady =
    rootConfigReady &&
    copilotConfigReady &&
    bankingHubExists &&
    rootCommandReady &&
    copilotCommandReady;

  if (allReady) return "ready";

  const anyReady =
    rootConfigReady ||
    copilotConfigReady ||
    bankingHubExists ||
    rootCommandReady ||
    copilotCommandReady;

  return anyReady ? "partial" : "not_ready";
};

export const getMcpConnectionStatus = async () => {
  const [rootConfig, copilotConfig, bankingHubExists] = await Promise.all([
    readJsonIfExists(ROOT_MCP_SETTINGS),
    readJsonIfExists(COPILOT_MCP_SETTINGS),
    fileExists(BANKING_HUB_PATH)
  ]);

  const rootServer = rootConfig.data?.servers?.[TARGET_SERVER_NAME];
  const copilotServer = copilotConfig.data?.mcpServers?.[TARGET_SERVER_NAME];

  const rootConfigReady = hasBankingServerConfig(rootConfig.data, "servers");
  const copilotConfigReady = hasBankingServerConfig(copilotConfig.data, "mcpServers");

  const rootArgs = Array.isArray(rootServer?.args) ? rootServer.args : [];
  const copilotArgs = Array.isArray(copilotServer?.args) ? copilotServer.args : [];
  const rootCommandReady = rootServer?.command === "node" && rootArgs.some(isBankingHubArg);
  const copilotCommandReady = copilotServer?.command === "node" && copilotArgs.some(isBankingHubArg);
  const rootPerplexityReady = hasPerplexityKeyEnv(rootServer);
  const copilotPerplexityReady = hasPerplexityKeyEnv(copilotServer);

  const status = getStatusLevel({
    rootConfigReady,
    copilotConfigReady,
    bankingHubExists,
    rootCommandReady,
    copilotCommandReady
  });

  const recommendations = [];

  if (!rootConfigReady) {
    recommendations.push("Missing or invalid bsm-banking-agents in mcp-settings.json");
  }
  if (!copilotConfigReady) {
    recommendations.push("Missing or invalid bsm-banking-agents in .github/copilot/mcp.json");
  }
  if (!bankingHubExists) {
    recommendations.push("mcp-servers/banking-hub.js is missing");
  }
  if (rootConfigReady && !rootCommandReady) {
    recommendations.push("mcp-settings.json server command/args should be: node ./mcp-servers/banking-hub.js");
  }
  if (copilotConfigReady && !copilotCommandReady) {
    recommendations.push("copilot mcp.json server command/args should target mcp-servers/banking-hub.js");
  }
  if (rootConfigReady && !rootPerplexityReady) {
    recommendations.push("mcp-settings.json should use PERPLEXITY_KEY (project standard)");
  }
  if (copilotConfigReady && !copilotPerplexityReady) {
    recommendations.push(".github/copilot/mcp.json should use PERPLEXITY_KEY (project standard)");
  }

  return {
    status,
    server: TARGET_SERVER_NAME,
    timestamp: new Date().toISOString(),
    checks: {
      rootMcpSettings: {
        path: ROOT_MCP_SETTINGS_REL,
        exists: rootConfig.exists,
        validJson: rootConfig.validJson,
        hasServer: rootConfigReady,
        command: rootServer?.command || null,
        args: rootArgs,
        hasPerplexityKeyEnv: rootPerplexityReady
      },
      copilotMcpSettings: {
        path: COPILOT_MCP_SETTINGS_REL,
        exists: copilotConfig.exists,
        validJson: copilotConfig.validJson,
        hasServer: copilotConfigReady,
        command: copilotServer?.command || null,
        args: copilotArgs,
        hasPerplexityKeyEnv: copilotPerplexityReady
      },
      bankingHubFile: {
        path: BANKING_HUB_PATH_REL,
        exists: bankingHubExists
      }
    },
    recommendations,
    instructions: {
      ar: [
        "على جهاز Windows افتح Cursor > Settings > MCP.",
        "أضف إعداد server باسم bsm-banking-agents.",
        "استخدم command=node و args تشير إلى mcp-servers/banking-hub.js.",
        "أضف مفاتيح OPENAI_API_KEY و ANTHROPIC_API_KEY و GOOGLE_API_KEY و PERPLEXITY_KEY.",
        "احفظ الإعدادات ثم أعد تشغيل Cursor واختبر أداة route_banking_query."
      ],
      en: [
        "On Windows, open Cursor > Settings > MCP.",
        "Add a server entry named bsm-banking-agents.",
        "Use command=node and args pointing to mcp-servers/banking-hub.js.",
        "Provide OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, and PERPLEXITY_KEY.",
        "Save, restart Cursor, then test with route_banking_query."
      ]
    }
  };
};
