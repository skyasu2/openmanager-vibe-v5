#!/usr/bin/env node

/**
 * Upstash Redis MCP Wrapper 테스트 스크립트
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

console.log('🔧 Upstash Redis MCP Wrapper 테스트 시작...\n');

// MCP 서버 프로세스 시작
const mcp = spawn('node', ['scripts/upstash-redis-mcp-wrapper-final.mjs'], {
  env: {
    ...process.env,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://charming-condor-46598.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// 에러 스트림 모니터링
mcp.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('running')) {
    console.log('✅ MCP 서버가 성공적으로 시작되었습니다!');
    console.log('📝 서버 메시지:', message.trim());
    
    // 서버가 시작되면 종료
    setTimeout(() => {
      mcp.kill();
      console.log('\n✅ 테스트 완료! MCP 서버가 정상적으로 작동합니다.');
      console.log('\n💡 다음 단계:');
      console.log('1. Claude Code를 재시작하세요');
      console.log('2. Redis MCP가 "running" 상태인지 확인하세요');
      console.log('3. Claude에서 다음 명령어를 사용할 수 있습니다:');
      console.log('   - mcp__redis__set("key", "value")');
      console.log('   - mcp__redis__get("key")');
      console.log('   - mcp__redis__list("pattern")');
      console.log('   - mcp__redis__delete("key")');
      process.exit(0);
    }, 1000);
  } else if (message.includes('Error') || message.includes('error')) {
    console.error('❌ 에러 발생:', message);
  } else {
    console.log('📝 서버 메시지:', message.trim());
  }
});

// 표준 출력 모니터링
mcp.stdout.on('data', (data) => {
  console.log('📤 출력:', data.toString());
});

// 프로세스 종료 처리
mcp.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ MCP 서버가 코드 ${code}로 종료되었습니다.`);
    process.exit(1);
  }
});

// 타임아웃 설정
setTimeout(() => {
  console.error('\n❌ 테스트 타임아웃 - MCP 서버가 시작되지 않았습니다.');
  mcp.kill();
  process.exit(1);
}, 10000);

console.log('⏳ MCP 서버 시작 대기 중...');