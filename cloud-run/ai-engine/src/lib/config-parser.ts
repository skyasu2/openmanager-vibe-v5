/**
 * Secret Configuration Parser
 * Parses JSON-based consolidated secrets from environment variables
 *
 * @module secret-config
 * @version 1.0.0
 *
 * ## Secret Consolidation (2025-12-25)
 * Consolidated 10 individual secrets into 4 grouped secrets for cost optimization:
 * - langfuse-config: LangFuse observability settings
 * - google-ai-config: Gemini API keys (primary + secondary failover)
 * - supabase-config: Supabase connection settings
 * - cloud-run-api-secret: API authentication (unchanged)
 */

// =============================================================================
// Types
// =============================================================================

export interface LangFuseConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
}

export interface GoogleAIConfig {
  primaryKey: string;
  secondaryKey: string;
}

export interface SupabaseConfig {
  url: string;
  directUrl: string;
  serviceRoleKey: string;
}

// =============================================================================
// JSON Parsing Helpers
// =============================================================================

function parseJsonSecret<T>(envVar: string, secretName: string): T | null {
  const value = process.env[envVar];
  if (!value) {
    console.warn(`⚠️ [Config] ${secretName} not found in environment`);
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error(`❌ [Config] Failed to parse ${secretName}:`, err);
    return null;
  }
}

// =============================================================================
// Legacy Environment Variable Support
// =============================================================================

function getLangFuseConfigLegacy(): LangFuseConfig | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL;

  if (publicKey && secretKey) {
    return {
      baseUrl: baseUrl || 'https://cloud.langfuse.com',
      publicKey,
      secretKey,
    };
  }
  return null;
}

function getGoogleAIConfigLegacy(): GoogleAIConfig | null {
  const primaryKey = process.env.GEMINI_API_KEY_PRIMARY;
  const secondaryKey = process.env.GEMINI_API_KEY_SECONDARY;

  if (primaryKey) {
    return {
      primaryKey,
      secondaryKey: secondaryKey || primaryKey,
    };
  }
  return null;
}

function getSupabaseConfigLegacy(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const directUrl = process.env.SUPABASE_DIRECT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    return {
      url,
      directUrl: directUrl || url,
      serviceRoleKey,
    };
  }
  return null;
}

// =============================================================================
// Public API - Config Getters with Fallback
// =============================================================================

let cachedLangFuseConfig: LangFuseConfig | null = null;
let cachedGoogleAIConfig: GoogleAIConfig | null = null;
let cachedSupabaseConfig: SupabaseConfig | null = null;

/**
 * Get LangFuse configuration
 * Tries JSON secret first, falls back to legacy env vars
 */
export function getLangFuseConfig(): LangFuseConfig | null {
  if (cachedLangFuseConfig) return cachedLangFuseConfig;

  // Try JSON secret first
  cachedLangFuseConfig = parseJsonSecret<LangFuseConfig>(
    'LANGFUSE_CONFIG',
    'langfuse-config'
  );

  // Fallback to legacy env vars
  if (!cachedLangFuseConfig) {
    cachedLangFuseConfig = getLangFuseConfigLegacy();
  }

  return cachedLangFuseConfig;
}

/**
 * Get Google AI (Gemini) configuration
 * Tries JSON secret first, falls back to legacy env vars
 */
export function getGoogleAIConfig(): GoogleAIConfig | null {
  if (cachedGoogleAIConfig) return cachedGoogleAIConfig;

  // Try JSON secret first
  cachedGoogleAIConfig = parseJsonSecret<GoogleAIConfig>(
    'GOOGLE_AI_CONFIG',
    'google-ai-config'
  );

  // Fallback to legacy env vars
  if (!cachedGoogleAIConfig) {
    cachedGoogleAIConfig = getGoogleAIConfigLegacy();
  }

  return cachedGoogleAIConfig;
}

/**
 * Get Supabase configuration
 * Tries JSON secret first, falls back to legacy env vars
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  if (cachedSupabaseConfig) return cachedSupabaseConfig;

  // Try JSON secret first
  cachedSupabaseConfig = parseJsonSecret<SupabaseConfig>(
    'SUPABASE_CONFIG',
    'supabase-config'
  );

  // Fallback to legacy env vars
  if (!cachedSupabaseConfig) {
    cachedSupabaseConfig = getSupabaseConfigLegacy();
  }

  return cachedSupabaseConfig;
}

/**
 * Get Cloud Run API Secret (unchanged - single value)
 */
export function getCloudRunApiSecret(): string | null {
  return process.env.CLOUD_RUN_API_SECRET || null;
}

/**
 * Get Groq API Key (kept as individual secret for now)
 */
export function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

// =============================================================================
// Status & Debugging
// =============================================================================

export function getConfigStatus(): {
  langfuse: boolean;
  googleAI: boolean;
  supabase: boolean;
  groq: boolean;
  cloudRunApi: boolean;
} {
  return {
    langfuse: getLangFuseConfig() !== null,
    googleAI: getGoogleAIConfig() !== null,
    supabase: getSupabaseConfig() !== null,
    groq: getGroqApiKey() !== null,
    cloudRunApi: getCloudRunApiSecret() !== null,
  };
}

/**
 * Clear cached configs (for testing)
 */
export function clearConfigCache(): void {
  cachedLangFuseConfig = null;
  cachedGoogleAIConfig = null;
  cachedSupabaseConfig = null;
}
