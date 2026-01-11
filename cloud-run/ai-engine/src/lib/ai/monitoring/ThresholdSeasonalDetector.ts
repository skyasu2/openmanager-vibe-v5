/**
 * 🔬 Threshold + Seasonal Anomaly Detector v1.0
 *
 * 베스트 프랙티스 기반 이상 탐지기 (Dashboard 호환)
 * 
 * 핵심 원칙:
 * - Dashboard와 동일한 임계값 사용 (일관성)
 * - 통계적 이상 탐지 보조
 * - 계절성 패턴 비교 (Datadog 스타일)
 *
 * 탐지 방식:
 * 1. 임계값 기반 (Primary) - Dashboard와 동일 기준
 * 2. 통계적 탐지 (Secondary) - 이동평균 + 2σ
 * 3. 계절성 탐지 (Tertiary) - 24시간 전 비교
 *
 * @created 2026-01-12
 */

import { STATUS_THRESHOLDS } from '../../../config/status-thresholds';

// ============================================================================
// Types
// ============================================================================

export interface ThresholdSeasonalResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  reasons: string[];
  detectionMethods: {
    threshold: { triggered: boolean; level: 'warning' | 'critical' | 'none' };
    statistical: { triggered: boolean; zScore: number };
    seasonal: { triggered: boolean; deviationPercent: number };
  };
}

export interface ServerAnalysisResult {
  serverId: string;
  serverName: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    cpu: ThresholdSeasonalResult;
    memory: ThresholdSeasonalResult;
    disk: ThresholdSeasonalResult;
    network: ThresholdSeasonalResult;
  };
  overallScore: number;
  recommendations: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  statistical: {
    shortWindow: 5,
    longWindow: 20,
    zScoreThreshold: 2,
  },
  seasonal: {
    hourlyOffset: 24,
    tolerancePercent: 15,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateMovingAverage(values: number[], windowSize: number): number {
  if (values.length === 0) return 0;
  const window = values.slice(-windowSize);
  return window.reduce((sum, v) => sum + v, 0) / window.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * 1️⃣ 임계값 기반 탐지 (Dashboard 동일 기준)
 */
function detectByThreshold(
  value: number,
  metricType: 'cpu' | 'memory' | 'disk' | 'network'
): { triggered: boolean; level: 'warning' | 'critical' | 'none'; reason: string } {
  const thresholds = STATUS_THRESHOLDS[metricType];
  
  if (value >= thresholds.critical) {
    return {
      triggered: true,
      level: 'critical',
      reason: `${metricType.toUpperCase()} ${value.toFixed(1)}% >= ${thresholds.critical}% (Critical)`,
    };
  }
  if (value >= thresholds.warning) {
    return {
      triggered: true,
      level: 'warning',
      reason: `${metricType.toUpperCase()} ${value.toFixed(1)}% >= ${thresholds.warning}% (Warning)`,
    };
  }
  return { triggered: false, level: 'none', reason: '' };
}

/**
 * 2️⃣ 통계적 탐지 (Z-Score 기반)
 */
function detectByStatistics(
  currentValue: number,
  historicalValues: number[]
): { triggered: boolean; zScore: number; reason: string } {
  if (historicalValues.length < CONFIG.statistical.shortWindow) {
    return { triggered: false, zScore: 0, reason: 'Insufficient data' };
  }

  const mean = calculateMovingAverage(historicalValues, CONFIG.statistical.longWindow);
  const stdDev = calculateStdDev(historicalValues, mean);
  const zScore = stdDev > 0 ? (currentValue - mean) / stdDev : 0;

  if (Math.abs(zScore) > CONFIG.statistical.zScoreThreshold) {
    return {
      triggered: true,
      zScore,
      reason: `Statistical deviation: Z-score ${zScore.toFixed(2)}`,
    };
  }
  return { triggered: false, zScore, reason: '' };
}

/**
 * 3️⃣ 계절성 탐지 (24시간 전 비교)
 */
function detectBySeasonal(
  currentValue: number,
  historicalValues: number[]
): { triggered: boolean; deviationPercent: number; reason: string } {
  if (historicalValues.length < CONFIG.seasonal.hourlyOffset) {
    return { triggered: false, deviationPercent: 0, reason: 'Insufficient seasonal data' };
  }

  const seasonalValue = historicalValues[historicalValues.length - CONFIG.seasonal.hourlyOffset];
  const deviationPercent = ((currentValue - seasonalValue) / Math.max(seasonalValue, 1)) * 100;

  if (Math.abs(deviationPercent) > CONFIG.seasonal.tolerancePercent * 2) {
    return {
      triggered: true,
      deviationPercent,
      reason: `Seasonal anomaly: ${Math.abs(deviationPercent).toFixed(1)}% deviation from 24h ago`,
    };
  }
  return { triggered: false, deviationPercent, reason: '' };
}

// ============================================================================
// Main Detector Class
// ============================================================================

export class ThresholdSeasonalDetector {
  private historicalData: Map<string, Map<string, number[]>> = new Map();

  /**
   * 히스토리 데이터 추가
   */
  addDataPoint(serverId: string, metric: string, value: number): void {
    if (!this.historicalData.has(serverId)) {
      this.historicalData.set(serverId, new Map());
    }
    const serverData = this.historicalData.get(serverId)!;
    if (!serverData.has(metric)) {
      serverData.set(metric, []);
    }
    const metricData = serverData.get(metric)!;
    metricData.push(value);

    // 최대 48시간 데이터 유지
    if (metricData.length > 48) {
      metricData.shift();
    }
  }

  /**
   * 단일 메트릭 분석
   */
  analyzeMetric(
    serverId: string,
    metricName: 'cpu' | 'memory' | 'disk' | 'network',
    currentValue: number
  ): ThresholdSeasonalResult {
    const historicalValues = this.getHistoricalValues(serverId, metricName);
    this.addDataPoint(serverId, metricName, currentValue);

    // 3가지 방식으로 탐지
    const thresholdResult = detectByThreshold(currentValue, metricName);
    const statisticalResult = detectByStatistics(currentValue, historicalValues);
    const seasonalResult = detectBySeasonal(currentValue, historicalValues);

    // 최종 판정: 임계값 초과 시 무조건 이상 (Dashboard 일관성)
    const isAnomaly = thresholdResult.triggered || 
      (statisticalResult.triggered && seasonalResult.triggered);

    // 심각도 결정
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (thresholdResult.level === 'critical') {
      severity = 'high';
    } else if (thresholdResult.level === 'warning') {
      severity = 'medium';
    } else if (statisticalResult.triggered || seasonalResult.triggered) {
      severity = 'medium';
    }

    // 신뢰도 계산
    const methodsTriggered = [
      thresholdResult.triggered,
      statisticalResult.triggered,
      seasonalResult.triggered,
    ].filter(Boolean).length;
    const dataConfidence = Math.min(historicalValues.length / 24, 1);
    const confidence = isAnomaly 
      ? 0.5 + (methodsTriggered / 3) * 0.3 + dataConfidence * 0.2
      : 0.9;

    // 이유 수집
    const reasons: string[] = [];
    if (thresholdResult.reason) reasons.push(thresholdResult.reason);
    if (statisticalResult.reason && statisticalResult.triggered) reasons.push(statisticalResult.reason);
    if (seasonalResult.reason && seasonalResult.triggered) reasons.push(seasonalResult.reason);

    return {
      isAnomaly,
      severity,
      confidence,
      reasons,
      detectionMethods: {
        threshold: { triggered: thresholdResult.triggered, level: thresholdResult.level },
        statistical: { triggered: statisticalResult.triggered, zScore: statisticalResult.zScore },
        seasonal: { triggered: seasonalResult.triggered, deviationPercent: seasonalResult.deviationPercent },
      },
    };
  }

  /**
   * 서버 전체 분석
   */
  analyzeServer(
    serverId: string,
    serverName: string,
    metrics: { cpu: number; memory: number; disk: number; network: number }
  ): ServerAnalysisResult {
    const cpuResult = this.analyzeMetric(serverId, 'cpu', metrics.cpu);
    const memoryResult = this.analyzeMetric(serverId, 'memory', metrics.memory);
    const diskResult = this.analyzeMetric(serverId, 'disk', metrics.disk);
    const networkResult = this.analyzeMetric(serverId, 'network', metrics.network);

    // 상태 결정
    const results = [cpuResult, memoryResult, diskResult, networkResult];
    const hasCritical = results.some((r) => r.isAnomaly && r.severity === 'high');
    const hasWarning = results.some((r) => r.isAnomaly && r.severity === 'medium');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (hasCritical) status = 'critical';
    else if (hasWarning) status = 'warning';

    // 점수 계산
    const anomalyCount = results.filter((r) => r.isAnomaly).length;
    const overallScore = Math.max(0, 100 - anomalyCount * 20);

    // 권장 사항
    const recommendations = this.generateRecommendations(cpuResult, memoryResult, diskResult, networkResult);

    return {
      serverId,
      serverName,
      status,
      metrics: { cpu: cpuResult, memory: memoryResult, disk: diskResult, network: networkResult },
      overallScore,
      recommendations,
    };
  }

  private getHistoricalValues(serverId: string, metric: string): number[] {
    const serverData = this.historicalData.get(serverId);
    if (!serverData) return [];
    return serverData.get(metric) || [];
  }

  private generateRecommendations(
    cpu: ThresholdSeasonalResult,
    memory: ThresholdSeasonalResult,
    disk: ThresholdSeasonalResult,
    network: ThresholdSeasonalResult
  ): string[] {
    const recommendations: string[] = [];

    if (cpu.isAnomaly && cpu.severity === 'high') {
      recommendations.push('CPU 사용량이 임계치를 초과했습니다. 프로세스 점검이 필요합니다.');
    } else if (cpu.isAnomaly) {
      recommendations.push('CPU 사용량 추이를 모니터링하세요.');
    }

    if (memory.isAnomaly && memory.severity === 'high') {
      recommendations.push('메모리 사용량이 위험 수준입니다. 메모리 누수 점검을 권장합니다.');
    } else if (memory.isAnomaly) {
      recommendations.push('메모리 사용량이 증가 추세입니다.');
    }

    if (disk.isAnomaly && disk.severity === 'high') {
      recommendations.push('디스크 공간이 부족합니다. 즉시 정리가 필요합니다.');
    } else if (disk.isAnomaly) {
      recommendations.push('디스크 사용량 증가를 확인하세요.');
    }

    if (network.isAnomaly) {
      recommendations.push('네트워크 트래픽 이상이 감지되었습니다.');
    }

    if (recommendations.length === 0) {
      recommendations.push('현재 모든 지표가 정상 범위 내에 있습니다.');
    }

    return recommendations;
  }

  clearHistory(): void {
    this.historicalData.clear();
  }

  injectHistory(serverId: string, metric: string, values: number[]): void {
    if (!this.historicalData.has(serverId)) {
      this.historicalData.set(serverId, new Map());
    }
    this.historicalData.get(serverId)!.set(metric, [...values]);
  }
}

// ============================================================================
// Singleton
// ============================================================================

let instance: ThresholdSeasonalDetector | null = null;

export function getThresholdSeasonalDetector(): ThresholdSeasonalDetector {
  if (!instance) {
    instance = new ThresholdSeasonalDetector();
  }
  return instance;
}

export function resetThresholdSeasonalDetector(): void {
  if (instance) {
    instance.clearHistory();
  }
  instance = null;
}
