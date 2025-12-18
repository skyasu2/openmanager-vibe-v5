/**
 * 🎯 AI Model Types
 */
export const AI_MODELS = {
  // Note: gemini-2.5-flash-lite doesn't exist (2025-12), using flash as default
  FLASH_LITE: 'gemini-2.5-flash',
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro', // QUOTA_EXCEEDED on free tier
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
