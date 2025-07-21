#!/usr/bin/env node

/**
 * ⚠️ 이 테스트는 더 이상 유효하지 않습니다.
 * Gemini CLI Bridge MCP가 지원 중단되었습니다.
 *
 * 대신 다음을 사용하세요:
 * - 개발 도구: ./tools/g "질문"
 * - npm 스크립트: npm run gemini:chat "질문"
 *
 * [아카이브 - 참고용으로만 유지]
 * 적응적 Gemini CLI Bridge 테스트 스크립트
 * 양방향 호출 문제 해결 검증
 */

import { AdaptiveGeminiBridge } from '../mcp-servers/gemini-cli-bridge/src/adaptive-gemini-bridge.js';

async function testAdaptiveGeminiBridge() {
  console.log('⚠️ 이 테스트는 더 이상 유효하지 않습니다.');
  console.log('🧪 적응적 Gemini CLI Bridge 테스트 시작 (아카이브)\n');

  try {
    // 1. 초기화 및 컨텍스트 감지 테스트
    console.log('1️⃣ 컨텍스트 감지 테스트...');
    const bridge = new AdaptiveGeminiBridge({
      timeout: 15000,
      maxRetries: 2,
    });

    const context = await bridge.initialize();

    console.log(`✅ 컨텍스트 감지 성공:`);
    console.log(`   호출자: ${context.caller}`);
    console.log(`   대상: ${context.target}`);
    console.log(`   실행 전략: ${context.executionStrategy}`);
    console.log(`   WSL 환경: ${context.isWSL}`);
    console.log(`   확신도: ${context.confidence}\n`);

    // 2. 버전 확인 테스트
    console.log('2️⃣ Gemini CLI 버전 확인 테스트...');
    try {
      const version = await bridge.getVersion();
      console.log(`✅ 버전 확인 성공: ${version}\n`);
    } catch (error) {
      console.log(`❌ 버전 확인 실패: ${error.message}\n`);
    }

    // 3. 간단한 채팅 테스트
    console.log('3️⃣ 간단한 채팅 테스트...');
    try {
      const response = await bridge.chat(
        '안녕하세요! 간단히 인사만 해주세요.',
        {
          timeout: 10000,
        }
      );
      console.log(`✅ 채팅 테스트 성공:`);
      console.log(
        `응답: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}\n`
      );
    } catch (error) {
      console.log(`❌ 채팅 테스트 실패: ${error.message}\n`);
    }

    // 4. Flash 모델 테스트
    console.log('4️⃣ Flash 모델 테스트...');
    try {
      const flashResponse = await bridge.chat('Hello! Just say hi briefly.', {
        model: 'gemini-2.5-flash',
        timeout: 8000,
      });
      console.log(`✅ Flash 모델 테스트 성공:`);
      console.log(
        `응답: ${flashResponse.substring(0, 100)}${flashResponse.length > 100 ? '...' : ''}\n`
      );
    } catch (error) {
      console.log(`❌ Flash 모델 테스트 실패: ${error.message}\n`);
    }

    // 5. 통계 조회 테스트 (빠른 타임아웃)
    console.log('5️⃣ 통계 조회 테스트...');
    try {
      const stats = await bridge.getStats();
      console.log(`✅ 통계 조회 성공:`);
      console.log(
        `통계: ${stats.substring(0, 200)}${stats.length > 200 ? '...' : ''}\n`
      );
    } catch (error) {
      console.log(`❌ 통계 조회 실패: ${error.message}\n`);
    }

    console.log('🎉 적응적 Gemini CLI Bridge 테스트 완료!');
    console.log('\n=== 테스트 요약 ===');
    console.log(`호출 컨텍스트: ${context.caller} → ${context.target}`);
    console.log(`실행 전략: ${context.executionStrategy}`);
    console.log(`권장사항: ${context.recommendations.join(', ')}`);
  } catch (error) {
    console.error('❌ 테스트 중 치명적 오류 발생:', error);
    process.exit(1);
  }
}

// 환경 변수 설정
process.env.GEMINI_DEBUG = 'false'; // 디버그 출력 비활성화

// 테스트 실행
testAdaptiveGeminiBridge().catch(console.error);
