import assert from "node:assert/strict";
import test from "node:test";
import { CLEANUP_RESERVE_MS, StageTracker, TimeoutError, WORK_DEADLINE_MS, withDeadline } from "./stages.mjs";

test("stages advance in declared order and track success/failure", () => {
  const tracker = new StageTracker();
  tracker.start("prerequisites", 100);
  tracker.pass("ready");
  tracker.start("build-identity", 100);
  tracker.fail("bad build", "failed");
  assert.equal(tracker.lastSuccessfulStage, "prerequisites");
  assert.equal(tracker.firstFailedStage, "build-identity");
  assert.throws(() => tracker.start("live-page", 100), /after a terminal failure/);
});

test("out-of-order stages are rejected", () => {
  const tracker = new StageTracker();
  assert.throws(() => tracker.start("live-page", 100), /out of order/);
});

test("deadline racing identifies the active stage", async () => {
  await assert.rejects(
    withDeadline("browser-launch", 5, new Promise((resolve) => setTimeout(resolve, 30))),
    (error) => error instanceof TimeoutError && error.stage === "browser-launch"
  );
});

test("global work and cleanup budgets total two minutes", () => {
  assert.equal(WORK_DEADLINE_MS, 115_000);
  assert.equal(CLEANUP_RESERVE_MS, 5_000);
  assert.equal(WORK_DEADLINE_MS + CLEANUP_RESERVE_MS, 120_000);
});
