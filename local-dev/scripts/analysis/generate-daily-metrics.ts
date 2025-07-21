#!/usr/bin/env tsx
/**
 * 📊 Daily Metrics Generator
 *
 * 지정된 서버 수의 24시간치 현실적인 시계열 데이터 생성
 * - 10분 간격 (144 포인트/서버)
 * - 총 2880개 레코드
 * - 현실적인 장애 패턴 포함
 * - Supabase에 자동 삽입
 */

import * as dotenv from 'dotenv';
import {
  DailyMetric,
  ServerConfig,
  ServerType,
  insertMetrics,
  clearMetrics,
} from '../../../src/lib/supabase-metrics';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// 서버 구성 정의
interface ServerCounts {
  web?: number;
  api?: number;
  db?: number;
  cache?: number;
  worker?: number;
}

const createServerConfigs = (counts: ServerCounts = {}): ServerConfig[] => {
  const { web = 6, api = 6, db = 4, cache = 2, worker = 2 } = counts;

  const configs: ServerConfig[] = [];

  // 웹 서버
  for (let i = 1; i <= web; i++) {
    configs.push({
      id: `web-${i.toString().padStart(2, '0')}`,
      type: 'web',
      baseLoad: {
        cpu: 15 + Math.random() * 20, // 15-35%
        memory: 25 + Math.random() * 25, // 25-50%
        disk: 20 + Math.random() * 15, // 20-35%
        responseTime: 50 + Math.random() * 100, // 50-150ms
      },
      characteristics: {
        cpuVolatility: 0.3 + Math.random() * 0.4, // 0.3-0.7
        memoryGrowthRate: 0.001 + Math.random() * 0.003, // 0.001-0.004
        diskGrowthRate: 0.0005 + Math.random() * 0.0015, // 0.0005-0.002
        responseTimeSpike: 0.05 + Math.random() * 0.1, // 5-15% 확률
      },
    });
  }

  // API 서버
  for (let i = 1; i <= api; i++) {
    configs.push({
      id: `api-${i.toString().padStart(2, '0')}`,
      type: 'api',
      baseLoad: {
        cpu: 20 + Math.random() * 25, // 20-45%
        memory: 30 + Math.random() * 30, // 30-60%
        disk: 15 + Math.random() * 10, // 15-25%
        responseTime: 30 + Math.random() * 70, // 30-100ms
      },
      characteristics: {
        cpuVolatility: 0.4 + Math.random() * 0.3, // 0.4-0.7
        memoryGrowthRate: 0.002 + Math.random() * 0.004, // 0.002-0.006
        diskGrowthRate: 0.0003 + Math.random() * 0.0007, // 0.0003-0.001
        responseTimeSpike: 0.08 + Math.random() * 0.12, // 8-20% 확률
      },
    });
  }

  // 데이터베이스 서버
  for (let i = 1; i <= db; i++) {
    configs.push({
      id: `db-${i.toString().padStart(2, '0')}`,
      type: 'db',
      baseLoad: {
        cpu: 25 + Math.random() * 30, // 25-55%
        memory: 40 + Math.random() * 35, // 40-75%
        disk: 30 + Math.random() * 25, // 30-55%
        responseTime: 10 + Math.random() * 30, // 10-40ms
      },
      characteristics: {
        cpuVolatility: 0.2 + Math.random() * 0.3, // 0.2-0.5
        memoryGrowthRate: 0.003 + Math.random() * 0.005, // 0.003-0.008
        diskGrowthRate: 0.002 + Math.random() * 0.004, // 0.002-0.006
        responseTimeSpike: 0.03 + Math.random() * 0.07, // 3-10% 확률
      },
    });
  }

  // 캐시 서버
  for (let i = 1; i <= cache; i++) {
    configs.push({
      id: `cache-${i.toString().padStart(2, '0')}`,
      type: 'cache',
      baseLoad: {
        cpu: 10 + Math.random() * 15, // 10-25%
        memory: 60 + Math.random() * 25, // 60-85%
        disk: 5 + Math.random() * 10, // 5-15%
        responseTime: 1 + Math.random() * 5, // 1-6ms
      },
      characteristics: {
        cpuVolatility: 0.2 + Math.random() * 0.2, // 0.2-0.4
        memoryGrowthRate: 0.001 + Math.random() * 0.002, // 0.001-0.003
        diskGrowthRate: 0.0001 + Math.random() * 0.0004, // 0.0001-0.0005
        responseTimeSpike: 0.02 + Math.random() * 0.03, // 2-5% 확률
      },
    });
  }

  // 워커 서버
  for (let i = 1; i <= worker; i++) {
    configs.push({
      id: `worker-${i.toString().padStart(2, '0')}`,
      type: 'worker',
      baseLoad: {
        cpu: 35 + Math.random() * 40, // 35-75%
        memory: 20 + Math.random() * 30, // 20-50%
        disk: 10 + Math.random() * 15, // 10-25%
        responseTime: 100 + Math.random() * 200, // 100-300ms
      },
      characteristics: {
        cpuVolatility: 0.5 + Math.random() * 0.3, // 0.5-0.8
        memoryGrowthRate: 0.004 + Math.random() * 0.006, // 0.004-0.01
        diskGrowthRate: 0.001 + Math.random() * 0.002, // 0.001-0.003
        responseTimeSpike: 0.1 + Math.random() * 0.15, // 10-25% 확률
      },
    });
  }

  return configs;
};

// 기본 메트릭 생성 (노이즈 포함)
const generateBaseMetrics = (
  server: ServerConfig,
  timeIndex: number,
  totalTimePoints: number
): Pick<DailyMetric, 'cpu' | 'memory' | 'disk' | 'response_time'> => {
  // 시간에 따른 일반적인 패턴 (업무시간 고려)
  const hour = (timeIndex * 10) / 60; // 현재 시간 (시 단위)
  const businessHourFactor = getBusinessHourFactor(hour);

  // 기본 부하에 시간 패턴 적용
  let cpu = server.baseLoad.cpu * businessHourFactor;
  let memory = server.baseLoad.memory;
  let disk = server.baseLoad.disk;
  let responseTime = server.baseLoad.responseTime * businessHourFactor;

  // 메모리와 디스크는 점진적으로 증가 (리소스 누적)
  const timeProgress = timeIndex / totalTimePoints;
  memory += memory * server.characteristics.memoryGrowthRate * timeIndex;
  disk += disk * server.characteristics.diskGrowthRate * timeIndex;

  // CPU 변동성 추가
  cpu += (Math.random() - 0.5) * server.characteristics.cpuVolatility * cpu;

  // 응답시간 스파이크
  if (Math.random() < server.characteristics.responseTimeSpike) {
    responseTime *= 2 + Math.random() * 8; // 2-10배 증가
  }

  // 일반적인 노이즈 추가
  cpu += (Math.random() - 0.5) * 10;
  memory += (Math.random() - 0.5) * 5;
  disk += (Math.random() - 0.5) * 3;
  responseTime += (Math.random() - 0.5) * responseTime * 0.3;

  // 범위 제한
  cpu = Math.max(0, Math.min(100, cpu));
  memory = Math.max(0, Math.min(100, memory));
  disk = Math.max(0, Math.min(100, disk));
  responseTime = Math.max(1, responseTime);

  return {
    cpu: Number(cpu.toFixed(2)),
    memory: Number(memory.toFixed(2)),
    disk: Number(disk.toFixed(2)),
    response_time: Math.round(responseTime),
  };
};

// 업무시간 팩터 계산
const getBusinessHourFactor = (hour: number): number => {
  // 0-24시간 기준
  if (hour >= 9 && hour <= 18) {
    // 업무시간: 높은 부하
    return 1.0 + 0.5 * Math.sin(((hour - 9) / 9) * Math.PI);
  } else if (hour >= 6 && hour <= 9) {
    // 출근시간: 점진적 증가
    return 0.5 + 0.5 * ((hour - 6) / 3);
  } else if (hour >= 18 && hour <= 22) {
    // 퇴근시간: 점진적 감소
    return 1.0 - 0.4 * ((hour - 18) / 4);
  } else {
    // 심야시간: 낮은 부하
    return 0.3 + 0.2 * Math.random();
  }
};

// 상태 계산
const calculateStatus = (
  cpu: number,
  memory: number,
  disk: number,
  responseTime: number
): 'healthy' | 'warning' | 'critical' => {
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

// 메인 생성 함수
const generateDailyMetrics = async (
  servers: ServerConfig[]
): Promise<DailyMetric[]> => {
  console.log('🚀 시작: 서버 메트릭 데이터 생성');
  const timePoints = 144; // 24시간 * 6 (10분 간격)
  const startTime = new Date();
  startTime.setHours(0, 0, 0, 0); // 오늘 00:00:00부터 시작

  console.log(`📊 서버 ${servers.length}대, ${timePoints}개 시점 생성`);
  console.log('🔥 장애 패턴 엔진 초기화 중...');

  const allMetrics: DailyMetric[] = [];

  // 각 서버별로 데이터 생성
  for (const server of servers) {
    console.log(`🔧 ${server.id} (${server.type}) 데이터 생성 중...`);

    for (let timeIndex = 0; timeIndex < timePoints; timeIndex++) {
      // 기본 메트릭 생성
      const baseMetrics = generateBaseMetrics(server, timeIndex, timePoints);

      // 최종 메트릭 계산
      const cpu = Math.min(100, baseMetrics.cpu);
      const memory = Math.min(100, baseMetrics.memory);
      const disk = Math.min(100, baseMetrics.disk);
      const responseTime = Math.round(baseMetrics.response_time);

      // 타임스탬프 계산
      const timestamp = new Date(
        startTime.getTime() + timeIndex * 10 * 60 * 1000
      );

      // 상태 계산
      const status = calculateStatus(cpu, memory, disk, responseTime);

      const metric: DailyMetric = {
        timestamp: timestamp.toISOString(),
        server_id: server.id,
        cpu: Number(cpu.toFixed(2)),
        memory: Number(memory.toFixed(2)),
        disk: Number(disk.toFixed(2)),
        response_time: responseTime,
        status,
      };

      allMetrics.push(metric);
    }
  }

  console.log(`✅ 총 ${allMetrics.length}개 메트릭 생성 완료`);

  // 상태별 통계
  const statusStats = allMetrics.reduce(
    (acc, metric) => {
      acc[metric.status] = (acc[metric.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('📈 상태 분포:');
  Object.entries(statusStats).forEach(([status, count]) => {
    const percentage = (((count || 0) / allMetrics.length) * 100).toFixed(1);
    console.log(`   ${status}: ${count}개 (${percentage}%)`);
  });

  return allMetrics;
};

// 데이터 삽입 함수
const insertData = async (
  metrics: DailyMetric[],
  batchSize: number = 100
): Promise<void> => {
  console.log(`📤 Supabase에 데이터 삽입 시작 (배치 크기: ${batchSize})`);

  const batches = [];
  for (let i = 0; i < metrics.length; i += batchSize) {
    batches.push(metrics.slice(i, i + batchSize));
  }

  console.log(`📦 총 ${batches.length}개 배치로 분할`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue;

    try {
      await insertMetrics(batch);
      console.log(
        `✅ 배치 ${i + 1}/${batches.length} 완료 (${batch.length}개 레코드)`
      );

      // API 제한 방지를 위한 딜레이
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ 배치 ${i + 1} 실패:`, error);
      throw error;
    }
  }

  console.log('🎉 모든 데이터 삽입 완료!');
};

// 메인 실행 함수
const main = async (): Promise<void> => {
  try {
    console.log('🌟 Daily Metrics Generator 시작');
    console.log('=====================================');

    // 환경 변수 확인
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
      );
    }

    // 기존 데이터 삭제 여부 확인
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');

    const getArgValue = (name: string): number | undefined => {
      const index = args.indexOf(`--${name}`);
      if (index !== -1 && args[index + 1]) {
        const value = Number(args[index + 1]);
        return isNaN(value) ? undefined : value;
      }
      return undefined;
    };

    const counts = {
      web: (getArgValue('web') ?? Number(process.env.WEB_COUNT)) || undefined,
      api: (getArgValue('api') ?? Number(process.env.API_COUNT)) || undefined,
      db: (getArgValue('db') ?? Number(process.env.DB_COUNT)) || undefined,
      cache:
        (getArgValue('cache') ?? Number(process.env.CACHE_COUNT)) || undefined,
      worker:
        (getArgValue('worker') ?? Number(process.env.WORKER_COUNT)) ||
        undefined,
    };

    const servers = createServerConfigs(counts);

    if (shouldClear) {
      console.log('🗑️ 기존 데이터 삭제 중...');
      await clearMetrics();
    }

    // 데이터 생성
    const metrics = await generateDailyMetrics(servers);

    // 데이터 삽입
    await insertData(metrics);

    console.log('=====================================');
    console.log('✨ 작업 완료!');
    console.log(`📊 생성된 메트릭: ${metrics.length}개`);
    console.log(`🕐 기간: 24시간 (10분 간격)`);
    console.log(`🖥️ 서버: ${servers.length}대`);
    console.log('');
    console.log('다음 명령어로 데이터를 확인할 수 있습니다:');
    console.log('SELECT COUNT(*) FROM daily_metrics;');
    console.log('SELECT status, COUNT(*) FROM daily_metrics GROUP BY status;');
  } catch (error) {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  main();
}
