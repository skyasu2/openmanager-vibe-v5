/**
 * 📈 Metrics Interpolation Module
 *
 * 10분 간격의 시계열 데이터를 1분 또는 5분 단위로 보간하여
 * 부드럽고 현실적인 시계열 흐름을 생성합니다.
 *
 * - 선형 보간 + 현실적 노이즈
 * - 메모리 효율적 처리
 * - Vercel 무료 티어 최적화
 */

import { DailyMetric } from './supabase-metrics';

// 보간 옵션 인터페이스
export interface InterpolationOptions {
  resolutionMinutes: 1 | 2 | 5; // 보간 해상도 (분 단위)
  noiseLevel: number; // 노이즈 레벨 (0.0 - 1.0, 기본: 0.02 = ±2%)
  preserveOriginal: boolean; // 원본 데이터 포인트 유지 여부
  smoothingFactor: number; // 평활화 팩터 (0.0 - 1.0)
}

// 기본 보간 옵션
const DEFAULT_OPTIONS: InterpolationOptions = {
  resolutionMinutes: 1,
  noiseLevel: 0.02,
  preserveOriginal: true,
  smoothingFactor: 0.1,
};

// 보간된 메트릭 타입 (원본과 동일하지만 interpolated 플래그 추가)
export interface InterpolatedMetric extends DailyMetric {
  interpolated?: boolean; // 보간된 데이터인지 여부
  originalIndex?: number; // 원본 데이터의 인덱스 (디버깅용)
}

/**
 * 시계열 데이터 보간 메인 함수
 */
export const interpolateMetrics = (
  originalData: DailyMetric[],
  options: Partial<InterpolationOptions> = {}
): InterpolatedMetric[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (originalData.length < 2) {
    console.warn('⚠️ 보간을 위해서는 최소 2개의 데이터 포인트가 필요합니다.');
    return originalData.map(d => ({ ...d, interpolated: false }));
  }

  console.log(
    `🔄 시계열 보간 시작: ${originalData.length}개 → ${opts.resolutionMinutes}분 간격`
  );

  // 시간순 정렬
  const sortedData = [...originalData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const interpolatedData: InterpolatedMetric[] = [];
  const intervalMs = opts.resolutionMinutes * 60 * 1000; // 분 → 밀리초

  // 각 구간별 보간 처리
  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i];
    const next = sortedData[i + 1];

    const currentTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(next.timestamp).getTime();
    const timeDiff = nextTime - currentTime;

    // 원본 데이터 포인트 추가
    if (opts.preserveOriginal) {
      interpolatedData.push({
        ...current,
        interpolated: false,
        originalIndex: i,
      });
    }

    // 10분 간격이 아닌 경우 스킵
    if (timeDiff !== 10 * 60 * 1000) {
      console.warn(`⚠️ 예상과 다른 간격: ${timeDiff / 60000}분`);
      continue;
    }

    // 보간 포인트 개수 계산
    const numInterpolations = Math.floor(timeDiff / intervalMs) - 1;

    // 각 보간 포인트 생성
    for (let j = 1; j <= numInterpolations; j++) {
      const ratio = j / (numInterpolations + 1);
      const interpolatedTime = currentTime + timeDiff * ratio;

      const interpolatedMetric = interpolateMetricValues(
        current,
        next,
        ratio,
        interpolatedTime,
        opts,
        i
      );

      interpolatedData.push(interpolatedMetric);
    }
  }

  // 마지막 데이터 포인트 추가
  if (opts.preserveOriginal && sortedData.length > 0) {
    const lastData = sortedData[sortedData.length - 1];
    interpolatedData.push({
      ...lastData,
      interpolated: false,
      originalIndex: sortedData.length - 1,
    });
  }

  // 시간순 재정렬
  interpolatedData.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(`✅ 보간 완료: ${interpolatedData.length}개 데이터 포인트 생성`);

  return interpolatedData;
};

/**
 * 두 메트릭 포인트 사이의 값을 보간
 */
const interpolateMetricValues = (
  current: DailyMetric,
  next: DailyMetric,
  ratio: number,
  timestamp: number,
  options: InterpolationOptions,
  originalIndex: number
): InterpolatedMetric => {
  // 기본 선형 보간
  const cpu = linearInterpolate(current.cpu, next.cpu, ratio);
  const memory = linearInterpolate(current.memory, next.memory, ratio);
  const disk = linearInterpolate(current.disk, next.disk, ratio);
  const responseTime = linearInterpolate(
    current.response_time,
    next.response_time,
    ratio
  );

  // 현실적 노이즈 추가
  const noisyCpu = addRealisticNoise(cpu, options.noiseLevel, 'cpu');
  const noisyMemory = addRealisticNoise(memory, options.noiseLevel, 'memory');
  const noisyDisk = addRealisticNoise(disk, options.noiseLevel, 'disk');
  const noisyResponseTime = addRealisticNoise(
    responseTime,
    options.noiseLevel,
    'responseTime'
  );

  // 평활화 적용 (급격한 변화 완화)
  const smoothedCpu = applySmoothingFilter(
    noisyCpu,
    current.cpu,
    next.cpu,
    options.smoothingFactor
  );
  const smoothedMemory = applySmoothingFilter(
    noisyMemory,
    current.memory,
    next.memory,
    options.smoothingFactor
  );
  const smoothedDisk = applySmoothingFilter(
    noisyDisk,
    current.disk,
    next.disk,
    options.smoothingFactor
  );
  const smoothedResponseTime = applySmoothingFilter(
    noisyResponseTime,
    current.response_time,
    next.response_time,
    options.smoothingFactor
  );

  // 값 범위 제한
  const finalCpu = clamp(smoothedCpu, 0, 100);
  const finalMemory = clamp(smoothedMemory, 0, 100);
  const finalDisk = clamp(smoothedDisk, 0, 100);
  const finalResponseTime = Math.max(1, Math.round(smoothedResponseTime));

  // 상태 계산
  const status = calculateInterpolatedStatus(
    finalCpu,
    finalMemory,
    finalDisk,
    finalResponseTime
  );

  return {
    timestamp: new Date(timestamp).toISOString(),
    server_id: current.server_id,
    cpu: Number(finalCpu.toFixed(2)),
    memory: Number(finalMemory.toFixed(2)),
    disk: Number(finalDisk.toFixed(2)),
    response_time: finalResponseTime,
    status,
    interpolated: true,
    originalIndex,
  };
};

/**
 * 선형 보간 함수
 */
const linearInterpolate = (
  start: number,
  end: number,
  ratio: number
): number => {
  return start + (end - start) * ratio;
};

/**
 * 현실적 노이즈 추가
 */
const addRealisticNoise = (
  value: number,
  noiseLevel: number,
  metricType: 'cpu' | 'memory' | 'disk' | 'responseTime'
): number => {
  if (noiseLevel === 0) return value;

  // 메트릭 타입별 노이즈 특성
  let noiseMultiplier = 1;
  let minNoise = 0.5;

  switch (metricType) {
    case 'cpu':
      noiseMultiplier = 1.2; // CPU는 변동성이 높음
      minNoise = 0.8;
      break;
    case 'memory':
      noiseMultiplier = 0.6; // 메모리는 상대적으로 안정
      minNoise = 0.3;
      break;
    case 'disk':
      noiseMultiplier = 0.4; // 디스크는 매우 안정
      minNoise = 0.2;
      break;
    case 'responseTime':
      noiseMultiplier = 1.5; // 응답시간은 가장 변동성이 높음
      minNoise = 1.0;
      break;
  }

  // 가우시안 노이즈 (정규분포)
  const gaussianNoise = () => {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const noise = gaussianNoise() * noiseLevel * noiseMultiplier * value;
  const clampedNoise = Math.max(
    -value * noiseLevel,
    Math.min(value * noiseLevel, noise)
  );

  return value + clampedNoise;
};

/**
 * 평활화 필터 적용
 */
const applySmoothingFilter = (
  interpolatedValue: number,
  startValue: number,
  endValue: number,
  smoothingFactor: number
): number => {
  if (smoothingFactor === 0) return interpolatedValue;

  // 기대값 (선형 보간 값)
  const expectedValue = (startValue + endValue) / 2;

  // 평활화: 보간값과 기대값 사이의 가중평균
  return (
    interpolatedValue * (1 - smoothingFactor) + expectedValue * smoothingFactor
  );
};

/**
 * 값 범위 제한
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * 보간된 값에 기반한 상태 계산
 */
const calculateInterpolatedStatus = (
  cpu: number,
  memory: number,
  disk: number,
  responseTime: number
): 'healthy' | 'warning' | 'critical' => {
  // 임계값 (원본과 동일)
  const thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 1000, critical: 3000 },
  };

  // Critical 조건
  if (
    cpu > thresholds.cpu.critical ||
    memory > thresholds.memory.critical ||
    disk > thresholds.disk.critical ||
    responseTime > thresholds.responseTime.critical
  ) {
    return 'critical';
  }

  // Warning 조건
  if (
    cpu > thresholds.cpu.warning ||
    memory > thresholds.memory.warning ||
    disk > thresholds.disk.warning ||
    responseTime > thresholds.responseTime.warning
  ) {
    return 'warning';
  }

  return 'healthy';
};

/**
 * 서버별 보간 (메모리 효율적 처리)
 */
export const interpolateMetricsByServer = (
  originalData: DailyMetric[],
  options: Partial<InterpolationOptions> = {}
): InterpolatedMetric[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('🔄 서버별 보간 처리 시작...');

  // 서버별로 데이터 그룹화
  const serverGroups = originalData.reduce(
    (groups, metric) => {
      if (!groups[metric.server_id]) {
        groups[metric.server_id] = [];
      }
      groups[metric.server_id].push(metric);
      return groups;
    },
    {} as Record<string, DailyMetric[]>
  );

  const allInterpolatedData: InterpolatedMetric[] = [];

  // 각 서버별로 개별 보간 처리 (메모리 효율성)
  for (const [serverId, serverData] of Object.entries(serverGroups)) {
    console.log(
      `📊 서버 ${serverId} 보간 중... (${serverData.length}개 포인트)`
    );

    const interpolatedServerData = interpolateMetrics(serverData, opts);
    allInterpolatedData.push(...interpolatedServerData);
  }

  // 시간순 재정렬
  allInterpolatedData.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(
    `✅ 서버별 보간 완료: ${allInterpolatedData.length}개 데이터 포인트`
  );

  return allInterpolatedData;
};

/**
 * 보간 결과 통계
 */
export const getInterpolationStats = (
  interpolatedData: InterpolatedMetric[]
) => {
  const originalCount = interpolatedData.filter(d => !d.interpolated).length;
  const interpolatedCount = interpolatedData.filter(d => d.interpolated).length;

  const statusStats = interpolatedData.reduce(
    (acc, metric) => {
      acc[metric.status] = (acc[metric.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const serverStats = interpolatedData.reduce(
    (acc, metric) => {
      acc[metric.server_id] = (acc[metric.server_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: interpolatedData.length,
    original: originalCount,
    interpolated: interpolatedCount,
    interpolationRatio: interpolatedCount / interpolatedData.length,
    statusDistribution: statusStats,
    serverDistribution: serverStats,
    timeRange:
      interpolatedData.length > 0
        ? {
            start: interpolatedData[0]?.timestamp,
            end: interpolatedData[interpolatedData.length - 1]?.timestamp,
          }
        : null,
  };
};

/**
 * 보간 품질 검증
 */
export const validateInterpolationQuality = (
  original: DailyMetric[],
  interpolated: InterpolatedMetric[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 기본 검증
  if (interpolated.length < original.length) {
    errors.push('보간된 데이터가 원본보다 적습니다.');
  }

  // 시간 순서 검증
  for (let i = 1; i < interpolated.length; i++) {
    const prev = new Date(interpolated[i - 1].timestamp).getTime();
    const curr = new Date(interpolated[i].timestamp).getTime();

    if (curr <= prev) {
      errors.push(`시간 순서가 올바르지 않습니다: ${i}번째 데이터`);
    }
  }

  // 값 범위 검증
  interpolated.forEach((metric, index) => {
    if (metric.cpu < 0 || metric.cpu > 100) {
      errors.push(`CPU 값이 범위를 벗어남: ${metric.cpu}% (${index}번째)`);
    }
    if (metric.memory < 0 || metric.memory > 100) {
      errors.push(
        `메모리 값이 범위를 벗어남: ${metric.memory}% (${index}번째)`
      );
    }
    if (metric.disk < 0 || metric.disk > 100) {
      errors.push(`디스크 값이 범위를 벗어남: ${metric.disk}% (${index}번째)`);
    }
    if (metric.response_time < 1) {
      errors.push(
        `응답시간이 범위를 벗어남: ${metric.response_time}ms (${index}번째)`
      );
    }
  });

  // 품질 점수 계산 (0-100)
  let qualityScore = 100;
  qualityScore -= errors.length * 20;
  qualityScore -= warnings.length * 5;
  qualityScore = Math.max(0, qualityScore);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore,
  };
};
