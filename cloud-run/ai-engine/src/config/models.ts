/**
 * 🎯 AI Model Types
 */
export const AI_MODELS = {
  // High Quota (1,500 RPD) - Best for Supervisor/Routing
  FLASH_LITE: 'gemini-2.5-flash-lite',
  // Standard (20 RPD) - Low Quota, use carefully
  FLASH: 'gemini-2.5-flash',
  // Preview (Free/Unstable) - Good for fallback or experimental
  FLASH_V3: 'gemini-3.0-flash-preview',
  // Paid Only (0 RPD Free)
  PRO: 'gemini-2.5-pro',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
