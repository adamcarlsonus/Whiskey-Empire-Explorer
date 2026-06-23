import assert from "node:assert/strict";
import test from "node:test";
import { traversePagination } from "../../src/content/pagination.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("returns partial results when a later request fails", async () => {
  const dom = await loadFixture("whiskey-page-1.html", "https://thewestsideblono.com/drink/drink-menu/?page=1");
  const restore = installDomGlobals(dom);
  try {
    const result = await traversePagination({
      initialDocument: dom.window.document,
      initialUrl: dom.window.location.href,
      signal: new AbortController().signal,
      fetchImpl: (async () => new Response("denied", { status: 429 })) as typeof fetch
    });
    assert.equal(result.warning?.code, "PARTIAL_RESULTS");
    assert.equal(result.rawRecords.length, 2);
    assert.equal(result.pages[1]?.errorCode, "REQUEST_FAILED");
  } finally { restore(); }
});

test("honors cancellation before a request", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(traversePagination({ initialDocument: dom.window.document, initialUrl: dom.window.location.href, signal: controller.signal }), { name: "AbortError" });
  } finally { restore(); }
});
