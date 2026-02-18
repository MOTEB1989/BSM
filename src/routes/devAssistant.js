import express from "express";
import {
  analyzeCode,
  generateTests,
  generateDocumentation,
  refactorCode,
  generateApiDocs,
  convertLanguage,
  detectSmells
} from "../controllers/devAssistantControl.js";

const router = express.Router();

/**
 * @route POST /api/dev-assistant/analyze
 * @desc Analyze code for quality, smells, and improvements
 * @body { code: string, language?: string, filePath?: string }
 */
router.post("/analyze", analyzeCode);

/**
 * @route POST /api/dev-assistant/generate-tests
 * @desc Generate unit tests for code (Jest, PyTest)
 * @body { code: string, language?: string, framework?: string, filePath?: string }
 */
router.post("/generate-tests", generateTests);

/**
 * @route POST /api/dev-assistant/generate-docs
 * @desc Generate JSDoc/Docstrings documentation
 * @body { code: string, language?: string, style?: string, filePath?: string }
 */
router.post("/generate-docs", generateDocumentation);

/**
 * @route POST /api/dev-assistant/refactor
 * @desc Refactor legacy code to modern standards
 * @body { code: string, language?: string, target?: string, filePath?: string }
 */
router.post("/refactor", refactorCode);

/**
 * @route POST /api/dev-assistant/generate-api-docs
 * @desc Generate API documentation (OpenAPI, Markdown)
 * @body { code: string, format?: string, filePath?: string }
 */
router.post("/generate-api-docs", generateApiDocs);

/**
 * @route POST /api/dev-assistant/convert
 * @desc Convert code between languages
 * @body { code: string, fromLang: string, toLang: string, filePath?: string }
 */
router.post("/convert", convertLanguage);

/**
 * @route POST /api/dev-assistant/detect-smells
 * @desc Detect code smells in code
 * @body { code: string, language?: string }
 */
router.post("/detect-smells", detectSmells);

export default router;
