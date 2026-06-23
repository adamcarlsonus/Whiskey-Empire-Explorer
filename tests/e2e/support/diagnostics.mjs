import { MAX_FRAME_ORIGINS, MAX_REQUEST_ORIGINS, MAX_VISIBLE_ELEMENTS, TARGET_ORIGIN } from "./config.mjs";
import { addError, originOnly, sanitizeText } from "./report.mjs";

function pushUniqueBounded(list, value, limit) {
  if (value && !list.includes(value) && list.length < limit) list.push(value);
}

export function recordDirectHarnessRequest(report, url) {
  report.observations.directHarnessRequestCount += 1;
  const origin = originOnly(url);
  if (origin !== TARGET_ORIGIN) report.observations.unexpectedHarnessRequests += 1;
}

export function recordDocumentRequest(report, url) {
  pushUniqueBounded(report.observations.documentRequestOrigins, originOnly(url), MAX_REQUEST_ORIGINS);
}

export function recordFrames(report, page) {
  for (const frame of page.frames()) pushUniqueBounded(report.observations.frameOrigins, originOnly(frame.url()), MAX_FRAME_ORIGINS);
}

export async function collectVisibleElements(report, page) {
  const summaries = [];
  for (const frame of page.frames()) {
    if (summaries.length >= MAX_VISIBLE_ELEMENTS) break;
    const available = await frame.locator('button,a,[role="tab"],[role="button"],input,select').evaluateAll((elements, remaining) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      }).slice(0, remaining).map((element) => ({
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        accessibleName: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("name") || "").trim().replace(/\s+/g, " ").slice(0, 200),
        state: Object.fromEntries(["aria-selected", "aria-expanded", "disabled", "hidden"].map((name) => [name, element.getAttribute(name)]).filter(([, value]) => value !== null))
      })), MAX_VISIBLE_ELEMENTS - summaries.length).catch(() => []);
    summaries.push(...available);
  }
  report.observations.visibleElements = boundedVisibleElements(summaries);
}

export function boundedVisibleElements(elements) { return elements.slice(0, MAX_VISIBLE_ELEMENTS); }

export function attachDiagnostics(context, report, stageName) {
  context.on("request", (request) => recordDocumentRequest(report, request.url()));
  context.on("requestfailed", (request) => addError(report, { source: "network", stage: stageName(), message: request.failure()?.errorText ?? "Request failed", url: request.url() }));
  context.on("weberror", (webError) => addError(report, { source: "browser", stage: stageName(), message: webError.error()?.message ?? String(webError) }));
  context.on("page", (page) => {
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) addError(report, { source: page.url().startsWith("chrome-extension://") ? "popup" : "page", stage: stageName(), message: message.text(), url: page.url() });
    });
    page.on("pageerror", (error) => addError(report, { source: page.url().startsWith("chrome-extension://") ? "popup" : "page", stage: stageName(), message: error.message, url: page.url() }));
  });
}

export function statusSnippet(value) { return sanitizeText(value, 500); }
