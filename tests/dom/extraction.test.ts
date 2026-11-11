import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { extractPage, locateActiveList } from "../../src/content/target-adapter.js";
import { loadFixture } from "../helpers/dom.js";

const url = "https://thewestsideblono.com/drink/drink-menu/?page=1";

for (const linked of [true, false]) {
  test(`reads whiskey rows and pagination when cocktails precede them (linked=${linked})`, async () => {
    const dom = await loadFixture("whiskey-untappd.html", url);
    const doc = dom.window.document;
    const panel = doc.querySelector<HTMLElement>('.tab-content')!;
    panel.id = linked ? 'menu-226060' : 'unlinked-whiskey';
    const cocktails = panel.cloneNode(true) as HTMLElement;
    cocktails.id = 'cocktails';
    cocktails.querySelector('.menu-title')!.textContent = 'Whiskey Empire Cocktail Menu';
    cocktails.querySelector('.item-name')!.textContent = 'SCOTCH-A-RITA';
    panel.before(cocktails);
    const total = doc.createElement('p');
    total.textContent = 'Displaying items 1 - 100 of 1261 in total';
    const nav = doc.createElement('nav');
    nav.innerHTML = '<a href="https://business.untappd.com/locations/27679/themes/106302/items?page=2&section_id=1804729">Next</a>';
    panel.append(total, nav);
    const result = extractPage(doc, url);
    assert.equal(locateActiveList(doc).ok, true);
    assert.deepEqual(result.records.map(row => row.rawName), ['Fixture Reserve Bourbon']);
    assert.equal(result.advertisedTotal, 1261);
    assert.equal(result.paginationUrls.length, 1);
    assert.equal(result.paginationUrls[0]?.searchParams.get('page'), '2');
  });
}

test("extracts valid rows, optional visible fields, categories, and pagination", async () => {
  const dom = await loadFixture("whiskey-page-1.html", url);
  const result = extractPage(dom.window.document, url);
  assert.equal(result.candidateCount, 3);
  assert.equal(result.records.length, 2);
  assert.equal(result.skippedCandidates, 1);
  assert.equal(result.records[0]?.rawCategory, "Bourbon");
  assert.match(result.records[0]?.allVisibleText ?? "", /Caramel and oak/);
  assert.deepEqual(result.paginationUrls.map((page) => page.search), ["?page=1", "?page=2"]);
  assert.equal(result.advertisedTotal, null);
});

test("extracts an Untappd pagination fragment and its advertised total", () => {
  const url = "https://business.untappd.com/locations/27679/themes/106302/items?page=2&section_id=1804729";
  const dom = new JSDOM(`<!doctype html><body>
    <div class="menu-item"><h4 class="item-name">Page Two Bourbon</h4><span class="price">$13</span></div>
    <div>Displaying items 101 - 200 of 1,261 in total</div>
    <div class="pagination"><a href="?page=3&section_id=1804729">3</a></div>
  </body>`, { url });
  const result = extractPage(dom.window.document, url);
  assert.equal(result.records.length, 1);
  assert.equal(result.advertisedTotal, 1261);
  assert.equal(result.paginationUrls[0]?.searchParams.get("page"), "3");
});

test("accepts a semantic layout variant", async () => {
  const dom = await loadFixture("whiskey-layout-variant.html");
  const result = extractPage(dom.window.document, dom.window.location.href);
  assert.equal(result.records[0]?.rawName, "Variant Bourbon");
  assert.equal(result.records[0]?.rawPrice, "Price: $11");
});

test("extracts the live Untappd menu structure", async () => {
  const dom = await loadFixture("whiskey-untappd.html");
  const result = extractPage(dom.window.document, dom.window.location.href);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0]?.rawName, "Fixture Reserve Bourbon");
  assert.equal(result.records[0]?.rawPrice, "$12.00");
  assert.equal(result.records[0]?.rawCategory, "Bourbon");
  assert.equal(result.records[0]?.rawDistillery, "Fixture Distilling");
  assert.equal(result.records[0]?.rawProof, "46% ABV");
  assert.equal(result.records[0]?.rawType, "Straight Bourbon");
  assert.equal(result.records[0]?.rawRegion, "Kentucky");
});

test("rejects unsupported markup and wrong pages", async () => {
  const unsupported = await loadFixture("unsupported-page.html");
  assert.deepEqual(locateActiveList(unsupported.window.document), { ok: false, code: "TAB_NOT_ACTIVE" });
  assert.deepEqual(locateActiveList(unsupported.window.document, "https://example.com/"), { ok: false, code: "WRONG_URL" });
});
