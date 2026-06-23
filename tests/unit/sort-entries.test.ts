import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord } from "../../src/domain/normalize.js";
import { selectEntries } from "../../src/domain/select-entries.js";

function make(name: string, price: string, order: number) {
  const result = normalizeRecord({ rawName: name, rawPrice: price, allVisibleText: `${name} ${price}`, sourcePageUrl: "https://thewestsideblono.com/drink/drink-menu/", sourceRowIndex: order }, order);
  if (!result.ok) throw new Error(result.reason);
  return result.entry;
}

test("sorts names and prices stably with null prices last", () => {
  const entries = [make("Zulu", "$10-$14", 0), make("beta", "$8", 1), make("Alpha", "$8", 2)];
  assert.deepEqual(selectEntries(entries, { query: "", distillery: null, sort: "name-asc" }).entries.map((item) => item.name), ["Alpha", "beta", "Zulu"]);
  assert.deepEqual(selectEntries(entries, { query: "", distillery: null, sort: "price-asc" }).entries.map((item) => item.name), ["Alpha", "beta", "Zulu"]);
  assert.deepEqual(selectEntries(entries, { query: "", distillery: null, sort: "price-desc" }).entries.map((item) => item.name), ["Alpha", "beta", "Zulu"]);
});
