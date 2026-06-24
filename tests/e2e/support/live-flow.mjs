import assert from "node:assert/strict";
import { TARGET_ORIGIN, TARGET_URL } from "./config.mjs";
import { originOnly, sanitizeText } from "./report.mjs";

export function parseCompleteStatus(value) {
  const match = String(value).trim().match(/^Scan complete:\s*(\d+)\s+entries\.$/i);
  const count = match ? Number(match[1]) : 0;
  assert.ok(count > 0, `Expected complete scan with positive entries; observed: ${sanitizeText(value, 200)}`);
  return count;
}

export function parseShownCount(value) {
  const match = String(value).trim().match(/^(\d+)\s+of\s+(\d+)\s+whiskeys shown\.$/i);
  assert.ok(match, `Expected positive filtered count; observed: ${sanitizeText(value, 200)}`);
  const shown = Number(match[1]);
  const total = Number(match[2]);
  assert.ok(shown > 0 && total >= shown, `Invalid filtered count: ${sanitizeText(value, 200)}`);
  return { shown, total };
}

export function parseAdvertisedTotal(value) {
  const match = String(value).match(/Displaying items\s+\d+\s*-\s*\d+\s+of\s+([\d,]+)\s+in total/i);
  const total = match?.[1] ? Number(match[1].replaceAll(",", "")) : 0;
  assert.ok(total > 0, `Expected a positive advertised whiskey total; observed: ${sanitizeText(value, 200)}`);
  return total;
}

export function deriveSearchToken(name) {
  const token = String(name).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]{2,}/u)?.[0] ?? "";
  assert.ok(token, "Observed whiskey name has no searchable token");
  return token;
}

export function requireDescendingSort(selected, ariaSort) {
  assert.equal(selected, "price-desc", "Price high-to-low is not selected");
  assert.equal(ariaSort, "descending", "Price column does not expose descending aria-sort");
}

export async function openLivePage(context) {
  const page = context.pages().find((candidate) => candidate.url() === "about:blank") ?? await context.newPage();
  const response = await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  assert.ok(response && response.ok(), `Live page returned ${response?.status() ?? "no response"}`);
  assert.equal(new URL(page.url()).origin, TARGET_ORIGIN, "Live page redirected to another origin");
  return page;
}

export async function observeWhiskeyTab(page) {
  await page.waitForLoadState("domcontentloaded");
  const deadline = Date.now() + 18_000;
  let visible = [];
  while (Date.now() < deadline && visible.length === 0) {
    for (const frame of page.frames()) {
      const candidates = frame.locator(".ut-menu .tab-anchor[data-tab-id]").filter({ hasText: /Whiskey\s+Empire/i });
      for (let index = 0; index < await candidates.count(); index += 1) {
        const candidate = candidates.nth(index);
        if (await candidate.isVisible().catch(() => false)) visible.push({ frame, candidate });
      }
    }
    if (visible.length === 0) await page.waitForTimeout(250);
  }
  assert.ok(visible.length > 0, "No visible Whiskey Empire control was found");
  for (const { frame, candidate } of visible) {
    const menu = candidate.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' ut-menu ')][1]");
    if (!await menu.count()) continue;
    const selected = await candidate.evaluate((element) => element.getAttribute("aria-selected") === "true" || /(^|\s)(active|selected|et_pb_tab_active)(\s|$)/i.test(element.className));
    const whiskeyPanel = menu.locator(".tab-content")
      .filter({ hasText: /Whiskey\s+Empire/i })
      .filter({ hasText: /Displaying items\s+\d+\s*-\s*\d+\s+of\s+[\d,]+\s+in total/i })
      .first();
    const advertisedTotal = parseAdvertisedTotal(await whiskeyPanel.textContent());
    return {
      accessibleName: "Whiskey Empire",
      role: await candidate.getAttribute("role") ?? await candidate.evaluate((element) => element.tagName.toLowerCase()),
      frameOrigin: originOnly(frame.url()) ?? "null",
      selected: Boolean(selected),
      advertisedTotal
    };
  }
  throw new Error("The visible Whiskey Empire control was not associated with a readable menu");
}

export async function assertWhiskeyTabSelected(page) {
  for (const frame of page.frames()) {
    const candidates = frame.locator(".ut-menu .tab-anchor[data-tab-id]").filter({ hasText: /Whiskey\s+Empire/i });
    for (let index = 0; index < await candidates.count(); index += 1) {
      const candidate = candidates.nth(index);
      if (!await candidate.isVisible().catch(() => false)) continue;
      const selected = await candidate.evaluate((element) => element.getAttribute("aria-selected") === "true" || /(^|\s)(active|selected|et_pb_tab_active)(\s|$)/i.test(element.className));
      if (selected) return true;
    }
  }
  throw new Error("The production scan did not select the Whiskey Empire tab");
}

export async function activateActionPopup(context, page, extensionId) {
  const existing = new Set(context.pages());
  await page.bringToFront();
  const browserSession = await context.browser().newBrowserCDPSession();
  const { targetInfos } = await browserSession.send("Target.getTargets", { filter: [{ type: "tab", exclude: false }] });
  const target = targetInfos.find((candidate) => candidate.type === "tab" && candidate.url === page.url());
  assert.ok(target, "Chromium did not expose the active restaurant tab target");
  const popupPromise = context.waitForEvent("page", {
    predicate: (candidate) => !existing.has(candidate) && candidate.url().startsWith(`chrome-extension://${extensionId}/`)
  });
  void popupPromise.catch(() => {});
  try {
    await browserSession.send("Extensions.triggerAction", { id: extensionId, targetId: target.targetId });
    let popup = await Promise.race([
      popupPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 750))
    ]);
    if (!popup) {
      popup = await context.newPage();
      await page.bringToFront();
      await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    }
    await popup.waitForLoadState("domcontentloaded");
    return popup;
  } finally {
    await browserSession.detach().catch(() => {});
  }
}

export async function startProductionScan(popup) {
  const scan = popup.getByRole("button", { name: "Scan whiskey list" });
  await scan.waitFor({ state: "visible" });
  assert.equal(await scan.isEnabled(), true, "Production Scan button is disabled");
  const scanLabel = (await scan.textContent())?.trim() ?? "";
  await scan.click();
  const status = (await popup.locator("#status").textContent().catch(() => ""))?.trim() ?? "";
  return {
    origin: `${new URL(popup.url()).protocol}//${new URL(popup.url()).host}`,
    scanLabel,
    scanEnabled: true,
    acknowledged: !/could not|not available|did not answer/i.test(status),
    statusText: sanitizeText(status, 500)
  };
}

export async function observeSuccessfulPanel(page) {
  const host = page.locator("#whiskey-empire-west-panel");
  await host.waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const text = document.querySelector("#whiskey-empire-west-panel")?.shadowRoot?.querySelector("#wew-status")?.textContent ?? "";
    return /scan complete|partial scan complete|not supported|could not|no entries|cancelled/i.test(text);
  });
  const status = (await host.locator("#wew-status").textContent())?.trim() ?? "";
  const resultCount = parseCompleteStatus(status);
  const countText = (await host.locator("#wew-count").textContent())?.trim() ?? "";
  const initial = parseShownCount(countText);
  assert.equal(initial.total, resultCount);
  return { host, status, resultCount };
}

export async function assertSearch(host) {
  const firstName = (await host.locator("#wew-body tr").first().locator("td").first().textContent())?.trim() ?? "";
  const query = deriveSearchToken(firstName);
  await host.locator("#wew-query").fill(query);
  const filtered = parseShownCount((await host.locator("#wew-count").textContent())?.trim() ?? "");
  return { queryLength: query.length, filteredCount: filtered.shown };
}

export async function assertSort(host) {
  await host.locator("#wew-sort").selectOption("price-desc");
  const selectedSort = await host.locator("#wew-sort").inputValue();
  const ariaSort = await host.locator("#wew-price-head").getAttribute("aria-sort");
  requireDescendingSort(selectedSort, ariaSort);
  return { selectedSort, ariaSort };
}
