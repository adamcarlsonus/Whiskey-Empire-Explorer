import assert from "node:assert/strict";
import test from "node:test";
import { activateWhiskeyTab, extractPage, locateActiveList } from "../../src/content/target-adapter.js";
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

test("activates the Whiskey Empire tab before scanning", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const tab = dom.window.document.querySelector<HTMLElement>('[role="tab"]')!;
  tab.setAttribute("aria-selected", "false");
  tab.addEventListener("click", () => tab.setAttribute("aria-selected", "true"));
  assert.equal(await activateWhiskeyTab(dom.window.document, 100), true);
  assert.equal(tab.getAttribute("aria-selected"), "true");
  assert.equal(locateActiveList(dom.window.document).ok, true);
});

test("ignores the cocktail tab and waits for the whiskey tab to load", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const doc = dom.window.document;
  doc.querySelector('[data-whiskey-empire-list]')?.removeAttribute('data-whiskey-empire-list');
  const whiskey = doc.querySelector<HTMLElement>('[role="tab"]')!;
  whiskey.setAttribute("aria-selected", "false");
  const cocktail = whiskey.cloneNode(true) as HTMLElement;
  cocktail.textContent = "Whiskey Empire Cocktail Menu";
  cocktail.setAttribute("aria-selected", "true");
  whiskey.before(cocktail);
  whiskey.remove();
  let cocktailClicks = 0;
  cocktail.addEventListener("click", () => cocktailClicks++);
  whiskey.addEventListener("click", () => whiskey.setAttribute("aria-selected", "true"));
  setTimeout(() => cocktail.after(whiskey), 10);
  assert.equal(await activateWhiskeyTab(doc, 300), true);
  assert.equal(cocktailClicks, 0);
  assert.equal(whiskey.getAttribute("aria-selected"), "true");
});
