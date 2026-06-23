import { DEFAULT_VIEW_CRITERIA, type SortOrder, type ViewCriteria, type WhiskeyEntry } from "./types.js";
import { normalizeText } from "./normalize.js";

export interface SelectionResult {
  entries: WhiskeyEntry[];
  total: number;
}

export function resetCriteria(): ViewCriteria {
  return { ...DEFAULT_VIEW_CRITERIA };
}

function compareName(a: WhiskeyEntry, b: WhiskeyEntry): number {
  return a.normalizedName.localeCompare(b.normalizedName, "en-US") || a.sourceOrder - b.sourceOrder;
}

function comparePrice(a: WhiskeyEntry, b: WhiskeyEntry, sort: SortOrder): number {
  const aPrice = a.sortablePriceCents;
  const bPrice = b.sortablePriceCents;
  if (aPrice === null && bPrice === null) return compareName(a, b);
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;
  const delta = sort === "price-desc" ? bPrice - aPrice : aPrice - bPrice;
  return delta || compareName(a, b);
}

export function selectEntries(allEntries: readonly WhiskeyEntry[], criteria: Readonly<ViewCriteria>): SelectionResult {
  const query = normalizeText(criteria.query);
  const distillery = criteria.distillery ? normalizeText(criteria.distillery) : null;
  const entries = allEntries.filter((entry) => {
    if (distillery && !normalizeText(entry.distillery ?? "").includes(distillery)) return false;
    return !query || entry.searchText.includes(query);
  });

  if (criteria.sort === "source") entries.sort((a, b) => a.sourceOrder - b.sourceOrder);
  else if (criteria.sort === "name-asc") entries.sort(compareName);
  else entries.sort((a, b) => comparePrice(a, b, criteria.sort));
  return { entries, total: entries.length };
}
