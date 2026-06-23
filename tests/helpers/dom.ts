import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

export async function loadFixture(name: string, url = "https://thewestsideblono.com/drink/drink-menu/"): Promise<JSDOM> {
  const html = await readFile(resolve("tests/fixtures", name), "utf8");
  return new JSDOM(html, { url, pretendToBeVisual: true });
}

export function installDomGlobals(dom: JSDOM): () => void {
  const previous = new Map<string, unknown>();
  for (const key of ["window", "document", "HTMLElement", "Element", "Node", "DOMParser", "Event", "CustomEvent", "AbortController", "DOMException", "DocumentFragment", "HTMLTableRowElement", "Option"]) {
    previous.set(key, Reflect.get(globalThis, key));
    Reflect.set(globalThis, key, Reflect.get(dom.window, key));
  }
  if (!("matchMedia" in dom.window)) {
    Object.defineProperty(dom.window, "matchMedia", { value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
  }
  previous.set("matchMedia", Reflect.get(globalThis, "matchMedia"));
  Reflect.set(globalThis, "matchMedia", dom.window.matchMedia.bind(dom.window));
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) Reflect.deleteProperty(globalThis, key);
      else Reflect.set(globalThis, key, value);
    }
  };
}

export function fakeFetch(pages: Record<string, string>, calls: string[] = []): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const html = pages[url];
    if (html === undefined) return new Response("Missing", { status: 404 });
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  }) as typeof fetch;
}
