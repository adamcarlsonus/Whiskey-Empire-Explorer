import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { traversePagination } from "../../src/content/pagination.js";
import { canonicalizeUrl } from "../../src/shared/target.js";
import { fakeFetch, installDomGlobals, loadFixture } from "../helpers/dom.js";

test("canonicalization rejects cross-origin and wrong paths", () => {
  assert.equal(canonicalizeUrl("https://example.com/drink/drink-menu/"), null);
  assert.equal(canonicalizeUrl("https://thewestsideblono.com/other/"), null);
  assert.equal(canonicalizeUrl("?page=2#fragment")?.href, "https://thewestsideblono.com/drink/drink-menu/?page=2");
  assert.equal(
    canonicalizeUrl("https://business.untappd.com/locations/27679/themes/106302/items?page=2&section_id=1804729")?.href,
    "https://business.untappd.com/locations/27679/themes/106302/items?page=2&section_id=1804729"
  );
  assert.equal(canonicalizeUrl("https://business.untappd.com/other?page=2&section_id=1804729"), null);
  assert.equal(canonicalizeUrl("https://business.untappd.com/locations/27679/themes/106302/items?page=21&section_id=1804729"), null);
});

test("traverses the visible Untappd pagination endpoint until the advertised total is collected", async () => {
  const providerUrl = "https://business.untappd.com/locations/27679/themes/106302/items?page=2&section_id=1804729";
  const initial = new JSDOM(`<!doctype html><body><div class="ut-menu">
    <a class="tab-anchor active" data-tab-id="whiskey">Whiskey Empire</a>
    <div class="tab-content"><h2 class="menu-title">Whiskey Empire</h2>
      <div class="menu-item"><h4 class="item-name">One</h4><span class="price">$10</span></div>
      <div>Displaying items 1 - 1 of 2 in total</div>
      <div class="pagination"><a href="${providerUrl}">2</a></div>
    </div></div></body>`, { url: "https://thewestsideblono.com/drink/drink-menu/" });
  const restore = installDomGlobals(initial);
  try {
    const fragment = `<!doctype html><body>
      <div class="menu-item"><h4 class="item-name">Two</h4><span class="price">$11</span></div>
      <div>Displaying items 2 - 2 of 2 in total</div>
    </body>`;
    const calls: string[] = [];
    const result = await traversePagination({
      initialDocument: initial.window.document,
      initialUrl: initial.window.location.href,
      signal: new AbortController().signal,
      fetchImpl: fakeFetch({ [providerUrl]: fragment }, calls)
    });
    assert.equal(result.rawRecords.length, 2);
    assert.equal(result.pages.length, 2);
    assert.equal(result.warning, null);
    assert.deepEqual(calls, [providerUrl]);
  } finally { restore(); }
});

test("reports partial results when collected rows do not reach the advertised total", async () => {
  const initial = new JSDOM(`<!doctype html><body><div class="ut-menu">
    <a class="tab-anchor active" data-tab-id="whiskey">Whiskey Empire</a>
    <div class="tab-content"><h2 class="menu-title">Whiskey Empire</h2>
      <div class="menu-item"><h4 class="item-name">Only Loaded Row</h4><span class="price">$10</span></div>
      <div>Displaying items 1 - 1 of 2 in total</div>
    </div></div></body>`, { url: "https://thewestsideblono.com/drink/drink-menu/" });
  const restore = installDomGlobals(initial);
  try {
    const result = await traversePagination({
      initialDocument: initial.window.document,
      initialUrl: initial.window.location.href,
      signal: new AbortController().signal
    });
    assert.equal(result.rawRecords.length, 1);
    assert.equal(result.warning?.code, "PARTIAL_RESULTS");
    assert.match(result.warning?.message ?? "", /1 of 2 advertised entries/);
  } finally { restore(); }
});

test("traverses same-origin pages sequentially without duplicates", async () => {
  const dom = await loadFixture("whiskey-page-1.html", "https://thewestsideblono.com/drink/drink-menu/?page=1");
  const restore = installDomGlobals(dom);
  try {
    const page2 = await readFile("tests/fixtures/whiskey-page-2.html", "utf8");
    const calls: string[] = [];
    const result = await traversePagination({
      initialDocument: dom.window.document,
      initialUrl: dom.window.location.href,
      signal: new AbortController().signal,
      fetchImpl: fakeFetch({ "https://thewestsideblono.com/drink/drink-menu/?page=2": page2 }, calls)
    });
    assert.equal(result.pages.length, 2);
    assert.equal(result.rawRecords.length, 4);
    assert.deepEqual(calls, ["https://thewestsideblono.com/drink/drink-menu/?page=2"]);
  } finally { restore(); }
});
