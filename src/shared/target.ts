export const SUPPORTED_ORIGIN = "https://thewestsideblono.com";
export const SUPPORTED_PATH = "/drink/drink-menu/";
export const SUPPORTED_URL = `${SUPPORTED_ORIGIN}${SUPPORTED_PATH}`;
export const PAGINATION_ORIGIN = "https://business.untappd.com";
export const MAX_PAGES = 20;
export const MAX_ENTRIES = 2_000;

const PAGINATION_PATH = /^\/locations\/\d+\/themes\/\d+\/items\/?$/;

function canonicalizePaginationUrl(url: URL): URL | null {
  if (url.protocol !== "https:" || url.origin !== PAGINATION_ORIGIN || !PAGINATION_PATH.test(url.pathname)) return null;
  const page = url.searchParams.get("page");
  const sectionId = url.searchParams.get("section_id");
  if (!page || !/^\d+$/.test(page) || Number(page) < 1 || Number(page) > MAX_PAGES) return null;
  if (!sectionId || !/^\d+$/.test(sectionId)) return null;
  url.search = "";
  url.searchParams.set("page", page);
  url.searchParams.set("section_id", sectionId);
  return url;
}

export function canonicalizeUrl(value: string | URL, base = SUPPORTED_URL): URL | null {
  try {
    const url = new URL(value, base);
    url.hash = "";
    if (url.origin === PAGINATION_ORIGIN) return canonicalizePaginationUrl(url);
    if (url.protocol !== "https:" || url.origin !== SUPPORTED_ORIGIN) return null;
    const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    if (normalizedPath !== SUPPORTED_PATH) return null;
    url.pathname = SUPPORTED_PATH;
    return url;
  } catch {
    return null;
  }
}

export function isPaginationUrl(value: string | URL): boolean {
  try {
    const supplied = new URL(value);
    return supplied.origin === PAGINATION_ORIGIN && canonicalizePaginationUrl(supplied) !== null;
  } catch {
    return false;
  }
}

export function isSupportedUrl(value: string): boolean {
  const url = canonicalizeUrl(value);
  if (!url) return false;
  const supplied = new URL(value);
  return supplied.origin === SUPPORTED_ORIGIN && (supplied.pathname === SUPPORTED_PATH || supplied.pathname === SUPPORTED_PATH.slice(0, -1));
}
