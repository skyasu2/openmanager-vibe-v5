#!/usr/bin/env tsx

/**
 * 🧪 명령어 추천 시스템 통합 테스트
 * 
 * SimplifiedQueryEngine의 명령어 감지 및 처리 로직을 검증합니다.
 * - detectCommandQuery() 메서드 테스트
 * - processCommandQuery() 메서드 테스트  
 * - UnifiedAIEngineRouter 통합 테스트
 * - 한국어/영어 패턴 테스트
 * - 다양한 명령어 시나리오 테스트
 */

import { SimplifiedQueryEngine } from '../src/services/ai/SimplifiedQueryEngine';
import { getUnifiedAIRouter } from '../src/services/ai/UnifiedAIEngineRouter';
import type { QueryRequest } from '../src/types/ai.types';

console.log('🧪 명령어 추천 시스템 통합 테스트 시작...\n');

// 테스트 케이스 정의
const testCases = [
  // 한국어 명령어 패턴
  {
    name: '한국어 기본 명령어 요청',
    query: 'web-prd-01 서버에서 사용할 수 있는 명령어 알려줘',
    expectedDetection: true,
    category: 'korean_basic'
  },
  {
    name: '한국어 CPU 모니터링 명령어',
    query: 'CPU 사용률 확인하는 명령어 어떻게 사용해?',
    expectedDetection: true,
    category: 'korean_monitoring'
  },
  {
    name: '한국어 서버 관리 명령어',
    query: '서버 상태 확인 명령어 추천해줘',
    expectedDetection: true,
    category: 'korean_management'
  },
  {
    name: '한국어 리눅스 명령어',
    query: '리눅스에서 메모리 확인하는 명령어',
    expectedDetection: true,
    category: 'korean_linux'
  },

  // 영어 명령어 패턴
  {
    name: '영어 명령어 요청',
    query: 'what command should I use to check disk space?',
    expectedDetection: true,
    category: 'english_basic'
  },
  {
    name: '영어 실행 명령어',
    query: 'how to run docker containers',
    expectedDetection: true,
    category: 'english_howto'
  },
  {
    name: '영어 서버 명령어',
    query: 'server monitoring commands for Linux',
    expectedDetection: true,
    category: 'english_server'
  },

  // 구체적 명령어 언급
  {
    name: '구체적 명령어 (top)',
    query: 'top 명령어 사용법',
    expectedDetection: true,
    category: 'specific_command'
  },
  {
    name: '구체적 명령어 (docker)',
    query: 'docker ps 명령어 설명',
    expectedDetection: true,
    category: 'specific_command'
  },

  // 서버 ID + 명령어 패턴
  {
    name: '서버 ID 패턴 (웹서버)',
    query: 'web-prd-01에서 Nginx 상태 확인 명령어',
    expectedDetection: true,
    category: 'server_specific'
  },
  {
    name: '서버 ID 패턴 (DB서버)',
    query: 'db-main-01 PostgreSQL 성능 모니터링 명령어',
    expectedDetection: true,
    category: 'server_specific'
  },

  // 일반 질의 (명령어가 아님)
  {
    name: '일반 질의 (서버 상태)',
    query: '현재 서버 상태는 어떤가요?',
    expectedDetection: false,
    category: 'general_query'
  },
  {
    name: '일반 질의 (AI 질문)',
    query: 'AI는 어떻게 작동하나요?',
    expectedDetection: false,
    category: 'general_query'
  },
  {
    name: '일반 질의 (기술 설명)',
    query: 'Docker와 Kubernetes의 차이점',
    expectedDetection: false,
    category: 'general_query'
  }
];

/**
 * 명령어 감지 테스트
 */
async function testCommandDetection() {
  console.log('📊 1단계: 명령어 감지 테스트');
  console.log('=====================================\n');

  const engine = new SimplifiedQueryEngine();
  let passCount = 0;
  let totalCount = testCases.length;

  for (const testCase of testCases) {
    try {
      // detectCommandQuery는 private 메서드이므로 
      // query() 메서드를 통해 간접적으로 테스트
      const request: QueryRequest = {
        query: testCase.query,
        mode: 'local'
      };

      // 실제 쿼리 실행으로 명령어 감지 확인
      const result = await engine.query(request);
      
      // 메타데이터에서 commandMode 확인
      const isCommandDetected = result.metadata?.commandMode === true;
      const testPassed = isCommandDetected === testCase.expectedDetection;
      
      console.log(`${testPassed ? '✅' : '❌'} ${testCase.name}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Expected: ${testCase.expectedDetection}, Actual: ${isCommandDetected}`);
      console.log(`   Category: ${testCase.category}`);
      
      if (testPassed) {
        passCount++;
      } else {
        console.log(`   ❗ 테스트 실패: 감지 결과가 예상과 다름`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${testCase.name} - 에러 발생`);
      console.log(`   Error: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
      console.log('');
    }
  }

  console.log(`📊 명령어 감지 테스트 결과: ${passCount}/${totalCount} 통과 (${Math.round(passCount/totalCount*100)}%)\n`);
  return { passed: passCount, total: totalCount };
}

/**
 * 명령어 처리 및 추천 테스트
 */
async function testCommandRecommendations() {
  console.log('🛠️ 2단계: 명령어 처리 및 추천 테스트');
  console.log('========================================\n');

  const engine = new SimplifiedQueryEngine();
  const commandQueries = testCases
    .filter(tc => tc.expectedDetection === true)
    .slice(0, 5); // 처음 5개만 테스트

  let successCount = 0;

  for (const testCase of commandQueries) {
    try {
      console.log(`🔍 테스트: ${testCase.name}`);
      console.log(`   Query: "${testCase.query}"`);
      
      const request: QueryRequest = {
        query: testCase.query,
        mode: 'local',
        options: {
          commandContext: {
            isCommandRequest: true,
            requestType: 'command_request'
          }
        }
      };

      const startTime = Date.now();
      const result = await engine.query(request);
      const processingTime = Date.now() - startTime;

      if (result.success && result.metadata?.commandMode) {
        console.log(`   ✅ 성공 (${processingTime}ms)`);
        console.log(`   Engine: ${result.engine}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Response Length: ${result.response.length}자`);
        
        // 추천 개수 확인
        if (result.metadata.recommendationCount) {
          console.log(`   Recommendations: ${result.metadata.recommendationCount}개`);
        }
        
        // Thinking steps 확인
        if (result.thinkingSteps && result.thinkingSteps.length > 0) {
          const commandSteps = result.thinkingSteps.filter(step => 
            step.step.includes('명령어') || step.step.includes('Command')
          );
          console.log(`   Command Processing Steps: ${commandSteps.length}개`);
        }
        
        successCount++;
      } else {
        console.log(`   ❌ 실패: ${result.error || '명령어 모드로 처리되지 않음'}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ 에러: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
      console.log('');
    }
  }

  console.log(`🛠️ 명령어 처리 테스트 결과: ${successCount}/${commandQueries.length} 성공\n`);
  return { passed: successCount, total: commandQueries.length };
}

/**
 * UnifiedAIEngineRouter 직접 테스트
 */
async function testUnifiedAIEngineRouter() {
  console.log('🎯 3단계: UnifiedAIEngineRouter 직접 테스트');
  console.log('===========================================\n');

  try {
    const aiRouter = getUnifiedAIRouter();
    
    const testQueries = [
      'web-prd-01 서버 CPU 모니터링 명령어',
      'PostgreSQL 성능 분석 명령어',
      'Docker 컨테이너 관리 명령어'
    ];

    let successCount = 0;

    for (const query of testQueries) {
      try {
        console.log(`🔍 테스트 쿼리: "${query}"`);
        
        const startTime = Date.now();
        const result = await aiRouter.getCommandRecommendations(query, {
          maxRecommendations: 5,
          includeAnalysis: true
        });
        const processingTime = Date.now() - startTime;

        if (result && result.recommendations && result.recommendations.length > 0) {
          console.log(`   ✅ 성공 (${processingTime}ms)`);
          console.log(`   추천 명령어 수: ${result.recommendations.length}개`);
          console.log(`   분석 신뢰도: ${result.analysis.confidence}`);
          console.log(`   응답 길이: ${result.formattedResponse.length}자`);
          
          // 첫 번째 추천 명령어 미리보기
          if (result.recommendations[0]) {
            const firstCmd = result.recommendations[0];
            console.log(`   첫 번째 추천: ${firstCmd.command} (${firstCmd.riskLevel})`);
          }
          
          successCount++;
        } else {
          console.log(`   ❌ 실패: 추천 결과가 비어있음`);
        }
        
      } catch (error) {
        console.log(`   ❌ 에러: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
      }
      
      console.log('');
    }

    console.log(`🎯 UnifiedAIEngineRouter 테스트 결과: ${successCount}/${testQueries.length} 성공\n`);
    return { passed: successCount, total: testQueries.length };
    
  } catch (error) {
    console.log(`❌ UnifiedAIEngineRouter 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 에러'}\n`);
    return { passed: 0, total: 1 };
  }
}

/**
 * 성능 벤치마크 테스트
 */
async function performanceBenchmark() {
  console.log('⚡ 4단계: 성능 벤치마크 테스트');
  console.log('===============================\n');

  const engine = new SimplifiedQueryEngine();
  const testQuery = 'web-prd-01 서버 모니터링 명령어 추천해줘';
  const iterations = 3;
  
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      
      const result = await engine.query({
        query: testQuery,
        mode: 'local',
        options: {
          commandContext: {
            isCommandRequest: true,
            requestType: 'command_request'
          }
        }
      });
      
      const processingTime = Date.now() - startTime;
      times.push(processingTime);
      
      console.log(`🔄 실행 ${i + 1}: ${processingTime}ms (성공: ${result.success})`);
      
    } catch (error) {
      console.log(`❌ 실행 ${i + 1} 실패: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 성능 결과:`);
    console.log(`   평균 처리시간: ${avgTime}ms`);
    console.log(`   최소 처리시간: ${minTime}ms`);
    console.log(`   최대 처리시간: ${maxTime}ms`);
    console.log(`   목표 달성: ${avgTime < 500 ? '✅' : '❌'} (목표: 500ms 이하)\n`);
    
    return { avgTime, minTime, maxTime, targetMet: avgTime < 500 };
  }
  
  return null;
}

/**
 * 메인 테스트 실행
 */
async function runIntegrationTests() {
  const startTime = Date.now();
  
  console.log('🚀 명령어 추천 시스템 통합 테스트');
  console.log('====================================\n');
  
  // 1단계: 명령어 감지 테스트
  const detectionResults = await testCommandDetection();
  
  // 2단계: 명령어 처리 테스트  
  const processingResults = await testCommandRecommendations();
  
  // 3단계: UnifiedAIEngineRouter 테스트
  const routerResults = await testUnifiedAIEngineRouter();
  
  // 4단계: 성능 벤치마크
  const performanceResults = await performanceBenchmark();
  
  // 전체 결과 요약
  const totalTime = Date.now() - startTime;
  
  console.log('📋 통합 테스트 결과 요약');
  console.log('========================\n');
  
  console.log(`🔍 명령어 감지: ${detectionResults.passed}/${detectionResults.total} (${Math.round(detectionResults.passed/detectionResults.total*100)}%)`);
  console.log(`🛠️ 명령어 처리: ${processingResults.passed}/${processingResults.total} (${Math.round(processingResults.passed/processingResults.total*100)}%)`);
  console.log(`🎯 AI 라우터: ${routerResults.passed}/${routerResults.total} (${Math.round(routerResults.passed/routerResults.total*100)}%)`);
  
  if (performanceResults) {
    console.log(`⚡ 성능: 평균 ${performanceResults.avgTime}ms (목표 달성: ${performanceResults.targetMet ? '✅' : '❌'})`);
  }
  
  console.log(`⏱️ 전체 테스트 시간: ${Math.round(totalTime/1000)}초\n`);
  
  // 전체 성공률 계산
  const totalPassed = detectionResults.passed + processingResults.passed + routerResults.passed;
  const totalTests = detectionResults.total + processingResults.total + routerResults.total;
  const successRate = Math.round(totalPassed/totalTests*100);
  
  console.log(`🎯 전체 성공률: ${totalPassed}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('✅ 통합 테스트 통과! 명령어 추천 시스템이 정상적으로 작동합니다.');
  } else if (successRate >= 60) {
    console.log('⚠️ 통합 테스트 부분 통과. 일부 개선이 필요합니다.');
  } else {
    console.log('❌ 통합 테스트 실패. 시스템 점검이 필요합니다.');
  }
}

// 테스트 실행
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ 통합 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

export { runIntegrationTests };