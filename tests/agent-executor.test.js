import test from "node:test";
import assert from "node:assert/strict";

import { isCommandAllowed } from "../src/routes/agent-executor.js";

test("isCommandAllowed accepts allowlisted command", () => {
  assert.equal(isCommandAllowed("npm install"), true);
  assert.equal(isCommandAllowed("git status"), true);
});

test("isCommandAllowed rejects forbidden or unknown commands", () => {
  assert.equal(isCommandAllowed("sudo npm i"), false);
  assert.equal(isCommandAllowed("rm -rf /"), false);
  assert.equal(isCommandAllowed("bash -lc 'echo hi'"), false);
  assert.equal(isCommandAllowed("chmod 777 file.txt"), false);
});
