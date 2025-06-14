#!/usr/bin/env node

/**
 * 🧪 최적화된 컨텍스트 설정 테스트
 * 무료 티어 환경에서의 성능 검증
 */

// 간단한 HTTP 요청을 위한 내장 모듈 사용
const http = require('http');

const BASE_URL = 'http://localhost:3001';

// 간단한 fetch 대체 함수
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(jsonData)
          });
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testOptimizedContext() {
  console.log('🧪 최적화된 컨텍스트 설정 테스트 시작...\n');

  const results = {
    contextManager: null,
    unifiedCache: null,
    aiChat: null,
    performance: {
      memoryUsage: 0,
      responseTime: 0,
      cacheHitRate: 0
    }
  };

  try {
    // 1. 컨텍스트 관리자 상태 확인
    console.log('📋 1. 컨텍스트 관리자 상태 확인...');
    const contextResponse = await makeRequest(`${BASE_URL}/api/ai/unified/status`);
    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      results.contextManager = {
        status: '✅ 정상',
        patterns: contextData.patterns || 'N/A',
        queries: contextData.queries || 'N/A',
        results: contextData.results || 'N/A'
      };
      console.log(`   패턴 저장소: ${contextData.patterns || 'N/A'}개`);
      console.log(`   쿼리 히스토리: ${contextData.queries || 'N/A'}개`);
      console.log(`   결과 저장소: ${contextData.results || 'N/A'}개`);
    } else {
      results.contextManager = { status: '❌ 오류', error: contextResponse.statusText };
    }

    // 2. 통합 캐시 성능 확인
    console.log('\n💾 2. 통합 캐시 성능 확인...');
    const cacheResponse = await makeRequest(`${BASE_URL}/api/system/unified/status`);
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json();
      results.unifiedCache = {
        status: '✅ 정상',
        hitRate: cacheData.cacheStats?.hitRate || 0,
        memoryUsage: cacheData.cacheStats?.memoryUsage || 'N/A',
        entries: cacheData.cacheStats?.totalEntries || 0
      };
      results.performance.cacheHitRate = cacheData.cacheStats?.hitRate || 0;
      console.log(`   캐시 히트율: ${(cacheData.cacheStats?.hitRate || 0).toFixed(1)}%`);
      console.log(`   메모리 사용량: ${cacheData.cacheStats?.memoryUsage || 'N/A'}`);
      console.log(`   총 엔트리: ${cacheData.cacheStats?.totalEntries || 0}개`);
    } else {
      results.unifiedCache = { status: '❌ 오류', error: cacheResponse.statusText };
    }

    // 3. AI 대화 시스템 테스트
    console.log('\n🤖 3. AI 대화 시스템 성능 테스트...');
    const startTime = Date.now();

    const aiResponse = await makeRequest(`${BASE_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        message: '현재 시스템의 무료 티어 최적화 상태를 분석해주세요. 메모리 사용량, 캐시 효율성, 응답 속도를 중심으로 평가해주세요.',
        sessionId: `optimization_test_${Date.now()}`
      })
    });

    const responseTime = Date.now() - startTime;
    results.performance.responseTime = responseTime;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      results.aiChat = {
        status: '✅ 정상',
        responseTime: `${responseTime}ms`,
        provider: aiData.provider || 'Unknown',
        tokens: aiData.usage?.total_tokens || 'N/A'
      };
      console.log(`   응답 시간: ${responseTime}ms`);
      console.log(`   AI 제공자: ${aiData.provider || 'Unknown'}`);
      console.log(`   토큰 사용: ${aiData.usage?.total_tokens || 'N/A'}`);

      if (aiData.response) {
        console.log('\n🎯 AI 분석 결과:');
        console.log(`   ${aiData.response.substring(0, 200)}...`);
      }
    } else {
      results.aiChat = { status: '❌ 오류', error: aiResponse.statusText };
    }

    // 4. 메모리 사용량 추정
    console.log('\n📊 4. 메모리 사용량 분석...');
    const memoryEstimate = calculateMemoryUsage(results);
    results.performance.memoryUsage = memoryEstimate;
    console.log(`   추정 메모리 사용량: ${memoryEstimate}MB`);

    // 5. 종합 평가
    console.log('\n📈 5. 종합 성능 평가...');
    const overallScore = calculateOverallScore(results);
    console.log(`   전체 성능 점수: ${overallScore}/100`);
    console.log(`   무료 티어 적합성: ${overallScore >= 80 ? '✅ 우수' : overallScore >= 60 ? '⚠️ 보통' : '❌ 개선 필요'}`);

    // 6. 최적화 권장사항
    console.log('\n💡 6. 최적화 권장사항:');
    const recommendations = generateRecommendations(results);
    recommendations.forEach(rec => console.log(`   • ${rec}`));

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    results.error = error.message;
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`컨텍스트 관리자: ${results.contextManager?.status || '❌ 테스트 실패'}`);
  console.log(`통합 캐시: ${results.unifiedCache?.status || '❌ 테스트 실패'}`);
  console.log(`AI 대화 시스템: ${results.aiChat?.status || '❌ 테스트 실패'}`);
  console.log(`캐시 히트율: ${results.performance.cacheHitRate.toFixed(1)}%`);
  console.log(`평균 응답시간: ${results.performance.responseTime}ms`);
  console.log(`메모리 사용량: ${results.performance.memoryUsage}MB`);

  return results;
}

function calculateMemoryUsage(results) {
  // 기본 시스템 메모리 + 컨텍스트 + 캐시
  let baseMemory = 50; // 기본 시스템

  if (results.contextManager?.status === '✅ 정상') {
    baseMemory += (results.contextManager.patterns || 0) * 0.1; // 패턴당 0.1MB
    baseMemory += (results.contextManager.queries || 0) * 0.05; // 쿼리당 0.05MB
    baseMemory += (results.contextManager.results || 0) * 0.2; // 결과당 0.2MB
  }

  if (results.unifiedCache?.status === '✅ 정상') {
    baseMemory += (results.unifiedCache.entries || 0) * 0.1; // 캐시 엔트리당 0.1MB
  }

  return Math.round(baseMemory * 10) / 10; // 소수점 1자리
}

function calculateOverallScore(results) {
  let score = 0;

  // 시스템 상태 (40점)
  if (results.contextManager?.status === '✅ 정상') score += 15;
  if (results.unifiedCache?.status === '✅ 정상') score += 15;
  if (results.aiChat?.status === '✅ 정상') score += 10;

  // 성능 지표 (60점)
  if (results.performance.cacheHitRate >= 70) score += 20;
  else if (results.performance.cacheHitRate >= 50) score += 15;
  else if (results.performance.cacheHitRate >= 30) score += 10;

  if (results.performance.responseTime <= 100) score += 20;
  else if (results.performance.responseTime <= 500) score += 15;
  else if (results.performance.responseTime <= 1000) score += 10;

  if (results.performance.memoryUsage <= 80) score += 20;
  else if (results.performance.memoryUsage <= 120) score += 15;
  else if (results.performance.memoryUsage <= 200) score += 10;

  return Math.min(score, 100);
}

function generateRecommendations(results) {
  const recommendations = [];

  if (results.performance.cacheHitRate < 70) {
    recommendations.push('캐시 히트율 개선을 위해 TTL 시간 조정 고려');
  }

  if (results.performance.responseTime > 500) {
    recommendations.push('응답 시간 개선을 위해 로컬 캐시 크기 증가 고려');
  }

  if (results.performance.memoryUsage > 120) {
    recommendations.push('메모리 사용량 최적화를 위해 정리 주기 단축 고려');
  }

  if (results.contextManager?.patterns > 20) {
    recommendations.push('패턴 저장소 크기 조정 고려 (현재 무료 티어 최적화: 15개)');
  }

  if (results.contextManager?.results > 40) {
    recommendations.push('결과 저장소 크기 조정 고려 (현재 무료 티어 최적화: 35개)');
  }

  if (recommendations.length === 0) {
    recommendations.push('현재 설정이 무료 티어에 최적화되어 있습니다');
  }

  return recommendations;
}

// 스크립트 직접 실행 시
if (require.main === module) {
  testOptimizedContext()
    .then(() => {
      console.log('\n✅ 테스트 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testOptimizedContext };