// src/config/ai-engine.ts
import { env, isDevelopment } from '@/env';

export const aiEngineConfig = {
  // Determine if MCP should be enabled based on environment and ENABLE_MCP env var
  useMcp: isDevelopment && (env.ENABLE_MCP ?? false),
  // Add other AI engine related configurations here if needed
  // defaultModel: 'gemini-2.0-flash-lite',
  // defaultTemperature: 0.7,
};
