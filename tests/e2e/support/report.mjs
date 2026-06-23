import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MAX_ERRORS, REPORT_RETENTION, TARGET_URL } from "./config.mjs";

export function makeRunId(date = new Date()) {
  return `${date.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
}

export function sanitizeText(value, limit = 1_000) {
  return String(value ?? "")
    .replace(/authorization\s*:\s*[^\s,;]+(?:\s+[^\s,;]+)?/gi, "Authorization: [REDACTED]")
    .replace(/\b(cookie|set-cookie)\s*=\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/\b(bearer|token|password|secret)\s*[=:]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, limit);
}

export function originOnly(value) {
  if (!value) return null;
  try {
    const origin = new URL(value).origin;
    return origin === "null" ? null : origin;
  } catch { return null; }
}

export function emptyObservations() {
  return {
    currentUrl: null,
    pageTitle: null,
    frameOrigins: [],
    documentRequestOrigins: [],
    directHarnessRequestCount: 0,
    unexpectedHarnessRequests: 0,
    whiskeyTab: null,
    popup: null,
    panel: null,
    visibleElements: []
  };
}

export function createReport({ runId = makeRunId(), startedAt = new Date().toISOString() } = {}) {
  return {
    schemaVersion: 1,
    runId,
    startedAt,
    finishedAt: startedAt,
    targetUrl: TARGET_URL,
    platform: process.platform,
    outcome: "blocked",
    lastSuccessfulStage: null,
    firstFailedStage: null,
    browser: null,
    extension: null,
    stages: [],
    observations: emptyObservations(),
    errors: [],
    cleanup: { browserClosed: false, profileRemoved: false, finishedAt: startedAt, message: "Cleanup not started." }
  };
}

export function addError(report, { source = "runner", stage = "prerequisites", message, url, urlOrigin } = {}) {
  if (report.errors.length >= MAX_ERRORS) return;
  report.errors.push({
    source,
    stage,
    message: sanitizeText(message),
    urlOrigin: urlOrigin ?? originOnly(url)
  });
}

export async function writeReport(report, root) {
  const directory = join(root, report.runId);
  await mkdir(directory, { recursive: true });
  const destination = join(directory, "report.json");
  const temporary = join(directory, ".report.json.tmp");
  await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, destination);
  return destination;
}

export async function pruneReports(root, keep = REPORT_RETENTION) {
  await mkdir(root, { recursive: true });
  const entries = await readdir(root, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();
  await Promise.all(directories.slice(keep).map((name) => rm(join(root, name), { recursive: true, force: true })));
}

export async function readReport(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
