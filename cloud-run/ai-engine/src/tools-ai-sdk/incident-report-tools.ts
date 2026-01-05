/**
 * Incident Report Tools (AI SDK Format)
 *
 * Comprehensive incident reporting with:
 * - Structured JSON/Markdown templates
 * - SLA monitoring and violation detection
 * - Multi-server correlation analysis
 * - Lightweight prediction (no external ML libraries)
 *
 * @version 1.0.0
 * @created 2026-01-05
 */

import { tool } from 'ai';
import { z } from 'zod';

// Data sources
import { getCurrentState, type ServerSnapshot } from '../data/precomputed-state';
import { FIXED_24H_DATASETS } from '../data/fixed-24h-metrics';
import { getScenariosByServer } from '../data/scenarios';

// Caching
import { getDataCache } from '../lib/cache-layer';

// ============================================================================
// 1. Types
// ============================================================================

export interface TimelineEvent {
  timestamp: string;
  eventType: 'threshold_breach' | 'scenario_start' | 'status_change' | 'prediction';
  metric?: string;
  value?: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  serverId?: string;
}

export interface RootCauseHypothesis {
  cause: string;
  confidence: number;
  evidence: string[];
  suggestedFix: string;
}

export interface SLAMetrics {
  targetUptime: number; // e.g., 99.9
  actualUptime: number;
  downtimeMinutes: number;
  slaViolation: boolean;
  remainingBudgetMinutes: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface ServerCorrelation {
  serverId: string;
  correlatedWith: string;
  correlationType: 'cascade' | 'simultaneous' | 'periodic';
  timeLagSeconds: number;
  affectedMetric: string;
  confidence: number;
}

export interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  predictedTime: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  breachProbability: number;
}

export interface IncidentReport {
  id: string;
  generatedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  affectedServers: Array<{
    id: string;
    name: string;
    status: string;
    primaryIssue: string;
  }>;
  timeline: TimelineEvent[];
  rootCause: RootCauseHypothesis | null;
  correlations: ServerCorrelation[];
  predictions: PredictionResult[];
  sla: SLAMetrics;
  suggestedActions: string[];
  markdown: string;
}

// ============================================================================
// 2. Constants
// ============================================================================

const SLA_TARGETS = {
  daily: { target: 99.9, maxDowntimeMinutes: 1.44 }, // 1440 * 0.001
  weekly: { target: 99.9, maxDowntimeMinutes: 10.08 }, // 10080 * 0.001
  monthly: { target: 99.9, maxDowntimeMinutes: 43.8 }, // 43800 * 0.001
} as const;

const THRESHOLDS = {
  cpu: { warning: 80, critical: 90 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 85, critical: 95 },
  network: { warning: 70, critical: 85 },
} as const;

// ============================================================================
// 3. Helper Functions
// ============================================================================

function generateIncidentId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
  return `INC-${dateStr}-${timeStr}`;
}

/**
 * Simple linear regression for prediction
 * Returns slope (trend) and projected value
 */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? values[0] || 0 : intercept };
}

/**
 * Calculate moving average for smoothing
 */
function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

/**
 * Determine severity from metric values
 */
function determineSeverity(servers: ServerSnapshot[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = servers.filter(s => s.status === 'critical').length;
  const warningCount = servers.filter(s => s.status === 'warning').length;

  if (criticalCount > 0) return 'critical';
  if (warningCount >= 3) return 'high';
  if (warningCount >= 1) return 'medium';
  return 'low';
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: Omit<IncidentReport, 'markdown'>): string {
  const severityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };

  let md = `# ${severityEmoji[report.severity]} 장애 보고서: ${report.title}\n\n`;
  md += `**ID**: ${report.id}\n`;
  md += `**생성 시각**: ${report.generatedAt}\n`;
  md += `**심각도**: ${report.severity.toUpperCase()}\n\n`;

  md += `## 📋 요약\n\n${report.summary}\n\n`;

  md += `## 🖥️ 영향받은 서버 (${report.affectedServers.length}대)\n\n`;
  md += `| 서버 | 상태 | 주요 이슈 |\n`;
  md += `|------|------|----------|\n`;
  for (const server of report.affectedServers) {
    md += `| ${server.name} | ${server.status} | ${server.primaryIssue} |\n`;
  }
  md += '\n';

  if (report.timeline.length > 0) {
    md += `## 📅 타임라인 (최근 ${report.timeline.length}건)\n\n`;
    for (const event of report.timeline.slice(0, 5)) {
      const emoji = event.severity === 'critical' ? '🔴' : event.severity === 'warning' ? '🟡' : '🔵';
      md += `- ${emoji} **${event.timestamp}**: ${event.description}\n`;
    }
    md += '\n';
  }

  if (report.rootCause) {
    md += `## 🔍 근본 원인 분석\n\n`;
    md += `**추정 원인**: ${report.rootCause.cause}\n`;
    md += `**신뢰도**: ${(report.rootCause.confidence * 100).toFixed(0)}%\n`;
    md += `**권장 조치**: ${report.rootCause.suggestedFix}\n\n`;
  }

  if (report.predictions.length > 0) {
    md += `## 📈 예측 분석\n\n`;
    md += `| 메트릭 | 현재값 | 예측값 | 위험도 |\n`;
    md += `|--------|--------|--------|--------|\n`;
    for (const pred of report.predictions) {
      const risk = pred.riskLevel === 'critical' ? '🔴' : pred.riskLevel === 'high' ? '🟠' : pred.riskLevel === 'medium' ? '🟡' : '🟢';
      md += `| ${pred.metric} | ${pred.currentValue.toFixed(1)}% | ${pred.predictedValue.toFixed(1)}% | ${risk} ${pred.riskLevel} |\n`;
    }
    md += '\n';
  }

  if (report.correlations.length > 0) {
    md += `## 🔗 서버 간 연관 분석\n\n`;
    for (const corr of report.correlations) {
      md += `- **${corr.serverId}** ↔ **${corr.correlatedWith}**: ${corr.correlationType} (${corr.affectedMetric}, 지연: ${corr.timeLagSeconds}초)\n`;
    }
    md += '\n';
  }

  md += `## ⏱️ SLA 현황\n\n`;
  md += `- **목표 가용률**: ${report.sla.targetUptime}%\n`;
  md += `- **실제 가용률**: ${report.sla.actualUptime.toFixed(3)}%\n`;
  md += `- **다운타임**: ${report.sla.downtimeMinutes.toFixed(1)}분 / ${SLA_TARGETS[report.sla.period].maxDowntimeMinutes.toFixed(1)}분\n`;
  md += `- **SLA 위반**: ${report.sla.slaViolation ? '⚠️ **위반**' : '✅ 정상'}\n\n`;

  if (report.suggestedActions.length > 0) {
    md += `## ✅ 권장 조치\n\n`;
    for (let i = 0; i < report.suggestedActions.length; i++) {
      md += `${i + 1}. ${report.suggestedActions[i]}\n`;
    }
  }

  return md;
}

// ============================================================================
// 4. AI SDK Tools
// ============================================================================

/**
 * Calculate SLA Metrics
 */
export const calculateSLA = tool({
  description:
    'SLA(Service Level Agreement) 가용률을 계산하고 위반 여부를 확인합니다. 월간/주간/일간 기준으로 다운타임을 분석합니다.',
  inputSchema: z.object({
    period: z
      .enum(['daily', 'weekly', 'monthly'])
      .default('monthly')
      .describe('SLA 계산 기간'),
    targetUptime: z
      .number()
      .default(99.9)
      .describe('목표 가용률 (%) - 기본 99.9%'),
  }),
  execute: async ({
    period = 'monthly',
    targetUptime = 99.9,
  }: {
    period?: 'daily' | 'weekly' | 'monthly';
    targetUptime?: number;
  }) => {
    const cache = getDataCache();
    const cacheKey = `sla:${period}:${targetUptime}`;

    return cache.getOrCompute('analysis', cacheKey, async () => {
      console.log(`⏱️ [SLA] Calculating ${period} SLA (target: ${targetUptime}%)`);

      const state = getCurrentState();
      const totalServers = state.servers.length;

      // Calculate downtime from server statuses
      // Assume each critical server = downtime proportional to period
      const criticalServers = state.servers.filter(
        s => s.status === 'critical'
      ).length;

      // Simulated downtime based on current status ratio
      const periodMinutes = {
        daily: 1440,
        weekly: 10080,
        monthly: 43800,
      };

      // Estimate downtime: (critical ratio) * period * sampling factor
      const criticalRatio = criticalServers / Math.max(totalServers, 1);
      const estimatedDowntime = criticalRatio * periodMinutes[period] * 0.1; // 10% sampling

      const maxDowntime = periodMinutes[period] * (1 - targetUptime / 100);
      const actualUptime = 100 - (estimatedDowntime / periodMinutes[period]) * 100;
      const slaViolation = actualUptime < targetUptime;
      const remainingBudget = Math.max(0, maxDowntime - estimatedDowntime);

      const slaMetrics: SLAMetrics = {
        targetUptime,
        actualUptime,
        downtimeMinutes: estimatedDowntime,
        slaViolation,
        remainingBudgetMinutes: remainingBudget,
        period,
      };

      return {
        success: true,
        sla: slaMetrics,
        summary: slaViolation
          ? `⚠️ SLA 위반: ${actualUptime.toFixed(3)}% < ${targetUptime}% (다운타임 ${estimatedDowntime.toFixed(1)}분)`
          : `✅ SLA 준수: ${actualUptime.toFixed(3)}% (남은 예산 ${remainingBudget.toFixed(1)}분)`,
        timestamp: new Date().toISOString(),
      };
    });
  },
});

/**
 * Predict Metrics (Lightweight - No ML Libraries)
 */
export const predictMetrics = tool({
  description:
    '메트릭 값을 예측합니다. 이동평균과 선형회귀를 사용한 경량 예측으로 30분 후 값을 추정합니다.',
  inputSchema: z.object({
    serverId: z.string().describe('예측할 서버 ID'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'network'])
      .default('cpu')
      .describe('예측할 메트릭'),
    horizonMinutes: z
      .number()
      .default(30)
      .describe('예측 시간 범위 (분) - 기본 30분'),
  }),
  execute: async ({
    serverId,
    metric = 'cpu',
    horizonMinutes = 30,
  }: {
    serverId: string;
    metric?: 'cpu' | 'memory' | 'disk' | 'network';
    horizonMinutes?: number;
  }) => {
    const cache = getDataCache();
    const cacheKey = `predict:${serverId}:${metric}:${horizonMinutes}`;

    return cache.getOrCompute('analysis', cacheKey, async () => {
      console.log(`📈 [Predict] ${serverId}/${metric} for next ${horizonMinutes}min`);

      const dataset = FIXED_24H_DATASETS.find(d => d.serverId === serverId);
      if (!dataset) {
        return { success: false, error: `Server not found: ${serverId}` };
      }

      // Get last 2 hours of data (12 points at 10min intervals)
      const recentData = dataset.data.slice(-12);
      const values = recentData.map(p => p[metric] as number);

      if (values.length < 3) {
        return { success: false, error: 'Insufficient data for prediction' };
      }

      // Smooth with moving average
      const smoothed = movingAverage(values, 3);
      const currentValue = smoothed[smoothed.length - 1];

      // Linear regression on smoothed data
      const { slope, intercept } = linearRegression(smoothed);

      // Predict: each index = 10 minutes
      const stepsAhead = horizonMinutes / 10;
      const predictedIndex = smoothed.length - 1 + stepsAhead;
      let predictedValue = intercept + slope * predictedIndex;

      // Clamp to reasonable range
      predictedValue = Math.max(0, Math.min(100, predictedValue));

      // Determine trend
      const trend: 'increasing' | 'decreasing' | 'stable' =
        slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable';

      // Calculate risk level
      const threshold = THRESHOLDS[metric];
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let breachProbability = 0;

      if (predictedValue >= threshold.critical) {
        riskLevel = 'critical';
        breachProbability = 0.9;
      } else if (predictedValue >= threshold.warning) {
        riskLevel = 'high';
        breachProbability = 0.7;
      } else if (predictedValue >= threshold.warning * 0.9) {
        riskLevel = 'medium';
        breachProbability = 0.4;
      } else {
        breachProbability = 0.1;
      }

      const predictedTime = new Date(Date.now() + horizonMinutes * 60 * 1000).toISOString();

      const prediction: PredictionResult = {
        metric,
        currentValue,
        predictedValue,
        predictedTime,
        trend,
        riskLevel,
        breachProbability,
      };

      return {
        success: true,
        serverId,
        prediction,
        summary:
          riskLevel === 'critical' || riskLevel === 'high'
            ? `⚠️ ${horizonMinutes}분 후 ${metric.toUpperCase()} ${predictedValue.toFixed(1)}% 예상 (${riskLevel})`
            : `✅ ${horizonMinutes}분 후 ${metric.toUpperCase()} ${predictedValue.toFixed(1)}% 예상 (안정)`,
        timestamp: new Date().toISOString(),
      };
    });
  },
});

/**
 * Analyze Multi-Server Correlation
 */
export const analyzeServerCorrelation = tool({
  description:
    '다중 서버 간 장애 연관성을 분석합니다. 동시 발생, 전파 패턴, 주기적 연관을 감지합니다.',
  inputSchema: z.object({
    timeWindowMinutes: z
      .number()
      .default(60)
      .describe('분석 시간 범위 (분) - 기본 60분'),
  }),
  execute: async ({
    timeWindowMinutes = 60,
  }: {
    timeWindowMinutes?: number;
  }) => {
    const cache = getDataCache();
    const cacheKey = `correlation:${timeWindowMinutes}`;

    return cache.getOrCompute('analysis', cacheKey, async () => {
      console.log(`🔗 [Correlation] Analyzing ${timeWindowMinutes}min window`);

      const correlations: ServerCorrelation[] = [];
      const state = getCurrentState();

      // Get servers with issues
      const problemServers = state.servers.filter(
        s => s.status === 'warning' || s.status === 'critical'
      );

      if (problemServers.length < 2) {
        return {
          success: true,
          correlations: [],
          summary: '연관 분석 대상 서버가 2대 미만입니다.',
          timestamp: new Date().toISOString(),
        };
      }

      // Check for simultaneous issues (same status in same time window)
      for (let i = 0; i < problemServers.length; i++) {
        for (let j = i + 1; j < problemServers.length; j++) {
          const server1 = problemServers[i];
          const server2 = problemServers[j];

          // Same status = simultaneous
          if (server1.status === server2.status) {
            // Find common high metric
            let commonMetric = 'cpu';
            if (server1.memory > 80 && server2.memory > 80) commonMetric = 'memory';
            if (server1.disk > 80 && server2.disk > 80) commonMetric = 'disk';

            correlations.push({
              serverId: server1.id,
              correlatedWith: server2.id,
              correlationType: 'simultaneous',
              timeLagSeconds: 0,
              affectedMetric: commonMetric,
              confidence: 0.8,
            });
          }
        }
      }

      // Check for cascade patterns from scenarios
      const scenarioMap = new Map<string, ReturnType<typeof getScenariosByServer>>();
      for (const server of state.servers) {
        scenarioMap.set(server.id, getScenariosByServer(server.id));
      }

      // Detect cascade: if server A has spike and server B has gradual increase shortly after
      for (const [serverId1, scenarios1] of scenarioMap) {
        for (const [serverId2, scenarios2] of scenarioMap) {
          if (serverId1 === serverId2) continue;

          const spike1 = scenarios1.find(s => s.pattern === 'spike');
          const gradual2 = scenarios2.find(s => s.pattern === 'gradual');

          if (spike1 && gradual2 && spike1.affectedMetric === gradual2.affectedMetric) {
            // Check time proximity
            const timeDiff = gradual2.timeRange[0] - spike1.timeRange[0];
            if (timeDiff > 0 && timeDiff < 30) {
              correlations.push({
                serverId: serverId1,
                correlatedWith: serverId2,
                correlationType: 'cascade',
                timeLagSeconds: timeDiff * 60,
                affectedMetric: spike1.affectedMetric,
                confidence: 0.7,
              });
            }
          }
        }
      }

      // Deduplicate
      const uniqueCorrelations = correlations.filter(
        (c, i, arr) =>
          arr.findIndex(
            x =>
              (x.serverId === c.serverId && x.correlatedWith === c.correlatedWith) ||
              (x.serverId === c.correlatedWith && x.correlatedWith === c.serverId)
          ) === i
      );

      return {
        success: true,
        correlations: uniqueCorrelations,
        clusterCount: uniqueCorrelations.length > 0 ? 1 : 0,
        summary:
          uniqueCorrelations.length > 0
            ? `${uniqueCorrelations.length}개의 서버 연관 패턴 감지됨`
            : '서버 간 연관 패턴 없음',
        timestamp: new Date().toISOString(),
      };
    });
  },
});

/**
 * Generate Incident Report
 */
export const generateIncidentReport = tool({
  description:
    '종합 장애 보고서를 생성합니다. 영향받은 서버, 타임라인, 근본 원인, 예측, SLA 현황을 포함한 구조화된 보고서를 제공합니다.',
  inputSchema: z.object({
    title: z
      .string()
      .optional()
      .describe('보고서 제목 (미입력시 자동 생성)'),
    includeAllServers: z
      .boolean()
      .default(false)
      .describe('모든 서버 포함 여부 (false면 문제있는 서버만)'),
  }),
  execute: async ({
    title,
    includeAllServers = false,
  }: {
    title?: string;
    includeAllServers?: boolean;
  }) => {
    console.log('📄 [IncidentReport] Generating comprehensive report');

    const state = getCurrentState();
    const now = new Date();

    // 1. Collect affected servers
    const affectedServers = (includeAllServers
      ? state.servers
      : state.servers.filter(s => s.status === 'warning' || s.status === 'critical')
    ).map(s => {
      let primaryIssue = '정상';
      if (s.cpu >= 90) primaryIssue = `CPU ${s.cpu.toFixed(1)}%`;
      else if (s.memory >= 90) primaryIssue = `Memory ${s.memory.toFixed(1)}%`;
      else if (s.disk >= 90) primaryIssue = `Disk ${s.disk.toFixed(1)}%`;
      else if (s.status === 'warning') primaryIssue = '경고 상태';
      else if (s.status === 'critical') primaryIssue = '위험 상태';

      return {
        id: s.id,
        name: s.name,
        status: s.status,
        primaryIssue,
      };
    });

    // 2. Build timeline
    const timeline: TimelineEvent[] = [];
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();

    for (const server of state.servers) {
      const scenarios = getScenariosByServer(server.id);
      const activeScenarios = scenarios.filter(
        s => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
      );

      for (const scenario of activeScenarios) {
        const eventTime = new Date(now);
        eventTime.setMinutes(eventTime.getMinutes() - (minuteOfDay - scenario.timeRange[0]));

        timeline.push({
          timestamp: eventTime.toISOString(),
          eventType: 'scenario_start',
          metric: scenario.affectedMetric,
          severity: scenario.severity === 'critical' ? 'critical' : 'warning',
          description: `${server.name}: ${scenario.affectedMetric.toUpperCase()} ${scenario.pattern} 패턴`,
          serverId: server.id,
        });
      }
    }

    // Sort timeline
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 3. Root cause analysis (simplified)
    let rootCause: RootCauseHypothesis | null = null;
    if (affectedServers.length > 0) {
      const primaryServer = affectedServers[0];
      rootCause = {
        cause: `${primaryServer.name}의 ${primaryServer.primaryIssue}`,
        confidence: 0.75,
        evidence: [
          `영향받은 서버 ${affectedServers.length}대`,
          `타임라인 이벤트 ${timeline.length}건`,
        ],
        suggestedFix: '리소스 사용량 점검 및 부하 분산 검토',
      };
    }

    // 4. Predictions (for critical servers)
    const predictions: PredictionResult[] = [];
    for (const server of affectedServers.slice(0, 3)) {
      const dataset = FIXED_24H_DATASETS.find(d => d.serverId === server.id);
      if (dataset) {
        const recentCpu = dataset.data.slice(-6).map(p => p.cpu);
        const { slope } = linearRegression(recentCpu);
        const currentCpu = recentCpu[recentCpu.length - 1];
        const predictedCpu = Math.max(0, Math.min(100, currentCpu + slope * 3));

        predictions.push({
          metric: `${server.name} CPU`,
          currentValue: currentCpu,
          predictedValue: predictedCpu,
          predictedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          trend: slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable',
          riskLevel: predictedCpu >= 90 ? 'critical' : predictedCpu >= 80 ? 'high' : 'low',
          breachProbability: predictedCpu >= 90 ? 0.8 : predictedCpu >= 80 ? 0.5 : 0.2,
        });
      }
    }

    // 5. Correlations (simplified)
    const correlations: ServerCorrelation[] = [];
    if (affectedServers.length >= 2) {
      correlations.push({
        serverId: affectedServers[0].id,
        correlatedWith: affectedServers[1].id,
        correlationType: 'simultaneous',
        timeLagSeconds: 0,
        affectedMetric: 'cpu',
        confidence: 0.7,
      });
    }

    // 6. SLA calculation
    const criticalCount = state.servers.filter(
      s => s.status === 'critical'
    ).length;
    const downtimeMinutes = (criticalCount / state.servers.length) * 43800 * 0.1;
    const actualUptime = 100 - (downtimeMinutes / 43800) * 100;

    const sla: SLAMetrics = {
      targetUptime: 99.9,
      actualUptime,
      downtimeMinutes,
      slaViolation: actualUptime < 99.9,
      remainingBudgetMinutes: Math.max(0, 43.8 - downtimeMinutes),
      period: 'monthly',
    };

    // 7. Suggested actions
    const suggestedActions: string[] = [];
    if (affectedServers.some(s => s.primaryIssue.includes('CPU'))) {
      suggestedActions.push('CPU 고부하 프로세스 확인 및 종료');
    }
    if (affectedServers.some(s => s.primaryIssue.includes('Memory'))) {
      suggestedActions.push('메모리 누수 점검 및 캐시 정리');
    }
    if (affectedServers.some(s => s.primaryIssue.includes('Disk'))) {
      suggestedActions.push('디스크 정리 및 로그 로테이션 확인');
    }
    if (suggestedActions.length === 0) {
      suggestedActions.push('시스템 상태 모니터링 유지');
    }
    suggestedActions.push('관련 팀에 장애 현황 공유');

    // 8. Determine severity
    const severity = determineSeverity(state.servers);

    // 9. Generate report title and summary
    const reportTitle = title || `${now.toISOString().slice(0, 10)} 시스템 상태 보고서`;
    const summary = affectedServers.length > 0
      ? `${affectedServers.length}대 서버에서 이상 감지됨. 주요 이슈: ${affectedServers[0]?.primaryIssue || '확인 필요'}`
      : '모든 서버 정상 운영 중';

    // Build report object (without markdown for now)
    const reportBase = {
      id: generateIncidentId(),
      generatedAt: now.toISOString(),
      severity,
      title: reportTitle,
      summary,
      affectedServers,
      timeline: timeline.slice(0, 10),
      rootCause,
      correlations,
      predictions,
      sla,
      suggestedActions,
    };

    // Generate markdown
    const markdown = generateMarkdownReport(reportBase);

    const report: IncidentReport = {
      ...reportBase,
      markdown,
    };

    return {
      success: true,
      report,
      summary: `${severity.toUpperCase()} 등급 보고서 생성 완료 (${affectedServers.length}대 서버)`,
      timestamp: now.toISOString(),
    };
  },
});
