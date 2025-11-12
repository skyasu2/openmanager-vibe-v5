/**
 * Shared feature flags for Playwright suites.
 * Admin mode/page were fully removed in v5.80, so legacy tests should skip.
 */
export const ADMIN_FEATURES_REMOVED = true;
export const ADMIN_FEATURES_SKIP_MESSAGE =
  'Legacy admin mode/page flows were retired in v5.80; update the scenario before reenabling.';
