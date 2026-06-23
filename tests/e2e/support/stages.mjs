import { CLEANUP_RESERVE_MS, STAGE_DEADLINES, WORK_DEADLINE_MS } from "./config.mjs";

export { CLEANUP_RESERVE_MS, WORK_DEADLINE_MS };

export const STAGE_NAMES = Object.freeze(Object.keys(STAGE_DEADLINES));

export class TimeoutError extends Error {
  constructor(stage, deadlineMs) {
    super(`${stage} exceeded its ${deadlineMs}ms deadline`);
    this.name = "TimeoutError";
    this.stage = stage;
    this.deadlineMs = deadlineMs;
  }
}

export async function withDeadline(stage, deadlineMs, operation) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(stage, deadlineMs)), deadlineMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class StageTracker {
  constructor(now = () => new Date().toISOString()) {
    this.now = now;
    this.stages = [];
    this.current = null;
    this.lastSuccessfulStage = null;
    this.firstFailedStage = null;
    this.terminalFailure = false;
  }

  start(name, deadlineMs = STAGE_DEADLINES[name]) {
    if (!STAGE_NAMES.includes(name)) throw new Error(`Unknown stage: ${name}`);
    if (this.current) throw new Error(`Stage ${this.current.name} is still running`);
    if (this.terminalFailure && name !== "cleanup") throw new Error("Cannot start work after a terminal failure");
    const expectedIndex = this.stages.length
      ? STAGE_NAMES.indexOf(this.stages.at(-1).name) + 1
      : 0;
    const requestedIndex = STAGE_NAMES.indexOf(name);
    if (name !== "cleanup" && requestedIndex !== expectedIndex) throw new Error(`Stage ${name} is out of order`);
    if (name === "cleanup" && requestedIndex < expectedIndex) throw new Error("Cleanup stage already passed");
    for (let index = expectedIndex; index < requestedIndex; index += 1) {
      this.stages.push({ name: STAGE_NAMES[index], status: "skipped", startedAt: null, finishedAt: null, deadlineMs: STAGE_DEADLINES[STAGE_NAMES[index]], summary: "Skipped after earlier termination." });
    }
    this.current = { name, status: "running", startedAt: this.now(), finishedAt: null, deadlineMs, summary: "" };
    this.stages.push(this.current);
    return this.current;
  }

  pass(summary = "Passed") {
    if (!this.current) throw new Error("No running stage");
    this.current.status = "passed";
    this.current.finishedAt = this.now();
    this.current.summary = String(summary).slice(0, 500);
    if (this.current.name !== "cleanup" || !this.firstFailedStage) this.lastSuccessfulStage = this.current.name;
    this.current = null;
  }

  fail(summary, status = "failed") {
    if (!this.current) throw new Error("No running stage");
    if (!new Set(["failed", "blocked"]).has(status)) throw new Error(`Invalid failure status: ${status}`);
    this.current.status = status;
    this.current.finishedAt = this.now();
    this.current.summary = String(summary).slice(0, 500);
    this.firstFailedStage ??= this.current.name;
    this.terminalFailure = true;
    this.current = null;
  }

  finalizeRunning(summary = "Interrupted") {
    if (this.current) this.fail(summary, "failed");
  }
}
