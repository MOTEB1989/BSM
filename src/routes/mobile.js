/**
 * Mobile & Remote Control API
 * واجهة الجوال والتحكم عن بُعد
 * Lightweight endpoints for iPhone PWA and remote control
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildChatProviders } from "../utils/providerUtils.js";
import { models } from "../config/models.js";

const router = Router();

/**
 * GET /api/mobile/status
 * Minimal status for mobile/remote clients (iPhone, PWA)
 */
router.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const providers = buildChatProviders(models);
    const anyAvailable = providers.length > 0;

    res.json({
      platform: "LexBANK",
      status: anyAvailable ? "ready" : "degraded",
      chat: anyAvailable,
      timestamp: new Date().toISOString(),
      endpoints: {
        chat: "/api/chat",
        direct: "/api/chat/direct",
        keyStatus: "/api/chat/key-status",
      },
      mobile: {
        pwa: true,
        rtl: true,
        languages: ["ar", "en"],
      },
    });
  })
);

/**
 * GET /api/mobile/connect
 * Connection check for remote control (iPhone → Backend)
 */
router.get(
  "/connect",
  asyncHandler(async (req, res) => {
    const ua = req.get("user-agent") || "";
    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);

    res.json({
      connected: true,
      client: isMobile ? "mobile" : "desktop",
      platform: "LexBANK",
      message: "متصل | Connected",
    });
  })
);

export default router;
