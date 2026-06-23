import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { chromium } from "playwright";
import { BUILT_MANIFEST_PATH, EXTENSION_PATH, PROFILE_PREFIX, SOURCE_MANIFEST_PATH } from "./config.mjs";

async function json(path) { return JSON.parse(await readFile(path, "utf8")); }

function values(manifest, key) { return [...(manifest[key] ?? [])].sort(); }

export function assertManifestEquality(source, built) {
  for (const key of ["name", "version", "manifest_version"]) assert.deepEqual(built[key], source[key], `Built manifest ${key} differs from source`);
  for (const key of ["permissions", "host_permissions"]) assert.deepEqual(values(built, key), values(source, key), `Built manifest ${key} differs from source`);
}

async function filesRecursively(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesRecursively(root, path));
    else files.push({ path, name: relative(root, path) });
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function digestDirectory(root = EXTENSION_PATH) {
  const hash = createHash("sha256");
  for (const file of await filesRecursively(root)) {
    hash.update(file.name);
    hash.update("\0");
    hash.update(await readFile(file.path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function readProductionIdentity() {
  const [source, built] = await Promise.all([json(SOURCE_MANIFEST_PATH), json(BUILT_MANIFEST_PATH)]);
  assertManifestEquality(source, built);
  return {
    name: built.name,
    version: built.version,
    manifestVersion: built.manifest_version,
    permissions: values(built, "permissions"),
    hostPermissions: values(built, "host_permissions"),
    buildDigest: await digestDirectory()
  };
}

export function managedChromiumPath() { return chromium.executablePath(); }

export async function assertManagedChromiumAvailable() { await access(managedChromiumPath()); }

export function createCleanup(context, profilePath) {
  let result;
  return async () => {
    if (result) return result;
    await context.close().catch(() => {});
    await rm(profilePath, { recursive: true, force: true });
    result = { browserClosed: true, profileRemoved: true, finishedAt: new Date().toISOString(), message: "Isolated Chromium closed and temporary profile removed." };
    return result;
  };
}

export async function launchIsolatedBrowser({ headless = false } = {}) {
  const profilePath = await mkdtemp(PROFILE_PREFIX);
  const profileId = randomUUID();
  let context;
  try {
    context = await chromium.launchPersistentContext(profilePath, {
      channel: "chromium",
      headless,
      timeout: 20_000,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        "--disable-background-networking",
        "--disable-component-update",
        "--enable-unsafe-extension-debugging",
        "--no-first-run",
        "--no-default-browser-check"
      ]
    });
  } catch (error) {
    await rm(profilePath, { recursive: true, force: true });
    throw error;
  }

  const cleanup = createCleanup(context, profilePath);

  return {
    context,
    profileId,
    profilePath,
    browserIdentity: {
      provider: "playwright",
      browserName: "chromium",
      version: context.browser()?.version() ?? "unknown",
      headless,
      profileId
    },
    cleanup
  };
}

export async function verifyInstalledExtension(context, expected) {
  const page = await context.newPage();
  try {
    await page.goto("chrome://extensions/");
    await page.locator("extensions-manager").waitFor({ state: "attached", timeout: 10_000 });
    const candidates = await page.locator("extensions-manager extensions-item").evaluateAll((items) => items.map((item) => ({
      id: item.getAttribute("id") || item.data?.id || "",
      name: item.shadowRoot?.querySelector("#name")?.textContent?.trim() || item.data?.name || "",
      version: item.shadowRoot?.querySelector("#version")?.textContent?.replace(/^Version\s*/i, "").trim() || item.data?.version || "",
      enabled: item.data?.state === 1 || item.shadowRoot?.querySelector("#enableToggle")?.hasAttribute("checked") || false
    })));
    const matches = candidates.filter((item) => item.name === expected.name && item.version === expected.version && item.enabled);
    assert.equal(matches.length, 1, `Expected one enabled ${expected.name} ${expected.version} extension; found ${matches.length}`);
    assert.match(matches[0].id, /^[a-p]{32}$/, "Chromium did not expose a valid extension ID");
    return { id: matches[0].id, ...expected };
  } finally {
    await page.close().catch(() => {});
  }
}
