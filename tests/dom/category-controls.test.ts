import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecords } from "../../src/domain/normalize.js";
import type { CollectionSession } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("shows distillery control only when producers exist", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = document.querySelector("[data-whiskey-empire-list]")!;
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRetry() {}, onContinue() {}, onClose() {} });
    const { entries } = normalizeRecords([{ rawName: "A", rawPrice: "$9", rawDistillery: "anCnoc", allVisibleText: "A anCnoc", sourcePageUrl: dom.window.location.href, sourceRowIndex: 0 }]);
    const session: CollectionSession = { sessionId: "x", status: "ready", pages: [], entries, skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null };
    updatePanel(panel, session, { query: "", distillery: null, sort: "source" });
    assert.equal(panel.distilleryField.hidden, false);
    assert.equal(panel.distillery.type, "search");
    assert.equal(panel.distillery.getAttribute("role"), "combobox");
    assert.equal(panel.distillery.getAttribute("aria-controls"), "wew-distillery-list");
    assert.deepEqual([...panel.distilleryList.querySelectorAll<HTMLButtonElement>(".distillery-option")].map((option) => option.dataset.value), ["anCnoc"]);
    panel.distillery.focus();
    assert.equal(panel.distilleryList.hidden, false);
    assert.equal(panel.distillery.getAttribute("aria-expanded"), "true");
    const distilleryOption = panel.distilleryList.querySelector<HTMLButtonElement>(".distillery-option")!;
    distilleryOption.focus();
    distilleryOption.click();
    assert.equal(panel.distillery.value, "anCnoc");
    assert.equal(panel.distilleryList.hidden, true);
    panel.distillery.value = "";
    updatePanel(panel, session, { query: "", distillery: "anCnoc", sort: "source" });
    assert.equal(panel.distillery.value, "anCnoc");
    assert.equal(panel.distilleryList.querySelector('[data-value="anCnoc"]')?.getAttribute("aria-selected"), "true");
    updatePanel(panel, { ...session, entries: [] }, { query: "", distillery: null, sort: "source" });
    assert.equal(panel.distilleryField.hidden, true);
  } finally { restore(); }
});
