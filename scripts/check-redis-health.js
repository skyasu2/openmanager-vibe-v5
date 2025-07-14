#!/usr/bin/env node

/**
 * Redis MCP Server 헬스 체크 스크립트
 * Redis 서버 연결 상태 및 MCP 서버 상태를 확인합니다.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏥 Redis MCP Server 헬스 체크 시작...');

// 1. Redis MCP 패키지 설치 확인
console.log('\n📦 패키지 상태 확인...');
try {
  const packagePath = path.join(__dirname, '../node_modules/@gongrzhe/server-redis-mcp/package.json');
  if (fs.existsSync(packagePath)) {
    const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`✅ Redis MCP Server v${packageInfo.version} 설치됨`);
  } else {
    throw new Error('Package not found');
  }
} catch (error) {
  console.error('❌ Redis MCP Server 패키지를 찾을 수 없습니다.');
  console.log('설치: npm install @gongrzhe/server-redis-mcp@1.0.0');
  process.exit(1);
}

// 2. Claude MCP 설정 확인
console.log('\n⚙️  Claude MCP 설정 확인...');
try {
  const result = execSync('claude mcp list', { encoding: 'utf8', stdio: 'pipe' });
  if (result.includes('redis') || result.includes('@gongrzhe/server-redis-mcp')) {
    console.log('✅ Redis MCP 서버가 Claude에 등록됨');
  } else {
    console.log('⚠️  Redis MCP 서버가 Claude에 등록되지 않음');
    console.log('등록: claude mcp add redis node "./node_modules/@gongrzhe/server-redis-mcp/dist/index.js" "redis://localhost:6379"');
  }
} catch (error) {
  console.log('⚠️  Claude MCP 명령어를 실행할 수 없습니다.');
  console.log('Claude Code가 설치되었는지 확인하세요.');
}

// 3. Redis 서버 연결 테스트 (redis-cli 사용)
console.log('\n🔌 Redis 서버 연결 테스트...');
try {
  // redis-cli ping 명령어로 연결 테스트
  const pingResult = execSync('redis-cli ping', { encoding: 'utf8', stdio: 'pipe' }).trim();
  if (pingResult === 'PONG') {
    console.log('✅ Redis 서버 연결 성공 (localhost:6379)');
  } else {
    console.log('⚠️  Redis 서버 응답이 예상과 다름:', pingResult);
  }
} catch (error) {
  console.log('❌ Redis 서버에 연결할 수 없습니다.');
  console.log('Redis 서버를 시작하세요:');
  console.log('  • Docker: docker run -d -p 6379:6379 redis:alpine');
  console.log('  • Local: redis-server');
  console.log('  • Homebrew (macOS): brew services start redis');
}

// 4. 환경변수 확인
console.log('\n🌍 환경변수 확인...');
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Redis URL: ${redisUrl}`);

// 5. 네트워크 포트 확인
console.log('\n🌐 네트워크 포트 확인...');
try {
  // Windows에서는 netstat, Linux/macOS에서는 lsof 사용
  const isWindows = process.platform === 'win32';
  let command;
  
  if (isWindows) {
    command = 'netstat -an | findstr :6379';
  } else {
    command = 'lsof -i :6379 || netstat -an | grep :6379';
  }
  
  const portResult = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  if (portResult.trim()) {
    console.log('✅ Redis 포트 6379가 사용 중');
    console.log(portResult.trim());
  } else {
    console.log('⚠️  Redis 포트 6379가 사용되지 않음');
  }
} catch (error) {
  console.log('⚠️  포트 확인 중 오류 발생');
}

// 헬스 체크 요약
console.log('\n📊 헬스 체크 요약:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Redis MCP Server 패키지: 설치됨');
console.log('2. Claude MCP 등록: 확인 필요');
console.log('3. Redis 서버 연결: 확인 필요');
console.log('4. 포트 6379: 확인 필요');

console.log('\n💡 문제 해결 가이드:');
console.log('• Redis 서버 시작: docker run -d -p 6379:6379 redis:alpine');
console.log('• MCP 서버 추가: claude mcp add redis node "./node_modules/@gongrzhe/server-redis-mcp/dist/index.js" "redis://localhost:6379"');
console.log('• 테스트 실행: npm run redis:test');

console.log('\n✅ Redis MCP Server 헬스 체크 완료!');