#!/usr/bin/env node

/**
 * 🎯 AI 엔진 처리 순서 테스트
 *
 * 올바른 순서 검증:
 * 1. MCP 컨텍스트 (실시간 서버 상태) - 70%
 * 2. RAG 검색 (서버 지식) - 15%
 * 3. 경량 ML (수치 처리) - 10%
 * 4. Google AI (복잡한 자연어) - 2%
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testAIEnginePriority() {
  console.log('🎯 AI 엔진 처리 순서 테스트 시작...\n');

  const testQueries = [
    {
      name: 'MCP 컨텍스트 우선 테스트',
      query: '현재 서버 상태가 어떻게 되나요?',
      expectedEngine: 'mcp',
      description: '실시간 서버 상태 질문 - MCP가 1순위로 처리해야 함',
    },
    {
      name: 'RAG 지식 검색 테스트',
      query: '서버 모니터링 모범 사례가 무엇인가요?',
      expectedEngine: 'rag',
      description: '일반적 서버 지식 질문 - RAG가 2순위로 처리 가능',
    },
    {
      name: '복잡한 자연어 테스트',
      query:
        '서버 성능 최적화를 위한 종합적인 전략을 세우고 단계별 실행 계획을 만들어주세요.',
      expectedEngine: 'google_ai',
      description: '복잡한 종합 분석 - Google AI가 최후에 처리해야 함',
    },
  ];

  let results = [];

  for (const test of testQueries) {
    console.log(`📋 ${test.name}`);
    console.log(`   질문: ${test.query}`);
    console.log(`   예상: ${test.expectedEngine} 엔진이 처리`);
    console.log(`   설명: ${test.description}\n`);

    try {
      // Smart Fallback Engine 테스트
      const response = await fetch(`${API_BASE}/ai/smart-fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: test.query,
          context: {
            serverMetrics: [
              { cpu: 45, memory: 60, disk: 30, timestamp: Date.now() },
            ],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const actualEngine = result.data?.stage || 'unknown';
        const confidence = result.data?.confidence || 0;
        const responseTime = result.data?.responseTime || 0;
        const fallbackPath = result.data?.fallbackPath || [];

        console.log(`   ✅ 결과: ${actualEngine} 엔진이 처리`);
        console.log(`   📊 신뢰도: ${Math.round(confidence * 100)}%`);
        console.log(`   ⚡ 응답시간: ${responseTime}ms`);
        console.log(`   🔄 처리 경로: ${fallbackPath.join(' → ')}`);

        const isCorrectEngine = actualEngine === test.expectedEngine;
        console.log(
          `   ${isCorrectEngine ? '🎯 예상대로 처리됨!' : '⚠️ 예상과 다른 엔진이 처리함'}\n`
        );

        results.push({
          test: test.name,
          expected: test.expectedEngine,
          actual: actualEngine,
          correct: isCorrectEngine,
          confidence,
          responseTime,
          fallbackPath,
        });
      } else {
        console.log(`   ❌ 실패: ${result.error}\n`);
        results.push({
          test: test.name,
          expected: test.expectedEngine,
          actual: 'failed',
          correct: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.log(`   ❌ 에러: ${error.message}\n`);
      results.push({
        test: test.name,
        expected: test.expectedEngine,
        actual: 'error',
        correct: false,
        error: error.message,
      });
    }

    // 다음 테스트 전 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 요약
  console.log('📊 AI 엔진 처리 순서 테스트 결과:');
  console.log('='.repeat(60));

  const successfulTests = results.filter(r => r.correct).length;
  const totalTests = results.length;

  results.forEach(result => {
    const status = result.correct ? '✅' : '❌';
    const details = result.error ? `(${result.error})` : `(${result.actual})`;
    console.log(
      `${status} ${result.test}: ${result.expected} → ${result.actual} ${details}`
    );
  });

  console.log('\n📈 통계:');
  console.log(`총 테스트: ${totalTests}개`);
  console.log(`성공: ${successfulTests}개`);
  console.log(`성공률: ${Math.round((successfulTests / totalTests) * 100)}%`);

  if (successfulTests === totalTests) {
    console.log(
      '\n🎉 모든 테스트 통과! AI 엔진 처리 순서가 올바르게 구현되었습니다!'
    );
  } else {
    console.log(
      '\n⚠️ 일부 테스트 실패. AI 엔진 처리 순서를 다시 확인해주세요.'
    );
  }

  // Google AI 할당량 상태 확인
  try {
    const quotaResponse = await fetch(`${API_BASE}/ai/smart-fallback/admin`);
    if (quotaResponse.ok) {
      const quotaData = await quotaResponse.json();
      const quota = quotaData.adminData?.quota?.googleAI;

      if (quota) {
        console.log('\n📋 Google AI 할당량 상태:');
        console.log(
          `   사용: ${quota.used}/${quota.limit}회 (${quota.percentage}%)`
        );
        console.log(`   남은 양: ${quota.remaining}회`);
        console.log(`   제한 근접: ${quota.isNearLimit ? '예' : '아니오'}`);
      }
    }
  } catch (error) {
    console.log('\n⚠️ Google AI 할당량 조회 실패:', error.message);
  }
}

// 실행
testAIEnginePriority().catch(console.error);
