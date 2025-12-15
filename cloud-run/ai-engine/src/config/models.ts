/**
 * 🎯 AI Model Types
 */
export const AI_MODELS = {
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
