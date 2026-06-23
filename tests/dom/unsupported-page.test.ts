import assert from "node:assert/strict";
import test from "node:test";
import { extractPage, locateActiveList } from "../../src/content/target-adapter.js";
import { loadFixture } from "../helpers/dom.js";

test("classifies inactive and unsupported structures without altering source", async () => {
  const unsupported = await loadFixture("unsupported-page.html");
  const before = unsupported.window.document.body.innerHTML;
  assert.equal(locateActiveList(unsupported.window.document).ok, false);
  assert.throws(() => extractPage(unsupported.window.document, unsupported.window.location.href));
  assert.equal(unsupported.window.document.body.innerHTML, before);
});

test("requires a selected Whiskey Empire tab", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  dom.window.document.querySelector('[role="tab"]')?.setAttribute("aria-selected", "false");
  dom.window.document.querySelector("[data-whiskey-empire-list]")?.removeAttribute("data-whiskey-empire-list");
  assert.deepEqual(locateActiveList(dom.window.document), { ok: false, code: "TAB_NOT_ACTIVE" });
});
