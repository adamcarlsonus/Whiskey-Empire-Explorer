import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { assertManifestEquality, createCleanup } from "./browser.mjs";
import { createReport, makeRunId } from "./report.mjs";

test("cleanup closes and removes exactly once", async () => {
  const profile = await mkdtemp(join(tmpdir(), "wew-cleanup-test-"));
  let closes = 0;
  const cleanup = createCleanup({ close: async () => { closes += 1; } }, profile);
  const first = await cleanup();
  const second = await cleanup();
  assert.equal(closes, 1);
  assert.deepEqual(second, first);
  await assert.rejects(access(profile));
});

test("run identifiers are distinct and profile paths are not reported", () => {
  const one = makeRunId();
  const two = makeRunId();
  assert.notEqual(one, two);
  const serialized = JSON.stringify(createReport({ runId: one }));
  assert.doesNotMatch(serialized, /whiskey-empire-west-e2e-|\/private\/tmp/);
});

test("manifest equality includes permissions and host permissions", () => {
  const source = { name: "Extension", version: "1.0.0", manifest_version: 3, permissions: ["activeTab", "scripting"] };
  assert.doesNotThrow(() => assertManifestEquality(source, structuredClone(source)));
  assert.throws(() => assertManifestEquality(source, { ...source, permissions: ["activeTab", "tabs"] }));
  assert.throws(() => assertManifestEquality(source, { ...source, host_permissions: ["<all_urls>"] }));
});
