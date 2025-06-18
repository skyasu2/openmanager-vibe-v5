/**
 * 🧠 Smart Fallback Engine 테스트 스크립트
 *
 * 사용법:
 * npx ts-node tests/scripts/smart-fallback-test.ts
 */

import SmartFallbackEngine from '../../src/services/ai/SmartFallbackEngine';

async function testSmartFallback() {
  console.log('🧠 Smart Fallback Engine 테스트 시작');
  console.log('='.repeat(50));

  const smartEngine = SmartFallbackEngine.getInstance();

  try {
    // 1. 초기화 테스트
    console.log('\n1️⃣ 초기화 테스트');
    await smartEngine.initialize();
    console.log('✅ 초기화 완료');

    // 2. 시스템 상태 확인
    console.log('\n2️⃣ 시스템 상태 확인');
    const status = smartEngine.getSystemStatus();
    console.log('📊 시스템 상태:', {
      initialized: status.initialized,
      engines: {
        mcp: status.engines.mcp.available ? '✅ 사용 가능' : '❌ 사용 불가',
        rag: status.engines.rag.available ? '✅ 사용 가능' : '❌ 사용 불가',
        googleAI: status.engines.googleAI.available
          ? '✅ 사용 가능'
          : '❌ 사용 불가',
      },
      quota: `${status.quota.googleAIUsed}/${status.quota.googleAIRemaining + status.quota.googleAIUsed}`,
    });

    // 3. 테스트 쿼리들
    const testQueries = [
      '현재 서버 상태를 알려주세요',
      'CPU 사용률이 높은 서버가 있나요?',
      '메모리 부족 경고가 있는지 확인해주세요',
      '최근 에러 로그를 분석해주세요',
      'AI 시스템 성능 최적화 방법을 알려주세요',
    ];

    console.log('\n3️⃣ 폴백 시스템 테스트');

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n테스트 ${i + 1}: "${query}"`);

      const startTime = Date.now();
      const result = await smartEngine.processQuery(query, {
        serverMetrics: [
          { cpu: 45, memory: 60, disk: 30, timestamp: new Date() },
          { cpu: 78, memory: 85, disk: 45, timestamp: new Date() },
        ],
        logEntries: [
          {
            level: 'warn',
            message: 'High CPU usage detected',
            timestamp: new Date(),
          },
          {
            level: 'info',
            message: 'System status check completed',
            timestamp: new Date(),
          },
        ],
      });

      const duration = Date.now() - startTime;

      console.log(`📊 결과:`, {
        success: result.success ? '✅' : '❌',
        stage: result.stage.toUpperCase(),
        confidence: Math.round(result.confidence * 100) + '%',
        responseTime: duration + 'ms',
        fallbackPath: result.fallbackPath.join(' → '),
        quota: `${result.quota.googleAIUsed}/300 (${Math.round((result.quota.googleAIUsed / 300) * 100)}%)`,
      });

      if (result.success) {
        console.log(
          `💬 응답: ${result.response.slice(0, 100)}${result.response.length > 100 ? '...' : ''}`
        );
      }

      // 각 테스트 사이에 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. 엔진별 개별 테스트
    console.log('\n4️⃣ 엔진별 개별 테스트');

    const engines = ['mcp', 'rag', 'google_ai'] as const;

    for (const engine of engines) {
      console.log(`\n${engine.toUpperCase()} 엔진 테스트:`);

      const options = {
        enableMCP: engine === 'mcp',
        enableRAG: engine === 'rag',
        enableGoogleAI: engine === 'google_ai',
        timeout: 10000,
      };

      const result = await smartEngine.processQuery(
        `${engine} 엔진으로 시스템 상태를 확인해주세요`,
        null,
        options
      );

      console.log(
        `${result.success ? '✅' : '❌'} ${engine}: ${result.success ? '성공' : '실패'}`
      );
      if (!result.success) {
        console.log(`   실패 경로: ${result.fallbackPath.join(' → ')}`);
      }
    }

    // 5. 실패 로그 확인
    console.log('\n5️⃣ 실패 로그 확인');
    const failureLogs = smartEngine.getFailureLogs(5);
    console.log(`📋 최근 실패 로그 ${failureLogs.length}개:`);

    failureLogs.forEach((log, index) => {
      console.log(
        `   ${index + 1}. [${log.stage.toUpperCase()}] ${log.error || '알 수 없는 오류'}`
      );
      console.log(`      시간: ${log.timestamp.toLocaleString('ko-KR')}`);
      console.log(`      응답시간: ${log.responseTime}ms`);
    });

    // 6. 성능 통계
    console.log('\n6️⃣ 성능 통계');
    const finalStatus = smartEngine.getSystemStatus();
    console.log('📈 엔진별 성공률:');
    console.log(
      `   MCP: ${Math.round(finalStatus.engines.mcp.successRate * 100)}%`
    );
    console.log(
      `   RAG: ${Math.round(finalStatus.engines.rag.successRate * 100)}%`
    );
    console.log(
      `   Google AI: ${Math.round(finalStatus.engines.googleAI.successRate * 100)}%`
    );

    console.log('\n📊 Google AI 할당량:');
    console.log(`   사용량: ${finalStatus.quota.googleAIUsed}/300`);
    console.log(`   남은 량: ${finalStatus.quota.googleAIRemaining}`);
    console.log(
      `   경고 상태: ${finalStatus.quota.isNearLimit ? '⚠️ 주의' : '✅ 정상'}`
    );
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧠 Smart Fallback Engine 테스트 완료');
}

// 스크립트 실행
if (require.main === module) {
  testSmartFallback()
    .then(() => {
      console.log('\n✅ 모든 테스트가 완료되었습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 테스트 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { testSmartFallback };
