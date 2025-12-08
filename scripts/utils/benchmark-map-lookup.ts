/**
 * Map O(1) vs Array.find() O(n) 성능 비교 벤치마크
 */

import { FIXED_24H_DATASETS, getServer24hData } from '../src/data/fixed-24h-metrics';

const ITERATIONS = 100000;

// Array.find() 방식 (기존)
function benchmarkArrayFind() {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const serverId = FIXED_24H_DATASETS[i % 15].serverId;
    const result = FIXED_24H_DATASETS.find((dataset) => dataset.serverId === serverId);
  }
  const end = performance.now();
  return end - start;
}

// Map.get() 방식 (신규)
function benchmarkMapGet() {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const serverId = FIXED_24H_DATASETS[i % 15].serverId;
    const result = getServer24hData(serverId);
  }
  const end = performance.now();
  return end - start;
}

console.log('🚀 Map O(1) vs Array.find() O(n) 성능 비교\n');
console.log(`반복 횟수: ${ITERATIONS.toLocaleString()}회`);
console.log(`데이터셋 크기: ${FIXED_24H_DATASETS.length}개 서버\n`);

// Warm-up
console.log('⏳ Warm-up...');
benchmarkArrayFind();
benchmarkMapGet();

// 실제 측정
console.log('📊 측정 중...\n');

const arrayTime = benchmarkArrayFind();
const mapTime = benchmarkMapGet();

console.log('='.repeat(60));
console.log('📈 결과:');
console.log('='.repeat(60));
console.log(`Array.find() O(n): ${arrayTime.toFixed(2)}ms`);
console.log(`Map.get() O(1):    ${mapTime.toFixed(2)}ms`);
console.log(`\n성능 개선:         ${((1 - mapTime / arrayTime) * 100).toFixed(1)}% 빠름`);
console.log(`속도 비율:         ${(arrayTime / mapTime).toFixed(1)}배 빠름`);
console.log('='.repeat(60));
