import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { rm, readFile, access } from "node:fs/promises";
import path from "node:path";
import { auditLogger } from "../src/utils/auditLogger.js";

const LOG_DIR = path.join(process.cwd(), "logs");
const AUDIT_LOG = path.join(LOG_DIR, "audit.log");

afterEach(async () => {
  await rm(LOG_DIR, { recursive: true, force: true });
});

test("creates log directory before writing entries", async () => {
  await rm(LOG_DIR, { recursive: true, force: true });

  const entry = { event: "test_event", action: "write" };
  await auditLogger.write(entry);

  await access(AUDIT_LOG);
  const content = await readFile(AUDIT_LOG, "utf8");
  const [line] = content.trim().split("\n");
  const parsed = JSON.parse(line);

  assert.equal(parsed.event, entry.event);
  assert.equal(parsed.action, entry.action);
  assert.ok(parsed.timestamp, "timestamp should be present");
});
