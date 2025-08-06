#!/usr/bin/env node

/**
 * AI 자연어 질의 Mock 테스트
 * 실제 서버 없이 두 모드의 동작을 시뮬레이션합니다.
 */

// Mock 응답 생성 함수
function generateMockResponse(mode, query) {
  const isLocalMode = mode === 'local-ai';
  const startTime = Date.now();
  
  // 쿼리 분석
  const queryLower = query.toLowerCase();
  const isCommand = queryLower.includes('명령') || queryLower.includes('command');
  const isStatus = queryLower.includes('상태') || queryLower.includes('status');
  const isMetric = queryLower.includes('cpu') || queryLower.includes('memory') || queryLower.includes('메모리');
  const isOptimization = queryLower.includes('최적화') || queryLower.includes('개선');
  
  // 모드별 응답 시간 시뮬레이션
  const baseTime = isLocalMode ? 50 : 200;
  const complexity = isOptimization ? 2 : isCommand ? 1.5 : 1;
  const responseTime = Math.floor(baseTime * complexity + Math.random() * 50);
  
  // 모드별 엔진 선택
  const engine = isLocalMode 
    ? (isCommand ? 'command-engine' : 'local-rag')
    : 'google-ai';
  
  // 모드별 신뢰도
  const confidence = isLocalMode
    ? (isCommand ? 0.92 : isStatus ? 0.88 : 0.75)
    : (isOptimization ? 0.95 : 0.85);
  
  // 응답 생성
  let response;
  if (isCommand) {
    response = `서버 재시작 명령어는 다음과 같습니다:
    
1. nginx 웹 서버: sudo systemctl restart nginx
2. Apache 웹 서버: sudo systemctl restart apache2
3. Node.js 앱: pm2 restart app
4. Docker 컨테이너: docker restart [container-id]

권장: 서버 유형을 확인 후 적절한 명령어를 사용하세요.`;
  } else if (isStatus) {
    response = `현재 서버 상태 요약:

📊 전체 서버: 8대
✅ 온라인: 3대 (37.5%)
⚠️ 경고: 3대 (37.5%)
❌ 오프라인: 2대 (25%)

주요 메트릭:
- 평균 CPU: 45.2%
- 평균 메모리: 62.3%
- 평균 디스크: 38.5%

권장 조치: 경고 상태 서버들의 로그를 확인하세요.`;
  } else if (isMetric) {
    response = `메트릭 분석 결과:

높은 사용률 서버:
1. web-prd-01: CPU 78%, Memory 82%
2. app-prd-02: CPU 65%, Memory 71%
3. db-main-01: CPU 55%, Memory 89%

권장사항:
- web-prd-01: 스케일 아웃 고려
- db-main-01: 메모리 최적화 필요`;
  } else if (isOptimization) {
    response = isLocalMode
      ? `서버 최적화 기본 방법:
1. 불필요한 프로세스 종료
2. 캐시 설정 최적화
3. 데이터베이스 인덱스 점검
4. 로그 로테이션 설정`
      : `고급 서버 최적화 전략:

1. 성능 분석
   - APM 도구 활용 (New Relic, DataDog)
   - 병목 지점 식별 (CPU, I/O, Network)
   - 쿼리 프로파일링

2. 아키텍처 개선
   - 마이크로서비스 분리
   - 로드 밸런싱 최적화
   - CDN 활용 강화

3. 리소스 최적화
   - 오토스케일링 정책 조정
   - 컨테이너 리소스 제한 설정
   - 데이터베이스 커넥션 풀 조정

4. 코드 레벨 최적화
   - 비동기 처리 도입
   - 캐싱 전략 개선
   - 쿼리 최적화`;
  } else {
    response = `질의 "${query}"에 대한 응답입니다.
    
${mode}에서 처리되었으며, 일반적인 정보를 제공합니다.`;
  }
  
  // 실제 경과 시간 계산
  const actualTime = Date.now() - startTime;
  
  // 시뮬레이션된 응답 시간 대기
  const waitTime = Math.max(0, responseTime - actualTime);
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        query,
        response,
        answer: response,
        confidence,
        engine,
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: {
          mode,
          temperature: 0.7,
          maxTokens: 1000,
          context: 'general',
          includeThinking: false,
          complexity: {
            score: isOptimization ? 8 : isCommand ? 3 : 5,
            level: isOptimization ? 'high' : isCommand ? 'low' : 'medium',
            recommendation: engine
          },
          cacheHit: false,
          intent: isCommand ? 'command' : isStatus ? 'status' : isMetric ? 'metric' : isOptimization ? 'optimization' : 'general',
          responseTime,
          queryId: Math.random().toString(36).substring(7),
          fallback: false
        }
      });
    }, waitTime);
  });
}

// 테스트 실행
async function runTests() {
  console.log('🚀 AI 자연어 질의 모드 Mock 테스트 시작\n');
  console.log('=' .repeat(80));
  console.log('⚠️  주의: Mock 데이터를 사용한 시뮬레이션입니다.\n');
  
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
      query: "nginx 웹 서버 재시작 명령어는 뭐야?",
      description: "명령어 추천 질의"
    },
    {
      id: 4,
      query: "서버 성능을 최적화하려면 어떻게 해야 하나요?",
      description: "최적화 관련 질의"
    }
  ];
  
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
        const result = await generateMockResponse(mode, testQuery.query);
        
        // 결과 저장
        results[mode].push({
          queryId: testQuery.id,
          success: result.success,
          responseTime: result.responseTime,
          engine: result.engine,
          confidence: result.confidence
        });
        
        // 결과 출력
        console.log(`✅ 성공`);
        console.log(`   - 엔진: ${result.engine}`);
        console.log(`   - 응답 시간: ${result.responseTime}ms`);
        console.log(`   - 신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   - 응답 길이: ${result.response.length}자`);
        
        // 응답 미리보기
        const preview = result.response.substring(0, 100);
        console.log(`   - 응답 미리보기: "${preview}${result.response.length > 100 ? '...' : ''}"`);
      } catch (error) {
        console.log(`❌ 테스트 실패: ${error.message}`);
      }
      
      // 다음 요청 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // 최종 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📈 테스트 결과 요약\n');
  
  for (const mode of modes) {
    const modeResults = results[mode];
    const totalTime = modeResults.reduce((sum, r) => sum + r.responseTime, 0);
    const avgTime = totalTime / modeResults.length;
    const avgConfidence = modeResults.reduce((sum, r) => sum + r.confidence, 0) / modeResults.length;
    
    console.log(`\n🔹 ${mode.toUpperCase()} 모드`);
    console.log(`   - 성공률: ${modeResults.length}/${modeResults.length} (100%)`);
    console.log(`   - 평균 응답 시간: ${avgTime.toFixed(0)}ms`);
    console.log(`   - 평균 신뢰도: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // 엔진 사용 통계
    const engineStats = {};
    modeResults.forEach(r => {
      engineStats[r.engine] = (engineStats[r.engine] || 0) + 1;
    });
    
    console.log(`   - 사용된 엔진:`);
    Object.entries(engineStats).forEach(([engine, count]) => {
      console.log(`     • ${engine}: ${count}회`);
    });
  }
  
  // 모드 간 비교
  console.log('\n' + '='.repeat(80));
  console.log('🔍 모드 간 비교 분석\n');
  
  const localResults = results['local-ai'];
  const googleResults = results['google-ai'];
  
  const localAvgTime = localResults.reduce((sum, r) => sum + r.responseTime, 0) / localResults.length;
  const googleAvgTime = googleResults.reduce((sum, r) => sum + r.responseTime, 0) / googleResults.length;
  
  const localAvgConfidence = localResults.reduce((sum, r) => sum + r.confidence, 0) / localResults.length;
  const googleAvgConfidence = googleResults.reduce((sum, r) => sum + r.confidence, 0) / googleResults.length;
  
  console.log('📊 성능 비교:');
  console.log(`   - 속도: local-ai가 ${(googleAvgTime - localAvgTime).toFixed(0)}ms 더 빠름`);
  console.log(`   - 신뢰도: ${googleAvgConfidence > localAvgConfidence ? 'google-ai' : 'local-ai'}가 ${Math.abs(googleAvgConfidence - localAvgConfidence).toFixed(3)} 더 높음`);
  
  console.log('\n📊 특성 분석:');
  console.log('\n   LOCAL-AI 모드:');
  console.log('   - 장점: 빠른 응답 속도, 명령어 추천 특화');
  console.log('   - 단점: 복잡한 분석에서 제한적');
  console.log('   - 적합한 용도: 실시간 모니터링, 간단한 질의');
  
  console.log('\n   GOOGLE-AI 모드:');
  console.log('   - 장점: 높은 정확도, 복잡한 분석 가능');
  console.log('   - 단점: 상대적으로 느린 응답');
  console.log('   - 적합한 용도: 심층 분석, 최적화 전략');
  
  console.log('\n💡 권장사항:');
  console.log('   ✅ 실시간 모니터링과 간단한 질의는 local-ai 모드 사용');
  console.log('   ✅ 복잡한 분석과 최적화 전략은 google-ai 모드 사용');
  console.log('   ✅ 하이브리드 접근: 상황에 따라 적절한 모드 선택');
  
  console.log('\n✨ Mock 테스트 완료!\n');
}

// 메인 실행
async function main() {
  try {
    await runTests();
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();