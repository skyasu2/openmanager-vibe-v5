/**
 * Mock 데이터 시스템 검증 스크립트
 * 사용법: npx ts-node test-mock-data.ts
 */

import { generateMockServerData } from './src/mock/mockDataGenerator';
import { SERVERS, FAILURE_SCENARIOS, getCurrentScenarioInfo } from './src/mock/mockScenarios';

console.log('🧪 Mock 데이터 시스템 검증 시작\n');

// 1. 서버 정의 확인
console.log('1️⃣ 서버 정의 확인');
console.log(`   - 총 서버 수: ${SERVERS.length}개`);
console.log(`   - 서버 목록:`);
SERVERS.forEach(server => {
  console.log(`     • ${server.id} (${server.type}): ${server.description}`);
});
console.log('');

// 2. 시나리오 정의 확인
console.log('2️⃣ 장애 시나리오 확인');
console.log(`   - 총 시나리오 수: ${FAILURE_SCENARIOS.length}개`);
FAILURE_SCENARIOS.forEach((scenario, idx) => {
  console.log(`   ${idx + 1}. ${scenario.name}`);
  console.log(`      시간대: ${scenario.timeRange[0]}시 ~ ${scenario.timeRange[1]}시`);
  console.log(`      영향받는 서버: ${scenario.affectedServers.length}개`);
  const criticalCount = scenario.affectedServers.filter(s => s.status === 'critical').length;
  const warningCount = scenario.affectedServers.filter(s => s.status === 'warning').length;
  console.log(`      - Critical: ${criticalCount}개, Warning: ${warningCount}개`);
});
console.log('');

// 3. 데이터 생성 검증
console.log('3️⃣ 데이터 생성 검증');
const mockData = generateMockServerData();

console.log(`   ✅ 생성된 서버 수: ${mockData.servers.length}개`);
console.log(`   ✅ 시계열 데이터 서버 수: ${Object.keys(mockData.timeSeries).length}개`);

// 각 서버의 데이터 포인트 수 확인
const firstServer = Object.keys(mockData.timeSeries)[0];
const dataPoints = mockData.timeSeries[firstServer].data.length;
console.log(`   ✅ 서버당 데이터 포인트: ${dataPoints}개`);
console.log(`   ✅ 총 데이터 포인트: ${dataPoints * SERVERS.length}개`);
console.log('');

// 4. 메타데이터 확인
console.log('4️⃣ 메타데이터');
console.log(`   - 생성 시각: ${mockData.metadata.generatedAt}`);
console.log(`   - 데이터 간격: ${mockData.metadata.intervalMinutes}분`);
console.log(`   - 서버당 포인트: ${mockData.metadata.dataPointsPerServer}개`);
console.log(`   - 전체 포인트: ${mockData.metadata.totalDataPoints}개`);
console.log('');

// 5. 시나리오 상태 검증
console.log('5️⃣ 시나리오 상태 검증 (시간대별)');
for (let hour = 0; hour < 24; hour += 6) {
  const scenarioInfo = getCurrentScenarioInfo(hour);
  console.log(`   ${hour}시: ${scenarioInfo.scenario?.name || '정상'}`);
  console.log(`     - Critical 서버: ${scenarioInfo.criticalServers.length}개`);
  console.log(`     - Warning 서버: ${scenarioInfo.warningServers.length}개`);
}
console.log('');

// 6. 실제 서버 상태 확인
console.log('6️⃣ 생성된 서버 상태');
const statusCounts = mockData.servers.reduce((acc, server) => {
  acc[server.status] = (acc[server.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(statusCounts).forEach(([status, count]) => {
  console.log(`   - ${status}: ${count}개`);
});
console.log('');

// 7. 검증 결과
console.log('7️⃣ 검증 결과');
const isDataPointsCorrect = dataPoints === 288;
const isServerCountCorrect = mockData.servers.length === 15;
const isTotalPointsCorrect = mockData.metadata.totalDataPoints === 288 * 15;

console.log(`   ${isDataPointsCorrect ? '✅' : '❌'} 데이터 포인트 수 (288개 예상)`);
console.log(`   ${isServerCountCorrect ? '✅' : '❌'} 서버 수 (15개 예상)`);
console.log(`   ${isTotalPointsCorrect ? '✅' : '❌'} 총 포인트 수 (4,320개 예상)`);

if (isDataPointsCorrect && isServerCountCorrect && isTotalPointsCorrect) {
  console.log('\n🎉 모든 검증 통과!');
} else {
  console.log('\n⚠️ 일부 검증 실패');
  process.exit(1);
}
