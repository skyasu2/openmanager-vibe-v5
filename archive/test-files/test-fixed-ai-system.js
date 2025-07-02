/**
 * 🔧 수정된 AI 시스템 테스트
 * OpenManager Vibe v5 - 문제 해결 후 검증
 */

async function testFixedAISystem() {
  try {
    console.log('🔧 수정된 AI 시스템 테스트 시작...');

    // 1. 환경변수 확인
    console.log('\n1️⃣ 환경변수 설정 확인...');
    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GOOGLE_AI_API_KEY',
      'UPSTASH_REDIS_REST_URL',
    ];

    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: 설정됨 (${value.substring(0, 20)}...)`);
      } else {
        console.log(`   ❌ ${varName}: 누락됨`);
      }
    });

    // 2. AI 통합 쿼리 테스트
    console.log('\n2️⃣ AI 통합 쿼리 테스트...');

    const testQueries = [
      '서버 상태 확인',
      '메모리 사용량',
      'CPU 모니터링',
      '디스크 공간',
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 쿼리: "${query}"`);

      try {
        const response = await fetch(
          'http://localhost:3000/api/ai/unified-query',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: query,
              mode: 'AUTO',
              context: {
                source: 'test-script',
                timestamp: new Date().toISOString(),
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ 응답 성공 (${response.status})`);
          console.log(`   📊 처리 시간: ${data.processingTime || 'N/A'}ms`);
          console.log(`   🎯 엔진: ${data.engineUsed || 'N/A'}`);
          console.log(`   📝 응답 길이: ${data.response?.length || 0}자`);

          if (data.error) {
            console.log(`   ⚠️ 에러: ${data.error}`);
          }
        } else {
          console.log(
            `   ❌ 응답 실패 (${response.status}): ${response.statusText}`
          );
          const errorText = await response.text();
          console.log(`   오류 내용: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ❌ 요청 실패: ${error.message}`);
      }

      // 요청 간 간격
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. 시스템 상태 확인
    console.log('\n3️⃣ 시스템 상태 확인...');

    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('   ✅ 시스템 헬스체크 성공');
        console.log(`   📊 상태: ${healthData.status || 'N/A'}`);
        console.log(`   🕒 업타임: ${healthData.uptime || 'N/A'}`);
      } else {
        console.log(`   ❌ 헬스체크 실패 (${healthResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ 헬스체크 요청 실패: ${error.message}`);
    }

    console.log('\n🎯 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실행 실패:', error.message);
  }
}

// Node.js 환경에서 fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testFixedAISystem();
