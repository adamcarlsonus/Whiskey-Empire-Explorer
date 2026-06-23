import type { RawWhiskeyRecord, ScanErrorCode } from "../domain/types.js";
import { canonicalizeUrl, isPaginationUrl, isSupportedUrl } from "../shared/target.js";

export type LocateResult =
  | { ok: true; root: Element; canonicalPageUrl: URL }
  | { ok: false; code: Extract<ScanErrorCode, "WRONG_URL" | "TAB_NOT_ACTIVE" | "UNSUPPORTED_STRUCTURE"> };

export interface PageExtraction {
  records: RawWhiskeyRecord[];
  candidateCount: number;
  skippedCandidates: number;
  paginationUrls: URL[];
  advertisedTotal: number | null;
}

const ROW_SELECTORS = ["[data-whiskey-entry]", ".whiskey-entry", ".menu-item", "tr"];
const NAME_SELECTORS = ["[data-name]", ".whiskey-name", ".item-name", "th", "h3", "h4", "strong"];
const PRICE_SELECTORS = ["[data-price]", ".whiskey-price", ".price", ".item-price", "td:last-child"];

function textFrom(root: Element, selectors: readonly string[]): string {
  for (const selector of selectors) {
    const value = root.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function isWhiskeyTab(element: Element): boolean {
  return /whiskey\s+empire/i.test(element.textContent ?? "");
}

function isSelectedTab(element: Element): boolean {
  const selected = element.getAttribute("aria-selected");
  return selected === "true" || /(?:^|\s)(?:active|selected|et_pb_tab_active)(?:\s|$)/i.test(element.className);
}

function findTabRoot(document: Document): Element | null {
  const explicit = document.querySelector("[data-whiskey-empire-list]");
  const tabs = [...document.querySelectorAll('[role="tab"], .et_pb_tabs_controls li, [data-tab], .tablinks, .tab-anchor[data-tab-id]')];
  const whiskeyTabs = tabs.filter((tab) => isWhiskeyTab(tab));
  const whiskeyTab = whiskeyTabs.find((tab) => isSelectedTab(tab) && /whiskey\s+empire/i.test(tab.closest(".ut-menu")?.querySelector(".menu-title")?.textContent ?? ""))
    ?? whiskeyTabs.find((tab) => isSelectedTab(tab))
    ?? whiskeyTabs[0];
  if (whiskeyTab && !isSelectedTab(whiskeyTab)) return null;
  if (explicit) return explicit;
  if (!whiskeyTab) return null;

  const target = whiskeyTab.getAttribute("aria-controls") ?? whiskeyTab.getAttribute("data-target") ?? whiskeyTab.getAttribute("href")?.replace(/^#/, "");
  if (target) {
    const controlled = document.getElementById(target.replace(/^#/, ""));
    if (controlled) return controlled;
  }
  const untappdMenu = whiskeyTab.closest(".ut-menu");
  const untappdPanel = untappdMenu
    ? [...untappdMenu.querySelectorAll(".tab-content")].find((panel) => /whiskey\s+empire/i.test(panel.querySelector(".menu-title")?.textContent ?? "")) ?? null
    : null;
  return untappdPanel
    ?? whiskeyTab.closest(".tabs, .et_pb_tabs")?.querySelector('.et_pb_tab_active, [role="tabpanel"]')
    ?? null;
}

export function locateActiveList(document: Document, pageUrl = document.location?.href ?? ""): LocateResult {
  if (!isSupportedUrl(pageUrl)) return { ok: false, code: "WRONG_URL" };
  const root = findTabRoot(document);
  if (!root) return { ok: false, code: "TAB_NOT_ACTIVE" };
  const hasRows = ROW_SELECTORS.some((selector) => root.querySelector(selector));
  if (!hasRows) return { ok: false, code: "UNSUPPORTED_STRUCTURE" };
  const canonicalPageUrl = canonicalizeUrl(pageUrl);
  if (!canonicalPageUrl) return { ok: false, code: "WRONG_URL" };
  return { ok: true, root, canonicalPageUrl };
}

function field(row: Element, selector: string): string | undefined {
  const value = row.querySelector(selector)?.textContent?.trim();
  return value || undefined;
}

function categoryFor(row: Element): string | undefined {
  const own = row.getAttribute("data-category") ?? field(row, "[data-category], .whiskey-category, .category");
  if (own) return own.trim();
  const section = row.closest("[data-category]");
  if (section) return section.getAttribute("data-category")?.trim() || section.querySelector(":scope > h2, :scope > h3")?.textContent?.trim() || undefined;
  return row.closest(".section")?.querySelector(".section-name")?.textContent?.trim() || undefined;
}

export function extractPage(document: Document, pageUrl: string): PageExtraction {
  const located = isPaginationUrl(pageUrl)
    ? (() => {
        const canonicalPageUrl = canonicalizeUrl(pageUrl);
        const root = document.body;
        return canonicalPageUrl && root && root.querySelector(ROW_SELECTORS.join(","))
          ? { ok: true as const, root, canonicalPageUrl }
          : { ok: false as const, code: "UNSUPPORTED_STRUCTURE" as const };
      })()
    : locateActiveList(document, pageUrl);
  if (!located.ok) throw Object.assign(new Error(located.code), { code: located.code });

  const rows = [...located.root.querySelectorAll(ROW_SELECTORS.join(","))].filter((row, index, all) =>
    !all.some((other, otherIndex) => otherIndex !== index && other.contains(row) && ROW_SELECTORS.some((selector) => other.matches(selector)))
  );
  const records: RawWhiskeyRecord[] = [];
  let skippedCandidates = 0;
  rows.forEach((row, sourceRowIndex) => {
    const rawName = textFrom(row, NAME_SELECTORS);
    const rawPrice = textFrom(row, PRICE_SELECTORS);
    if (!rawName || !rawPrice) {
      skippedCandidates += 1;
      return;
    }
    const sourceHref = row.querySelector<HTMLAnchorElement>("a[href]")?.href;
    records.push({
      rawName,
      rawPrice,
      rawCategory: categoryFor(row),
      rawDistillery: field(row, ".item-producer, [data-brand], .whiskey-brand, .brand, .brewery"),
      rawType: field(row, "[data-type], .whiskey-type, .item-category, .item-style, .type"),
      rawRegion: field(row, "[data-region], .whiskey-region, .region, .item-brewery-location"),
      rawProof: field(row, ".item-abv, [data-proof], .whiskey-proof, .proof"),
      rawNotes: field(row, "[data-notes], .whiskey-notes, .description, p"),
      allVisibleText: row.textContent?.trim().replace(/\s+/g, " ") ?? "",
      sourcePageUrl: located.canonicalPageUrl.href,
      sourceRowIndex,
      ...(sourceHref ? { sourceHref } : {})
    });
  });

  const paginationUrls = [...located.root.querySelectorAll<HTMLAnchorElement>('nav a[href], [aria-label*="pagination" i] a[href], .pagination a[href]')]
    .map((anchor) => canonicalizeUrl(anchor.href, located.canonicalPageUrl.href))
    .filter((url): url is URL => url !== null);
  const totalMatch = (located.root.textContent ?? "").match(/Displaying items\s+\d+\s*-\s*\d+\s+of\s+([\d,]+)\s+in total/i);
  const advertisedTotal = totalMatch?.[1] ? Number(totalMatch[1].replaceAll(",", "")) : null;
  return { records, candidateCount: rows.length, skippedCandidates, paginationUrls, advertisedTotal };
}
