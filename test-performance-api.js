/**
 * 🧪 성능 모니터링 API 테스트 스크립트
 *
 * CentralizedPerformanceMonitor API 엔드포인트를 테스트합니다:
 * - GET /api/performance?action=current (현재 메트릭)
 * - GET /api/performance?action=stats (통계)
 * - GET /api/performance?action=collect (메트릭 수집)
 * - POST /api/performance?action=start (모니터링 시작)
 */

const BASE_URL = 'http://localhost:3000';

// API 테스트 함수
async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🔍 테스트: ${method} ${endpoint}`);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`✅ 응답 상태: ${response.status}`);
    console.log(`📊 응답 데이터:`, JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error(`❌ 오류 발생:`, error.message);
    return null;
  }
}

// 성능 모니터링 API 테스트 시퀀스
async function runPerformanceTests() {
  console.log('🚀 성능 모니터링 API 테스트 시작');
  console.log('━'.repeat(60));

  // 1. 기본 상태 확인
  await testAPI('/api/performance');

  // 2. 현재 메트릭 조회
  await testAPI('/api/performance?action=current');

  // 3. 통계 조회
  await testAPI('/api/performance?action=stats');

  // 4. 모니터링 시작
  await testAPI('/api/performance?action=start', 'POST');

  // 5. 메트릭 수집
  await testAPI('/api/performance?action=collect');

  // 6. 24시간 히스토리 조회
  await testAPI('/api/performance?action=history&hours=24');

  // 7. 활성 알림 조회
  await testAPI('/api/performance?action=alerts');

  // 8. 과금 절약 모드 테스트
  await testAPI('/api/performance?action=cost-saving', 'POST');

  console.log('\n🎉 모든 테스트 완료!');
  console.log('━'.repeat(60));
}

// 테스트 실행
runPerformanceTests();
