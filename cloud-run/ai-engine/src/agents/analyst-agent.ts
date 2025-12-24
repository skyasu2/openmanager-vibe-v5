/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getAnomalyDetector,
  type MetricDataPoint,
} from '../lib/ai/monitoring/SimpleAnomalyDetector';
import {
  getTrendPredictor,
  type TrendDataPoint,
} from '../lib/ai/monitoring/TrendPredictor';
import { getDataCache } from '../lib/cache-layer';
import {
  loadHistoricalContext,
  loadHourlyScenarioData,
} from '../services/scenario/scenario-loader';

// ============================================================================
// 1. Tool Result Types
// ============================================================================

type AnomalyResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      anomalyCount: number;
      hasAnomalies: boolean;
      results: Record<
        string,
        {
          isAnomaly: boolean;
          severity: string;
          confidence: number;
          currentValue: number;
          threshold: { upper: number; lower: number };
        }
      >;
      timestamp: string;
      _algorithm: string;
      _engine: 'typescript';
    }
  | { success: false; error: string };

type TrendResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      predictionHorizon: string;
      results: Record<
        string,
        {
          trend: string;
          currentValue: number;
          predictedValue: number;
          changePercent: number;
          confidence: number;
        }
      >;
      summary: { increasingMetrics: string[]; hasRisingTrends: boolean };
      timestamp: string;
      _algorithm: string;
      _engine: 'typescript';
    }
  | { success: false; error: string };
// ... (skip unchanged pattern types) ...

// ... (in tools)
        const usedEngine: 'typescript' = 'typescript';
// ...

// 🚫 Dead Code Removed: clusterLogPatternsTool (ML Service removed)
// 🚫 Dead Code Removed: analystAgentNode & Helpers
// Use createReactAgent in multi-agent-supervisor.ts instead.

