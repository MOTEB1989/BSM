import { Router } from "express";
import { exec as rawExec } from "child_process";
import { promisify } from "util";
import path from "path";
import { env } from "../config/env.js";

const exec = promisify(rawExec);
const router = Router();

// Allowed commands (safety whitelist) - intentionally narrow.
const ALLOWED_COMMANDS = new Set([
  "npm", "node", "git", "ls", "cat", "mkdir",
  "touch", "rm", "cp", "mv", "echo", "curl",
  "python3", "pip3", "npx"
]);

const FORBIDDEN_PATTERN = /(\bsudo\b|rm\s+-rf\s+\/?\s*$|\bchmod\b|\bchown\b|\bkill\b|>|>>)/i;

function resolveCwd(cwd = ".") {
  const requested = path.resolve(process.cwd(), cwd);
  if (!requested.startsWith(process.cwd())) {
    throw new Error("Invalid cwd path");
  }
  return requested;
}

export function isCommandAllowed(command = "") {
  if (typeof command !== "string" || !command.trim()) return false;
  if (FORBIDDEN_PATTERN.test(command)) return false;

  // Validate only the leading executable to keep behavior predictable.
  const baseCommand = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.has(baseCommand);
}

function isAdminTokenValid(adminToken) {
  return Boolean(adminToken) && adminToken === env.adminToken && adminToken.length >= 16;
}

// Execute terminal command
router.post("/execute", async (req, res) => {
  try {
    const { command, cwd = "." } = req.body ?? {};
    const adminToken = req.headers["x-admin-token"];

    if (!isAdminTokenValid(adminToken)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isCommandAllowed(command)) {
      return res.status(403).json({
        error: "Command not allowed",
        allowed: Array.from(ALLOWED_COMMANDS)
      });
    }

    const resolvedCwd = resolveCwd(cwd);
    console.log(`🤖 Agent executing: ${command} (cwd=${resolvedCwd})`);

    const { stdout, stderr } = await exec(command, {
      cwd: resolvedCwd,
      timeout: 30_000,
      maxBuffer: 1024 * 1024
    });

    return res.json({
      success: true,
      command,
      stdout,
      stderr,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stderr: error.stderr
    });
  }
});

// Get system status
router.get("/status", async (_req, res) => {
  try {
    const { stdout: nodeVersion } = await exec("node --version");
    const { stdout: npmVersion } = await exec("npm --version");
    const { stdout: gitStatus } = await exec("git status --short").catch(() => ({ stdout: "Clean" }));
    const { stdout: diskSpace } = await exec("df -h .");

    return res.json({
      system: {
        node: nodeVersion.trim(),
        npm: npmVersion.trim(),
        platform: process.platform
      },
      git: gitStatus.trim() || "No changes",
      disk: diskSpace.split("\n")[1],
      uptime: process.uptime()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
