import assert from "node:assert/strict";
import test from "node:test";
import { deriveSearchToken, parseAdvertisedTotal, parseCompleteStatus, parseShownCount, requireDescendingSort } from "./live-flow.mjs";

test("only a complete status with a positive entry count succeeds", () => {
  assert.equal(parseCompleteStatus("Scan complete: 42 entries."), 42);
  for (const status of ["Partial scan complete: 42 entries.", "No entries", "Scan cancelled.", "Scan complete: 0 entries."]) {
    assert.throws(() => parseCompleteStatus(status));
  }
});

test("visible count parsing requires a positive matching subset", () => {
  assert.deepEqual(parseShownCount("3 of 42 whiskeys shown."), { shown: 3, total: 42 });
  assert.throws(() => parseShownCount("No matching whiskeys."));
});

test("advertised totals are parsed with thousands separators", () => {
  assert.equal(parseAdvertisedTotal("Displaying items 1 - 100 of 1,261 in total"), 1261);
  assert.throws(() => parseAdvertisedTotal("Whiskey Empire"));
});

test("search tokens are derived from observed names without fixed inventory", () => {
  assert.equal(deriveSearchToken("Buffalo Trace Kentucky Straight Bourbon"), "Buffalo");
  assert.throws(() => deriveSearchToken("--"));
});

test("descending sort requires both selected control and accessible state", () => {
  assert.doesNotThrow(() => requireDescendingSort("price-desc", "descending"));
  assert.throws(() => requireDescendingSort("price-desc", "none"));
  assert.throws(() => requireDescendingSort("source", "descending"));
});
