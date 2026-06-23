import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord } from "../../src/domain/normalize.js";
import { resetCriteria, selectEntries } from "../../src/domain/select-entries.js";

function make(name: string, distillery: string, order: number) {
  const result = normalizeRecord({ rawName: name, rawPrice: `$${9 + order}`, rawDistillery: distillery, allVisibleText: `${name} ${distillery}`, sourcePageUrl: "https://thewestsideblono.com/drink/drink-menu/", sourceRowIndex: order }, order);
  if (!result.ok) throw new Error(result.reason);
  return result.entry;
}

test("composes distillery, query, sort, counts, and reset", () => {
  const entries = [make("Zulu", "Beam", 0), make("Alpha", "Buffalo Trace", 1), make("Beta", "Beam", 2)];
  const selected = selectEntries(entries, { query: "bet", distillery: "BEA", sort: "name-asc" });
  assert.deepEqual(selected.entries.map((item) => item.name), ["Beta"]);
  assert.equal(selected.total, 1);
  assert.equal(resetCriteria().distillery, null);
});
