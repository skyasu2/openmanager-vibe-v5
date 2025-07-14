#!/usr/bin/env node

/**
 * Upstash Redis 연결 테스트 스크립트
 */

import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

console.log('🔧 Upstash Redis 연결 테스트 시작...\n');

// 환경 변수 확인
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('📋 환경 변수 확인:');
console.log(`UPSTASH_REDIS_REST_URL: ${url ? '✅ 설정됨' : '❌ 누락'}`);
console.log(`UPSTASH_REDIS_REST_TOKEN: ${token ? '✅ 설정됨' : '❌ 누락'}`);

if (!url || !token) {
  console.error('\n❌ 환경 변수가 설정되지 않았습니다.');
  console.log('.env.local 파일을 확인하세요.');
  process.exit(1);
}

// Upstash Redis REST API 테스트
console.log('\n🔌 Upstash Redis 연결 테스트...');

async function testConnection() {
  try {
    // PING 명령어로 연결 테스트
    const response = await fetch(`${url}/ping`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upstash Redis 연결 성공!');
      console.log(`응답: ${JSON.stringify(result)}`);
      
      // SET/GET 테스트
      console.log('\n📝 SET/GET 테스트...');
      
      // SET 테스트
      const setResponse = await fetch(`${url}/set/test_key/test_value`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (setResponse.ok) {
        console.log('✅ SET 명령어 성공');
        
        // GET 테스트
        const getResponse = await fetch(`${url}/get/test_key`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (getResponse.ok) {
          const getValue = await getResponse.json();
          console.log(`✅ GET 명령어 성공: ${JSON.stringify(getValue)}`);
          
          // 정리: 테스트 키 삭제
          await fetch(`${url}/del/test_key`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('✅ 테스트 키 삭제 완료');
        }
      }
      
    } else {
      console.error('❌ Upstash Redis 연결 실패');
      console.error(`상태 코드: ${response.status}`);
      console.error(`응답: ${await response.text()}`);
    }
  } catch (error) {
    console.error('❌ 연결 중 오류 발생:', error.message);
  }
}

// 테스트 실행
await testConnection();

console.log('\n📊 테스트 요약:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. 환경 변수: ✅ 설정됨');
console.log('2. Upstash Redis 연결: 위 결과 참조');
console.log('3. MCP 설정 경로: 수정 완료');

console.log('\n💡 다음 단계:');
console.log('1. Claude Code 재시작 (MCP 설정 반영)');
console.log('2. Redis MCP가 "running" 상태인지 확인');
console.log('3. Claude에서 Redis 도구 사용 가능');

console.log('\n✅ Upstash Redis 테스트 완료!');