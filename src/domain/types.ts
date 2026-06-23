export type SessionStatus =
  | "idle"
  | "validating"
  | "scanning"
  | "normalizing"
  | "ready"
  | "partial"
  | "failed"
  | "unsupported"
  | "cancelled";

export type PageState = "discovered" | "loading" | "parsed" | "failed";
export type SortOrder = "source" | "name-asc" | "price-asc" | "price-desc";
export type ScanErrorCode =
  | "WRONG_URL"
  | "TAB_NOT_ACTIVE"
  | "UNSUPPORTED_STRUCTURE"
  | "REQUEST_FAILED"
  | "PARSE_FAILED"
  | "NO_VALID_ENTRIES"
  | "NOT_INJECTED";
export type ScanWarningCode = "PARTIAL_RESULTS" | "PAGE_LIMIT_REACHED" | "ENTRY_LIMIT_REACHED" | "SKIPPED_CANDIDATES";

export interface RawWhiskeyRecord {
  rawName: string;
  rawPrice: string;
  rawCategory?: string | undefined;
  rawDistillery?: string | undefined;
  rawType?: string | undefined;
  rawRegion?: string | undefined;
  rawProof?: string | undefined;
  rawNotes?: string | undefined;
  allVisibleText: string;
  sourcePageUrl: string;
  sourceRowIndex: number;
  sourceHref?: string | undefined;
}

export interface SourceReference {
  pageUrl: string;
  rowIndex: number;
  sourceHref: string | null;
}

export interface WhiskeyEntry {
  id: string;
  sourceOrder: number;
  name: string;
  normalizedName: string;
  displayPrice: string;
  sortablePriceCents: number | null;
  category: string | null;
  normalizedCategory: string | null;
  distillery: string | null;
  type: string | null;
  region: string | null;
  proof: string | null;
  notes: string | null;
  searchText: string;
  source: SourceReference;
}

export interface SourcePage {
  url: string;
  state: PageState;
  entryCount: number;
  skippedCandidates: number;
  errorCode: ScanErrorCode | null;
}

export interface ScanError {
  code: ScanErrorCode;
  message: string;
}

export interface ScanWarning {
  code: ScanWarningCode;
  message: string;
}

export interface CollectionSession {
  sessionId: string;
  status: SessionStatus;
  pages: SourcePage[];
  entries: WhiskeyEntry[];
  skippedCandidates: number;
  startedAt: number | null;
  completedAt: number | null;
  warning: ScanWarning | null;
  error: ScanError | null;
}

export interface ViewCriteria {
  query: string;
  distillery: string | null;
  sort: SortOrder;
}

export const DEFAULT_VIEW_CRITERIA: Readonly<ViewCriteria> = Object.freeze({
  query: "",
  distillery: null,
  sort: "source"
});
