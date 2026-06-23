import { normalizeRecords } from "../domain/normalize.js";
import type { CollectionSession, ScanErrorCode } from "../domain/types.js";
import type { SessionSnapshot } from "../shared/messages.js";
import { traversePagination } from "./pagination.js";

export type SessionListener = (session: Readonly<CollectionSession>) => void;

function freshSession(): CollectionSession {
  return {
    sessionId: crypto.randomUUID(), status: "idle", pages: [], entries: [], skippedCandidates: 0,
    startedAt: null, completedAt: null, warning: null, error: null
  };
}

function publicMessage(code: ScanErrorCode): string {
  const messages: Record<ScanErrorCode, string> = {
    WRONG_URL: "Open the supported Westside drink menu first.",
    TAB_NOT_ACTIVE: "Select the Whiskey Empire tab, then scan again.",
    UNSUPPORTED_STRUCTURE: "This version of the whiskey list is not supported.",
    REQUEST_FAILED: "A whiskey-list page could not be requested.",
    PARSE_FAILED: "A whiskey-list page could not be read.",
    NO_VALID_ENTRIES: "No entries with both a name and displayed price were found.",
    NOT_INJECTED: "The extension panel is not available in this tab."
  };
  return messages[code];
}

export class Scanner {
  private session = freshSession();
  private controller: AbortController | null = null;

  get current(): Readonly<CollectionSession> { return this.session; }

  snapshot(): SessionSnapshot {
    const processedEntryCount = this.session.pages.reduce((sum, page) => sum + page.entryCount, 0);
    return {
      status: this.session.status,
      pagesDiscovered: this.session.pages.length,
      pagesProcessed: this.session.pages.filter((page) => page.state === "parsed" || page.state === "failed").length,
      entriesCollected: this.session.entries.length || processedEntryCount,
      skippedCandidates: this.session.skippedCandidates,
      warning: this.session.warning,
      error: this.session.error
    };
  }

  async start(document: Document, listener: SessionListener): Promise<Readonly<CollectionSession>> {
    if (["validating", "scanning", "normalizing", "ready"].includes(this.session.status)) {
      listener(this.session);
      return this.session;
    }
    this.controller?.abort();
    this.controller = new AbortController();
    this.session = freshSession();
    this.session.status = "validating";
    this.session.startedAt = performance.now();
    listener(this.session);

    try {
      this.session.status = "scanning";
      listener(this.session);
      const traversal = await traversePagination({
        initialDocument: document,
        initialUrl: document.location.href,
        signal: this.controller.signal,
        onProgress: (progress) => {
          this.session.pages = progress.pages;
          this.session.skippedCandidates = progress.skippedCandidates;
          listener(this.session);
        }
      });
      this.session.status = "normalizing";
      listener(this.session);
      const normalized = normalizeRecords(traversal.rawRecords);
      this.session.entries = normalized.entries;
      this.session.skippedCandidates = traversal.skippedCandidates + normalized.skipped;
      this.session.warning = traversal.warning;
      if (!this.session.entries.length) throw Object.assign(new Error(publicMessage("NO_VALID_ENTRIES")), { code: "NO_VALID_ENTRIES" });
      this.session.status = traversal.warning?.code === "PARTIAL_RESULTS" || traversal.warning?.code.endsWith("LIMIT_REACHED") ? "partial" : "ready";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") this.session.status = "cancelled";
      else {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) as ScanErrorCode : "PARSE_FAILED";
        this.session.status = ["WRONG_URL", "TAB_NOT_ACTIVE", "UNSUPPORTED_STRUCTURE", "NO_VALID_ENTRIES"].includes(code) ? "unsupported" : "failed";
        this.session.error = { code, message: publicMessage(code) };
      }
    }
    this.session.completedAt = performance.now();
    listener(this.session);
    return this.session;
  }

  cancel(listener?: SessionListener): void {
    this.controller?.abort();
    if (["validating", "scanning", "normalizing"].includes(this.session.status)) this.session.status = "cancelled";
    this.session.completedAt = performance.now();
    listener?.(this.session);
  }

  reset(): void {
    this.controller?.abort();
    this.controller = null;
    this.session = freshSession();
  }

  continuePartial(listener: SessionListener): void {
    if (this.session.status === "partial") {
      this.session.status = "ready";
      listener(this.session);
    }
  }
}
