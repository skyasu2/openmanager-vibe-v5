#!/usr/bin/env node

/**
 * Gemini CLI Bridge v2.1 테스트 스크립트
 * 새로운 기능들을 테스트합니다.
 */

import { AdaptiveGeminiBridge } from './src/adaptive-gemini-bridge-v2.js';

async function testV2Features() {
  console.log('🧪 Gemini CLI Bridge v2.1 테스트 시작...\n');

  const bridge = new AdaptiveGeminiBridge({
    timeout: 10000,
    maxRetries: 2,
  });

  try {
    // 1. 초기화 및 컨텍스트 감지
    console.log('1️⃣ 컨텍스트 감지 테스트...');
    const context = await bridge.initialize();
    console.log(`✅ 컨텍스트: ${context.caller} → ${context.target}`);
    console.log(`✅ 전략: ${context.executionStrategy}\n`);

    // 2. 버전 확인
    console.log('2️⃣ Gemini CLI 버전 확인...');
    try {
      const version = await bridge.getVersion();
      console.log(`✅ Gemini CLI 버전: ${version}\n`);
    } catch (error) {
      console.log(`⚠️ 버전 확인 실패: ${error.message}\n`);
    }

    // 3. 사용량 대시보드
    console.log('3️⃣ 사용량 대시보드 확인...');
    const dashboard = bridge.getUsageDashboard();
    console.log(dashboard);
    console.log();

    // 4. 통계 확인
    console.log('4️⃣ 확장된 통계 정보...');
    const stats = await bridge.getStats();
    console.log('📊 캐시 통계:', {
      hitRate: stats.cache?.hitRate || 0,
      size: stats.cache?.size || 0,
    });
    console.log('📊 사용량 통계:', {
      current: stats.usage?.current || 0,
      limit: stats.usage?.limit || 1000,
      percent: stats.usage?.percent || 0,
    });
    console.log();

    // 5. 간단한 채팅 테스트
    console.log('5️⃣ 채팅 테스트...');
    try {
      const response = await bridge.chat('안녕하세요. 테스트 메시지입니다.', {
        model: 'gemini-2.5-flash',
      });
      console.log('✅ 응답:', response.substring(0, 100) + '...\n');
    } catch (error) {
      console.log(`⚠️ 채팅 실패: ${error.message}\n`);
    }

    // 6. 캐시 성능 테스트
    console.log('6️⃣ 캐시 성능 테스트...');
    console.log('첫 번째 컨텍스트 감지 (캐시 미스 예상)...');
    const start1 = Date.now();
    await bridge.initialize();
    const time1 = Date.now() - start1;

    console.log('두 번째 컨텍스트 감지 (캐시 히트 예상)...');
    const start2 = Date.now();
    await bridge.initialize();
    const time2 = Date.now() - start2;

    console.log(`✅ 첫 번째: ${time1}ms`);
    console.log(`✅ 두 번째: ${time2}ms`);
    console.log(`✅ 성능 향상: ${Math.round((1 - time2 / time1) * 100)}%\n`);

    // 7. 사용량 예측
    console.log('7️⃣ 사용량 예측 테스트...');
    const tracker = bridge.usageTracker;
    const prediction = tracker.predictDailyUsage();
    console.log('📈 예측 결과:', prediction);
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }

  console.log('\n✅ 테스트 완료!');
}

// 테스트 실행
testV2Features().catch(console.error);
