import assert from "node:assert/strict";
import test from "node:test";
import { createPanel } from "../../src/ui/panel.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("panel controls have native semantics, names, focus, live status, and reduced-motion styles", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const panel = createPanel(document.querySelector("[data-whiskey-empire-list]")!, { onCriteria() {}, onReset() {}, onCancel() {}, onRetry() {}, onContinue() {}, onClose() {} });
    await Promise.resolve();
    assert.equal(panel.shadow.activeElement, panel.heading);
    assert.equal(panel.status.getAttribute("aria-live"), "polite");
    assert.equal(panel.query.labels?.[0]?.textContent?.includes("Search"), true);
    assert.equal(panel.sortButton.getAttribute("aria-haspopup"), "listbox");
    assert.equal(panel.sortButton.getAttribute("aria-controls"), "wew-sort-list");
    assert.equal(panel.sortList.getAttribute("role"), "listbox");
    assert.equal(panel.shadow.querySelectorAll("button").length >= 5, true);
    assert.match(panel.shadow.querySelector("style")?.textContent ?? "", /prefers-reduced-motion/);
    assert.match(panel.shadow.querySelector("style")?.textContent ?? "", /max-width: 700px/);
    assert.match(panel.shadow.querySelector("style")?.textContent ?? "", /appearance: none/);
  } finally { restore(); }
});
