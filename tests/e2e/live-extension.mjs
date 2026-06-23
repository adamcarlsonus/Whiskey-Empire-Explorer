import { launchIsolatedBrowser, readProductionIdentity, verifyInstalledExtension } from "./support/browser.mjs";
import { CLEANUP_RESERVE_MS, REPORT_ROOT, STAGE_DEADLINES, TARGET_URL, WORK_DEADLINE_MS } from "./support/config.mjs";
import { attachDiagnostics, collectVisibleElements, recordDirectHarnessRequest, recordFrames } from "./support/diagnostics.mjs";
import { activateActionPopup, assertSearch, assertSort, observeSuccessfulPanel, openLivePage, selectWhiskeyTab, startProductionScan } from "./support/live-flow.mjs";
import { seededFailure, throwIfSeeded } from "./support/failure-fixtures.mjs";
import { checkPrerequisites, exitCodeFor } from "./support/prerequisites.mjs";
import { addError, createReport, pruneReports, writeReport } from "./support/report.mjs";
import { StageTracker, withDeadline } from "./support/stages.mjs";

const report = createReport();
const tracker = new StageTracker();
const failureSeed = seededFailure();
let browserSession;
let page;
let popup;
let panel;
let extensionIdentity;
let reportPath;
let exitCode = 1;
let forcedExitCode = null;

function syncReport() {
  report.stages = tracker.stages.map((stage) => ({ ...stage }));
  report.lastSuccessfulStage = tracker.lastSuccessfulStage;
  report.firstFailedStage = tracker.firstFailedStage;
  report.finishedAt = new Date().toISOString();
}

async function persist() {
  syncReport();
  reportPath = await writeReport(report, REPORT_ROOT);
}

async function stage(name, operation) {
  tracker.start(name, STAGE_DEADLINES[name]);
  try {
    throwIfSeeded(failureSeed, name);
    const result = await withDeadline(name, STAGE_DEADLINES[name], operation());
    tracker.pass("Passed");
    await persist();
    return result;
  } catch (error) {
    tracker.fail(error instanceof Error ? error.message : String(error), error?.blocked || error?.exitCode === 2 ? "blocked" : "failed");
    throw error;
  }
}

async function scenario() {
  await stage("prerequisites", async () => {
    await checkPrerequisites({ recordRequest: (url) => recordDirectHarnessRequest(report, url) });
  });

  const expected = await stage("build-identity", () => readProductionIdentity());
  browserSession = await stage("browser-launch", () => launchIsolatedBrowser({ headless: false }));
  report.browser = browserSession.browserIdentity;
  attachDiagnostics(browserSession.context, report, () => tracker.current?.name ?? tracker.lastSuccessfulStage ?? "browser-launch");

  extensionIdentity = await stage("extension-availability", () => verifyInstalledExtension(browserSession.context, expected));
  report.extension = extensionIdentity;

  page = await stage("live-page", async () => {
    recordDirectHarnessRequest(report, TARGET_URL);
    const livePage = await openLivePage(browserSession.context);
    report.observations.currentUrl = livePage.url();
    report.observations.pageTitle = await livePage.title();
    recordFrames(report, livePage);
    return livePage;
  });

  report.observations.whiskeyTab = await stage("whiskey-tab", () => selectWhiskeyTab(page));
  popup = await stage("action-popup", () => activateActionPopup(browserSession.context, page, extensionIdentity.id));
  report.observations.popup = await stage("scan-start", () => startProductionScan(popup));

  const completed = await stage("scan-completion", () => observeSuccessfulPanel(page));
  if (completed.resultCount !== report.observations.whiskeyTab.advertisedTotal) {
    throw new Error(`Scan collected ${completed.resultCount} of ${report.observations.whiskeyTab.advertisedTotal} advertised entries`);
  }
  panel = completed.host;
  report.observations.panel = {
    present: true,
    finalStatus: completed.status,
    resultCount: completed.resultCount,
    searchQueryLength: null,
    filteredCount: null,
    selectedSort: null,
    ariaSort: null
  };

  const search = await stage("search-assertion", () => assertSearch(panel));
  report.observations.panel.searchQueryLength = search.queryLength;
  report.observations.panel.filteredCount = search.filteredCount;

  const sort = await stage("sort-assertion", () => assertSort(panel));
  report.observations.panel.selectedSort = sort.selectedSort;
  report.observations.panel.ariaSort = sort.ariaSort;
}

async function cleanup() {
  if (tracker.current) tracker.finalizeRunning("Interrupted before cleanup");
  if (!tracker.stages.some((item) => item.name === "cleanup")) tracker.start("cleanup", CLEANUP_RESERVE_MS);
  try {
    report.cleanup = browserSession
      ? await withDeadline("cleanup", CLEANUP_RESERVE_MS, browserSession.cleanup())
      : { browserClosed: true, profileRemoved: true, finishedAt: new Date().toISOString(), message: "No browser profile was created." };
    tracker.pass(report.cleanup.message);
  } catch (error) {
    report.cleanup = { browserClosed: false, profileRemoved: false, finishedAt: new Date().toISOString(), message: error instanceof Error ? error.message : String(error) };
    tracker.fail(report.cleanup.message, "failed");
    exitCode = 1;
  }
}

function interrupt() {
  forcedExitCode = 130;
  void browserSession?.cleanup();
}
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

try {
  await withDeadline("global-work", WORK_DEADLINE_MS, scenario());
  exitCode = 0;
} catch (error) {
  if (page) {
    recordFrames(report, page);
    await collectVisibleElements(report, page).catch(() => {});
  }
  const stageName = tracker.firstFailedStage ?? tracker.current?.name ?? "prerequisites";
  addError(report, { source: "runner", stage: stageName, message: error instanceof Error ? error.message : String(error), url: page?.url() });
  exitCode = exitCodeFor(error, forcedExitCode);
} finally {
  await cleanup();
  report.outcome = exitCode === 0 && report.cleanup.browserClosed && report.cleanup.profileRemoved ? "passed" : exitCode === 2 ? "blocked" : "failed";
  await persist();
  await pruneReports(REPORT_ROOT);
  console.log(`[live-e2e] ${report.outcome.toUpperCase()} report=${reportPath} last=${report.lastSuccessfulStage ?? "none"} failed=${report.firstFailedStage ?? "none"}`);
}

process.exitCode = exitCode;
