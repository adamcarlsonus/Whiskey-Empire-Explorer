import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { resolve } from "node:path";
import { createReport } from "./report.mjs";

const schema = JSON.parse(await readFile(resolve("specs/002-live-extension-e2e/contracts/diagnostic-report.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(schema);

function identities(report) {
  report.browser = { provider: "playwright", browserName: "chromium", version: "149", headless: false, profileId: "profile-1" };
  report.extension = { id: "abcdefghijklmnopabcdefghijklmnop", name: "Whiskey Empire West", version: "0.1.0", manifestVersion: 3, permissions: ["activeTab", "scripting"], hostPermissions: [], buildDigest: "a".repeat(64) };
}

function cleanup(report, passed = true) {
  report.cleanup = { browserClosed: passed, profileRemoved: passed, finishedAt: report.finishedAt, message: passed ? "Clean" : "Failed" };
}

test("successful report requires identities, positive panel evidence, no unexpected requests, and cleanup", () => {
  const report = createReport({ runId: "pass" });
  report.outcome = "passed";
  report.lastSuccessfulStage = "cleanup";
  identities(report);
  report.stages = [{ name: "cleanup", status: "passed", startedAt: report.startedAt, finishedAt: report.finishedAt, deadlineMs: 5_000, summary: "Clean" }];
  report.observations.panel = { present: true, finalStatus: "Scan complete: 100 entries.", resultCount: 100, searchQueryLength: 4, filteredCount: 6, selectedSort: "price-desc", ariaSort: "descending" };
  cleanup(report);
  assert.equal(validate(report), true, JSON.stringify(validate.errors));
  report.observations.panel.resultCount = 0;
  assert.equal(validate(report), false);
});

test("failed and blocked reports require a first failed stage", () => {
  for (const outcome of ["failed", "blocked"]) {
    const report = createReport({ runId: outcome });
    report.outcome = outcome;
    report.firstFailedStage = "prerequisites";
    report.stages = [{ name: "prerequisites", status: outcome === "blocked" ? "blocked" : "failed", startedAt: report.startedAt, finishedAt: report.finishedAt, deadlineMs: 1_000, summary: outcome }];
    cleanup(report);
    assert.equal(validate(report), true, JSON.stringify(validate.errors));
    report.firstFailedStage = null;
    assert.equal(validate(report), false);
  }
});

test("malformed report fields are rejected", () => {
  const report = createReport({ runId: "bad" });
  report.outcome = "failed";
  report.firstFailedStage = "live-page";
  report.stages = [{ name: "not-a-stage", status: "failed", startedAt: null, finishedAt: null, deadlineMs: 1, summary: "bad" }];
  cleanup(report);
  assert.equal(validate(report), false);
});
