import { selectEntries } from "../domain/select-entries.js";
import type { CollectionSession, ViewCriteria, WhiskeyEntry } from "../domain/types.js";
import type { PanelView } from "./panel.js";

function cell(row: HTMLTableRowElement, label: string, value: string): void {
  const td = document.createElement("td");
  td.dataset.label = label;
  td.textContent = value;
  row.append(td);
}

function rowFor(entry: WhiskeyEntry): HTMLTableRowElement {
  const row = document.createElement("tr");
  row.dataset.entryId = entry.id;
  cell(row, "Name", entry.name);
  cell(row, "Distillery", entry.distillery ?? "—");
  cell(row, "Proof", entry.proof ?? "—");
  cell(row, "Price", entry.sortablePriceCents === null ? `${entry.displayPrice} (not comparable)` : entry.displayPrice);
  cell(row, "Notes", entry.notes ?? ([entry.type, entry.region].filter(Boolean).join(" · ") || "—"));
  return row;
}

function statusText(session: Readonly<CollectionSession>): string {
  const processed = session.pages.filter((page) => page.state === "parsed" || page.state === "failed").length;
  const collected = session.entries.length || session.pages.reduce((sum, page) => sum + page.entryCount, 0);
  if (["validating", "scanning"].includes(session.status)) return `Scanning page ${processed} of ${session.pages.length || "an unknown total"}; ${collected} entries collected; ${session.skippedCandidates} skipped.`;
  if (session.status === "normalizing") return "Normalizing collected whiskey entries…";
  if (session.status === "ready") return `Scan complete: ${session.entries.length} entries.`;
  if (session.status === "partial") return `Partial scan complete: ${session.entries.length} entries.`;
  if (session.status === "cancelled") return "Scan cancelled. Temporary results were discarded.";
  return session.error?.message ?? "Ready.";
}

export function updatePanel(view: PanelView, session: Readonly<CollectionSession>, criteria: Readonly<ViewCriteria>): void {
  view.status.textContent = statusText(session);
  const terminalResults = session.status === "ready" || session.status === "partial";
  view.controls.hidden = !terminalResults;
  view.cancel.hidden = !["validating", "scanning", "normalizing"].includes(session.status);
  view.retry.hidden = !["partial", "failed", "unsupported", "cancelled"].includes(session.status);
  view.continueButton.hidden = session.status !== "partial";
  view.warning.hidden = !session.warning && !session.error;
  view.warning.className = session.error ? "error" : "warning";
  view.warning.textContent = session.error?.message ?? session.warning?.message ?? "";

  const distilleries = [...new Map(session.entries.filter((entry) => entry.distillery).map((entry) => [entry.distillery!.toLocaleLowerCase("en-US"), entry.distillery!])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "en-US"));
  const currentDistillery = view.distillery.value;
  view.distilleryOptions.replaceChildren(...distilleries.map(([, label]) => new Option(label, label)));
  view.distillery.value = currentDistillery;
  const distilleryLabel = view.shadow.querySelector<HTMLElement>("#wew-distillery-label");
  if (distilleryLabel) distilleryLabel.hidden = distilleries.length === 0;

  const result = selectEntries(session.entries, criteria);
  const fragment = document.createDocumentFragment();
  for (const entry of result.entries) fragment.append(rowFor(entry));
  view.body.replaceChildren(fragment);
  view.count.textContent = terminalResults ? (result.total ? `${result.total} of ${session.entries.length} whiskeys shown.` : "No matching whiskeys. Clear search or reset filters.") : "";
  const table = view.shadow.querySelector<HTMLTableElement>("#wew-table");
  if (table) table.hidden = !terminalResults || result.total === 0;
  view.nameHeader.setAttribute("aria-sort", criteria.sort === "name-asc" ? "ascending" : "none");
  view.priceHeader.setAttribute("aria-sort", criteria.sort === "price-asc" ? "ascending" : criteria.sort === "price-desc" ? "descending" : "none");
}
