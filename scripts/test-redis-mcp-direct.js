#!/usr/bin/env node

/**
 * Redis MCP Direct Test
 * MCP 프로토콜을 통해 Redis 서버와 직접 통신하는 테스트
 */

import { spawn } from 'child_process';

const redisMcp = spawn('node', ['scripts/upstash-redis-mcp-wrapper-final.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let messageId = 1;

// MCP 프로토콜 메시지 전송
function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  
  const messageStr = JSON.stringify(message);
  console.log('→ Sending:', messageStr);
  redisMcp.stdin.write(messageStr + '\n');
}

// stdout 버퍼
let buffer = '';

// 응답 처리
redisMcp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  // 마지막 라인이 불완전할 수 있으므로 보관
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('← Received:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('← Raw output:', line);
      }
    }
  }
});

// stderr 출력
redisMcp.stderr.on('data', (data) => {
  console.error('⚠️ stderr:', data.toString());
});

// 에러 처리
redisMcp.on('error', (error) => {
  console.error('❌ Process error:', error);
});

// 종료 처리
redisMcp.on('close', (code) => {
  console.log(`✅ Process exited with code ${code}`);
});

// 테스트 시작
console.log('🚀 Starting Redis MCP test...\n');

// 1. Initialize
sendMessage('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0'
  }
});

// 2. 잠시 대기 후 tools 목록 요청
setTimeout(() => {
  sendMessage('tools/list');
}, 1000);

// 3. Redis 명령 테스트
setTimeout(() => {
  // SET 테스트
  sendMessage('tools/call', {
    name: 'set',
    arguments: {
      key: 'test:key',
      value: 'Hello from MCP!',
      expireSeconds: 60
    }
  });
}, 2000);

setTimeout(() => {
  // GET 테스트
  sendMessage('tools/call', {
    name: 'get',
    arguments: {
      key: 'test:key'
    }
  });
}, 3000);

setTimeout(() => {
  // LIST 테스트
  sendMessage('tools/call', {
    name: 'list',
    arguments: {
      pattern: 'test:*'
    }
  });
}, 4000);

// 5초 후 종료
setTimeout(() => {
  console.log('\n🏁 Test completed!');
  redisMcp.kill();
  process.exit(0);
}, 5000);