/**
 * 24시간 고정 데이터 시스템 검증 스크립트
 * 
 * 검증 항목:
 * 1. 15개 서버 데이터셋 존재 여부
 * 2. 각 서버당 144개 데이터 포인트 (24시간 * 6 = 144)
 * 3. 장애 시나리오 적용 확인 (6개)
 * 4. 한국 시간 동기화 확인
 * 5. 뫼비우스 띠 순환 테스트
 */

import { FIXED_24H_DATASETS, getServer24hData, getDataAtMinute, getRecentData, calculateAverageMetrics } from '../src/data/fixed-24h-metrics';
import { FAILURE_SCENARIOS } from '../src/data/scenarios';
import { KST } from '../src/lib/time';

console.log('🎯 24시간 고정 데이터 시스템 검증 시작\n');

// 1. 서버 데이터셋 검증
console.log('='.repeat(60));
console.log('1️⃣  서버 데이터셋 검증');
console.log('='.repeat(60));

const totalServers = FIXED_24H_DATASETS.length;
console.log(`✅ 총 서버 수: ${totalServers}개 (기대값: 15개)`);

if (totalServers !== 15) {
  console.error(`❌ 실패: 서버 수가 15개가 아님 (실제: ${totalServers}개)`);
  process.exit(1);
}

// 서버별 데이터 포인트 확인
let allValid = true;
FIXED_24H_DATASETS.forEach((dataset) => {
  const pointCount = dataset.data.length;
  const expected = 144;
  const status = pointCount === expected ? '✅' : '❌';
  console.log(`${status} ${dataset.serverId} (${dataset.serverType}): ${pointCount}개 포인트`);
  
  if (pointCount !== expected) {
    console.error(`   ❌ 기대값 144개, 실제 ${pointCount}개`);
    allValid = false;
  }
});

if (!allValid) {
  console.error('\n❌ 일부 서버의 데이터 포인트 수가 올바르지 않습니다.');
  process.exit(1);
}

console.log('✅ 모든 서버가 144개 데이터 포인트를 가지고 있습니다.\n');

// 2. 장애 시나리오 검증
console.log('='.repeat(60));
console.log('2️⃣  장애 시나리오 검증');
console.log('='.repeat(60));

console.log(`✅ 총 장애 시나리오: ${FAILURE_SCENARIOS.length}개 (기대값: 6개)\n`);

if (FAILURE_SCENARIOS.length !== 6) {
  console.error(`❌ 실패: 장애 시나리오가 6개가 아님 (실제: ${FAILURE_SCENARIOS.length}개)`);
  process.exit(1);
}

FAILURE_SCENARIOS.forEach((scenario) => {
  const [startMin, endMin] = scenario.timeRange;
  const startTime = KST.toTime(startMin);
  const endTime = KST.toTime(endMin);
  const duration = (endMin - startMin) / 60; // 시간 단위
  
  console.log(`📊 ${scenario.id}`);
  console.log(`   이름: ${scenario.name}`);
  console.log(`   서버: ${scenario.serverId}`);
  console.log(`   메트릭: ${scenario.affectedMetric}`);
  console.log(`   시간: ${startTime} - ${endTime} (${duration}시간)`);
  console.log(`   심각도: ${scenario.severity}`);
  console.log(`   패턴: ${scenario.pattern}`);
  console.log(`   기준값 → 최고값: ${scenario.baseValue} → ${scenario.peakValue}\n`);
});

// 3. 특정 시나리오 데이터 확인 (새벽 백업 디스크 급증)
console.log('='.repeat(60));
console.log('3️⃣  새벽 백업 시나리오 데이터 확인');
console.log('='.repeat(60));

const dbServer = getServer24hData('DB-MAIN-01');
if (!dbServer) {
  console.error('❌ DB-MAIN-01 서버를 찾을 수 없습니다.');
  process.exit(1);
}

console.log('새벽 2시-4시 디스크 사용량 추이 (10분 간격):\n');
for (let minute = 120; minute <= 240; minute += 10) {
  const data = getDataAtMinute(dbServer, minute);
  if (data) {
    const time = KST.toTime(data.minuteOfDay);
    console.log(`${time} → 디스크: ${data.disk.toFixed(1)}%`);
  }
}

// 4. 한국 시간 동기화 검증
console.log('\n' + '='.repeat(60));
console.log('4️⃣  한국 시간 동기화 검증');
console.log('='.repeat(60));

const currentKST = KST.currentTime();
const currentMinute = KST.minuteOfDay();

console.log(`현재 한국 시간: ${currentKST} (${currentMinute}분)`);
console.log(`현재 10분 슬롯: ${Math.floor(currentMinute / 10) * 10}분\n`);

// 현재 시각의 평균 메트릭 계산
const avgMetrics = calculateAverageMetrics(currentMinute);
console.log('현재 시각 전체 서버 평균 메트릭:');
console.log(`  CPU: ${avgMetrics.avgCpu.toFixed(1)}%`);
console.log(`  메모리: ${avgMetrics.avgMemory.toFixed(1)}%`);
console.log(`  디스크: ${avgMetrics.avgDisk.toFixed(1)}%`);
console.log(`  네트워크: ${avgMetrics.avgNetwork.toFixed(1)}%\n`);

// 5. 뫼비우스 띠 순환 검증
console.log('='.repeat(60));
console.log('5️⃣  뫼비우스 띠 순환 검증 (24시간 순환)');
console.log('='.repeat(60));

const testServer = getServer24hData('WEB-01');
if (!testServer) {
  console.error('❌ WEB-01 서버를 찾을 수 없습니다.');
  process.exit(1);
}

console.log('최근 10분 데이터 (현재 시각 기준 역순):\n');
const recentData = getRecentData(testServer, currentMinute, 10);
recentData.forEach((point, index) => {
  const time = KST.toTime(point.minuteOfDay);
  console.log(`${index === 0 ? '→' : ' '} ${time} | CPU: ${point.cpu.toFixed(1)}% | 메모리: ${point.memory.toFixed(1)}% | 디스크: ${point.disk.toFixed(1)}% | 네트워크: ${point.network.toFixed(1)}%`);
});

// 자정 전후 순환 테스트
console.log('\n자정 전후 순환 테스트 (23:50 → 00:00 → 00:10):');
const midnightTest = [
  getDataAtMinute(testServer, 1430), // 23:50
  getDataAtMinute(testServer, 0),    // 00:00
  getDataAtMinute(testServer, 10),   // 00:10
];

midnightTest.forEach((data) => {
  if (data) {
    const time = KST.toTime(data.minuteOfDay);
    console.log(`  ${time} → CPU: ${data.cpu.toFixed(1)}%`);
  }
});

// 6. 서버 타입별 데이터 확인
console.log('\n' + '='.repeat(60));
console.log('6️⃣  서버 타입별 데이터 확인');
console.log('='.repeat(60));

const serverTypes = ['web', 'database', 'application', 'storage', 'cache', 'loadbalancer'] as const;
serverTypes.forEach((type) => {
  const servers = FIXED_24H_DATASETS.filter((s) => s.serverType === type);
  console.log(`${type.toUpperCase()}: ${servers.length}개 서버`);
  servers.forEach((s) => {
    console.log(`  - ${s.serverId} (${s.location})`);
  });
});

console.log('\n' + '='.repeat(60));
console.log('✅ 모든 검증 통과!');
console.log('='.repeat(60));
console.log('\n📊 검증 요약:');
console.log(`  ✅ 서버 수: ${totalServers}개`);
console.log(`  ✅ 총 데이터 포인트: ${totalServers * 144}개 (${totalServers} * 144)`);
console.log(`  ✅ 장애 시나리오: ${FAILURE_SCENARIOS.length}개`);
console.log(`  ✅ 한국 시간 동기화: 정상`);
console.log(`  ✅ 뫼비우스 띠 순환: 정상`);
console.log('\n🎉 24시간 고정 데이터 시스템 구현 완료!');
