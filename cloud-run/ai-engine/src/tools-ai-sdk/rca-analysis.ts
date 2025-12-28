/**
 * RCA (Root Cause Analysis) Tools (AI SDK Format)
 *
 * Converted from LangChain tools to Vercel AI SDK format.
 * Simplified version focusing on core RCA functionality.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import { tool } from 'ai';
import { z } from 'zod';

// Data sources
import {
  FAILURE_SCENARIOS,
  getScenariosByServer,
  type MetricType,
} from '../data/scenarios';
import {
  FIXED_24H_DATASETS,
} from '../data/fixed-24h-metrics';

// ============================================================================
// 1. Types
// ============================================================================

interface TimelineEvent {
  timestamp: string;
  eventType: string;
  metric?: string;
  value?: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

interface RootCauseHypothesis {
  cause: string;
  confidence: number;
  evidence: string[];
  suggestedFix: string;
}

// ============================================================================
// 2. Helper Functions
// ============================================================================

function getMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function calculateCorrelation(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length === 0) return 0;

  const n = arr1.length;
  const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denominator1 * denominator2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// ============================================================================
// 3. AI SDK Tools
// ============================================================================

/**
 * Build Incident Timeline
 */
export const buildIncidentTimeline = tool({
  description:
    '서버의 장애 타임라인을 구성합니다. 시나리오, 메트릭 임계값 초과, 로그 이벤트를 시간순으로 정렬합니다.',
  inputSchema: z.object({
    serverId: z.string().describe('분석할 서버 ID'),
    timeRangeHours: z.number().default(6).describe('분석 시간 범위 (시간)'),
  }),
  execute: async ({
    serverId,
    timeRangeHours,
  }: {
    serverId: string;
    timeRangeHours: number;
  }) => {
    try {
      const events: TimelineEvent[] = [];
      const now = new Date();
      const minuteOfDay = getMinuteOfDay();

      // Get active scenarios for this server
      const serverScenarios = getScenariosByServer(serverId);
      const activeScenarios = serverScenarios.filter(
        (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      // Add scenario events
      for (const scenario of activeScenarios) {
        const startTime = new Date(now);
        startTime.setMinutes(
          startTime.getMinutes() - (minuteOfDay - scenario.timeRange[0])
        );

        events.push({
          timestamp: startTime.toISOString(),
          eventType: 'scenario_start',
          metric: scenario.affectedMetric,
          severity: scenario.severity === 'critical' ? 'critical' : 'warning',
          description: `${scenario.affectedMetric.toUpperCase()} ${scenario.pattern} pattern detected`,
        });
      }

      // Get threshold breaches from metrics
      const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
      if (dataset) {
        const thresholds: Record<string, number> = {
          cpu: 80,
          memory: 85,
          disk: 90,
          network: 85,
        };

        for (const [metric, threshold] of Object.entries(thresholds)) {
          const dataLength = Math.min(dataset.data.length, timeRangeHours * 6);
          for (let i = 0; i < dataLength; i++) {
            const point = dataset.data[i];
            const value = point[metric as keyof typeof point] as number;

            if (value >= threshold) {
              const eventTime = new Date(now);
              eventTime.setMinutes(eventTime.getMinutes() - i * 10);

              events.push({
                timestamp: eventTime.toISOString(),
                eventType: 'threshold_breach',
                metric,
                value,
                severity: value >= 90 ? 'critical' : 'warning',
                description: `${metric.toUpperCase()} breached ${threshold}%: ${value.toFixed(1)}%`,
              });
              break; // Only first breach per metric
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const criticalCount = events.filter(
        (e) => e.severity === 'critical'
      ).length;

      return {
        success: true,
        serverId,
        eventCount: events.length,
        criticalEvents: criticalCount,
        events: events.slice(0, 10), // Top 10 events
        summary:
          events.length > 0
            ? `${serverId}: ${events.length} events (${criticalCount} critical) in last ${timeRangeHours}h`
            : `${serverId}: No significant events`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Correlate Metrics
 */
export const correlateMetrics = tool({
  description:
    '메트릭 간 상관관계를 분석합니다. 피어슨 상관계수를 계산하여 잠재적 인과관계를 식별합니다.',
  inputSchema: z.object({
    serverId: z.string().describe('분석할 서버 ID'),
    targetMetric: z
      .enum(['cpu', 'memory', 'disk', 'network'])
      .describe('분석 대상 메트릭'),
  }),
  execute: async ({
    serverId,
    targetMetric,
  }: {
    serverId: string;
    targetMetric: 'cpu' | 'memory' | 'disk' | 'network';
  }) => {
    try {
      const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);

      if (!dataset) {
        return { success: false, error: `Server not found: ${serverId}` };
      }

      const allMetrics: MetricType[] = ['cpu', 'memory', 'disk', 'network'];
      const otherMetrics = allMetrics.filter((m) => m !== targetMetric);

      // Extract values (last 2 hours = 12 points)
      const dataPoints = dataset.data.slice(-12);
      const targetValues = dataPoints.map(
        (p) => p[targetMetric as keyof typeof p] as number
      );

      const correlations = otherMetrics.map((metric) => {
        const metricValues = dataPoints.map(
          (p) => p[metric as keyof typeof p] as number
        );
        const coefficient = calculateCorrelation(targetValues, metricValues);

        return {
          metric1: targetMetric,
          metric2: metric,
          coefficient: Math.round(coefficient * 100) / 100,
          relationship:
            coefficient > 0.5
              ? 'positive'
              : coefficient < -0.5
                ? 'negative'
                : 'none',
        };
      });

      // Sort by absolute correlation
      correlations.sort(
        (a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)
      );

      const strongestCause = correlations.find(
        (c) => Math.abs(c.coefficient) > 0.7
      );

      return {
        success: true,
        serverId,
        targetMetric,
        correlations,
        strongestCorrelation: strongestCause
          ? `${targetMetric} ↔ ${strongestCause.metric2} (r=${strongestCause.coefficient})`
          : 'No strong correlations',
        summary: strongestCause
          ? `Strong ${strongestCause.relationship} correlation with ${strongestCause.metric2}`
          : `No strong correlations found for ${targetMetric}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Find Root Cause
 */
export const findRootCause = tool({
  description:
    '증상을 기반으로 근본 원인 가설을 생성합니다. 시나리오 패턴 매칭과 키워드 분석을 사용합니다.',
  inputSchema: z.object({
    serverId: z.string().describe('문제가 발생한 서버 ID'),
    symptom: z.string().describe('증상 설명 (예: "CPU 급증", "메모리 부족")'),
  }),
  execute: async ({
    serverId,
    symptom,
  }: {
    serverId: string;
    symptom: string;
  }) => {
    try {
      const hypotheses: RootCauseHypothesis[] = [];
      const minuteOfDay = getMinuteOfDay();
      const symptomLower = symptom.toLowerCase();

      // Pattern matching with active scenarios
      const serverScenarios = getScenariosByServer(serverId);
      const activeScenarios = serverScenarios.filter(
        (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      for (const scenario of activeScenarios) {
        const metricMatch = symptomLower.includes(scenario.affectedMetric);

        if (metricMatch) {
          const patternDescriptions: Record<string, string> = {
            spike: '급격한 부하 증가',
            gradual: '점진적 리소스 누적',
            oscillate: '불안정한 부하 변동',
            sustained: '지속적 고부하 상태',
          };

          const fixes: Record<string, string> = {
            spike: '급격한 부하 원인 제거 (배치작업 중지, 트래픽 제한)',
            gradual: '누적 원인 해결 (로그 정리, 캐시 클리어)',
            oscillate: '부하 분산 조정 (스케일아웃, 로드밸런서 설정)',
            sustained: '리소스 확장 필요 (스케일업, 메모리 증설)',
          };

          hypotheses.push({
            cause: `${scenario.affectedMetric.toUpperCase()} ${patternDescriptions[scenario.pattern]}`,
            confidence: 0.85,
            evidence: [
              `Pattern: ${scenario.pattern}`,
              `Severity: ${scenario.severity}`,
              `Metric: ${scenario.affectedMetric}`,
            ],
            suggestedFix: fixes[scenario.pattern],
          });
        }
      }

      // Keyword-based fallback
      if (hypotheses.length === 0) {
        const categories: Record<string, string[]> = {
          cpu: ['cpu', 'load', '부하', '프로세서'],
          memory: ['memory', '메모리', 'oom', '누수'],
          disk: ['disk', '디스크', '용량', 'storage'],
          network: ['network', '네트워크', '트래픽', '지연'],
        };

        for (const [category, keywords] of Object.entries(categories)) {
          if (keywords.some((kw) => symptomLower.includes(kw))) {
            hypotheses.push({
              cause: `${category.toUpperCase()} 관련 문제`,
              confidence: 0.5,
              evidence: [`Keyword match: ${category}`],
              suggestedFix: `${category} 리소스 점검 및 최적화 필요`,
            });
          }
        }
      }

      // Default if no matches
      if (hypotheses.length === 0) {
        hypotheses.push({
          cause: '원인 불명 - 추가 분석 필요',
          confidence: 0.3,
          evidence: [`Symptom: ${symptom}`, `Server: ${serverId}`],
          suggestedFix: '수동 로그 분석 및 메트릭 상세 검토 필요',
        });
      }

      // Sort by confidence
      hypotheses.sort((a, b) => b.confidence - a.confidence);

      return {
        success: true,
        serverId,
        symptom,
        hypotheses: hypotheses.slice(0, 3),
        mostLikelyCause: hypotheses[0].cause,
        confidence: hypotheses[0].confidence,
        suggestedFix: hypotheses[0].suggestedFix,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
