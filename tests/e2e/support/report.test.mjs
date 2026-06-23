import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { addError, createReport, pruneReports, sanitizeText, writeReport } from "./report.mjs";

test("report shape is complete and sensitive text is redacted", () => {
  const report = createReport({ runId: "run-1", startedAt: "2026-06-21T00:00:00.000Z" });
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.targetUrl, "https://thewestsideblono.com/drink/drink-menu/");
  assert.deepEqual(report.errors, []);
  assert.equal(report.observations.unexpectedHarnessRequests, 0);
  assert.doesNotMatch(sanitizeText("Authorization: Bearer secret cookie=session"), /secret|session/);
});

test("errors are bounded and URLs retain origins only", () => {
  const report = createReport({ runId: "run-2" });
  for (let index = 0; index < 30; index += 1) {
    addError(report, { source: "network", stage: "live-page", message: `failure ${index}`, url: "https://example.com/private?q=secret" });
  }
  assert.equal(report.errors.length, 20);
  assert.equal(report.errors[0].urlOrigin, "https://example.com");
});

test("reports are written atomically and retention keeps newest ten", async () => {
  const root = await mkdtemp(join(tmpdir(), "wew-report-test-"));
  try {
    for (let index = 0; index < 12; index += 1) {
      const report = createReport({ runId: `20260621-${String(index).padStart(2, "0")}` });
      await writeReport(report, root);
    }
    await pruneReports(root, 10);
    const entries = (await readdir(root)).sort();
    assert.equal(entries.length, 10);
    const persisted = JSON.parse(await readFile(join(root, entries.at(-1), "report.json"), "utf8"));
    assert.equal(persisted.schemaVersion, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
