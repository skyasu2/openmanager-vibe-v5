/**
 * 🤖 AI Engine Configuration (Centralized)
 *
 * @description
 * All AI engine settings are centralized here for better maintainability.
 * This configuration covers:
 * - Google AI Unified Engine settings
 * - Streaming AI Engine settings
 * - Provider configurations (RAG, ML, Korean NLP)
 * - Cache strategies (multi-layer)
 * - Quota protection
 *
 * @version 2.0.0 - Expanded from 7 lines to 150+ lines
 * @date 2025-11-21
 */

import { env, isDevelopment, isProduction as _isProduction } from '@/env';

/**
 * 🎯 AI Model Types
 */
export const AI_MODELS = {
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

/**
 * ⚙️ Core AI Engine Configuration
 */
export const aiEngineConfig = {
  /**
   * 🔧 General Settings
   */
  defaultModel: AI_MODELS.FLASH_LITE,
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
    // L1: Unified Engine Cache (Google AI Unified Engine)
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
      // L2: ML Analytics (LangGraph)
      ml: {
        ttl: 600000, // 10 minutes
      },
      // L2: Korean NLP (LangGraph)
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

    // ML Analytics Provider (Now handled by local LangGraph)
    ml: {
      enabled: true,
      models: [
        'anomaly-detection',
        'trend-analysis',
        'pattern-recognition',
      ] as const,
      // NOTE: Cloud Run ai-backend removed (2025-12-14)
      // ML analytics now run locally via src/services/langgraph/
      endpoint: undefined,
      timeout: 5000, // 5 seconds
    },

    // Korean NLP Provider (Now handled by local LangGraph)
    nlp: {
      enabled: true,
      // NOTE: Cloud Run ai-backend removed (2025-12-14)
      // NLP now run locally via src/services/langgraph/
      endpoint: undefined,
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
   * 🛡️ Quota Protection
   */
  quotaProtection: {
    enabled: env.GOOGLE_AI_QUOTA_PROTECTION === 'true',
    models: [AI_MODELS.FLASH_LITE, AI_MODELS.FLASH, AI_MODELS.PRO] as AIModel[],
    dailyLimit: parseInt(env.GOOGLE_AI_DAILY_LIMIT ?? '1500', 10),
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

    // Retry configuration (basic - will be enhanced by AIErrorHandler)
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
  console.log('🤖 AI Engine Config Loaded:', {
    model: aiEngineConfig.defaultModel,
    quotaProtection: aiEngineConfig.quotaProtection.enabled,
    streaming: aiEngineConfig.streaming.enabled,
    providers: Object.keys(aiEngineConfig.providers).filter(
      (key) =>
        aiEngineConfig.providers[key as keyof typeof aiEngineConfig.providers]
          .enabled
    ),
  });
}
