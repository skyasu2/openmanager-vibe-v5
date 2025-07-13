#!/usr/bin/env node

import { GeminiBridge } from '../mcp-servers/gemini-cli-bridge/src/gemini-bridge.js';

console.log('🧪 Gemini CLI MCP 브릿지 테스트');
console.log('================================\n');

const bridge = new GeminiBridge({
  timeout: 10000,
  maxRetries: 2
});

async function runTests() {
  const tests = [
    {
      name: '버전 확인',
      fn: async () => await bridge.getVersion()
    },
    {
      name: '통계 조회',
      fn: async () => await bridge.getStats()
    },
    {
      name: '간단한 채팅',
      fn: async () => await bridge.chat('안녕하세요')
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📍 ${test.name} 테스트 중...`);
      const result = await test.fn();
      console.log(`✅ 성공:`, result.substring(0, 100) + (result.length > 100 ? '...' : ''));
    } catch (error) {
      console.log(`❌ 실패:`, error.message);
      
      // 쿼터 초과인 경우 안내
      if (error.message.includes('사용 제한')) {
        console.log('\n💡 해결 방법:');
        console.log('1. 내일 다시 시도 (쿼터는 매일 초기화)');
        console.log('2. 다른 Google 계정으로 로그인:');
        console.log('   gemini logout');
        console.log('   gemini login');
        break;
      }
    }
  }
}

// 테스트 실행
runTests().catch(console.error);