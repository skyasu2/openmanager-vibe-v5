/**
 * 🎯 AI Model Types (Rate Limits as of 2025-12)
 * @see https://ai.google.dev/gemini-api/docs/rate-limits
 *
 * FREE Tier: Flash & Flash-Lite share 500 RPD pool (account/project varies)
 * Model selection: Performance vs Cost/Speed tradeoff
 */
export const AI_MODELS = {
  // Fast, cheap - Best for routing/simple tasks (shares 500 RPD pool)
  FLASH_LITE: 'gemini-2.5-flash-lite',
  // Higher quality - Best for complex reasoning (shares 500 RPD pool)
  FLASH: 'gemini-2.5-flash',
  // Preview (Unstable) - For experimental features
  FLASH_V3: 'gemini-3.0-flash-preview',
  // Paid Only (0 RPD FREE tier)
  PRO: 'gemini-2.5-pro',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
