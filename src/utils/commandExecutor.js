import { execSync } from "child_process";
import logger from "./logger.js";

/**
 * Safe command executor for agent terminal operations.
 * Executes commands automatically without user confirmation,
 * restricted to an allowlist of safe base commands.
 */

// Allowed base commands the agent can execute
const ALLOWED_COMMANDS = new Set([
  "npm",
  "node",
  "git",
  "ls",
  "cat",
  "echo",
  "pwd",
  "whoami",
  "date",
  "uptime",
  "df",
  "du",
  "head",
  "tail",
  "wc",
  "grep",
  "find",
  "curl",
  "ping",
  "docker",
  "pm2",
  "npx",
  "which",
  "env",
  "printenv",
  "mkdir",
  "cp",
  "mv",
  "touch",
  "chmod",
  "tar",
  "zip",
  "unzip"
]);

// Blocked patterns that should never be executed regardless of base command
const BLOCKED_PATTERNS = [
  /rm\s+(-rf|-fr|--recursive)\s*\//i,   // rm -rf /
  /rm\s+(-rf|-fr|--recursive)\s+~/i,    // rm -rf ~
  /:\s*\(\)\s*\{\s*:\s*\|/,             // fork bomb
  /mkfs\./i,                             // format filesystem
  /dd\s+if=/i,                           // disk overwrite
  />\s*\/dev\/sd/i,                      // write to disk device
  /shutdown/i,
  /reboot/i,
  /init\s+[06]/i,
  /rm\s+-rf\s+\.\s*$/i,                 // rm -rf .
];

const COMMAND_TIMEOUT_MS = 30000; // 30 seconds
const MAX_OUTPUT_LENGTH = 10000; // 10KB max output

/**
 * Extract the base command from a full command string
 * @param {string} command - Full command string
 * @returns {string} Base command name
 */
function extractBaseCommand(command) {
  const trimmed = command.trim();
  // Handle env vars prefix like KEY=val cmd
  const withoutEnvVars = trimmed.replace(/^(\w+=\S+\s+)+/, "");
  const parts = withoutEnvVars.split(/\s+/);
  return parts[0] || "";
}

/**
 * Validate a command against the allowlist and blocked patterns
 * @param {string} command - Command to validate
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateCommand(command) {
  if (!command || typeof command !== "string" || !command.trim()) {
    return { valid: false, reason: "الأمر فارغ" };
  }

  // Check blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { valid: false, reason: `الأمر محظور لأسباب أمنية: ${command}` };
    }
  }

  // Handle piped commands - validate each part
  const pipeParts = command.split(/\s*\|\s*/);
  for (const part of pipeParts) {
    const baseCmd = extractBaseCommand(part);
    if (!ALLOWED_COMMANDS.has(baseCmd)) {
      return { valid: false, reason: `الأمر غير مسموح: ${baseCmd}` };
    }
  }

  // Handle chained commands (&&, ;)
  const chainParts = command.split(/\s*(?:&&|;)\s*/);
  for (const part of chainParts) {
    const subPipes = part.split(/\s*\|\s*/);
    for (const subPart of subPipes) {
      const baseCmd = extractBaseCommand(subPart);
      if (!ALLOWED_COMMANDS.has(baseCmd)) {
        return { valid: false, reason: `الأمر غير مسموح: ${baseCmd}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Execute a terminal command safely
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @param {string} options.cwd - Working directory
 * @param {number} options.timeout - Timeout in ms
 * @returns {{ success: boolean, output: string, command: string, duration: number }}
 */
export function executeCommand(command, options = {}) {
  const validation = validateCommand(command);

  if (!validation.valid) {
    logger.warn({ command, reason: validation.reason }, "Command rejected");
    return {
      success: false,
      output: validation.reason,
      command,
      duration: 0
    };
  }

  const timeout = options.timeout || COMMAND_TIMEOUT_MS;
  const cwd = options.cwd || process.cwd();
  const startTime = Date.now();

  logger.info({ command, cwd }, "Auto-executing terminal command");

  try {
    const result = execSync(command, {
      cwd,
      timeout,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024, // 1MB buffer
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" }
    });

    const duration = Date.now() - startTime;
    const output = result.length > MAX_OUTPUT_LENGTH
      ? result.slice(0, MAX_OUTPUT_LENGTH) + "\n... (تم اقتطاع المخرجات)"
      : result;

    logger.info({ command, duration, outputLength: result.length }, "Command executed successfully");

    return {
      success: true,
      output: output || "(لا يوجد مخرجات)",
      command,
      duration
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const stderr = err.stderr ? err.stderr.toString() : "";
    const stdout = err.stdout ? err.stdout.toString() : "";
    const output = stderr || stdout || err.message;

    logger.warn({ command, duration, exitCode: err.status, error: output }, "Command execution failed");

    return {
      success: false,
      output: output.length > MAX_OUTPUT_LENGTH
        ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n... (تم اقتطاع المخرجات)"
        : output,
      command,
      duration,
      exitCode: err.status
    };
  }
}

/**
 * Parse command blocks from GPT response text
 * Format: [EXECUTE_COMMAND]command here[/EXECUTE_COMMAND]
 * @param {string} text - GPT response text
 * @returns {string[]} Array of commands to execute
 */
export function parseCommandBlocks(text) {
  if (!text || typeof text !== "string") return [];

  const commands = [];
  const regex = /\[EXECUTE_COMMAND\]([\s\S]*?)\[\/EXECUTE_COMMAND\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const cmd = match[1].trim();
    if (cmd) {
      commands.push(cmd);
    }
  }

  return commands;
}

/**
 * Execute multiple commands sequentially and collect results
 * @param {string[]} commands - Array of commands
 * @param {Object} options - Execution options
 * @returns {Array<{ success: boolean, output: string, command: string, duration: number }>}
 */
export function executeCommands(commands, options = {}) {
  return commands.map(cmd => executeCommand(cmd, options));
}
