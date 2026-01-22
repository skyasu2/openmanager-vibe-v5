/**
 * 🤖 AI Engine Configuration (Centralized)
 *
 * @description
 * All AI engine settings are centralized here for better maintainability.
 * This configuration covers:
 * - Cloud Run AI Engine settings (Mistral/Cerebras/Groq)
 * - Streaming AI Engine settings
 * - Provider configurations (RAG, ML, Korean NLP)
 * - Cache strategies (multi-layer)
 *
 * ## v5.84.0 (2025-12-31): Migrated from Google AI to Cloud Run
 * - Removed Gemini model references
 * - AI processing now via Cloud Run (Mistral/Cerebras/Groq)
 * - Vercel = Proxy only, Cloud Run = AI Processing
 *
 * @version 3.0.0 - Cloud Run based architecture
 * @date 2025-12-31
 */

import { env, isDevelopment, isProduction as _isProduction } from '@/env';
import { logger } from '@/lib/logging';

/**
 * 🎯 AI Model Types (Cloud Run)
 * Note: Actual model selection is handled by Cloud Run ai-engine
 */
export const AI_MODELS = {
  // Cloud Run uses Mistral for text generation
  FAST: 'mistral-small-latest',
  STANDARD: 'mistral-small-latest',
  EMBEDDING: 'mistral-embed',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

/**
 * ⚙️ Core AI Engine Configuration
 */
export const aiEngineConfig = {
  /**
   * 🔧 General Settings
   */
  defaultModel: AI_MODELS.FAST,
  temperature: 0.7,
  maxTokens: 2048,
  timeout: 30000, // 30 seconds (will be replaced by dynamic timeout)

  /**
   * 🔌 MCP Integration
   */
  useMcp: isDevelopment && (env.ENABLE_MCP ?? false),

  /**
   * 💾 Cache Configuration (Multi-layer Strategy)
   */
  cache: {
    // L1: Unified Engine Cache (Cloud Run AI Engine)
    unified: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100,
    },

    // L4: Streaming Engine Cache (Ultra-fast)
    streaming: {
      enabled: true,
      ttl: 180000, // 3 minutes
      maxSize: 50,
    },

    // Provider-specific cache TTLs
    providers: {
      // L3: RAG (Supabase)
      rag: {
        ttl: 180000, // 3 minutes
      },
      // L2: ML Analytics (Cloud Run)
      ml: {
        ttl: 600000, // 10 minutes
      },
      // L2: Korean NLP (Cloud Run)
      nlp: {
        ttl: 600000, // 10 minutes
      },
    },
  },

  /**
   * 🎛️ Provider Configuration
   */
  providers: {
    // RAG Provider (Supabase)
    rag: {
      enabled: true,
      maxResults: 5,
      threshold: 0.7,
      endpoint: env.NEXT_PUBLIC_SUPABASE_URL,
    },

    // ML Analytics Provider (Cloud Run Analyst Agent)
    ml: {
      enabled: true,
      models: [
        'anomaly-detection',
        'trend-analysis',
        'pattern-recognition',
      ] as const,
      // NOTE: All ML processing via Cloud Run ai-engine
      endpoint: undefined, // Handled by /api/ai/supervisor proxy
      timeout: 5000, // 5 seconds
    },

    // Korean NLP Provider (Cloud Run NLQ Agent)
    nlp: {
      enabled: true,
      // NOTE: All NLP processing via Cloud Run ai-engine
      endpoint: undefined, // Handled by /api/ai/supervisor proxy
      corsEnabled: false, // Direct server-to-server
      timeout: 5000, // 5 seconds
    },

    // Rule-based Provider (Local)
    rule: {
      enabled: true,
      confidenceThreshold: 0.6,
    },
  },

  /**
   * ⚡ Streaming Configuration
   */
  streaming: {
    enabled: true,
    targetResponseTime: 152, // Target: 152ms (ultra-fast)
    maxConcurrency: 5, // Parallel query limit
    predictiveCaching: true, // Enable pattern-based preloading

    // Initial response timing (< 20ms)
    initialResponseDelay: 20,

    // Pattern learning
    minPatternFrequency: 3, // Learn after 3 occurrences
    maxPreloadedResponses: 20, // Cache up to 20 predicted responses
  },

  /**
   * 🛡️ Rate Limiting (Cloud Run managed)
   * Note: Actual quota management is handled by Cloud Run ai-engine
   */
  rateLimiting: {
    enabled: true,
    models: [AI_MODELS.FAST, AI_MODELS.STANDARD, AI_MODELS.EMBEDDING] as AIModel[],
    warningThreshold: 0.8, // Alert at 80% usage
  },

  /**
   * 🎯 Scenario-based Provider Selection
   */
  scenarios: {
    // Server monitoring query
    monitoring: {
      enableRAG: true,
      enableML: true,
      enableRules: true,
      enableNLP: false,
    },

    // Performance analysis
    performance: {
      enableRAG: true,
      enableML: true,
      enableRules: true,
      enableNLP: false,
    },

    // General query (Korean heavy)
    general: {
      enableRAG: true,
      enableML: false,
      enableRules: true,
      enableNLP: true,
    },

    // Quick query (minimal context)
    quick: {
      enableRAG: false,
      enableML: false,
      enableRules: true,
      enableNLP: false,
    },
  } as const,

  /**
   * 🔧 Advanced Settings
   */
  advanced: {
    // Parallel context collection
    parallelProviders: true,

    // Health check interval (5 minutes)
    healthCheckInterval: 300000,

    // Statistics collection
    collectStats: true,

    // Graceful degradation
    gracefulDegradation: true,

    // Retry configuration (Vercel AI SDK handles advanced retry)
    maxRetries: 3,
    retryDelay: 1000, // 1 second base delay
  },
} as const;

/**
 * 📊 Export type for type safety
 */
export type AIEngineConfig = typeof aiEngineConfig;

/**
 * 🎯 Helper functions
 */
export const getProviderConfig = (
  providerKey: keyof typeof aiEngineConfig.providers
) => {
  return aiEngineConfig.providers[providerKey];
};

export const getScenarioConfig = (
  scenario: keyof typeof aiEngineConfig.scenarios
) => {
  return aiEngineConfig.scenarios[scenario];
};

export const getCacheConfig = (layer: keyof typeof aiEngineConfig.cache) => {
  return aiEngineConfig.cache[layer];
};

/**
 * 🚀 Development logging
 */
if (isDevelopment) {
  logger.info('🤖 AI Engine Config Loaded:', {
    model: aiEngineConfig.defaultModel,
    rateLimiting: aiEngineConfig.rateLimiting.enabled,
    streaming: aiEngineConfig.streaming.enabled,
    providers: Object.keys(aiEngineConfig.providers).filter(
      (key) =>
        aiEngineConfig.providers[key as keyof typeof aiEngineConfig.providers]
          .enabled
    ),
  });
}
