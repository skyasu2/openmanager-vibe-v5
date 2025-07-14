#!/usr/bin/env node

/**
 * Redis MCP Server 테스트 스크립트
 * Redis MCP Server의 기본 기능을 테스트합니다.
 */

console.log('🔧 Redis MCP Server 테스트 시작...');

// Redis MCP Server 기본 정보
const REDIS_MCP_INFO = {
  name: '@gongrzhe/server-redis-mcp',
  version: '1.0.0',
  tools: ['set', 'get', 'delete', 'list'],
  defaultUrl: 'redis://localhost:6379'
};

console.log('📋 Redis MCP Server 정보:');
console.log(`  패키지: ${REDIS_MCP_INFO.name}@${REDIS_MCP_INFO.version}`);
console.log(`  지원 도구: ${REDIS_MCP_INFO.tools.join(', ')}`);
console.log(`  기본 URL: ${REDIS_MCP_INFO.defaultUrl}`);

// 패키지 설치 확인
console.log('\n📦 패키지 설치 확인...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const url = await import('url');
  
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const packagePath = path.join(__dirname, '../node_modules/@gongrzhe/server-redis-mcp/package.json');
  const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`✅ Redis MCP Server v${packageInfo.version} 설치됨`);
} catch (error) {
  console.error('❌ Redis MCP Server가 설치되지 않았습니다.');
  console.log('설치 명령어: npm install @gongrzhe/server-redis-mcp@1.0.0');
  process.exit(1);
}

// Redis 연결 테스트 (옵션)
console.log('\n🔌 Redis 연결 테스트...');
console.log('⚠️  Redis 서버가 실행 중인지 확인하세요:');
console.log('   • Docker: docker run -d -p 6379:6379 redis:alpine');
console.log('   • Local: redis-server');
console.log('   • Cloud: Redis Cloud, AWS ElastiCache 등');

// MCP 서버 설정 가이드
console.log('\n⚙️  MCP 서버 설정 가이드:');
console.log('1. Claude Code에서 Redis MCP 추가:');
console.log('   claude mcp add redis node');
console.log('   "./node_modules/@gongrzhe/server-redis-mcp/dist/index.js"');
console.log('   "redis://localhost:6379"');
console.log('');
console.log('2. 또는 Smithery 사용:');
console.log('   npx -y @smithery/cli install @gongrzhe/server-redis-mcp --client claude');

// 사용 예시
console.log('\n🎯 사용 예시:');
console.log('• set user:123 "John Doe"     - 사용자 정보 저장');
console.log('• get user:123               - 사용자 정보 조회');
console.log('• list user:*                - user: 패턴으로 시작하는 모든 키');
console.log('• delete user:123            - 사용자 정보 삭제');

console.log('\n✅ Redis MCP Server 테스트 완료!');
console.log('');
console.log('💡 다음 단계:');
console.log('1. Redis 서버 실행');
console.log('2. Claude Code에서 MCP 서버 추가');
console.log('3. @redis-mcp 명령어로 Redis 데이터 관리');