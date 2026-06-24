import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord, normalizeRecords } from "../../src/domain/normalize.js";
import type { RawWhiskeyRecord } from "../../src/domain/types.js";

const raw: RawWhiskeyRecord = {
  rawName: "  Rare   Creek Rye ", rawPrice: "$14.50", rawCategory: " Rye ", rawRegion: "Indiana",
  allVisibleText: "Rare Creek Rye $14.50 Indiana Spicy Finish", sourcePageUrl: "https://thewestsideblono.com/drink/drink-menu/?page=2", sourceRowIndex: 0
};

test("normalizes comparison values while preserving display strings", () => {
  const result = normalizeRecord(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.entry.name, "Rare Creek Rye");
  assert.equal(result.entry.normalizedCategory, "rye");
  assert.equal(result.entry.sortablePriceCents, 1450);
  assert.match(result.entry.searchText, /spicy finish/);
  assert.equal(result.entry.source.pageUrl, raw.sourcePageUrl);
});

test("skips invalid records while preserving distinct source rows", () => {
  const result = normalizeRecords([raw, { ...raw, sourceRowIndex: 1 }, { ...raw, rawPrice: "", sourceRowIndex: 2 }]);
  assert.equal(result.entries.length, 2);
  assert.equal(result.skipped, 1);
});

test("removes source hash codes while preserving and separating the whiskey type", () => {
  const result = normalizeRecord({ ...raw, rawName: "Example Reserve #BOU Bourbon", rawType: "#BOU Bourbon", allVisibleText: "Example Reserve #BOU Bourbon" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.entry.name, "Example Reserve");
  assert.equal(result.entry.type, "Bourbon");
  assert.equal(result.entry.searchText, "example reserve bourbon");
});
