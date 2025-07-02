/**
 * ������ 고품질 한국어 NLP 엔진 테스트
 * 
 * Vercel 환경에서 품질 우선 한국어 처리 테스트
 */

const { performance } = require('perf_hooks');

// Vercel 배포 환경 테스트
const VERCEL_URL = 'https://openmanager-vibe-v5.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// 테스트용 한국어 쿼리들 (복잡도별)
const testQueries = [
  // 기본 수준
  {
    query: "서버 상태 확인해줘",
    expectedTopics: ["서버 관리"],
    expectedUrgency: "medium",
    complexity: "basic"
  },
  
  // 중급 수준
  {
    query: "웹서버 CPU 사용률이 높아서 응답시간이 느려지고 있어요",
    expectedTopics: ["성능 분석", "CPU 분석"],
    expectedUrgency: "high",
    complexity: "intermediate"
  },
  
  // 고급 수준
  {
    query: "데이터베이스 서버 클러스터에서 메모리 누수가 발생해서 로드밸런서 처리량이 급격히 감소하고 있습니다. 긴급히 분석해주세요",
    expectedTopics: ["문제 해결", "메모리 분석", "네트워크 분석"],
    expectedUrgency: "critical",
    complexity: "advanced"
  }
];

async function testKoreanNLP(baseUrl, query, expectedResult) {
  const startTime = performance.now();
  
  try {
    console.log(`\n�� 테스트 쿼리: "${query}"`);
    console.log(`��� 예상 복잡도: ${expectedResult.complexity}`);
    
    const response = await fetch(`${baseUrl}/api/ai/unified-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        query: query,
        mode: 'LOCAL', // 한국어 NLP 엔진 우선 사용
        category: 'server-monitoring',
        context: {
          timestamp: new Date().toISOString(),
          source: 'enhanced-korean-nlp-test',
          testComplexity: expectedResult.complexity,
        }
      })
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ 응답 성공 (${responseTime}ms)`);
    console.log(`��� 모드: ${result.mode}`);
    console.log(`�� 엔진: ${result.engine}`);
    console.log(`��� 신뢰도: ${result.confidence}`);
    console.log(`���️ 엔진 경로: ${result.enginePath?.join(' → ') || 'N/A'}`);
    console.log(`��� 폴백 사용: ${result.fallbacksUsed || 0}회`);
    
    // 한국어 분석 결과 확인
    if (result.metadata?.koreanAnalysis) {
      const koreanAnalysis = result.metadata.koreanAnalysis;
      console.log(`\n������ 한국어 분석 결과:`);
      console.log(`   주제: ${koreanAnalysis.semanticAnalysis?.mainTopic}`);
      console.log(`   하위주제: ${koreanAnalysis.semanticAnalysis?.subTopics?.join(', ') || 'N/A'}`);
      console.log(`   긴급도: ${koreanAnalysis.semanticAnalysis?.urgencyLevel}`);
      console.log(`   기술복잡도: ${Math.round((koreanAnalysis.semanticAnalysis?.technicalComplexity || 0) * 100)}%`);
      console.log(`   엔티티: ${koreanAnalysis.entities?.length || 0}개`);
      console.log(`   처리시간: ${koreanAnalysis.qualityMetrics?.processingTime}ms`);
      console.log(`   분석깊이: ${Math.round((koreanAnalysis.qualityMetrics?.analysisDepth || 0) * 100)}%`);
      console.log(`   컨텍스트관련성: ${Math.round((koreanAnalysis.qualityMetrics?.contextRelevance || 0) * 100)}%`);
      
      return {
        success: true,
        responseTime,
        confidence: result.confidence,
        koreanAnalysis,
        complexity: expectedResult.complexity,
        engine: result.engine,
        fallbacksUsed: result.fallbacksUsed || 0
      };
    } else {
      console.log(`⚠️ 한국어 분석 결과 없음 (기본 엔진 사용됨)`);
      return {
        success: true,
        responseTime,
        confidence: result.confidence,
        complexity: expectedResult.complexity,
        engine: result.engine,
        fallbacksUsed: result.fallbacksUsed || 0
      };
    }
    
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.error(`❌ 테스트 실패 (${responseTime}ms):`, error.message);
    return {
      success: false,
      responseTime,
      error: error.message,
      complexity: expectedResult.complexity
    };
  }
}

async function runTest() {
  console.log('������ 고품질 한국어 NLP 엔진 테스트 시작\n');
  
  const results = [];
  
  // Vercel 환경 테스트
  console.log(`��� Vercel 환경 테스트 (${VERCEL_URL})`);
  console.log('='.repeat(60));
  
  for (const testCase of testQueries) {
    const result = await testKoreanNLP(VERCEL_URL, testCase.query, testCase);
    results.push(result);
    
    // 테스트 간 간격 (API 제한 방지)
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 결과 분석
  console.log(`\n��� 테스트 결과 분석`);
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`성공: ${successful.length}/${results.length}`);
  console.log(`실패: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    const avgConfidence = successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length;
    const totalFallbacks = successful.reduce((sum, r) => sum + (r.fallbacksUsed || 0), 0);
    
    console.log(`평균 응답시간: ${Math.round(avgResponseTime)}ms`);
    console.log(`평균 신뢰도: ${Math.round(avgConfidence * 100)}%`);
    console.log(`총 폴백 사용: ${totalFallbacks}회`);
    
    // 복잡도별 분석
    const complexityGroups = {
      basic: successful.filter(r => r.complexity === 'basic'),
      intermediate: successful.filter(r => r.complexity === 'intermediate'),
      advanced: successful.filter(r => r.complexity === 'advanced')
    };
    
    console.log(`\n복잡도별 성능:`);
    Object.entries(complexityGroups).forEach(([complexity, group]) => {
      if (group.length > 0) {
        const avgTime = group.reduce((sum, r) => sum + r.responseTime, 0) / group.length;
        console.log(`  ${complexity}: ${Math.round(avgTime)}ms`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n실패 원인:`);
    failed.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.error}`);
    });
  }
  
  console.log(`\n✅ 테스트 완료`);
}

// 메인 실행
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testKoreanNLP };
