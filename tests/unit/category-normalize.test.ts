import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord } from "../../src/domain/normalize.js";

test("preserves category display value and creates a stable key", () => {
  const result = normalizeRecord({ rawName: "A", rawPrice: "$9", rawCategory: "  Single   Malt ", allVisibleText: "A Single Malt", sourcePageUrl: "https://thewestsideblono.com/drink/drink-menu/", sourceRowIndex: 0 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.entry.category, "Single Malt");
    assert.equal(result.entry.normalizedCategory, "single malt");
  }
});
