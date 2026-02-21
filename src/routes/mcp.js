import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, success } from "../utils/httpResponses.js";
import {
  BANKING_AI_AGENTS,
  executeBankingTool,
  listBankingTools
} from "../services/bankingMcpService.js";
import { getMcpConnectionStatus } from "../services/mcpConnectionService.js";

const router = Router();

/**
 * GET /api/mcp/tools
 * Returns MCP-like tool metadata available for mobile/web UI usage.
 */
router.get("/tools", asyncHandler(async (req, res) => {
  const tools = listBankingTools();
  success(
    res,
    {
      server: {
        name: "BSM-Banking-Agents",
        version: "1.0.0",
        description: "Banking MCP tools exposed over HTTP for mobile and web clients"
      },
      tools,
      agents: Object.keys(BANKING_AI_AGENTS)
    },
    req.correlationId
  );
}));

/**
 * POST /api/mcp/tools/call
 * Execute a supported MCP tool from HTTP clients (e.g. iPhone dashboard).
 * Body: { name: string, arguments?: object }
 */
router.post("/tools/call", asyncHandler(async (req, res) => {
  const { name, arguments: toolArgs = {} } = req.body || {};
  if (!name || typeof name !== "string") {
    return badRequest(res, "Tool name is required", req.correlationId);
  }

  const result = executeBankingTool(name, toolArgs);
  success(
    res,
    {
      ok: true,
      tool: name,
      result,
      timestamp: new Date().toISOString()
    },
    req.correlationId
  );
}));

/**
 * GET /api/mcp/connection-status
 * Returns readiness status for Cursor Windows MCP wiring.
 */
router.get("/connection-status", asyncHandler(async (req, res) => {
  const status = await getMcpConnectionStatus();
  success(res, status, req.correlationId);
}));

export default router;
