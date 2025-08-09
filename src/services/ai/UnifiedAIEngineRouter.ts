/**
 * 🎯 Unified AI Engine Router for OpenManager VIBE v5
 *
 * 📦 MODULAR ARCHITECTURE (8 specialized modules):
 * 
 * Core Features:
 * - Intelligent routing between AI engines (local-ai / google-ai modes)
 * - Comprehensive security layer with prompt sanitization
 * - Token usage monitoring and limits enforcement
 * - Circuit breaker patterns for reliability
 * - Performance optimization with caching
 * - Korean NLP integration and command recommendation
 *
 * 🔧 Architecture:
 * This is the main entry point that imports from 8 modular components:
 * 1. UnifiedAIEngineRouter.types - Type definitions
 * 2. UnifiedAIEngineRouter.cache - Caching system  
 * 3. UnifiedAIEngineRouter.circuitBreaker - Circuit breaker logic
 * 4. UnifiedAIEngineRouter.security - Security layer
 * 5. UnifiedAIEngineRouter.commands - Command recommendation system
 * 6. UnifiedAIEngineRouter.metrics - Metrics and monitoring
 * 7. UnifiedAIEngineRouter.utils - Utility functions
 * 8. UnifiedAIEngineRouter.core - Main orchestrator (imports all 7 above)
 *
 * @author AI Systems Engineer  
 * @version 2.0.0 (Modular Architecture)
 * @since v1.0.0 (Monolithic) → v2.0.0 (Modular)
 */

// 📦 Import types from modular architecture
export type {
  RouterConfig,
  RouterMetrics, 
  RouteResult,
  CommandRecommendation,
  CommandRequestContext,
  CommandAnalysisResult,
  CommandDetectionResult
} from './UnifiedAIEngineRouter.types';

// 📦 Import main orchestrator class and utility functions from core module
export { 
  UnifiedAIEngineRouter,
  getUnifiedAIRouter,
  routeAIQuery 
} from './UnifiedAIEngineRouter.core';
