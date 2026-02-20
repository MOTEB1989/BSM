import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Mobile mode middleware
 * Restricts certain operations when MOBILE_MODE=true
 * Chat endpoints are always allowed for mobile (iPhone PWA)
 */

// Endpoints that mobile clients CAN always access (chat is core mobile functionality)
const mobileAllowedPaths = [
  "/api/chat",
  "/api/chat/direct",
  "/api/chat/key-status",
  "/api/mobile"
];

const restrictedOperations = {
  // POST/PUT/DELETE to these endpoints are blocked in mobile mode
  "/api/agents/run": ["POST"],
  "/api/agents/start": ["POST"],
  "/api/agents/stop": ["POST"],
  "/api/admin": ["POST", "PUT", "DELETE", "PATCH"],
  "/api/emergency": ["POST"]
};

const isOperationRestricted = (path, method) => {
  for (const [restrictedPath, methods] of Object.entries(restrictedOperations)) {
    if (path.startsWith(restrictedPath) && methods.includes(method)) {
      return true;
    }
  }
  return false;
};

export const mobileModeMiddleware = (req, res, next) => {
  if (!env.mobileMode) {
    return next();
  }
  
  // Always allow chat endpoints for mobile (core PWA functionality)
  const isChatEndpoint = mobileAllowedPaths.some(p => req.path.startsWith(p));
  if (isChatEndpoint) {
    return next();
  }

  // In mobile mode, only allow safe read operations for other endpoints
  const isSafeOperation = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";

  if (!isSafeOperation && isOperationRestricted(req.path, req.method)) {
    logger.warn({
      method: req.method,
      path: req.path,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent")
    }, "MOBILE_MODE: Blocked restricted operation");
    
    return res.status(403).json({
      error: "Operation Not Allowed",
      message: "This operation is restricted in mobile mode. Use desktop client for write operations.",
      code: "MOBILE_MODE_RESTRICTION",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      hint: "Mobile devices are configured as read-only clients"
    });
  }
  
  next();
};

/**
 * Detect if request is from mobile device
 */
export const isMobileClient = (req) => {
  const userAgent = req.get("user-agent") || "";
  const mobilePatterns = [
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /Android/i,
    /Mobile/i,
    /webOS/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};
