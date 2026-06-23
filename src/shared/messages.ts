import type { ScanError, ScanWarning, SessionStatus } from "../domain/types.js";

export type ExtensionRequest =
  | { type: "START_SCAN" }
  | { type: "GET_STATUS" }
  | { type: "CANCEL_SCAN" };

export interface SessionSnapshot {
  status: SessionStatus;
  pagesDiscovered: number;
  pagesProcessed: number;
  entriesCollected: number;
  skippedCandidates: number;
  warning: ScanWarning | null;
  error: ScanError | null;
}

export type ExtensionResponse =
  | { ok: true; snapshot: SessionSnapshot }
  | { ok: false; error: ScanError };

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  return ["START_SCAN", "GET_STATUS", "CANCEL_SCAN"].includes(String(value.type));
}
