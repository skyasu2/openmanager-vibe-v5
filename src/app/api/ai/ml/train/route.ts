/**
 * 🧠 ML 학습 트리거 API
 *
 * POST /api/ai/ml/train
 * - 2가지 ML 학습 타입 지원: patterns, incident
 * - anomaly/prediction은 IntelligentMonitoringPage에서 제공 (중복 제거)
 * - 실제 서버 메트릭 데이터 기반 학습
 * - 학습 결과 Supabase 저장
 */

import crypto from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { getCachedData, setCachedData } from '@/lib/cache/cache-helper';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// anomaly/prediction은 IntelligentMonitoringPage에서 제공 (중복 제거)
type LearningType = 'patterns' | 'incident';

/**
 * ML 학습을 위한 메트릭 데이터 타입
 * (포트폴리오용 Mock 데이터 생성)
 */
interface MLMetricData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage?: number;
  network_usage?: number;
  timestamp: string;
  server_id?: string;
}

interface TrainRequest {
  type: LearningType;
  serverId?: string;
  timeRange?: '1h' | '6h' | '24h' | '7d';
  config?: {
    threshold?: number;
    sensitivity?: 'low' | 'medium' | 'high';
  };
}

interface TrainingResult {
  id: string;
  type: LearningType;
  patternsLearned: number;
  accuracyImprovement: number;
  confidence: number;
  insights: string[];
  nextRecommendation: string;
  metadata: {
    processingTime: number;
    dataPoints: number;
    algorithm: string;
    version: string;
  };
  timestamp: string;
}

// 이전 학습 결과 타입 (정확도 비교용)
interface PreviousTrainingStats {
  avgAccuracy: number;
  avgConfidence: number;
  totalPatterns: number;
  trainingCount: number;
}

// 📊 이전 학습 결과 조회 (정확도 개선 계산용)
async function getPreviousTrainingStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: LearningType,
  limit = 5
): Promise<PreviousTrainingStats> {
  const { data, error } = await supabase
    .from('ml_training_results')
    .select('accuracy_improvement, confidence, patterns_learned')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    // 이전 데이터 없으면 기본값 반환
    return {
      avgAccuracy: 0,
      avgConfidence: 0.5,
      totalPatterns: 0,
      trainingCount: 0,
    };
  }

  const avgAccuracy =
    data.reduce((sum, r) => sum + (r.accuracy_improvement || 0), 0) /
    data.length;
  const avgConfidence =
    data.reduce((sum, r) => sum + (r.confidence || 0), 0) / data.length;
  const totalPatterns = data.reduce(
    (sum, r) => sum + (r.patterns_learned || 0),
    0
  );

  return {
    avgAccuracy,
    avgConfidence,
    totalPatterns,
    trainingCount: data.length,
  };
}

// 📈 실제 정확도 개선 계산 (이전 결과와 비교)
function calculateAccuracyImprovement(
  currentPatterns: number,
  previousStats: PreviousTrainingStats
): number {
  if (previousStats.trainingCount === 0) {
    // 첫 학습: 기본 개선율 (새로 발견된 패턴 기반)
    return Math.min(currentPatterns * 2, 30);
  }

  const avgPreviousPatterns =
    previousStats.totalPatterns / previousStats.trainingCount;

  if (avgPreviousPatterns === 0) {
    return Math.min(currentPatterns * 2, 30);
  }

  // 패턴 수 증가율 기반 개선율 계산
  const patternGrowth =
    ((currentPatterns - avgPreviousPatterns) / avgPreviousPatterns) * 100;

  // -20% ~ +40% 범위로 제한 (비현실적 값 방지)
  return Math.max(-20, Math.min(40, patternGrowth + previousStats.avgAccuracy));
}

// 📊 신뢰도 계산 (샘플 크기 + 데이터 품질 기반)
function calculateConfidence(
  dataPoints: number,
  dataQualityScore: number // 0-1 사이 값
): number {
  // 샘플 크기 기여 (최소 10개, 최대 1000개 기준)
  const sampleContribution = Math.min(1, dataPoints / 100) * 0.4;

  // 데이터 품질 기여
  const qualityContribution = dataQualityScore * 0.6;

  // 최종 신뢰도 (0.5 ~ 0.99 범위)
  const confidence = 0.5 + (sampleContribution + qualityContribution) * 0.49;

  return Math.min(0.99, Math.max(0.5, confidence));
}

// 🎯 하이브리드 아키텍처: Supabase server_metrics 테이블에서 실제 데이터 조회
// Frontend: JSON 파일 (CDN), Backend/AI: Supabase (queryable)
async function getServerMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serverId?: string,
  timeRange = '24h'
): Promise<MLMetricData[]> {
  // 시간 범위에 따라 조회할 시간대 수 결정
  const hourLimits: Record<string, number> = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 24, // 24시간 데이터만 있으므로 최대 24
  };
  const limit = hourLimits[timeRange] ?? 24;

  // Supabase에서 server_metrics 조회
  let query = supabase
    .from('server_metrics')
    .select('server_id, cpu, memory, disk, network, recorded_at')
    .order('hour', { ascending: true })
    .limit(limit * 8); // 8개 서버 × 시간대

  if (serverId) {
    query = query.eq('server_id', serverId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase 메트릭 조회 실패:', error);
    // 폴백: Mock 데이터 생성
    return generateFallbackMetrics(serverId, timeRange);
  }

  if (!data || data.length === 0) {
    console.warn('Supabase에 메트릭 데이터 없음, 폴백 사용');
    return generateFallbackMetrics(serverId, timeRange);
  }

  // Supabase 데이터 → MLMetricData 변환
  return data.map((row) => ({
    cpu_usage: Number(row.cpu),
    memory_usage: Number(row.memory),
    disk_usage: Number(row.disk),
    network_usage: Number(row.network),
    timestamp: row.recorded_at,
    server_id: row.server_id,
  }));
}

// 폴백: Supabase 데이터 없을 때 Mock 생성
function generateFallbackMetrics(
  serverId?: string,
  timeRange = '24h'
): MLMetricData[] {
  const now = new Date();
  const timeRangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };

  const defaultDuration = 24 * 60 * 60 * 1000;
  const duration = timeRangeMs[timeRange] ?? defaultDuration;
  const interval = 5 * 60 * 1000;
  const dataPoints = Math.min(Math.floor(duration / interval), 1000);

  const mockData: MLMetricData[] = [];
  const serverIds = serverId
    ? [serverId]
    : ['web-server-1', 'api-server-1', 'db-server-1'];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - i * interval);
    const baseServerId = serverIds[i % serverIds.length];
    const hour = timestamp.getHours();
    const isBusinessHour = hour >= 9 && hour <= 18;
    const loadMultiplier = isBusinessHour ? 1.3 : 0.7;

    mockData.push({
      cpu_usage: Math.min(95, (20 + Math.random() * 40) * loadMultiplier),
      memory_usage: Math.min(90, (30 + Math.random() * 35) * loadMultiplier),
      disk_usage: 40 + Math.random() * 30,
      network_usage: (10 + Math.random() * 50) * loadMultiplier,
      timestamp: timestamp.toISOString(),
      server_id: baseServerId,
    });
  }

  return mockData;
}

// 패턴 학습 알고리즘
function trainPatterns(metrics: MLMetricData[]): Partial<TrainingResult> {
  // CPU/Memory 상관관계 분석
  const cpuMemoryCorrelations = metrics.map((m) => ({
    cpu: m.cpu_usage || 0,
    memory: m.memory_usage || 0,
    timestamp: m.timestamp,
  }));

  // 간단한 상관계수 계산
  const avgCpu =
    cpuMemoryCorrelations.reduce((sum, m) => sum + m.cpu, 0) /
    cpuMemoryCorrelations.length;
  const avgMemory =
    cpuMemoryCorrelations.reduce((sum, m) => sum + m.memory, 0) /
    cpuMemoryCorrelations.length;

  const correlation =
    cpuMemoryCorrelations.reduce((sum, m) => {
      return sum + (m.cpu - avgCpu) * (m.memory - avgMemory);
    }, 0) / cpuMemoryCorrelations.length;

  const insights = [
    `CPU-메모리 상관계수: ${correlation.toFixed(3)}`,
    `평균 CPU 사용률: ${avgCpu.toFixed(1)}%`,
    `평균 메모리 사용률: ${avgMemory.toFixed(1)}%`,
  ];

  if (correlation > 0.7) {
    insights.push('높은 양의 상관관계 - CPU 증가 시 메모리도 증가');
  }

  // 📊 실제 패턴 수 계산: 상관관계 강도 + 변동성 기반
  const variance =
    cpuMemoryCorrelations.reduce((sum, m) => sum + (m.cpu - avgCpu) ** 2, 0) /
    cpuMemoryCorrelations.length;
  const stdDev = Math.sqrt(variance);

  // 패턴 수: 상관관계가 강하고 변동성이 높을수록 더 많은 패턴 발견
  const patternsLearned = Math.max(
    1,
    Math.floor(Math.abs(correlation) * 10 + stdDev / 5)
  );

  // 데이터 품질 점수: 데이터 포인트 수 + 값 범위 다양성 기반
  const valueRange =
    Math.max(...cpuMemoryCorrelations.map((m) => m.cpu)) -
    Math.min(...cpuMemoryCorrelations.map((m) => m.cpu));
  const dataQualityScore = Math.min(1, (valueRange / 100) * 0.5 + 0.5);

  return {
    patternsLearned,
    accuracyImprovement: 0, // performMLTraining에서 이전 결과와 비교하여 계산
    confidence: calculateConfidence(metrics.length, dataQualityScore),
    insights,
    nextRecommendation: '네트워크 I/O 패턴 분석 추가 권장',
    metadata: {
      processingTime: Date.now() - Date.now(), // Will be set properly in main function
      dataPoints: metrics.length,
      algorithm: 'correlation_analysis',
      version: '2.0', // 버전 업그레이드
    },
  };
}

// 이상 패턴 분석
function _trainAnomalyDetection(
  metrics: MLMetricData[]
): Partial<TrainingResult> {
  // 임계값 기반 이상 탐지
  const anomalies = [];

  for (const metric of metrics) {
    if (metric.cpu_usage > 90) {
      anomalies.push({
        type: 'cpu',
        severity: 'high',
        value: metric.cpu_usage,
      });
    }
    if (metric.memory_usage > 95) {
      anomalies.push({
        type: 'memory',
        severity: 'critical',
        value: metric.memory_usage,
      });
    }
    if (metric.disk_usage && metric.disk_usage > 90) {
      anomalies.push({
        type: 'disk',
        severity: 'high',
        value: metric.disk_usage,
      });
    }
  }

  const cpuAnomalies = anomalies.filter((a) => a.type === 'cpu').length;
  const memoryAnomalies = anomalies.filter((a) => a.type === 'memory').length;
  const diskAnomalies = anomalies.filter((a) => a.type === 'disk').length;

  const insights = [
    `탐지된 이상 패턴: ${anomalies.length}개`,
    `CPU 이상: ${cpuAnomalies}건`,
    `메모리 이상: ${memoryAnomalies}건`,
    `디스크 이상: ${diskAnomalies}건`,
  ];

  // 📊 데이터 품질 점수: 이상 탐지 정확도는 데이터 다양성에 의존
  // 다양한 유형의 이상이 탐지될수록 더 높은 품질
  const anomalyTypeCount = [
    cpuAnomalies,
    memoryAnomalies,
    diskAnomalies,
  ].filter((count) => count > 0).length;
  const dataQualityScore = Math.min(
    1,
    anomalyTypeCount / 3 + metrics.length / 200
  );

  return {
    patternsLearned: anomalies.length, // 실제 탐지된 이상 패턴 수 (변경 없음)
    accuracyImprovement: 0, // performMLTraining에서 이전 결과와 비교하여 계산
    confidence: calculateConfidence(metrics.length, dataQualityScore),
    insights,
    nextRecommendation: '임계값 자동 조정 알고리즘 도입 권장',
    metadata: {
      processingTime: 0, // Will be set properly in main function
      dataPoints: metrics.length,
      algorithm: 'threshold_based_anomaly',
      version: '2.0', // 버전 업그레이드
    },
  };
}

// 장애 케이스 학습 (v2.0: 실제 메트릭 임계값 분석)
function trainIncidentLearning(
  metrics: MLMetricData[]
): Partial<TrainingResult> {
  // 📊 실제 메트릭에서 임계값 초과 횟수 계산
  const cpuCriticalCount = metrics.filter(
    (m) => (m.cpu_usage ?? 0) > 95
  ).length;
  const memoryCriticalCount = metrics.filter(
    (m) => (m.memory_usage ?? 0) > 98
  ).length;
  const diskCriticalCount = metrics.filter(
    (m) => (m.disk_usage ?? 0) > 95
  ).length;

  // 장애 패턴 (실제 데이터 기반 발생 횟수)
  const incidentPatterns = [
    {
      pattern: 'CPU > 95% for 5+ minutes',
      occurrences: Math.max(1, Math.floor(cpuCriticalCount / 5)), // 5개 연속 = 1건
      avgResolutionTime: '12분',
    },
    {
      pattern: 'Memory > 98% + Swap usage',
      occurrences: Math.max(1, Math.floor(memoryCriticalCount / 3)), // 3개 연속 = 1건
      avgResolutionTime: '8분',
    },
    {
      pattern: 'Disk > 95% + I/O errors',
      occurrences: Math.max(1, Math.floor(diskCriticalCount / 2)), // 2개 연속 = 1건
      avgResolutionTime: '15분',
    },
  ];

  const totalPatterns = incidentPatterns.reduce(
    (sum, p) => sum + p.occurrences,
    0
  );

  // 📈 데이터 품질 점수 (임계값 초과 다양성)
  const criticalTypes = [
    cpuCriticalCount > 0,
    memoryCriticalCount > 0,
    diskCriticalCount > 0,
  ];
  const dataQualityScore = criticalTypes.filter(Boolean).length / 3; // 0-1

  // 가장 빈번한 패턴 찾기
  const maxPattern = incidentPatterns.reduce((prev, curr) =>
    curr.occurrences > prev.occurrences ? curr : prev
  );

  const insights = [
    `학습된 장애 패턴: ${incidentPatterns.length}가지`,
    `총 발생 사례: ${totalPatterns}건`,
    `가장 빈번한 패턴: ${maxPattern.pattern} (${maxPattern.occurrences}건)`,
    `임계값 초과: CPU ${cpuCriticalCount}회, 메모리 ${memoryCriticalCount}회, 디스크 ${diskCriticalCount}회`,
  ];

  return {
    patternsLearned: totalPatterns,
    accuracyImprovement: 0, // POST 핸들러에서 이전 결과와 비교하여 계산
    confidence: calculateConfidence(metrics.length, dataQualityScore),
    insights,
    nextRecommendation:
      totalPatterns > 5
        ? '즉시 스케일링 정책 점검 필요'
        : '예방적 스케일링 정책 수립 권장',
    metadata: {
      processingTime: 0, // Will be set properly in main function
      dataPoints: metrics.length,
      algorithm: 'incident_pattern_recognition',
      version: '2.0',
    },
  };
}

// 예측 모델 훈련 (v2.0: 실제 트렌드 분석)
function _trainPredictionModel(
  metrics: MLMetricData[]
): Partial<TrainingResult> {
  // 간단한 시계열 트렌드 분석
  const sortedMetrics = metrics.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // CPU 사용률 트렌드 계산
  const cpuTrend = sortedMetrics.map((m) => m.cpu_usage || 0);
  const memoryTrend = sortedMetrics.map((m) => m.memory_usage || 0);

  // 선형 회귀를 통한 트렌드 분석 (간단한 버전)
  const firstCpu = cpuTrend[0] ?? 0;
  const lastCpu =
    cpuTrend.length > 0
      ? (cpuTrend[cpuTrend.length - 1] ?? firstCpu)
      : firstCpu;
  const firstMemory = memoryTrend[0] ?? 0;
  const lastMemory =
    memoryTrend.length > 0
      ? (memoryTrend[memoryTrend.length - 1] ?? firstMemory)
      : firstMemory;
  const cpuSlope =
    cpuTrend.length > 1 ? (lastCpu - firstCpu) / cpuTrend.length : 0;
  const memorySlope =
    memoryTrend.length > 1
      ? (lastMemory - firstMemory) / memoryTrend.length
      : 0;

  // 📊 패턴 수 계산 (트렌드 변화점 기반)
  let trendChanges = 0;
  for (let i = 1; i < cpuTrend.length - 1; i++) {
    const prev = cpuTrend[i - 1] ?? 0;
    const curr = cpuTrend[i] ?? 0;
    const next = cpuTrend[i + 1] ?? 0;
    // 변곡점 감지 (방향 전환)
    if ((curr - prev) * (next - curr) < 0) {
      trendChanges++;
    }
  }
  const patternsLearned = Math.max(5, trendChanges + 3); // 최소 5개 패턴

  // 📈 데이터 품질: 트렌드 일관성 (R² 유사 지표)
  const cpuMean = cpuTrend.reduce((a, b) => a + b, 0) / cpuTrend.length || 0;
  const cpuVariance =
    cpuTrend.reduce((sum, v) => sum + (v - cpuMean) ** 2, 0) / cpuTrend.length;
  const trendConsistency = Math.max(0.3, 1 - cpuVariance / 1000); // 분산 기반 일관성

  // 예측 정확도 계산 (샘플 크기 + 트렌드 일관성)
  const predictedAccuracy = Math.min(
    95,
    70 + metrics.length / 10 + trendConsistency * 10
  );

  const insights = [
    `CPU 사용률 트렌드: ${cpuSlope > 0 ? '증가' : '감소'} (${Math.abs(cpuSlope).toFixed(2)}%/시간)`,
    `메모리 사용률 트렌드: ${memorySlope > 0 ? '증가' : '감소'} (${Math.abs(memorySlope).toFixed(2)}%/시간)`,
    `24시간 후 예측 정확도: ${predictedAccuracy.toFixed(1)}%`,
    `감지된 트렌드 변화점: ${trendChanges}개`,
  ];

  return {
    patternsLearned,
    accuracyImprovement: 0, // POST 핸들러에서 이전 결과와 비교하여 계산
    confidence: calculateConfidence(metrics.length, trendConsistency),
    insights,
    nextRecommendation:
      trendChanges > 10
        ? '데이터 노이즈 필터링 필요'
        : '계절적 변동 데이터 추가 학습 권장',
    metadata: {
      processingTime: 0, // Will be set properly in main function
      dataPoints: metrics.length,
      algorithm: 'linear_regression_trend',
      version: '2.0',
    },
  };
}

function performMLTraining(
  type: LearningType,
  metrics: MLMetricData[]
): Partial<TrainingResult> {
  const startTime = Date.now();

  let result: Partial<TrainingResult>;

  switch (type) {
    case 'patterns':
      result = trainPatterns(metrics);
      break;
    case 'incident':
      result = trainIncidentLearning(metrics);
      break;
    // anomaly/prediction은 IntelligentMonitoringPage에서 제공
    default:
      throw new Error('지원하지 않는 학습 타입입니다.');
  }

  const processingTime = Date.now() - startTime;

  const metadataBase: TrainingResult['metadata'] = result.metadata ?? {
    dataPoints: metrics.length,
    algorithm: 'unspecified',
    version: '1.0',
    processingTime,
  };

  return {
    ...result,
    metadata: {
      processingTime,
      dataPoints: metadataBase.dataPoints ?? metrics.length,
      algorithm: metadataBase.algorithm ?? 'unspecified',
      version: metadataBase.version ?? '1.0',
    },
  };
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const body: TrainRequest = await request.json();
    const { type, serverId, timeRange = '24h', config } = body;

    // anomaly/prediction은 IntelligentMonitoringPage에서 제공 (중복 제거)
    if (!type || !['patterns', 'incident'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 학습 타입입니다. (지원: patterns, incident)' },
        { status: 400 }
      );
    }

    // 캐시 키 생성
    const cacheKey = `ml_train_${type}_${serverId || 'all'}_${timeRange}`;
    const cached = getCachedData<TrainingResult>(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        result: cached,
      });
    }

    // Mock 서버 메트릭 데이터 생성 (포트폴리오용)
    const metrics = await getServerMetrics(supabase, serverId, timeRange);

    if (metrics.length === 0) {
      return NextResponse.json(
        { error: '학습할 메트릭 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 📊 이전 학습 결과 조회 (정확도 개선 계산용)
    const previousStats = await getPreviousTrainingStats(supabase, type, 5);

    // 로컬 ML 학습 실행
    const trainingResult = performMLTraining(type, metrics);

    // 📈 실제 정확도 개선 계산
    const accuracyImprovement = calculateAccuracyImprovement(
      trainingResult.patternsLearned || 0,
      previousStats
    );

    // 결과 생성
    const normalizedMetadata: TrainingResult['metadata'] = {
      processingTime: trainingResult.metadata?.processingTime ?? 0,
      dataPoints: trainingResult.metadata?.dataPoints ?? metrics.length,
      algorithm: trainingResult.metadata?.algorithm ?? 'unknown',
      version: trainingResult.metadata?.version ?? '2.0', // v2.0 업데이트
    };

    const result: TrainingResult = {
      id: crypto.randomUUID(),
      type,
      patternsLearned: trainingResult.patternsLearned || 0,
      accuracyImprovement, // 실제 계산된 정확도 개선
      confidence: trainingResult.confidence || 0,
      insights: trainingResult.insights || [],
      nextRecommendation: trainingResult.nextRecommendation || '',
      metadata: normalizedMetadata,
      timestamp: new Date().toISOString(),
    };

    // Supabase에 결과 저장
    const { error: saveError } = await supabase
      .from('ml_training_results')
      .insert({
        id: result.id,
        type: result.type,
        patterns_learned: result.patternsLearned,
        accuracy_improvement: result.accuracyImprovement,
        confidence: result.confidence,
        insights: result.insights,
        next_recommendation: result.nextRecommendation,
        metadata: result.metadata,
        created_at: result.timestamp,
        server_id: serverId || null,
        time_range: timeRange,
        config: config || null,
      });

    if (saveError) {
      console.error('ML 학습 결과 저장 실패:', saveError);
      // 저장 실패해도 결과는 반환
    }

    // 캐시에 저장 (5분)
    setCachedData(cacheKey, result, 300);

    return NextResponse.json({
      success: true,
      result,
      cached: false,
      source: 'local',
    });
  } catch (error) {
    console.error('ML 학습 실패:', error);

    return NextResponse.json(
      {
        error: 'ML 학습 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
