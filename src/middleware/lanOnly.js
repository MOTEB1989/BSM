import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * LAN-only enforcement middleware
 * Restricts access to local network addresses only when LAN_ONLY=true
 */

const isLanAddress = (ip) => {
  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, "");
  
  // Localhost/loopback
  if (cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp === "localhost") {
    return true;
  }
  
  // Private IPv4 ranges
  const ipParts = cleanIp.split(".");
  if (ipParts.length === 4) {
    const first = parseInt(ipParts[0], 10);
    const second = parseInt(ipParts[1], 10);
    
    // 10.0.0.0/8
    if (first === 10) return true;
    
    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) return true;
    
    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;
    
    // Link-local 169.254.0.0/16
    if (first === 169 && second === 254) return true;
  }
  
  // Private IPv6 ranges
  if (cleanIp.startsWith("fd") || cleanIp.startsWith("fc")) {
    return true; // Unique Local Addresses (ULA)
  }
  
  if (cleanIp.startsWith("fe80")) {
    return true; // Link-local
  }
  
  return false;
};

export const lanOnlyMiddleware = (req, res, next) => {
  if (!env.lanOnly) {
    return next();
  }
  
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (!clientIp || !isLanAddress(clientIp)) {
    logger.warn({
      clientIp,
      path: req.path,
      correlationId: req.correlationId
    }, "LAN_ONLY: Blocked non-LAN request");
    
    return res.status(403).json({
      error: "Access Denied",
      message: "This service is only available on the local network",
      code: "LAN_ONLY_VIOLATION"
    });
  }
  
  next();
};
