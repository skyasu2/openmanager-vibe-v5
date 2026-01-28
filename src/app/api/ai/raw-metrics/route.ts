export const maxDuration = 10; // Vercel Free Tier

import fs from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import {
  safeConnections,
  safeResponseTime,
  safeServerStatus,
} from '@/lib/utils/type-converters';

/**
 * 🤖 AI 분석 무결성 보장 API
 *
 * ✅ 제공되는 데이터:
 * - 순수 Raw 메트릭 (CPU, Memory, Disk, Network)
 * - 서버 기본 정보 (ID, Name, Status, Uptime)
 * - 타임스탬프 및 위치 정보
 *
 * ❌ 제거된 정보 (AI 분석 무결성 보장):
 * - 시나리오 이름 및 힌트
 * - Mock/시뮬레이션 관련 표시
 * - Fixed-Pattern, Scenario 등 패턴 정보
 * - Console 로그 (시나리오 활성화 알림)
 *
 * 🎯 목적: AI가 사전 정보 없이 순수 메트릭만으로 분석하도록 보장
 */

import type { ServerStatus } from '@/types/server-enums';

interface RawServerMetric {
  id: string;
  name: string;
  hostname: string;
  status: ServerStatus; // 🔧 수정: 'unknown' 포함 (AI 교차검증 Codex 버그 포인트 #1)

  // 📊 Pure Raw Metrics (AI 분석용)
  cpu: number;
  memory: number;
  disk: number;
  network: number;

  // ⏱️ Time & Location (분석 컨텍스트)
  uptime: number;
  timestamp: string;
  location: string;

  // 🏗️ Server Context (AI 분석 도움)
  type: string;
  environment: string;

  // 📈 Additional Raw Metrics
  responseTime?: number;
  connections?: number;
  load?: number;
}

// 시간별 데이터 구조 타입 정의
interface HourlyDataStructure {
  hour?: number;
  dataPoints?: Array<{
    minute: number;
    timestamp: string;
    servers: Record<string, ServerDataStructure>;
  }>;
  servers?: Record<string, ServerDataStructure>; // 하위 호환
  scenario?: string;
}

interface ServerDataStructure {
  id: string;
  name: string;
  hostname: string;
  status: string;
  type: string;
  location: string;
  environment: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  responseTime?: number;
  connections?: number;
}

/**
 * 🔄 24시간 순수 메트릭 로드 (시나리오 힌트 완전 제거)
 */
function loadPureRawMetrics(): Promise<RawServerMetric[]> {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // 30초 단위 데이터 회전 (시나리오 정보 없이)
    const segmentInHour = Math.floor((currentMinute * 60 + currentSecond) / 30);
    const rotationMinute = segmentInHour % 60;

    // 시나리오 정보를 로그하지 않음 - AI 분석 무결성 보장
    const filePath = path.join(
      process.cwd(),
      'public',
      'hourly-data',
      `hour-${currentHour.toString().padStart(2, '0')}.json`
    );

    let hourlyData: HourlyDataStructure;

    if (!fs.existsSync(filePath)) {
      const fallbackPath = path.join(
        process.cwd(),
        'public',
        'hourly-data',
        'hour-17.json'
      );
      hourlyData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    } else {
      hourlyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    return Promise.resolve(
      convertToPureMetrics(
        hourlyData,
        currentHour,
        rotationMinute,
        segmentInHour
      )
    );
  } catch (error) {
    logger.error('Raw metrics 로드 실패:', error);
    return Promise.resolve(generateFallbackMetrics());
  }
}

/**
 * 🧹 순수 메트릭 변환기 - 모든 시나리오 힌트 제거
 */
function convertToPureMetrics(
  hourlyData: HourlyDataStructure,
  _currentHour: number,
  rotationMinute: number,
  _segmentInHour: number
): RawServerMetric[] {
  // dataPoints 구조 지원 (실제 JSON 형식)
  const dataPoint = hourlyData.dataPoints?.[0];
  const servers = dataPoint?.servers ?? hourlyData.servers ?? {};

  // 🔒 시나리오 정보를 로그하지 않음 - AI 분석 무결성 유지

  // 10개 서버 보장
  if (Object.keys(servers).length < 10) {
    const missingCount = 10 - Object.keys(servers).length;

    for (let i = 0; i < missingCount; i++) {
      const serverIndex = Object.keys(servers).length + i + 1;
      const serverTypes = ['security', 'backup', 'proxy', 'gateway'];
      const serverType = serverTypes[i % serverTypes.length] ?? 'worker';
      const serverId = `${serverType}-server-${serverIndex}`;

      servers[serverId] = {
        id: serverId,
        name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${serverIndex}`,
        hostname: `${serverType}-${serverIndex.toString().padStart(2, '0')}.internal`,
        status: 'online',
        type: serverType,
        location: 'datacenter-east',
        environment: 'production',
        uptime: 2592000 + Math.floor(Math.random() * 86400),
        cpu: Math.floor(15 + Math.random() * 25),
        memory: Math.floor(20 + Math.random() * 35),
        disk: Math.floor(25 + Math.random() * 40),
        network: Math.floor(5 + Math.random() * 20),
      };
    }
  }

  return Object.values(servers).map(
    (serverData: ServerDataStructure, index) => {
      // 🔄 시간 내 고정 패턴 (시나리오 힌트 없이)
      const minuteFactor = rotationMinute / 59;
      const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2;
      const serverOffset = (index * 3.7) % 10;
      const fixedVariation = 1 + (fixedOffset + serverOffset) / 100;

      // 📊 순수 Raw 메트릭만 계산
      const rawMetric: RawServerMetric = {
        id: serverData.id || `server-${index}`,
        name: serverData.name || `Server ${index + 1}`,
        hostname: serverData.hostname || `server-${index}.internal`,
        status: safeServerStatus(serverData.status) || 'online',

        // 🎯 Pure Raw Metrics (시나리오 정보 없이)
        cpu: Math.round((serverData.cpu || 0) * fixedVariation),
        memory: Math.round((serverData.memory || 0) * fixedVariation),
        disk: Math.round((serverData.disk || 0) * fixedVariation),
        network: Math.round((serverData.network || 20) * fixedVariation),

        // ⏱️ Time & Location
        uptime: serverData.uptime || 86400,
        timestamp: new Date().toISOString(),
        location: serverData.location || 'datacenter-east',

        // 🏗️ Server Context
        type: serverData.type || 'worker',
        environment: serverData.environment || 'production',

        // 📈 Additional Metrics
        responseTime: safeResponseTime(
          (serverData.responseTime || 200) * fixedVariation
        ),
        connections: safeConnections(
          (serverData.connections || 150) * fixedVariation
        ),
        load:
          Math.round(((serverData.cpu || 0) / 25) * fixedVariation * 100) / 100,
      };

      return rawMetric;
    }
  );
}

/**
 * 🔄 Fallback Raw 메트릭 생성 (시나리오 힌트 없이)
 */
function generateFallbackMetrics(): RawServerMetric[] {
  const serverTypes = [
    'web',
    'api',
    'database',
    'cache',
    'monitoring',
    'security',
    'backup',
    'proxy',
    'gateway',
    'worker',
  ];

  return Array.from({ length: 10 }, (_, index) => {
    const serverType = serverTypes[index] ?? 'worker';
    const baseMetrics = getBaseMetricsForType(serverType);

    return {
      id: `server-${index + 1}`,
      name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${index + 1}`,
      type: serverType,
      hostname: `${serverType}-${(index + 1).toString().padStart(2, '0')}.internal`,
      status:
        Math.random() > 0.85
          ? Math.random() > 0.5
            ? 'warning'
            : 'critical'
          : 'online',

      cpu: baseMetrics.cpu + Math.floor(Math.random() * 20) - 10,
      memory: baseMetrics.memory + Math.floor(Math.random() * 15) - 7,
      disk: baseMetrics.disk + Math.floor(Math.random() * 10) - 5,
      network: baseMetrics.network + Math.floor(Math.random() * 15) - 7,

      uptime: 86400 + Math.floor(Math.random() * 2592000),
      timestamp: new Date().toISOString(),
      location: 'datacenter-east',
      environment: 'production',

      responseTime: 150 + Math.floor(Math.random() * 100),
      connections: 100 + Math.floor(Math.random() * 200),
      load: Math.round((baseMetrics.cpu / 25) * 100) / 100,
    };
  });
}

/**
 * 📊 서버 타입별 기본 메트릭 (시나리오 정보 없이)
 */
function getBaseMetricsForType(type: string): {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
} {
  const profiles: Record<
    string,
    { cpu: number; memory: number; disk: number; network: number }
  > = {
    web: { cpu: 40, memory: 50, disk: 60, network: 20 },
    api: { cpu: 45, memory: 60, disk: 45, network: 25 },
    database: { cpu: 27, memory: 67, disk: 75, network: 12 },
    cache: { cpu: 30, memory: 65, disk: 35, network: 40 },
    monitoring: { cpu: 30, memory: 50, disk: 72, network: 17 },
    security: { cpu: 22, memory: 57, disk: 72, network: 10 },
    backup: { cpu: 40, memory: 27, disk: 55, network: 25 },
    proxy: { cpu: 35, memory: 45, disk: 40, network: 50 },
    gateway: { cpu: 50, memory: 55, disk: 30, network: 45 },
    worker: { cpu: 40, memory: 50, disk: 50, network: 25 },
  };

  return (
    profiles[type] ??
    profiles.worker ?? { cpu: 40, memory: 50, disk: 50, network: 25 }
  );
}

// ============================================================================
// Types for Time Series Data
// ============================================================================

interface MetricHistoryPoint {
  timestamp: string;
  value: number;
}

interface PredictionPoint {
  timestamp: string;
  predicted: number;
  upper: number;
  lower: number;
}

interface AnomalyResult {
  startTime: string;
  endTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  description: string;
}

interface TimeSeriesResponse {
  serverId: string;
  serverName: string;
  metric: string;
  history: MetricHistoryPoint[];
  prediction?: PredictionPoint[];
  anomalies?: AnomalyResult[];
}

// ============================================================================
// Time Series Generation Functions
// ============================================================================

/**
 * 🕐 시계열 히스토리 데이터 생성
 */
function generateMetricHistory(
  baseValue: number,
  metric: string,
  range: string
): MetricHistoryPoint[] {
  const now = new Date();
  const points: MetricHistoryPoint[] = [];

  // 범위에 따른 포인트 수와 간격 결정
  const DEFAULT_CONFIG = { points: 72, intervalMs: 300000 }; // 6h default
  const config: Record<string, { points: number; intervalMs: number }> = {
    '1h': { points: 60, intervalMs: 60000 }, // 1분 간격
    '6h': { points: 72, intervalMs: 300000 }, // 5분 간격
    '24h': { points: 96, intervalMs: 900000 }, // 15분 간격
    '7d': { points: 168, intervalMs: 3600000 }, // 1시간 간격
  };

  const rangeConfig = config[range] ?? DEFAULT_CONFIG;
  const numPoints = rangeConfig.points;
  const intervalMs = rangeConfig.intervalMs;

  for (let i = numPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);

    // 시간에 따른 자연스러운 변동 패턴 생성
    const hourOfDay = timestamp.getHours();
    const dayPattern = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 10; // 낮에 높음
    const noise = (Math.random() - 0.5) * 8;
    const trend = ((numPoints - i) / numPoints) * 5; // 약간의 상승 트렌드

    let value = baseValue + dayPattern + noise + trend;

    // 메트릭별 특성 조정
    if (metric === 'cpu') {
      // CPU는 스파이크 패턴 추가
      if (Math.random() < 0.05) value += Math.random() * 20;
    } else if (metric === 'memory') {
      // 메모리는 더 안정적
      value = baseValue + noise * 0.5 + trend;
    } else if (metric === 'disk') {
      // 디스크는 천천히 증가
      value = baseValue + ((numPoints - i) / numPoints) * 3 + noise * 0.3;
    }

    value = Math.max(0, Math.min(100, value));

    points.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 10) / 10,
    });
  }

  return points;
}

/**
 * 🔮 예측 데이터 생성 (간단한 선형 회귀 + 신뢰구간)
 */
function generatePrediction(
  history: MetricHistoryPoint[],
  forecastPoints: number = 12
): PredictionPoint[] {
  if (history.length < 10) return [];

  // 최근 데이터로 추세 계산
  const recentData = history.slice(-20);
  const n = recentData.length;

  // 선형 회귀 계수 계산
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recentData[i]?.value ?? 0;
    sumXY += i * (recentData[i]?.value ?? 0);
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 잔차로 표준편차 계산 (신뢰구간용)
  let sumSquaredErrors = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    const actual = recentData[i]?.value ?? 0;
    sumSquaredErrors += (actual - predicted) ** 2;
  }
  const stdError = Math.sqrt(sumSquaredErrors / (n - 2));

  // 예측 포인트 생성
  const lastTimestamp = new Date(
    history[history.length - 1]?.timestamp ?? new Date()
  );
  const intervalMs =
    history.length > 1
      ? new Date(history[1]?.timestamp ?? new Date()).getTime() -
        new Date(history[0]?.timestamp ?? new Date()).getTime()
      : 300000;

  const predictions: PredictionPoint[] = [];
  for (let i = 1; i <= forecastPoints; i++) {
    const x = n + i - 1;
    const predicted = slope * x + intercept;
    const margin =
      stdError *
      1.96 *
      Math.sqrt(1 + 1 / n + (x - sumX / n) ** 2 / (sumX2 - (sumX * sumX) / n));

    const clampedPredicted = Math.max(0, Math.min(100, predicted));
    const clampedUpper = Math.max(0, Math.min(100, predicted + margin));
    const clampedLower = Math.max(0, Math.min(100, predicted - margin));

    predictions.push({
      timestamp: new Date(
        lastTimestamp.getTime() + i * intervalMs
      ).toISOString(),
      predicted: Math.round(clampedPredicted * 10) / 10,
      upper: Math.round(clampedUpper * 10) / 10,
      lower: Math.round(clampedLower * 10) / 10,
    });
  }

  return predictions;
}

/**
 * 🚨 이상 탐지 (Z-Score 기반)
 */
function detectAnomalies(
  history: MetricHistoryPoint[],
  metric: string,
  thresholdZ: number = 2.5
): AnomalyResult[] {
  if (history.length < 10) return [];

  // 평균과 표준편차 계산
  const values = history.map((h) => h.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );

  if (stdDev === 0) return [];

  const anomalies: AnomalyResult[] = [];
  let anomalyStart: string | null = null;
  let maxZ = 0;

  for (let i = 0; i < history.length; i++) {
    const point = history[i];
    if (!point) continue;

    const zScore = Math.abs((point.value - mean) / stdDev);

    if (zScore > thresholdZ) {
      if (!anomalyStart) {
        anomalyStart = point.timestamp;
        maxZ = zScore;
      } else {
        maxZ = Math.max(maxZ, zScore);
      }
    } else if (anomalyStart) {
      // 이상 구간 종료
      const prevPoint = history[i - 1];
      if (prevPoint) {
        anomalies.push({
          startTime: anomalyStart,
          endTime: prevPoint.timestamp,
          severity: getSeverityFromZ(maxZ),
          metric,
          description: `${metric.toUpperCase()} 이상 감지: Z-Score ${maxZ.toFixed(2)}`,
        });
      }
      anomalyStart = null;
      maxZ = 0;
    }
  }

  // 마지막 이상 구간 처리
  if (anomalyStart && history.length > 0) {
    const lastPoint = history[history.length - 1];
    if (lastPoint) {
      anomalies.push({
        startTime: anomalyStart,
        endTime: lastPoint.timestamp,
        severity: getSeverityFromZ(maxZ),
        metric,
        description: `${metric.toUpperCase()} 이상 감지: Z-Score ${maxZ.toFixed(2)}`,
      });
    }
  }

  return anomalies;
}

function getSeverityFromZ(
  zScore: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (zScore >= 4) return 'critical';
  if (zScore >= 3.5) return 'high';
  if (zScore >= 3) return 'medium';
  return 'low';
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * 🤖 AI Raw Metrics API Endpoint
 * 순수 메트릭만 제공, 시나리오 힌트 완전 차단
 *
 * 확장 파라미터:
 * - serverId: 특정 서버 ID (선택적)
 * - metric: cpu | memory | disk | network
 * - range: 1h | 6h | 24h | 7d
 * - includePrediction: true/false
 * - includeAnomalies: true/false
 * - includeHistory: true/false
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    );
    const format = searchParams.get('format') || 'standard';

    // 시계열 데이터 파라미터
    const serverId = searchParams.get('serverId');
    const metric = searchParams.get('metric') as
      | 'cpu'
      | 'memory'
      | 'disk'
      | 'network'
      | null;
    const range = searchParams.get('range') || '6h';
    const includePrediction = searchParams.get('includePrediction') === 'true';
    const includeAnomalies = searchParams.get('includeAnomalies') === 'true';
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // 🔒 AI 분석용 순수 메트릭 로드 (시나리오 힌트 없이)
    const rawMetrics = await loadPureRawMetrics();

    // 📊 시계열 데이터 요청 처리
    if (includeHistory && serverId && metric) {
      const server = rawMetrics.find((s) => s.id === serverId);
      if (!server) {
        return NextResponse.json(
          {
            success: false,
            error: 'SERVER_NOT_FOUND',
            message: '서버를 찾을 수 없습니다.',
          },
          { status: 404 }
        );
      }

      const baseValue = server[metric] ?? 50;
      const history = generateMetricHistory(baseValue, metric, range);

      const timeSeriesData: TimeSeriesResponse = {
        serverId: server.id,
        serverName: server.name,
        metric,
        history,
      };

      if (includePrediction) {
        timeSeriesData.prediction = generatePrediction(history);
      }

      if (includeAnomalies) {
        timeSeriesData.anomalies = detectAnomalies(history, metric);
      }

      return NextResponse.json(
        {
          success: true,
          data: timeSeriesData,
          metadata: {
            serverId,
            metric,
            range,
            historyPoints: history.length,
            predictionPoints: timeSeriesData.prediction?.length ?? 0,
            anomalyCount: timeSeriesData.anomalies?.length ?? 0,
            timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-AI-Data-Source': 'time-series',
          },
        }
      );
    }

    // 📊 요청된 수량만큼만 제공
    const limitedMetrics = rawMetrics.slice(0, limit);

    // 🧹 Format별 응답 (AI 분석 최적화)
    let responseData: Partial<RawServerMetric>[] | RawServerMetric[];

    if (format === 'minimal') {
      // 🎯 최소 메트릭만 (AI 가벼운 분석용)
      responseData = limitedMetrics.map((server) => ({
        id: server.id,
        name: server.name,
        status: server.status,
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        network: server.network,
        timestamp: server.timestamp,
      }));
    } else if (format === 'extended') {
      // 📈 확장 메트릭 (AI 상세 분석용)
      responseData = limitedMetrics.map((server) => ({
        ...server,
        metrics: {
          utilization: {
            cpu: server.cpu,
            memory: server.memory,
            disk: server.disk,
            network: server.network,
          },
          performance: {
            responseTime: server.responseTime,
            connections: server.connections,
            load: server.load,
          },
          context: {
            uptime: server.uptime,
            type: server.type,
            environment: server.environment,
            location: server.location,
          },
        },
      }));
    } else {
      // 📋 표준 포맷 (AI 일반 분석용)
      responseData = limitedMetrics;
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        metadata: {
          count: responseData.length,
          timestamp: new Date().toISOString(),
          format: format,
          // 🚫 시나리오/시뮬레이션 정보 완전 제거 - AI 분석 무결성 보장
          dataIntegrityLevel: 'pure-raw-metrics',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-AI-Data-Source': 'raw-metrics',
          'X-Analysis-Mode': 'integrity-preserved',
        },
      }
    );
  } catch (error) {
    logger.error('AI Raw Metrics API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'RAW_METRICS_FAILED',
        message: '순수 메트릭 데이터를 불러올 수 없습니다.',
      },
      { status: 500 }
    );
  }
});
