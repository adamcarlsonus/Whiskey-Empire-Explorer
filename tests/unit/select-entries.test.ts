import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord } from "../../src/domain/normalize.js";
import { resetCriteria, selectEntries } from "../../src/domain/select-entries.js";

function entry(name: string, notes: string, order: number) {
  const result = normalizeRecord({ rawName: name, rawPrice: "$10", rawNotes: notes, allVisibleText: `${name} ${notes}`, sourcePageUrl: "https://thewestsideblono.com/drink/drink-menu/", sourceRowIndex: order }, order);
  if (!result.ok) throw new Error(result.reason);
  return result.entry;
}

test("searches case-insensitively across all visible text without mutation", () => {
  const entries = [entry("Alpha", "Kentucky caramel", 0), entry("Beta", "Indiana spice", 1)];
  const before = [...entries];
  assert.deepEqual(selectEntries(entries, { query: "SPICE", distillery: null, sort: "source" }).entries.map((item) => item.name), ["Beta"]);
  assert.deepEqual(entries, before);
  assert.deepEqual(resetCriteria(), { query: "", distillery: null, sort: "source" });
});
