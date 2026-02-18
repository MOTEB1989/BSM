import { devAssistantAgent } from "../agents/DevAssistantAgent.js";
import logger from "../utils/logger.js";

/**
 * Analyze code for quality, smells, and improvements
 */
export const analyzeCode = async (req, res, next) => {
  try {
    const { code, language = "javascript", filePath } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ language, filePath }, "Code analysis requested");

    const result = await devAssistantAgent.analyzeCode({
      code,
      language,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "Code analysis failed");
    next(error);
  }
};

/**
 * Generate unit tests for code
 */
export const generateTests = async (req, res, next) => {
  try {
    const { code, language = "javascript", framework = "jest", filePath } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ language, framework, filePath }, "Test generation requested");

    const result = await devAssistantAgent.generateTests({
      code,
      language,
      framework,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "Test generation failed");
    next(error);
  }
};

/**
 * Generate documentation for code
 */
export const generateDocumentation = async (req, res, next) => {
  try {
    const { code, language = "javascript", style = "jsdoc", filePath } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ language, style, filePath }, "Documentation generation requested");

    const result = await devAssistantAgent.generateDocumentation({
      code,
      language,
      style,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "Documentation generation failed");
    next(error);
  }
};

/**
 * Refactor code to modern standards
 */
export const refactorCode = async (req, res, next) => {
  try {
    const { code, language = "javascript", target = "modern", filePath } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ language, target, filePath }, "Code refactoring requested");

    const result = await devAssistantAgent.refactorCode({
      code,
      language,
      target,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "Code refactoring failed");
    next(error);
  }
};

/**
 * Generate API documentation
 */
export const generateApiDocs = async (req, res, next) => {
  try {
    const { code, format = "openapi", filePath } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ format, filePath }, "API documentation generation requested");

    const result = await devAssistantAgent.generateApiDocs({
      code,
      format,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "API documentation generation failed");
    next(error);
  }
};

/**
 * Convert code between languages
 */
export const convertLanguage = async (req, res, next) => {
  try {
    const { code, fromLang, toLang, filePath } = req.body;

    if (!code || !fromLang || !toLang) {
      return res.status(400).json({
        error: "Missing required fields: code, fromLang, toLang"
      });
    }

    logger.info({ fromLang, toLang, filePath }, "Code conversion requested");

    const result = await devAssistantAgent.convertLanguage({
      code,
      fromLang,
      toLang,
      filePath
    });

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "Code conversion failed");
    next(error);
  }
};

/**
 * Detect code smells
 */
export const detectSmells = async (req, res, next) => {
  try {
    const { code, language = "javascript" } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Missing required field: code"
      });
    }

    logger.info({ language }, "Code smell detection requested");

    const smells = devAssistantAgent.detectCodeSmells(code, language);

    res.json({
      agentId: devAssistantAgent.id,
      language,
      smellsCount: smells.length,
      smells,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, "Code smell detection failed");
    next(error);
  }
};
