#!/usr/bin/env node

/**
 * AI 자연어 질의 모드 테스트 스크립트
 * local-ai 모드와 google-ai 모드를 각각 테스트합니다.
 */

const https = require('https');

// 서버 설정
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// 테스트 쿼리들
const testQueries = [
  {
    id: 1,
    query: "현재 서버 상태를 확인해줘",
    description: "서버 상태 확인 질의"
  },
  {
    id: 2,
    query: "CPU 사용률이 높은 서버는 어떤 것들이 있나요?",
    description: "메트릭 기반 질의"
  },
  {
    id: 3,
    query: "최근 서버 장애 이력을 보여줘",
    description: "장애 이력 질의"
  },
  {
    id: 4,
    query: "서버 성능을 최적화하려면 어떻게 해야 하나요?",
    description: "최적화 관련 질의"
  },
  {
    id: 5,
    query: "nginx 웹 서버 재시작 명령어는 뭐야?",
    description: "명령어 추천 질의"
  }
];

// HTTP 요청 헬퍼 함수
function makeRequest(mode, query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query,
      mode,
      temperature: 0.7,
      maxTokens: 1000,
      context: 'general',
      includeThinking: false,
      timeoutMs: 450
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-AI-Mode': mode
      },
      rejectUnauthorized: false // 로컬 개발 환경용
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const result = JSON.parse(responseData);
          resolve({
            ...result,
            actualResponseTime: responseTime,
            statusCode: res.statusCode
          });
        } catch (e) {
          reject(new Error(`JSON 파싱 실패: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// 테스트 실행 함수
async function runTests() {
  console.log('🚀 AI 자연어 질의 모드 테스트 시작\n');
  console.log('=' .repeat(80));
  
  const modes = ['local-ai', 'google-ai'];
  const results = {
    'local-ai': [],
    'google-ai': []
  };
  
  // 각 모드별로 테스트
  for (const mode of modes) {
    console.log(`\n📊 ${mode.toUpperCase()} 모드 테스트`);
    console.log('-'.repeat(80));
    
    for (const testQuery of testQueries) {
      console.log(`\n[테스트 ${testQuery.id}] ${testQuery.description}`);
      console.log(`📝 질의: "${testQuery.query}"`);
      
      try {
        const result = await makeRequest(mode, testQuery.query);
        
        // 결과 저장
        results[mode].push({
          queryId: testQuery.id,
          success: result.success,
          responseTime: result.responseTime || result.actualResponseTime,
          engine: result.engine,
          confidence: result.confidence
        });
        
        // 결과 출력
        if (result.success) {
          console.log(`✅ 성공`);
          console.log(`   - 엔진: ${result.engine}`);
          console.log(`   - 응답 시간: ${result.responseTime || result.actualResponseTime}ms`);
          console.log(`   - 신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
          console.log(`   - 응답 길이: ${result.response?.length || 0}자`);
          
          // 응답 미리보기 (첫 100자)
          if (result.response) {
            const preview = result.response.substring(0, 100);
            console.log(`   - 응답 미리보기: "${preview}${result.response.length > 100 ? '...' : ''}"`);
          }
        } else {
          console.log(`❌ 실패: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.log(`❌ 요청 실패: ${error.message}`);
        results[mode].push({
          queryId: testQuery.id,
          success: false,
          error: error.message
        });
      }
      
      // 다음 요청 전 잠시 대기 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // 최종 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📈 테스트 결과 요약\n');
  
  for (const mode of modes) {
    const modeResults = results[mode];
    const successCount = modeResults.filter(r => r.success).length;
    const totalTime = modeResults.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    const avgTime = totalTime / modeResults.length;
    const avgConfidence = modeResults
      .filter(r => r.confidence)
      .reduce((sum, r, _, arr) => sum + r.confidence / arr.length, 0);
    
    console.log(`\n🔹 ${mode.toUpperCase()} 모드`);
    console.log(`   - 성공률: ${successCount}/${modeResults.length} (${(successCount/modeResults.length*100).toFixed(0)}%)`);
    console.log(`   - 평균 응답 시간: ${avgTime.toFixed(0)}ms`);
    console.log(`   - 평균 신뢰도: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // 엔진 사용 통계
    const engineStats = {};
    modeResults.forEach(r => {
      if (r.engine) {
        engineStats[r.engine] = (engineStats[r.engine] || 0) + 1;
      }
    });
    
    if (Object.keys(engineStats).length > 0) {
      console.log(`   - 사용된 엔진:`);
      Object.entries(engineStats).forEach(([engine, count]) => {
        console.log(`     • ${engine}: ${count}회`);
      });
    }
  }
  
  // 모드 간 비교
  console.log('\n' + '='.repeat(80));
  console.log('🔍 모드 간 비교 분석\n');
  
  const localResults = results['local-ai'];
  const googleResults = results['google-ai'];
  
  const localAvgTime = localResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / localResults.length;
  const googleAvgTime = googleResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / googleResults.length;
  
  const localSuccessRate = localResults.filter(r => r.success).length / localResults.length * 100;
  const googleSuccessRate = googleResults.filter(r => r.success).length / googleResults.length * 100;
  
  console.log('📊 성능 비교:');
  console.log(`   - 속도: ${localAvgTime < googleAvgTime ? 'local-ai' : 'google-ai'} 모드가 ${Math.abs(localAvgTime - googleAvgTime).toFixed(0)}ms 더 빠름`);
  console.log(`   - 성공률: ${localSuccessRate > googleSuccessRate ? 'local-ai' : localSuccessRate === googleSuccessRate ? '동일' : 'google-ai'} 모드가 더 높음`);
  
  // 권장사항
  console.log('\n💡 권장사항:');
  if (localAvgTime < 200 && localSuccessRate >= 80) {
    console.log('   ✅ local-ai 모드가 빠르고 안정적입니다. 일반적인 질의에 적합합니다.');
  }
  if (googleSuccessRate > localSuccessRate + 20) {
    console.log('   ✅ google-ai 모드가 더 높은 성공률을 보입니다. 복잡한 질의에 적합합니다.');
  }
  if (localAvgTime > 500 && googleAvgTime > 500) {
    console.log('   ⚠️  두 모드 모두 응답 시간이 500ms를 초과합니다. 성능 최적화가 필요합니다.');
  }
  
  console.log('\n✨ 테스트 완료!\n');
}

// API 서버 상태 확인
async function checkServerStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/ai/query',
      method: 'GET',
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

// 메인 실행
async function main() {
  console.log('🔍 서버 상태 확인 중...');
  
  const serverAvailable = await checkServerStatus();
  
  if (!serverAvailable) {
    console.error('❌ 서버가 실행 중이지 않습니다.');
    console.log('💡 다음 명령어로 서버를 시작하세요: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 서버가 실행 중입니다.\n');
  
  try {
    await runTests();
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();