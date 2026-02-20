import crypto from "crypto";
import { env } from "../config/env.js";

// Constant-time string comparison to prevent timing attacks
const timingSafeEqual = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const tokenFromBasicAuth = (headerValue) => {
  if (!headerValue) return null;
  const [scheme, encoded] = headerValue.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return null;
  return decoded.slice(separatorIndex + 1);
};

export const adminAuth = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (!token || !env.adminToken || !timingSafeEqual(token, env.adminToken)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.adminToken = token;
  next();
};

export const adminUiAuth = (req, res, next) => {
  if (!env.adminToken) {
    return res.status(500).send("Admin token not configured");
  }

  if (req.query?.token) {
    return res
      .status(401)
      .send("Unauthorized: token in query parameters is not allowed. Use x-admin-token header or HTTP Basic Auth.");
  }

  const token =
    req.headers["x-admin-token"] ||
    tokenFromBasicAuth(req.headers.authorization);

  if (!token || !timingSafeEqual(token, env.adminToken)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin", charset="UTF-8"');
    return res.status(401).send("Unauthorized");
  }

  req.adminToken = token;
  return next();
};

// Backward-compatible alias used by some legacy routes.
export const auth = adminAuth;
