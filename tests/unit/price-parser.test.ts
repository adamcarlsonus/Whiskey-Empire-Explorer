import assert from "node:assert/strict";
import test from "node:test";
import { containsUsdAmount, parsePrice } from "../../src/domain/price-parser.js";

test("parses one unambiguous USD amount into cents", () => {
  assert.equal(parsePrice("$9").sortablePriceCents, 900);
  assert.equal(parsePrice("Price: 14.50").sortablePriceCents, 1450);
  assert.equal(parsePrice("$1,200.05").sortablePriceCents, 120005);
});

test("preserves but does not compare ranges, pours, or unrelated numbers", () => {
  for (const value of ["$10-$14", "1 oz $8 / 2 oz $14", "90 proof", "€10", "Market price", ""]) {
    assert.equal(parsePrice(value).sortablePriceCents, null, value);
  }
  assert.equal(containsUsdAmount("1 oz $8 / 2 oz $14"), true);
  assert.equal(containsUsdAmount("90 proof"), false);
});
