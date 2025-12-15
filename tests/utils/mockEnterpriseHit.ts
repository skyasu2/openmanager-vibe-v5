#!/usr/bin/env node

/**
 * 엔터프라이즈 계정 시뮬레이션 스크립트
 * - 프리미엄 기능 접근 권한 부여
 * - 고급 AI 분석 기능 활성화
 * - 무제한 서버 모니터링 허용
 *
 * 사용법:
 * - node development/scripts/mockEnterpriseHit.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const _TEST_SERVER_ID = 'db-master-01'; // 테스트할 서버 ID

interface TestResult {
  endpoint: string;
  status: number;
  success: boolean;
  duration: number;
  data?: unknown;
  error?: string;
}

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<TestResult> {
  const start = Date.now();
  const url = `${BASE_URL}${endpoint}`;

  try {
    console.log(`🔍 Testing ${method} ${endpoint}...`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - start;
    const data = await response.json();

    const result: TestResult = {
      endpoint,
      status: response.status,
      success: response.ok,
      duration,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error || 'Unknown error',
    };

    if (response.ok) {
      console.log(`✅ ${endpoint} - ${response.status} (${duration}ms)`);
    } else {
      console.log(
        `❌ ${endpoint} - ${response.status} (${duration}ms): ${result.error}`
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const result: TestResult = {
      endpoint,
      status: 0,
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Network error',
    };

    console.log(
      `💥 ${endpoint} - Network Error (${duration}ms): ${result.error}`
    );
    return result;
  }
}

async function runEnterpriseTests() {
  console.log('🏢 Enterprise IDC 시스템 테스트 시작...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  // 1. 기본 상태 체크
  results.push(await testEndpoint('/api/health'));

  // 2. Enterprise 전체 현황
  results.push(await testEndpoint('/api/enterprise'));

  // 3. 서버 목록
  results.push(await testEndpoint('/api/servers'));

  // 4. 대시보드 데이터
  results.push(await testEndpoint('/api/dashboard'));

  // 5. 대시보드 알림 (alerts API 대체)
  results.push(await testEndpoint('/api/dashboard?alerts=true'));

  // 6. Enterprise 시딩 (POST)
  results.push(await testEndpoint('/api/enterprise/seed', 'POST'));

  // 7. 시뮬레이터 실행 (POST)
  results.push(await testEndpoint('/api/simulate', 'POST'));

  // 8. 자연어 쿼리 시스템 (POST) - LangGraph unified-stream API
  results.push(
    await testEndpoint('/api/ai/supervisor', 'POST', {
      messages: [{ role: 'user', content: '전체 인프라 상태 어때?' }],
    })
  );

  // 9. 특정 서버 상태 쿼리
  results.push(
    await testEndpoint('/api/ai/supervisor', 'POST', {
      messages: [{ role: 'user', content: '데이터베이스 서버 문제 있어?' }],
    })
  );

  // 결과 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ 성공: ${successful}/${results.length}`);
  console.log(`❌ 실패: ${failed}/${results.length}`);
  console.log(`⏱️  총 시간: ${totalDuration}ms`);
  console.log(
    `📈 평균 응답시간: ${Math.round(totalDuration / results.length)}ms`
  );

  // 실패한 테스트 상세
  const failedTests = results.filter((r) => !r.success);
  if (failedTests.length > 0) {
    console.log('\n🚨 실패한 테스트:');
    failedTests.forEach((test) => {
      console.log(`  - ${test.endpoint}: ${test.error}`);
    });
  }

  // 성공한 경우 주요 데이터 샘플 출력
  const enterpriseResult = results.find(
    (r) => r.endpoint === '/api/enterprise' && r.success
  );
  if (enterpriseResult?.data) {
    console.log('\n🏢 Enterprise 현황 샘플:');
    const summary = enterpriseResult.data.data?.summary;
    if (summary) {
      console.log(`  총 서버: ${summary.totalServers}대`);
      console.log(`  정상: ${summary.healthyServers}대`);
      console.log(`  경고: ${summary.warningServers}대`);
      console.log(`  심각: ${summary.criticalServers}대`);
      console.log(`  전체 건강도: ${summary.overallHealthScore}/100`);
    }
  }

  // 종료 코드 설정
  const exitCode = failed > 0 ? 1 : 0;
  console.log(
    `\n${exitCode === 0 ? '🎉' : '💥'} 테스트 ${exitCode === 0 ? '완료' : '실패'}`
  );

  if (process.argv[2] !== '--no-exit') {
    process.exit(exitCode);
  }

  return results;
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runEnterpriseTests().catch((error) => {
    console.error('💥 테스트 실행 중 오류:', error);
    process.exit(1);
  });
}

export { runEnterpriseTests, testEndpoint };
