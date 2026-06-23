import assert from "node:assert/strict";
import test from "node:test";
import { MAX_VISIBLE_ELEMENTS, TARGET_URL } from "./config.mjs";
import { boundedVisibleElements, recordDirectHarnessRequest } from "./diagnostics.mjs";
import { FAILURE_SCENARIOS } from "./failure-fixtures.mjs";
import { BlockedError, exitCodeFor } from "./prerequisites.mjs";
import { addError, createReport } from "./report.mjs";
import { TimeoutError } from "./stages.mjs";

test("all required diagnostic failure classes are seeded", () => {
  assert.deepEqual(FAILURE_SCENARIOS.map((scenario) => scenario.classification), [
    "browser-launch", "extension-install", "network-page", "tab-selection",
    "action-popup", "injection-messaging", "scanner", "assertion"
  ]);
  assert.ok(FAILURE_SCENARIOS.every((scenario) => scenario.stage && scenario.discriminator));
});

test("blocked, failed, timeout, and interrupted exits are distinct", () => {
  assert.equal(exitCodeFor(new BlockedError("missing browser")), 2);
  assert.equal(exitCodeFor(new TimeoutError("live-page", 10)), 124);
  assert.equal(exitCodeFor(new Error("product failure")), 1);
  assert.equal(exitCodeFor(new Error("interrupt"), 130), 130);
});

test("direct request provenance rejects non-restaurant destinations", () => {
  const report = createReport();
  recordDirectHarnessRequest(report, TARGET_URL);
  recordDirectHarnessRequest(report, "https://analytics.example/upload");
  assert.equal(report.observations.directHarnessRequestCount, 2);
  assert.equal(report.observations.unexpectedHarnessRequests, 1);
});

test("errors and visible evidence remain bounded and sanitized", () => {
  const report = createReport();
  for (let index = 0; index < 30; index += 1) addError(report, { message: `token=private-${index}`, stage: "live-page" });
  assert.equal(report.errors.length, 20);
  assert.doesNotMatch(report.errors[0].message, /private/);
  assert.equal(boundedVisibleElements(Array.from({ length: 80 }, (_, index) => ({ tag: "a", role: null, accessibleName: `item ${index}`, state: {} }))).length, MAX_VISIBLE_ELEMENTS);
});
