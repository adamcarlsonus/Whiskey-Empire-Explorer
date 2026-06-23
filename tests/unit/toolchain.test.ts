import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedUrl } from "../../src/shared/target.js";

test("toolchain imports project modules", () => {
  assert.equal(isSupportedUrl("https://thewestsideblono.com/drink/drink-menu/"), true);
  assert.equal(isSupportedUrl("https://example.com/"), false);
});
