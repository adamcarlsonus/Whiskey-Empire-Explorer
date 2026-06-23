import type { RawWhiskeyRecord, ScanErrorCode, ScanWarning, SourcePage } from "../domain/types.js";
import { MAX_ENTRIES, MAX_PAGES, canonicalizeUrl } from "../shared/target.js";
import { extractPage, type PageExtraction } from "./target-adapter.js";

export interface TraversalProgress {
  pages: SourcePage[];
  records: number;
  skippedCandidates: number;
}

export interface TraversalResult extends TraversalProgress {
  rawRecords: RawWhiskeyRecord[];
  warning: ScanWarning | null;
}

interface TraversalOptions {
  initialDocument: Document;
  initialUrl: string;
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
  extract?: (document: Document, url: string) => PageExtraction;
  onProgress?: (progress: TraversalProgress) => void;
}

const PAGE_TIMEOUT_MS = 15_000;

async function fetchPage(fetchImpl: typeof fetch, url: string, parentSignal: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort(parentSignal.reason);
  parentSignal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("Page request timed out", "TimeoutError")), PAGE_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { credentials: "same-origin", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    parentSignal.removeEventListener("abort", abort);
  }
}

function scanError(code: ScanErrorCode, message: string): Error & { code: ScanErrorCode } {
  return Object.assign(new Error(message), { code });
}

export async function traversePagination(options: TraversalOptions): Promise<TraversalResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const extractor = options.extract ?? extractPage;
  const initial = canonicalizeUrl(options.initialUrl);
  if (!initial) throw scanError("WRONG_URL", "Open the supported Westside drink menu first.");

  const queue: URL[] = [initial];
  const seen = new Set<string>();
  const pages: SourcePage[] = [];
  const rawRecords: RawWhiskeyRecord[] = [];
  let skippedCandidates = 0;
  let warning: ScanWarning | null = null;
  let advertisedTotal: number | null = null;

  while (queue.length && pages.length < MAX_PAGES && rawRecords.length < MAX_ENTRIES) {
    if (options.signal.aborted) throw new DOMException("Scan cancelled", "AbortError");
    const current = queue.shift();
    if (!current || seen.has(current.href)) continue;
    seen.add(current.href);
    const page: SourcePage = { url: current.href, state: "loading", entryCount: 0, skippedCandidates: 0, errorCode: null };
    pages.push(page);

    try {
      let document: Document;
      if (pages.length === 1) document = options.initialDocument;
      else {
        const response = await fetchPage(fetchImpl, current.href, options.signal);
        if (!response.ok) throw scanError("REQUEST_FAILED", `Page request failed with ${response.status}.`);
        document = new DOMParser().parseFromString(await response.text(), "text/html");
      }
      const extraction = extractor(document, current.href);
      if (extraction.advertisedTotal !== null) advertisedTotal = Math.max(advertisedTotal ?? 0, extraction.advertisedTotal);
      const remaining = Math.max(0, MAX_ENTRIES - rawRecords.length);
      rawRecords.push(...extraction.records.slice(0, remaining));
      skippedCandidates += extraction.skippedCandidates;
      page.state = "parsed";
      page.entryCount = Math.min(extraction.records.length, remaining);
      page.skippedCandidates = extraction.skippedCandidates;
      for (const discovered of extraction.paginationUrls) {
        if (!seen.has(discovered.href) && !queue.some((url) => url.href === discovered.href)) queue.push(discovered);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      const code = typeof error === "object" && error && "code" in error ? String(error.code) as ScanErrorCode : "PARSE_FAILED";
      page.state = "failed";
      page.errorCode = code;
      if (rawRecords.length === 0) throw scanError(code, error instanceof Error ? error.message : "Unable to read the whiskey list.");
      warning = { code: "PARTIAL_RESULTS", message: "A later page could not be read. Results are incomplete." };
      options.onProgress?.({ pages: [...pages], records: rawRecords.length, skippedCandidates });
      break;
    }
    options.onProgress?.({ pages: [...pages], records: rawRecords.length, skippedCandidates });
  }

  if (!warning && advertisedTotal !== null && rawRecords.length < advertisedTotal) {
    warning = { code: "PARTIAL_RESULTS", message: `Collected ${rawRecords.length} of ${advertisedTotal} advertised entries. Results are incomplete.` };
  } else if (!warning && queue.length) {
    warning = pages.length >= MAX_PAGES
      ? { code: "PAGE_LIMIT_REACHED", message: `Stopped safely after ${MAX_PAGES} pages. Results are partial.` }
      : { code: "ENTRY_LIMIT_REACHED", message: `Stopped safely after ${MAX_ENTRIES} entries. Results are partial.` };
  } else if (!warning && skippedCandidates > 0) {
    warning = { code: "SKIPPED_CANDIDATES", message: `${skippedCandidates} candidate rows lacked a recognizable name or displayed price.` };
  }
  return { pages, rawRecords, records: rawRecords.length, skippedCandidates, warning };
}
