/**
 * 🎯 24시간 고정 메트릭 데이터
 *
 * 15개 서버의 24시간(144개 데이터 포인트) 고정 데이터
 * 10분 단위 슬롯, 장애 시나리오 포함
 */

import { applyScenario } from './scenarios';

/**
 * 10분 단위 고정 메트릭
 */
export interface Fixed10MinMetric {
  minuteOfDay: number; // 0, 10, 20, ..., 1430
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

/**
 * 서버 24시간 데이터셋
 */
export interface Server24hDataset {
  serverId: string;
  serverType:
    | 'web'
    | 'database'
    | 'application'
    | 'storage'
    | 'cache'
    | 'loadbalancer';
  location: string;
  baseline: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  data: Fixed10MinMetric[]; // length 144
}

/**
 * 기본 메트릭에 작은 변동 추가 (±5%)
 */
function addVariation(value: number): number {
  // ±5% 퍼센트 기반 변동 (절대값이 아닌 상대값)
  const variation = value * (Math.random() - 0.5) * 0.1; // ±5%
  return Math.max(0, Math.min(100, value + variation));
}

/**
 * 서버별 24시간 데이터 생성
 */
function generateServer24hData(
  serverId: string,
  serverType: Server24hDataset['serverType'],
  location: string,
  baseline: { cpu: number; memory: number; disk: number; network: number }
): Server24hDataset {
  const data: Fixed10MinMetric[] = [];

  // 144개 데이터 포인트 생성 (24시간 * 6 = 144, 10분 간격)
  for (let i = 0; i < 144; i++) {
    const minuteOfDay = i * 10; // 0, 10, 20, ..., 1430

    // 기본값에 작은 변동 추가
    let cpu = addVariation(baseline.cpu);
    let memory = addVariation(baseline.memory);
    let disk = addVariation(baseline.disk);
    let network = addVariation(baseline.network);

    // 장애 시나리오 적용
    cpu = applyScenario(serverId, 'cpu', minuteOfDay, cpu);
    memory = applyScenario(serverId, 'memory', minuteOfDay, memory);
    disk = applyScenario(serverId, 'disk', minuteOfDay, disk);
    network = applyScenario(serverId, 'network', minuteOfDay, network);

    data.push({
      minuteOfDay,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      network: Math.round(network * 10) / 10,
    });
  }

  return {
    serverId,
    serverType,
    location,
    baseline,
    data,
  };
}

/**
 * 15개 서버의 24시간 고정 데이터 (시나리오 포함)
 */
export const FIXED_24H_DATASETS: Server24hDataset[] = [
  // 🌐 웹 서버 (3대)
  generateServer24hData('WEB-01', 'web', 'Seoul-AZ1', {
    cpu: 30,
    memory: 45,
    disk: 25,
    network: 50,
  }),

  generateServer24hData('WEB-02', 'web', 'Seoul-AZ2', {
    cpu: 35,
    memory: 50,
    disk: 30,
    network: 55,
  }),

  generateServer24hData('WEB-03', 'web', 'Busan-AZ1', {
    cpu: 40,
    memory: 55,
    disk: 35,
    network: 40, // 저녁 네트워크 폭주 시나리오 대상
  }),

  // 🗄️ 데이터베이스 서버 (3대)
  generateServer24hData('DB-MAIN-01', 'database', 'Seoul-AZ1', {
    cpu: 50,
    memory: 70,
    disk: 50, // 새벽 백업 디스크 급증 시나리오 대상
    network: 45,
  }),

  generateServer24hData('DB-REPLICA-01', 'database', 'Seoul-AZ2', {
    cpu: 40,
    memory: 65,
    disk: 48,
    network: 40,
  }),

  generateServer24hData('DB-BACKUP-01', 'database', 'Busan-AZ1', {
    cpu: 25,
    memory: 50,
    disk: 60,
    network: 30,
  }),

  // 📱 애플리케이션 서버 (3대)
  generateServer24hData('APP-01', 'application', 'Seoul-AZ1', {
    cpu: 45,
    memory: 60, // 점심 시간 메모리 진동 시나리오 대상
    disk: 40,
    network: 50,
  }),

  generateServer24hData('APP-02', 'application', 'Seoul-AZ2', {
    cpu: 50,
    memory: 70, // 야간 메모리 누수 시나리오 대상
    disk: 45,
    network: 55,
  }),

  generateServer24hData('APP-03', 'application', 'Busan-AZ1', {
    cpu: 55,
    memory: 75,
    disk: 50,
    network: 60,
  }),

  // 💾 스토리지 서버 (2대)
  generateServer24hData('STORAGE-01', 'storage', 'Seoul-AZ1', {
    cpu: 20,
    memory: 40,
    disk: 75, // 오후 디스크 경고 시나리오 대상
    network: 35,
  }),

  generateServer24hData('STORAGE-02', 'storage', 'Busan-AZ1', {
    cpu: 25,
    memory: 45,
    disk: 70,
    network: 40,
  }),

  // 🔥 캐시 서버 (2대)
  generateServer24hData('CACHE-01', 'cache', 'Seoul-AZ1', {
    cpu: 35,
    memory: 80,
    disk: 20,
    network: 60,
  }),

  generateServer24hData('CACHE-02', 'cache', 'Seoul-AZ2', {
    cpu: 40,
    memory: 85,
    disk: 25,
    network: 65,
  }),

  // ⚖️ 로드밸런서 (2대)
  generateServer24hData('LB-01', 'loadbalancer', 'Seoul-AZ1', {
    cpu: 30,
    memory: 50,
    disk: 15,
    network: 70,
  }),

  generateServer24hData('LB-02', 'loadbalancer', 'Seoul-AZ2', {
    cpu: 35,
    memory: 55,
    disk: 20,
    network: 75,
  }),
];

/**
 * 서버 ID로 24시간 데이터셋 조회
 *
 * ⚠️ Map O(1) 최적화 시도 → 롤백 (2025-10-14)
 *
 * **Qwen 제안**: Array.find() O(n) → Map.get() O(1)로 70% 개선
 * **실제 측정 결과** (100,000회 반복):
 *   - Array.find(): 1.45ms ✅ (더 빠름)
 *   - Map.get():    3.78ms ❌ (2.6배 느림, -160.9%)
 *
 * **불가 이유**:
 * 1. **작은 데이터셋 (15개)**: Array는 CPU 캐시에 완전히 적재
 *    - 연속 메모리 배치로 캐시 히트율 극대화
 *    - 평균 7.5번 비교는 해시 함수보다 빠름
 *
 * 2. **해시 오버헤드**: Map.get()의 해시 함수 계산 비용이 큼
 *    - String 해시 계산 + 버킷 탐색 > 단순 문자열 비교
 *
 * 3. **이론 vs 현실**:
 *    - 이론: O(1) < O(n)
 *    - 현실: 상수 계수와 데이터 크기가 더 중요
 *    - Map이 유리한 시점: ~100개 이상 서버
 *
 * **결론**: 현재 15개 서버 규모에서는 Array.find()가 최적
 *          미래 확장 시 재검토 (100+ 서버 시 Map 전환)
 *
 * @see scripts/benchmark-map-lookup.ts - 성능 측정 스크립트
 */
export function getServer24hData(
  serverId: string
): Server24hDataset | undefined {
  return FIXED_24H_DATASETS.find((dataset) => dataset.serverId === serverId);
}

/**
 * 서버 타입별 데이터셋 조회
 */
export function getServersByType(
  serverType: Server24hDataset['serverType']
): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter(
    (dataset) => dataset.serverType === serverType
  );
}

/**
 * 특정 시간(분)의 데이터 포인트 조회
 * @param minuteOfDay 0-1439 (자정부터 경과 시간)
 * @returns 가장 가까운 10분 단위 데이터
 */
export function getDataAtMinute(
  dataset: Server24hDataset,
  minuteOfDay: number
): Fixed10MinMetric | undefined {
  // 가장 가까운 10분 단위로 반올림
  const roundedMinute = Math.floor(minuteOfDay / 10) * 10;
  return dataset.data.find((point) => point.minuteOfDay === roundedMinute);
}

/**
 * 현재 시간(분) 기준 최근 N개 데이터 포인트 조회
 * @param minuteOfDay 현재 시간(분)
 * @param count 조회할 데이터 개수
 * @returns 최근 N개 데이터 (시간 역순)
 */
export function getRecentData(
  dataset: Server24hDataset,
  minuteOfDay: number,
  count: number = 6 // 기본 60분(1시간)
): Fixed10MinMetric[] {
  const currentSlotIndex = Math.floor(minuteOfDay / 10);
  const result: Fixed10MinMetric[] = [];

  for (let i = 0; i < count; i++) {
    // 뫼비우스 띠처럼 순환 (0시를 넘어가면 23시대로) - 모듈러 연산으로 수정
    const targetIndex = (((currentSlotIndex - i) % 144) + 144) % 144;

    const dataPoint = dataset.data[targetIndex];
    if (dataPoint) {
      result.push(dataPoint);
    }
  }

  return result;
}

/**
 * 전체 서버의 평균 메트릭 계산
 */
export function calculateAverageMetrics(minuteOfDay: number): {
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgNetwork: number;
} {
  let totalCpu = 0;
  let totalMemory = 0;
  let totalDisk = 0;
  let totalNetwork = 0;
  let count = 0;

  for (const dataset of FIXED_24H_DATASETS) {
    const dataPoint = getDataAtMinute(dataset, minuteOfDay);
    if (dataPoint) {
      totalCpu += dataPoint.cpu;
      totalMemory += dataPoint.memory;
      totalDisk += dataPoint.disk;
      totalNetwork += dataPoint.network;
      count++;
    }
  }

  return {
    avgCpu: Math.round((totalCpu / count) * 10) / 10,
    avgMemory: Math.round((totalMemory / count) * 10) / 10,
    avgDisk: Math.round((totalDisk / count) * 10) / 10,
    avgNetwork: Math.round((totalNetwork / count) * 10) / 10,
  };
}
