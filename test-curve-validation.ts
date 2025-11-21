/**
 * 자연스러운 변화 곡선 검증 스크립트
 * 사용법: npx ts-node test-curve-validation.ts
 */

import { generate24HourData, getServerStatus, SERVERS } from './src/mock/mockScenarios';

console.log('🧪 자연스러운 변화 곡선 검증\n');

// DB-PRIMARY 서버의 0-6시 데이터 확인
const data = generate24HourData('db-primary');
console.log(`✅ 총 데이터 포인트: ${data.length}개 (예상: 288개)\n`);

// 시간별 첫 포인트 확인
console.log('📊 시간별 메트릭 변화 (DB-PRIMARY):');
console.log('시간 | CPU (%) | Memory (%) | Status');
console.log('-----|---------|------------|----------');

for (let h = 0; h < 6; h++) {
  const idx = h * 12; // 5분 간격 = 12포인트/시간
  const point = data[idx];
  if (point) {
    const status = getServerStatus(point);
    console.log(`${h}시   | ${point.cpu.toFixed(1).padStart(5)} | ${point.memory.toFixed(1).padStart(8)} | ${status}`);
  }
}

console.log('\n📈 5분 단위 상세 변화 (2-3시, 악화 단계):');
console.log('시각    | CPU (%) | Status');
console.log('--------|---------|----------');

for (let min = 0; min < 60; min += 5) {
  const idx = 2 * 12 + (min / 5); // 2시 + 분
  const point = data[idx];
  if (point) {
    const status = getServerStatus(point);
    console.log(`2:${min.toString().padStart(2, '0')}   | ${point.cpu.toFixed(1).padStart(5)} | ${status}`);
  }
}

console.log('\n✅ 예상 패턴:');
console.log('   0-1시: 정상 (CPU ~40%)');
console.log('   1-2시: 징조 (CPU 40→60%, 선형 증가)');
console.log('   2-3시: 악화 (CPU 60→85%, 지수 증가)');
console.log('   3-5시: 절정 (CPU 85→92%, 급격한 증가)');
console.log('   5-6시: 부분회복 (CPU 92→90%, 여전히 Critical)');

// 실제 검증
let passed = true;
const point0 = data[0];
const point1 = data[12];
const point2 = data[24];
const point3 = data[36];

console.log('\n🔍 검증 결과:');

if (point0 && point0.cpu >= 35 && point0.cpu <= 45) {
  console.log('   ✅ 0시 CPU 정상 범위');
} else {
  console.log(`   ❌ 0시 CPU 비정상: ${point0?.cpu}`);
  passed = false;
}

if (point1 && point1.cpu >= 40 && point1.cpu <= 65) {
  console.log('   ✅ 1시 CPU 징조 범위');
} else {
  console.log(`   ❌ 1시 CPU 비정상: ${point1?.cpu}`);
  passed = false;
}

if (point2 && point2.cpu >= 55 && point2.cpu <= 70) {
  console.log('   ✅ 2시 CPU 악화 시작');
} else {
  console.log(`   ❌ 2시 CPU 비정상: ${point2?.cpu}`);
  passed = false;
}

if (point3 && point3.cpu >= 80 && point3.cpu <= 95) {
  console.log('   ✅ 3시 CPU Critical 진입');
} else {
  console.log(`   ❌ 3시 CPU 비정상: ${point3?.cpu}`);
  passed = false;
}

if (passed) {
  console.log('\n🎉 모든 검증 통과! 자연스러운 변화 곡선 확인');
} else {
  console.log('\n⚠️ 일부 검증 실패');
  process.exit(1);
}
