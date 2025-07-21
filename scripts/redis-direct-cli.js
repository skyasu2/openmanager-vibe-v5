#!/usr/bin/env node

/**
 * 🔧 Redis 직접 CLI 클라이언트
 * OpenManager Vibe v5 - Redis에 직접 접속하여 명령어 실행
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

// 환경변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('❌ Redis 환경변수가 설정되지 않았습니다');
  console.error('   UPSTASH_REDIS_REST_URL 및 UPSTASH_REDIS_REST_TOKEN 필요');
  process.exit(1);
}

console.log('🚀 OpenManager Vibe v5 - Redis 직접 CLI');
console.log('========================================');
console.log(`🔗 연결: ${redisUrl}`);
console.log('📝 사용 가능한 명령어: ping, get, set, del, keys, info, quit');
console.log('💡 예시: set mykey "hello world", get mykey, keys *');
console.log('');

// Redis 명령어 실행 함수
async function executeRedisCommand(command, ...args) {
  try {
    let url, method, body;

    switch (command.toLowerCase()) {
      case 'ping':
        url = `${redisUrl}/ping`;
        method = 'POST';
        break;

      case 'get':
        if (args.length !== 1) {
          throw new Error('GET 명령어 사용법: get <key>');
        }
        url = `${redisUrl}/get/${encodeURIComponent(args[0])}`;
        method = 'GET';
        break;

      case 'set':
        if (args.length !== 2) {
          throw new Error('SET 명령어 사용법: set <key> <value>');
        }
        url = `${redisUrl}/set/${encodeURIComponent(args[0])}`;
        method = 'POST';
        body = JSON.stringify({ value: args[1] });
        break;

      case 'del':
        if (args.length !== 1) {
          throw new Error('DEL 명령어 사용법: del <key>');
        }
        url = `${redisUrl}/del/${encodeURIComponent(args[0])}`;
        method = 'POST';
        break;

      case 'keys':
        const pattern = args[0] || '*';
        url = `${redisUrl}/keys/${encodeURIComponent(pattern)}`;
        method = 'GET';
        break;

      case 'incr':
        if (args.length !== 1) {
          throw new Error('INCR 명령어 사용법: incr <key>');
        }
        url = `${redisUrl}/incr/${encodeURIComponent(args[0])}`;
        method = 'POST';
        break;

      case 'exists':
        if (args.length !== 1) {
          throw new Error('EXISTS 명령어 사용법: exists <key>');
        }
        url = `${redisUrl}/exists/${encodeURIComponent(args[0])}`;
        method = 'GET';
        break;

      case 'expire':
        if (args.length !== 2) {
          throw new Error('EXPIRE 명령어 사용법: expire <key> <seconds>');
        }
        url = `${redisUrl}/expire/${encodeURIComponent(args[0])}`;
        method = 'POST';
        body = JSON.stringify({ seconds: parseInt(args[1]) });
        break;

      case 'ttl':
        if (args.length !== 1) {
          throw new Error('TTL 명령어 사용법: ttl <key>');
        }
        url = `${redisUrl}/ttl/${encodeURIComponent(args[0])}`;
        method = 'GET';
        break;

      case 'flushall':
        url = `${redisUrl}/flushall`;
        method = 'POST';
        break;

      default:
        throw new Error(`지원하지 않는 명령어: ${command}`);
    }

    const headers = {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    // 결과 포맷팅
    if (result.result !== undefined) {
      if (typeof result.result === 'string') {
        console.log(`"${result.result}"`);
      } else if (Array.isArray(result.result)) {
        if (result.result.length === 0) {
          console.log('(empty list or set)');
        } else {
          result.result.forEach((item, index) => {
            console.log(`${index + 1}) "${item}"`);
          });
        }
      } else {
        console.log(result.result);
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

// CLI 인터페이스
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'redis> ',
});

rl.prompt();

rl.on('line', async line => {
  const trimmed = line.trim();

  if (!trimmed) {
    rl.prompt();
    return;
  }

  if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
    console.log('👋 Redis CLI를 종료합니다');
    rl.close();
    return;
  }

  if (trimmed.toLowerCase() === 'help') {
    console.log('📚 사용 가능한 명령어:');
    console.log('   ping                    - 연결 테스트');
    console.log('   get <key>              - 값 조회');
    console.log('   set <key> <value>      - 값 저장');
    console.log('   del <key>              - 키 삭제');
    console.log('   keys <pattern>         - 키 목록 (예: keys *)');
    console.log('   incr <key>             - 숫자 증가');
    console.log('   exists <key>           - 키 존재 확인');
    console.log('   expire <key> <seconds> - 만료 시간 설정');
    console.log('   ttl <key>              - 남은 시간 확인');
    console.log('   flushall               - 모든 데이터 삭제 (주의!)');
    console.log('   help                   - 도움말');
    console.log('   quit, exit             - 종료');
    rl.prompt();
    return;
  }

  // 명령어 파싱 (간단한 방식)
  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const command = parts[0];
  const args = parts.slice(1).map(arg => {
    // 따옴표 제거
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1);
    }
    return arg;
  });

  await executeRedisCommand(command, ...args);
  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 안녕히 가세요!');
  process.exit(0);
});

// 초기 연결 테스트
console.log('🔗 Redis 연결 테스트 중...');
executeRedisCommand('ping')
  .then(() => {
    console.log('✅ Redis 연결 성공!');
    console.log('💬 명령어를 입력하세요 (help로 도움말 확인):');
    rl.prompt();
  })
  .catch(error => {
    console.error('❌ Redis 연결 실패:', error.message);
    process.exit(1);
  });
