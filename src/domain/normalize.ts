import { containsUsdAmount, parsePrice } from "./price-parser.js";
import type { RawWhiskeyRecord, WhiskeyEntry } from "./types.js";

export type NormalizeFailure = "MISSING_NAME" | "MISSING_PRICE";
export type NormalizeResult = { ok: true; entry: WhiskeyEntry } | { ok: false; reason: NormalizeFailure };

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function display(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized || null;
}

function withoutSourceCode(value: string | undefined): string | null {
  return display(value?.replace(/(^|\s)#[a-z0-9]{2,5}\b/gi, "$1"));
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `w-${(hash >>> 0).toString(36)}`;
}

export function normalizeRecord(raw: RawWhiskeyRecord, sourceOrder = raw.sourceRowIndex): NormalizeResult {
  const type = withoutSourceCode(raw.rawType);
  let name = withoutSourceCode(raw.rawName);
  if (name && type && normalizeText(name).endsWith(normalizeText(type))) name = display(name.slice(0, -type.length));
  if (!name) return { ok: false, reason: "MISSING_NAME" };
  const rawPrice = display(raw.rawPrice);
  if (!rawPrice || !containsUsdAmount(rawPrice)) return { ok: false, reason: "MISSING_PRICE" };

  const price = parsePrice(rawPrice);
  const category = display(raw.rawCategory);
  const normalizedName = normalizeText(name);
  const normalizedCategory = category ? normalizeText(category) : null;
  const sourceHref = display(raw.sourceHref);
  const identity = [normalizedName, price.displayPrice, normalizedCategory ?? "", raw.sourcePageUrl, raw.sourceRowIndex].join("|");

  return {
    ok: true,
    entry: {
      id: stableId(identity),
      sourceOrder,
      name,
      normalizedName,
      displayPrice: price.displayPrice,
      sortablePriceCents: price.sortablePriceCents,
      category,
      normalizedCategory,
      distillery: display(raw.rawDistillery),
      type,
      region: display(raw.rawRegion),
      proof: display(raw.rawProof),
      notes: display(raw.rawNotes),
      searchText: normalizeText(raw.allVisibleText.replace(/(^|\s)#[a-z0-9]{2,5}\b/gi, "$1")),
      source: { pageUrl: raw.sourcePageUrl, rowIndex: raw.sourceRowIndex, sourceHref }
    }
  };
}

export function normalizeRecords(records: readonly RawWhiskeyRecord[]): { entries: WhiskeyEntry[]; skipped: number } {
  const entries: WhiskeyEntry[] = [];
  let skipped = 0;
  records.forEach((raw, index) => {
    const result = normalizeRecord(raw, index);
    if (!result.ok) {
      skipped += 1;
      return;
    }
    entries.push(result.entry);
  });
  return { entries, skipped };
}
