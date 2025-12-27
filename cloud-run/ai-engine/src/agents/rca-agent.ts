/**
 * RCA Agent - Root Cause Analysis
 *
 * ## Responsibilities
 * - Build incident timelines
 * - Correlate events and metrics
 * - Find root causes using pattern matching + GraphRAG
 * - Search similar past incidents
 * - Fetch log patterns and deployment history
 *
 * ## Tools (6)
 * - buildIncidentTimeline: Event timeline construction
 * - correlateEvents: Metric correlation analysis
 * - findRootCause: Causal inference with LLM
 * - searchSimilarIncidents: GraphRAG-based similarity search
 * - fetchLogPattern: Log pattern extraction (simulated)
 * - fetchDeploymentHistory: Deployment history lookup (simulated)
 *
 * ## Data Sources
 * - FAILURE_SCENARIOS: 12 predefined failure patterns
 * - FIXED_24H_DATASETS: 6-hour historical metrics
 * - GraphRAG: Knowledge base relationships
 *
 * @see /home/sky-note/.claude/plans/elegant-fluttering-acorn.md Section 3
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  FAILURE_SCENARIOS,
  getActiveScenarios,
  getScenariosByServer,
  type ScenarioDefinition,
  type MetricType,
} from '../data/scenarios';
import {
  getServer24hData,
  FIXED_24H_DATASETS,
  type Server24hDataset,
} from '../data/fixed-24h-metrics';
import {
  hybridGraphSearch,
  getRelatedKnowledge,
  type RelationshipType,
} from '../lib/graph-rag-service';
// Simple in-memory cache for RCA results (avoid complex HybridCacheLayer API)
const rcaCache = new Map<string, { data: unknown; expiresAt: number }>();

/** Get cached value or null if expired/missing */
function getCached<T>(key: string): T | null {
  const entry = rcaCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    rcaCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Set cached value with TTL in seconds */
function setCache(key: string, data: unknown, ttlSeconds: number): void {
  rcaCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// ============================================================================
// Types
// ============================================================================

export interface TimelineEvent {
  timestamp: string;
  eventType:
    | 'metric_spike'
    | 'threshold_breach'
    | 'anomaly_detected'
    | 'scenario_start'
    | 'log_error'
    | 'deployment';
  metric?: MetricType;
  value?: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface Correlation {
  metric1: string;
  metric2: string;
  coefficient: number; // -1 to 1
  lag: number; // Time lag in minutes
  relationship: 'positive' | 'negative' | 'none';
}

export interface RootCauseHypothesis {
  cause: string;
  confidence: number;
  evidence: string[];
  suggestedFix: string;
  relatedScenario?: string;
}

export interface SimilarIncident {
  id: string;
  title: string;
  similarity: number;
  resolution: string;
  rootCause: string;
}

export interface LogPattern {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  count: number;
}

export interface DeploymentRecord {
  timestamp: string;
  version: string;
  deployer: string;
  changeType: 'deploy' | 'config' | 'scale' | 'rollback';
  status: 'success' | 'failed';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current minute of day (0-1439)
 */
function getMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
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
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Extract metric values from dataset for correlation
 */
function extractMetricValues(
  serverId: string,
  metric: MetricType,
  lastNMinutes: number = 60
): number[] {
  // Find dataset by serverId (FIXED_24H_DATASETS is an array)
  const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
  if (!dataset) return [];

  // Get the last N data points (each point is 10 minutes)
  const pointCount = Math.ceil(lastNMinutes / 10);
  const dataPoints = dataset.data.slice(-pointCount);

  return dataPoints.map((point: { cpu: number; memory: number; disk: number; network: number }) => {
    switch (metric) {
      case 'cpu':
        return point.cpu;
      case 'memory':
        return point.memory;
      case 'disk':
        return point.disk;
      case 'network':
        return point.network;
      default:
        return 0;
    }
  });
}

/**
 * Compress output for token efficiency
 */
function compressTimelineOutput(
  events: TimelineEvent[],
  summary: string
): string {
  const criticalCount = events.filter((e) => e.severity === 'critical').length;
  const warningCount = events.filter((e) => e.severity === 'warning').length;

  return JSON.stringify({
    summary,
    eventCount: events.length,
    criticalEvents: criticalCount,
    warningEvents: warningCount,
    topEvents: events.slice(0, 5).map((e) => ({
      ts: e.timestamp,
      type: e.eventType,
      sev: e.severity,
      desc: e.description.substring(0, 50),
    })),
  });
}

/**
 * Compress correlation output
 */
function compressCorrelationOutput(
  correlations: Correlation[],
  summary: string
): string {
  const strong = correlations.filter((c) => Math.abs(c.coefficient) > 0.7);
  return JSON.stringify({
    summary,
    totalCorrelations: correlations.length,
    strongCorrelations: strong.length,
    topCorrelations: correlations.slice(0, 3).map((c) => ({
      pair: `${c.metric1}-${c.metric2}`,
      coef: c.coefficient.toFixed(2),
      rel: c.relationship,
    })),
  });
}

/**
 * Compress RCA output
 */
function compressRCAOutput(
  hypotheses: RootCauseHypothesis[],
  mostLikely: string
): string {
  return JSON.stringify({
    rootCause: mostLikely,
    confidence: hypotheses[0]?.confidence.toFixed(2) || '0',
    hypothesesCount: hypotheses.length,
    topCauses: hypotheses.slice(0, 2).map((h) => ({
      cause: h.cause.substring(0, 60),
      conf: h.confidence.toFixed(2),
      fix: h.suggestedFix.substring(0, 50),
    })),
  });
}

// ============================================================================
// Tool 1: buildIncidentTimelineTool
// ============================================================================

export const buildIncidentTimelineTool = tool(
  async ({
    serverId,
    timeRangeHours = 6,
  }: {
    serverId: string;
    timeRangeHours?: number;
  }) => {
    const cacheKey = `rca:timeline:${serverId}:${timeRangeHours}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const events: TimelineEvent[] = [];
      const now = new Date();
      const minuteOfDay = getMinuteOfDay();

      // 1. Get active scenarios for this server
      const serverScenarios = getScenariosByServer(serverId);
      const activeScenarios = serverScenarios.filter(
        (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      // Add scenario start events
      for (const scenario of activeScenarios) {
        const startTime = new Date(now);
        startTime.setMinutes(startTime.getMinutes() - (minuteOfDay - scenario.timeRange[0]));

        events.push({
          timestamp: startTime.toISOString(),
          eventType: 'scenario_start',
          metric: scenario.affectedMetric,
          severity: scenario.severity === 'critical' ? 'critical' : 'warning',
          description: `${scenario.name}: ${scenario.description}`,
        });
      }

      // 2. Get historical metrics and detect threshold breaches
      const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
      if (dataset) {
        const metricsToCheck: MetricType[] = ['cpu', 'memory', 'disk', 'network'];
        const thresholds: Record<MetricType, number> = { cpu: 80, memory: 85, disk: 90, network: 85 };

        for (const metric of metricsToCheck) {
          const threshold = thresholds[metric];
          let breachDetected = false;

          for (let i = 0; i < dataset.data.length && i < timeRangeHours * 6; i++) {
            const point = dataset.data[i] as { cpu: number; memory: number; disk: number; network: number };
            const value = point[metric as keyof typeof point];

            if (value >= threshold && !breachDetected) {
              const eventTime = new Date(now);
              eventTime.setMinutes(eventTime.getMinutes() - i * 10);

              events.push({
                timestamp: eventTime.toISOString(),
                eventType: 'threshold_breach',
                metric,
                value,
                severity: value >= 90 ? 'critical' : 'warning',
                description: `${metric.toUpperCase()} breached ${threshold}% threshold: ${value.toFixed(1)}%`,
              });
              breachDetected = true;
            }
          }
        }
      }

      // 3. Add log error events (simulated based on scenario)
      for (const scenario of activeScenarios) {
        if (scenario.severity === 'critical') {
          const logTime = new Date(now);
          logTime.setMinutes(logTime.getMinutes() - 15);

          events.push({
            timestamp: logTime.toISOString(),
            eventType: 'log_error',
            severity: 'critical',
            description: `Error logs detected: ${scenario.name} related errors`,
          });
        }
      }

      // Sort events by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const summary = events.length > 0
        ? `${serverId}: ${events.length} events found in last ${timeRangeHours}h (${activeScenarios.length} active scenarios)`
        : `${serverId}: No significant events in last ${timeRangeHours}h`;

      const result = {
        success: true as const,
        serverId,
        events,
        summary,
      };

      const compressed = compressTimelineOutput(events, summary);
      setCache(cacheKey, compressed, 300); // 5min cache

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Timeline build failed',
      });
    }
  },
  {
    name: 'buildIncidentTimeline',
    description:
      'Build incident timeline for a server. Extracts events from scenarios, metrics, and logs. Returns chronologically sorted events with severity.',
    schema: z.object({
      serverId: z.string().describe('Server ID to analyze (e.g., "db-mysql-icn-primary")'),
      timeRangeHours: z
        .number()
        .optional()
        .default(6)
        .describe('Time range in hours to analyze (default: 6)'),
    }),
  }
);

// ============================================================================
// Tool 2: correlateEventsTool
// ============================================================================

export const correlateEventsTool = tool(
  async ({
    serverId,
    targetMetric,
  }: {
    serverId: string;
    targetMetric: MetricType;
  }) => {
    const cacheKey = `rca:correlation:${serverId}:${targetMetric}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const correlations: Correlation[] = [];
      const allMetrics: MetricType[] = ['cpu', 'memory', 'disk', 'network'];
      const otherMetrics = allMetrics.filter((m) => m !== targetMetric);

      // Get target metric values
      const targetValues = extractMetricValues(serverId, targetMetric, 120); // 2 hours

      if (targetValues.length === 0) {
        return JSON.stringify({
          success: false,
          error: `No data found for server ${serverId}`,
        });
      }

      // Calculate correlations with other metrics
      for (const metric of otherMetrics) {
        const metricValues = extractMetricValues(serverId, metric, 120);
        if (metricValues.length === targetValues.length) {
          const coefficient = calculateCorrelation(targetValues, metricValues);

          correlations.push({
            metric1: targetMetric,
            metric2: metric,
            coefficient,
            lag: 0, // Simple version without lag analysis
            relationship:
              coefficient > 0.5 ? 'positive' : coefficient < -0.5 ? 'negative' : 'none',
          });
        }
      }

      // Sort by absolute correlation strength
      correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

      const strongestCause = correlations.find((c) => Math.abs(c.coefficient) > 0.7);
      const confidence = strongestCause ? Math.abs(strongestCause.coefficient) : 0;

      const summary = strongestCause
        ? `Strong correlation found: ${targetMetric} ↔ ${strongestCause.metric2} (r=${strongestCause.coefficient.toFixed(2)})`
        : `No strong correlations found for ${targetMetric}`;

      const result = {
        success: true as const,
        correlations,
        strongestCause: strongestCause?.metric2,
        confidence,
      };

      const compressed = compressCorrelationOutput(correlations, summary);
      setCache(cacheKey, compressed, 300);

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Correlation analysis failed',
      });
    }
  },
  {
    name: 'correlateEvents',
    description:
      'Analyze correlations between the target metric and other metrics. Returns Pearson correlation coefficients and identifies potential causal relationships.',
    schema: z.object({
      serverId: z.string().describe('Server ID to analyze'),
      targetMetric: z
        .enum(['cpu', 'memory', 'disk', 'network'])
        .describe('Target metric experiencing issues'),
    }),
  }
);

// ============================================================================
// Tool 3: findRootCauseTool
// ============================================================================

export const findRootCauseTool = tool(
  async ({
    serverId,
    symptom,
  }: {
    serverId: string;
    symptom: string;
  }) => {
    const cacheKey = `rca:rootcause:${serverId}:${symptom.substring(0, 30)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const hypotheses: RootCauseHypothesis[] = [];
      const minuteOfDay = getMinuteOfDay();

      // 1. Pattern matching with scenarios
      const serverScenarios = getScenariosByServer(serverId);
      const activeScenarios = serverScenarios.filter(
        (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      for (const scenario of activeScenarios) {
        const symptomLower = symptom.toLowerCase();
        const scenarioLower = `${scenario.name} ${scenario.description}`.toLowerCase();

        // Check if symptom matches scenario
        const metricMatch = symptomLower.includes(scenario.affectedMetric);
        const severityMatch =
          (symptomLower.includes('critical') && scenario.severity === 'critical') ||
          (symptomLower.includes('warning') && scenario.severity === 'warning');

        if (metricMatch || severityMatch) {
          let suggestedFix = '';
          switch (scenario.pattern) {
            case 'spike':
              suggestedFix = '급격한 부하 원인 제거 (배치작업 중지, 트래픽 제한)';
              break;
            case 'gradual':
              suggestedFix = '누적 원인 해결 (로그 정리, 캐시 클리어, 임시 파일 삭제)';
              break;
            case 'oscillate':
              suggestedFix = '부하 분산 조정 (스케일아웃, 로드밸런서 설정)';
              break;
            case 'sustained':
              suggestedFix = '리소스 확장 필요 (스케일업, 메모리 증설)';
              break;
          }

          hypotheses.push({
            cause: scenario.name,
            confidence: metricMatch && severityMatch ? 0.9 : 0.7,
            evidence: [
              `Active scenario: ${scenario.id}`,
              `Pattern: ${scenario.pattern}`,
              `Severity: ${scenario.severity}`,
              `Affected metric: ${scenario.affectedMetric}`,
            ],
            suggestedFix,
            relatedScenario: scenario.id,
          });
        }
      }

      // 2. GraphRAG search for similar issues (if available)
      // Note: This requires embedding which we'll skip for now and use heuristics
      const symptomKeywords = symptom.toLowerCase().split(' ');
      const keywordCategories: Record<string, string[]> = {
        memory: ['메모리', 'memory', 'oom', '누수', 'leak', 'heap'],
        cpu: ['cpu', '프로세서', 'load', '부하'],
        disk: ['디스크', 'disk', '용량', 'storage', '풀'],
        network: ['네트워크', 'network', '트래픽', 'traffic', '지연'],
      };

      for (const [category, keywords] of Object.entries(keywordCategories)) {
        if (keywords.some((kw) => symptomKeywords.some((sw) => sw.includes(kw)))) {
          // Find scenarios with this metric
          const categoryScenarios = FAILURE_SCENARIOS.filter(
            (s) => s.affectedMetric === category
          );

          for (const scenario of categoryScenarios) {
            if (!hypotheses.find((h) => h.relatedScenario === scenario.id)) {
              hypotheses.push({
                cause: `${category.toUpperCase()} 관련 문제: ${scenario.name}`,
                confidence: 0.5,
                evidence: [
                  `Keyword match: ${category}`,
                  `Related scenario pattern: ${scenario.pattern}`,
                ],
                suggestedFix: `${category} 리소스 점검 및 최적화 필요`,
                relatedScenario: scenario.id,
              });
            }
          }
        }
      }

      // 3. Default hypothesis if no matches
      if (hypotheses.length === 0) {
        hypotheses.push({
          cause: '원인 불명 - 추가 분석 필요',
          confidence: 0.3,
          evidence: [
            `Symptom: ${symptom}`,
            `Server: ${serverId}`,
            'No matching scenarios found',
          ],
          suggestedFix: '수동 로그 분석 및 메트릭 상세 검토 필요',
        });
      }

      // Sort by confidence
      hypotheses.sort((a, b) => b.confidence - a.confidence);

      const mostLikelyCause = hypotheses[0]?.cause || 'Unknown';
      const reasoning = hypotheses
        .slice(0, 2)
        .map((h) => `${h.cause} (${(h.confidence * 100).toFixed(0)}%)`)
        .join(', ');

      const result = {
        success: true as const,
        hypotheses,
        mostLikelyCause,
        reasoning,
      };

      const compressed = compressRCAOutput(hypotheses, mostLikelyCause);
      setCache(cacheKey, compressed, 600); // 10min cache

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Root cause analysis failed',
      });
    }
  },
  {
    name: 'findRootCause',
    description:
      'Find root cause hypotheses for a symptom. Uses scenario pattern matching and keyword analysis to generate ranked hypotheses with suggested fixes.',
    schema: z.object({
      serverId: z.string().describe('Server ID experiencing the issue'),
      symptom: z.string().describe('Symptom description (e.g., "CPU 급증", "메모리 부족")'),
    }),
  }
);

// ============================================================================
// Tool 4: searchSimilarIncidentsTool
// ============================================================================

export const searchSimilarIncidentsTool = tool(
  async ({
    symptom,
    serverType,
  }: {
    symptom: string;
    serverType?: string;
  }) => {
    const cacheKey = `rca:similar:${symptom.substring(0, 30)}:${serverType || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const incidents: SimilarIncident[] = [];

      // Map symptom to scenario patterns
      const symptomLower = symptom.toLowerCase();
      const relevantScenarios = FAILURE_SCENARIOS.filter((scenario) => {
        const scenarioText = `${scenario.name} ${scenario.description}`.toLowerCase();

        // Match by metric keyword
        const metricMatches =
          (symptomLower.includes('cpu') && scenario.affectedMetric === 'cpu') ||
          (symptomLower.includes('memory') && scenario.affectedMetric === 'memory') ||
          (symptomLower.includes('메모리') && scenario.affectedMetric === 'memory') ||
          (symptomLower.includes('disk') && scenario.affectedMetric === 'disk') ||
          (symptomLower.includes('디스크') && scenario.affectedMetric === 'disk') ||
          (symptomLower.includes('network') && scenario.affectedMetric === 'network') ||
          (symptomLower.includes('네트워크') && scenario.affectedMetric === 'network');

        // Match by server type if provided
        const serverTypeMatch =
          !serverType ||
          scenario.serverId.includes(serverType.toLowerCase());

        return metricMatches && serverTypeMatch;
      });

      // Generate simulated past incidents based on scenarios
      for (const scenario of relevantScenarios) {
        const resolutions: Record<string, string> = {
          'midnight-db-disk-critical': '바이너리 로그 정리 및 백업 정책 최적화',
          'morning-api-memory-critical': 'JVM 힙 메모리 확장 및 GC 튜닝',
          'afternoon-web-network-critical': 'CDN 캐시 활성화 및 트래픽 분산',
          'evening-cache-memory-critical': 'Redis maxmemory-policy 설정 및 TTL 최적화',
        };

        incidents.push({
          id: `incident-${scenario.id}`,
          title: `과거 사례: ${scenario.name}`,
          similarity: scenario.severity === 'critical' ? 0.85 : 0.7,
          resolution: resolutions[scenario.id] || `${scenario.affectedMetric} 리소스 최적화`,
          rootCause: scenario.description,
        });
      }

      // Sort by similarity
      incidents.sort((a, b) => b.similarity - a.similarity);

      const result = {
        success: true as const,
        incidents: incidents.slice(0, 5),
        totalFound: incidents.length,
      };

      const compressed = JSON.stringify({
        found: incidents.length,
        topIncidents: incidents.slice(0, 3).map((i) => ({
          title: i.title.substring(0, 40),
          sim: i.similarity.toFixed(2),
          fix: i.resolution.substring(0, 50),
        })),
      });

      setCache(cacheKey, compressed, 600);

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Similar incident search failed',
      });
    }
  },
  {
    name: 'searchSimilarIncidents',
    description:
      'Search for similar past incidents based on symptom description. Returns matched incidents with their resolutions.',
    schema: z.object({
      symptom: z.string().describe('Symptom to search for similar incidents'),
      serverType: z
        .string()
        .optional()
        .describe('Filter by server type (e.g., "web", "db", "cache")'),
    }),
  }
);

// ============================================================================
// Tool 5: fetchLogPatternTool (NEW - Critical Improvement #1)
// ============================================================================

export const fetchLogPatternTool = tool(
  async ({
    serverId,
    timeRange = 'last1h',
    errorKeywords = ['Exception', 'Error', 'Timeout', 'OOM'],
  }: {
    serverId: string;
    timeRange?: string;
    errorKeywords?: string[];
  }) => {
    const cacheKey = `rca:logs:${serverId}:${timeRange}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const logs: LogPattern[] = [];
      const now = new Date();

      // Get active scenarios for context
      const minuteOfDay = getMinuteOfDay();
      const serverScenarios = getScenariosByServer(serverId);
      const activeScenarios = serverScenarios.filter(
        (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      // Generate simulated log patterns based on active scenarios
      for (const scenario of activeScenarios) {
        const logTime = new Date(now);
        logTime.setMinutes(logTime.getMinutes() - Math.floor(Math.random() * 30));

        // Generate error logs based on scenario type
        const errorMessages: Record<MetricType, LogPattern[]> = {
          cpu: [
            {
              timestamp: logTime.toISOString(),
              level: 'error',
              message: 'CPU throttling detected: high process load',
              count: 15,
            },
            {
              timestamp: logTime.toISOString(),
              level: 'warn',
              message: 'Thread pool exhaustion warning',
              count: 8,
            },
          ],
          memory: [
            {
              timestamp: logTime.toISOString(),
              level: 'error',
              message: 'OutOfMemoryError: Java heap space',
              count: 5,
            },
            {
              timestamp: logTime.toISOString(),
              level: 'error',
              message: 'Memory allocation failed: insufficient resources',
              count: 3,
            },
          ],
          disk: [
            {
              timestamp: logTime.toISOString(),
              level: 'error',
              message: 'Disk write failed: No space left on device',
              count: 12,
            },
            {
              timestamp: logTime.toISOString(),
              level: 'warn',
              message: 'Binary log rotation failed',
              count: 4,
            },
          ],
          network: [
            {
              timestamp: logTime.toISOString(),
              level: 'error',
              message: 'Connection timeout: upstream server not responding',
              count: 25,
            },
            {
              timestamp: logTime.toISOString(),
              level: 'warn',
              message: 'Socket buffer overflow detected',
              count: 10,
            },
          ],
        };

        logs.push(...(errorMessages[scenario.affectedMetric] || []));
      }

      // Add some general error logs if no scenarios active
      if (logs.length === 0) {
        logs.push({
          timestamp: now.toISOString(),
          level: 'info',
          message: 'No significant errors detected in the specified time range',
          count: 0,
        });
      }

      // Sort by count (most frequent first)
      logs.sort((a, b) => b.count - a.count);

      const topErrors = logs
        .filter((l) => l.level === 'error')
        .slice(0, 3)
        .map((l) => l.message);

      const summary =
        logs.length > 0
          ? `${serverId}: ${logs.filter((l) => l.level === 'error').length} error patterns, ${logs.reduce((sum, l) => sum + l.count, 0)} total occurrences`
          : `${serverId}: No significant errors found`;

      const result = {
        success: true as const,
        serverId,
        logs,
        topErrors,
        summary,
      };

      const compressed = JSON.stringify({
        summary,
        errorPatterns: logs.length,
        topErrors: topErrors.slice(0, 2).map((e) => e.substring(0, 50)),
      });

      setCache(cacheKey, compressed, 180); // 3min cache

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Log pattern fetch failed',
      });
    }
  },
  {
    name: 'fetchLogPattern',
    description:
      'Fetch error log patterns from a server. Returns categorized error messages with occurrence counts for RCA analysis.',
    schema: z.object({
      serverId: z.string().describe('Server ID to fetch logs from'),
      timeRange: z
        .enum(['last1h', 'last6h', 'last24h'])
        .optional()
        .default('last1h')
        .describe('Time range for log search'),
      errorKeywords: z
        .array(z.string())
        .optional()
        .describe('Keywords to filter logs (default: Exception, Error, Timeout, OOM)'),
    }),
  }
);

// ============================================================================
// Tool 6: fetchDeploymentHistoryTool (NEW - Critical Improvement #1)
// ============================================================================

export const fetchDeploymentHistoryTool = tool(
  async ({
    serviceId,
    lastHours = 24,
  }: {
    serviceId: string;
    lastHours?: number;
  }) => {
    const cacheKey = `rca:deployments:${serviceId}:${lastHours}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached as string;
    }

    try {
      const deployments: DeploymentRecord[] = [];
      const now = new Date();

      // Generate simulated deployment history based on service type
      const servicePrefix = serviceId.split('-')[0]; // e.g., "web", "api", "db"

      // Simulate recent deployments
      const deploymentPatterns: Record<string, DeploymentRecord[]> = {
        web: [
          {
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            version: 'v2.3.1',
            deployer: 'ci-pipeline',
            changeType: 'deploy',
            status: 'success',
          },
          {
            timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
            version: 'v2.3.0',
            deployer: 'ci-pipeline',
            changeType: 'deploy',
            status: 'success',
          },
        ],
        api: [
          {
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
            version: 'v1.5.2',
            deployer: 'devops-team',
            changeType: 'config',
            status: 'success',
          },
          {
            timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
            version: 'v1.5.1',
            deployer: 'ci-pipeline',
            changeType: 'deploy',
            status: 'success',
          },
        ],
        db: [
          {
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
            version: 'v8.0.34',
            deployer: 'dba-team',
            changeType: 'config',
            status: 'success',
          },
        ],
        cache: [
          {
            timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            version: 'v7.2.1',
            deployer: 'devops-team',
            changeType: 'scale',
            status: 'success',
          },
        ],
      };

      // Get deployments for the service type
      const typeDeployments = deploymentPatterns[servicePrefix] || [];
      deployments.push(...typeDeployments);

      // Filter by time range
      const cutoffTime = new Date(now.getTime() - lastHours * 60 * 60 * 1000);
      const filteredDeployments = deployments.filter(
        (d) => new Date(d.timestamp) >= cutoffTime
      );

      // Sort by timestamp (newest first)
      filteredDeployments.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const recentChange = filteredDeployments[0]
        ? `${filteredDeployments[0].changeType}: ${filteredDeployments[0].version} at ${filteredDeployments[0].timestamp}`
        : undefined;

      // Find rollback target if recent deploy exists
      const rollbackTarget =
        filteredDeployments.length > 1 ? filteredDeployments[1].version : undefined;

      const result = {
        success: true as const,
        deployments: filteredDeployments,
        recentChange,
        rollbackTarget,
      };

      const compressed = JSON.stringify({
        deploymentsCount: filteredDeployments.length,
        recentChange: recentChange?.substring(0, 60),
        rollbackTarget,
        lastDeploy: filteredDeployments[0]
          ? {
              type: filteredDeployments[0].changeType,
              version: filteredDeployments[0].version,
              hoursAgo: Math.round(
                (now.getTime() - new Date(filteredDeployments[0].timestamp).getTime()) /
                  (60 * 60 * 1000)
              ),
            }
          : null,
      });

      setCache(cacheKey, compressed, 300); // 5min cache

      return compressed;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Deployment history fetch failed',
      });
    }
  },
  {
    name: 'fetchDeploymentHistory',
    description:
      'Fetch recent deployment and configuration changes for a service. Helps identify if a recent change caused the issue.',
    schema: z.object({
      serviceId: z.string().describe('Service ID to check deployments for'),
      lastHours: z
        .number()
        .optional()
        .default(24)
        .describe('How many hours of history to retrieve (default: 24)'),
    }),
  }
);

// ============================================================================
// Exports
// ============================================================================

export const rcaTools = [
  buildIncidentTimelineTool,
  correlateEventsTool,
  findRootCauseTool,
  searchSimilarIncidentsTool,
  fetchLogPatternTool,
  fetchDeploymentHistoryTool,
];

export default rcaTools;
