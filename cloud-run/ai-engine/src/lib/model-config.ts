/**
 * API Key Configuration
 *
 * Minimal configuration for API key validation.
 * LangChain model factories removed (2025-12-28) - using AI SDK instead.
 *
 * @version 2.0.0
 * @updated 2025-12-28
 */

import { getGroqApiKey, getCerebrasApiKey } from './config-parser';

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validate that all required API keys are configured
 */
export function validateAPIKeys(): {
  mistral: boolean;
  groq: boolean;
  cerebras: boolean;
  all: boolean;
} {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = getGroqApiKey();
  const cerebrasKey = getCerebrasApiKey();

  return {
    mistral: !!mistralKey,
    groq: !!groqKey,
    cerebras: !!cerebrasKey,
    all: !!mistralKey && !!groqKey && !!cerebrasKey,
  };
}

/**
 * Log API key status to console
 */
export function logAPIKeyStatus(): void {
  const status = validateAPIKeys();
  console.log('🔑 API Key Status:', {
    'Mistral AI': status.mistral ? '✅' : '❌',
    Groq: status.groq ? '✅' : '❌',
    Cerebras: status.cerebras ? '✅' : '❌',
  });
}
