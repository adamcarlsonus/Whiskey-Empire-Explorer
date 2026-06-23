export const FAILURE_SCENARIOS = Object.freeze([
  { classification: "browser-launch", stage: "browser-launch", exitCode: 2, discriminator: "managed Chromium unavailable" },
  { classification: "extension-install", stage: "extension-availability", exitCode: 1, discriminator: "production extension not accepted" },
  { classification: "network-page", stage: "live-page", exitCode: 2, discriminator: "restaurant page unreachable or redirected" },
  { classification: "tab-selection", stage: "whiskey-tab", exitCode: 1, discriminator: "Whiskey Empire control unavailable" },
  { classification: "action-popup", stage: "action-popup", exitCode: 1, discriminator: "default action or popup unavailable" },
  { classification: "injection-messaging", stage: "scan-start", exitCode: 1, discriminator: "production popup did not acknowledge Scan" },
  { classification: "scanner", stage: "scan-completion", exitCode: 1, discriminator: "scan unsupported, partial, failed, or empty" },
  { classification: "assertion", stage: "search-assertion", exitCode: 1, discriminator: "search or sort evidence invalid" }
]);

export function seededFailure(name = process.env.WEW_E2E_SEED_FAILURE) {
  if (!name) return null;
  const scenario = FAILURE_SCENARIOS.find((candidate) => candidate.classification === name);
  if (!scenario) throw new Error(`Unknown seeded failure: ${name}`);
  return scenario;
}

export function throwIfSeeded(scenario, stage) {
  if (scenario?.stage === stage) throw Object.assign(new Error(`[seeded] ${scenario.discriminator}`), { seeded: true, exitCode: scenario.exitCode });
}
