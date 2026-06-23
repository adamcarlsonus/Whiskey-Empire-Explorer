import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TARGET_URL = "https://thewestsideblono.com/drink/drink-menu/";
export const TARGET_ORIGIN = new URL(TARGET_URL).origin;
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const EXTENSION_PATH = resolve(REPO_ROOT, "dist");
export const SOURCE_MANIFEST_PATH = resolve(REPO_ROOT, "manifest.json");
export const BUILT_MANIFEST_PATH = resolve(EXTENSION_PATH, "manifest.json");
export const REPORT_ROOT = resolve(REPO_ROOT, "test-results/live-extension");
export const PROFILE_PREFIX = resolve(tmpdir(), "whiskey-empire-west-e2e-");
export const SUPPORTED_PLATFORM = "darwin";
export const REPORT_RETENTION = 10;
export const MAX_ERRORS = 20;
export const MAX_FRAME_ORIGINS = 20;
export const MAX_REQUEST_ORIGINS = 20;
export const MAX_VISIBLE_ELEMENTS = 50;
export const WORK_DEADLINE_MS = 115_000;
export const CLEANUP_RESERVE_MS = 5_000;

export const STAGE_DEADLINES = Object.freeze({
  prerequisites: 15_000,
  "build-identity": 10_000,
  "browser-launch": 20_000,
  "extension-availability": 10_000,
  "live-page": 25_000,
  "whiskey-tab": 20_000,
  "action-popup": 10_000,
  "scan-start": 10_000,
  "scan-completion": 40_000,
  "search-assertion": 10_000,
  "sort-assertion": 10_000,
  cleanup: CLEANUP_RESERVE_MS
});
