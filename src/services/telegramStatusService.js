import { env } from "../config/env.js";

const BOOT_TIME_MS = Date.now();

function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function formatMemoryBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Build a real-time system status summary for Telegram admins.
 * Keeps output compact and avoids exposing sensitive runtime details.
 */
export function buildTelegramStatusMessage() {
  const uptimeSeconds = Math.floor((Date.now() - BOOT_TIME_MS) / 1000);
  const memory = process.memoryUsage();

  const runtimeStatus = {
    now: new Date().toISOString(),
    env: env.nodeEnv,
    uptime: formatUptime(uptimeSeconds),
    pid: process.pid,
    rss: formatMemoryBytes(memory.rss),
    heapUsed: formatMemoryBytes(memory.heapUsed),
    heapTotal: formatMemoryBytes(memory.heapTotal)
  };

  const featureFlags = {
    mobileMode: env.mobileMode ? "ON" : "OFF",
    lanOnly: env.lanOnly ? "ON" : "OFF",
    safeMode: env.safeMode ? "ON" : "OFF"
  };

  return [
    "✅ BSM Live Status",
    "",
    `Time: ${runtimeStatus.now}`,
    `Env: ${runtimeStatus.env}`,
    `Uptime: ${runtimeStatus.uptime}`,
    `PID: ${runtimeStatus.pid}`,
    "",
    "Memory:",
    `- RSS: ${runtimeStatus.rss}`,
    `- Heap: ${runtimeStatus.heapUsed} / ${runtimeStatus.heapTotal}`,
    "",
    "Flags:",
    `- Mobile Mode: ${featureFlags.mobileMode}`,
    `- LAN Only: ${featureFlags.lanOnly}`,
    `- Safe Mode: ${featureFlags.safeMode}`
  ].join("\n");
}

