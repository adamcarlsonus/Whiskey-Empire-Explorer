import { access, readFile } from "node:fs/promises";
import { BUILT_MANIFEST_PATH, EXTENSION_PATH, SUPPORTED_PLATFORM, TARGET_ORIGIN, TARGET_URL } from "./config.mjs";
import { assertManagedChromiumAvailable } from "./browser.mjs";
import { TimeoutError } from "./stages.mjs";

export class BlockedError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "BlockedError";
    this.blocked = true;
  }
}

export function exitCodeFor(error, forcedCode = null) {
  if (forcedCode !== null) return forcedCode;
  if (error instanceof BlockedError) return 2;
  if (error instanceof TimeoutError) return 124;
  return Number.isInteger(error?.exitCode) ? error.exitCode : 1;
}

export async function checkPrerequisites({ recordRequest = () => {} } = {}) {
  if (process.platform !== SUPPORTED_PLATFORM) throw new BlockedError(`Live E2E supports macOS; observed ${process.platform}`);
  try {
    await Promise.all([assertManagedChromiumAvailable(), access(EXTENSION_PATH), access(BUILT_MANIFEST_PATH)]);
  } catch (error) {
    throw new BlockedError("Managed Chromium or the production build is unavailable.", { cause: error });
  }
  const manifest = JSON.parse(await readFile(BUILT_MANIFEST_PATH, "utf8"));
  if (!manifest.action?.default_popup) throw new BlockedError("Production manifest has no default popup.");
  recordRequest(TARGET_URL);
  let response;
  try {
    response = await fetch(TARGET_URL, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    throw new BlockedError("The live restaurant page is unreachable.", { cause: error });
  }
  if (response.status >= 400 || new URL(response.url || TARGET_URL).origin !== TARGET_ORIGIN) throw new BlockedError(`Live restaurant prerequisite returned ${response.status}.`);
  return { browserAvailable: true, extensionBuildAvailable: true, targetReachable: true, defaultActionAvailable: true };
}
