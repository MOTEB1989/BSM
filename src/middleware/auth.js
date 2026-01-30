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

export const adminAuth = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (!token || !env.adminToken || !timingSafeEqual(token, env.adminToken)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
