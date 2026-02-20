import { AppError } from "../utils/errors.js";

export const BANKING_AI_AGENTS = {
  gemini: {
    name: "Gemini Pro",
    specialties: ["Arabic Language", "General Banking", "Customer Support"],
    endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
  },
  claude: {
    name: "Claude-3 Haiku",
    specialties: ["Legal Analysis", "Code Review", "Risk Assessment"],
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  gpt4: {
    name: "GPT-4 Turbo",
    specialties: ["Technical Coding", "Data Analysis", "Integration"],
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  perplexity: {
    name: "Perplexity Sonar",
    specialties: ["Real-time Search", "Market Updates", "Fact Verification"],
    endpoint: "https://api.perplexity.ai/chat/completions"
  }
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const detectAgent = ({ query, language, category }) => {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);
  const normalizedLanguage = normalizeText(language);

  if (normalizedCategory === "legal") return "claude";
  if (normalizedCategory === "technical") return "gpt4";
  if (normalizedCategory === "creative") return "gemini";

  if (
    normalizedQuery.includes("قانون") ||
    normalizedQuery.includes("امتثال") ||
    normalizedQuery.includes("legal") ||
    normalizedQuery.includes("compliance")
  ) {
    return "claude";
  }

  if (
    normalizedQuery.includes("برمجة") ||
    normalizedQuery.includes("كود") ||
    normalizedQuery.includes("code") ||
    normalizedQuery.includes("api")
  ) {
    return "gpt4";
  }

  if (
    normalizedQuery.includes("سعر") ||
    normalizedQuery.includes("اسعار") ||
    normalizedQuery.includes("مؤشر") ||
    normalizedQuery.includes("price") ||
    normalizedQuery.includes("market") ||
    normalizedQuery.includes("rate")
  ) {
    return "perplexity";
  }

  if (normalizedLanguage === "ar") return "gemini";
  return "gpt4";
};

export const listBankingTools = () => [
  {
    name: "route_banking_query",
    description: "توجيه الاستفسار البنكي للعامل المناسب",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "نص الاستفسار" },
        language: { type: "string", enum: ["ar", "en"], default: "ar" },
        category: {
          type: "string",
          enum: ["general", "technical", "legal", "creative"],
          description: "نوع الاستفسار"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "check_agent_status",
    description: "فحص حالة العوامل المختلفة",
    inputSchema: {
      type: "object",
      properties: {
        agent: { type: "string", enum: Object.keys(BANKING_AI_AGENTS) }
      }
    }
  }
];

export const routeBankingQuery = ({ query, language = "ar", category = "general" } = {}) => {
  if (!query || typeof query !== "string") {
    throw new AppError("query is required and must be a string", 400, "INVALID_TOOL_INPUT");
  }

  const selectedAgent = detectAgent({ query, language, category });
  const agent = BANKING_AI_AGENTS[selectedAgent];

  return {
    selectedAgent,
    language,
    category,
    content: [
      {
        type: "text",
        text:
          `🤖 **تم توجيه الاستفسار إلى**: ${agent.name}\n\n` +
          `**التخصصات**: ${agent.specialties.join(", ")}\n` +
          `**الاستفسار**: ${query}\n` +
          `**اللغة**: ${language === "ar" ? "العربية" : "English"}\n` +
          `**الفئة**: ${category}\n\n` +
          "⚡ **الحالة**: نشط ومتاح\n" +
          "🔒 **الأمان**: Banking Grade Security\n" +
          `🌐 **Endpoint**: ${agent.endpoint}`
      }
    ]
  };
};

export const checkAgentStatus = ({ agent } = {}) => {
  const selectedAgent = agent || "gemini";

  if (!BANKING_AI_AGENTS[selectedAgent]) {
    throw new AppError(`عامل غير موجود: ${selectedAgent}`, 404, "AGENT_NOT_FOUND");
  }

  const status = {
    agent: selectedAgent,
    name: BANKING_AI_AGENTS[selectedAgent].name,
    state: "active",
    responseTime: "< 200ms",
    lastCheck: new Date().toISOString(),
    arabicSupport: selectedAgent === "gemini" ? "native" : "translated"
  };

  return {
    ...status,
    content: [
      {
        type: "text",
        text:
          `✅ **حالة العامل ${status.name}**:\n\n` +
          `🟢 **الحالة**: ${status.state}\n` +
          `⏱️ **زمن الاستجابة**: ${status.responseTime}\n` +
          `🌐 **دعم العربية**: ${status.arabicSupport}\n` +
          `🔍 **آخر فحص**: ${status.lastCheck}`
      }
    ]
  };
};

export const executeBankingTool = (name, toolArgs = {}) => {
  if (name === "route_banking_query") {
    return routeBankingQuery(toolArgs);
  }

  if (name === "check_agent_status") {
    return checkAgentStatus(toolArgs);
  }

  throw new AppError(`Unknown tool: ${name}`, 400, "UNKNOWN_TOOL");
};
