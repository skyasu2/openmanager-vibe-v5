#!/usr/bin/env node

/**
 * 🔍 Redis 연결 테스트 - OpenManager Vibe v5
 * 실제 Redis 연결 테스트 및 접속 정보 제공
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 환경변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

config({ path: join(projectRoot, '.env.local') });

console.log('🚀 OpenManager Vibe v5 - Redis 연결 분석');
console.log('===========================================');

// 1. 환경변수 확인
console.log('\n📋 Redis 연결 정보');
console.log('------------------');

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl) {
    const host = redisUrl.replace('https://', '').replace('http://', '');
    console.log('✅ Upstash Redis URL:', redisUrl);
    console.log('🌐 Redis 호스트:', host);
} else {
    console.log('❌ UPSTASH_REDIS_REST_URL 환경변수 없음');
}

if (redisToken) {
    const tokenPreview = redisToken.substring(0, 10) + '...';
    console.log('🔐 Redis 토큰:', tokenPreview, `(길이: ${redisToken.length})`);
} else {
    console.log('❌ UPSTASH_REDIS_REST_TOKEN 환경변수 없음');
}

// 2. Redis 연결 테스트 (fetch 기반 - 의존성 없음)
console.log('\n🧪 Redis 연결 테스트');
console.log('-------------------');

async function testRedisWithFetch() {
    if (!redisUrl || !redisToken) {
        console.log('❌ Redis 환경변수가 설정되지 않아 테스트를 건너뜁니다');
        return;
    }

    try {
        console.log('🔗 Upstash REST API로 연결 테스트 중...');
        
        // PING 요청
        const pingResponse = await fetch(`${redisUrl}/ping`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${redisToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (pingResponse.ok) {
            const pingResult = await pingResponse.json();
            console.log('✅ Redis PING 성공:', pingResult);
            
            // SET 테스트
            const testKey = 'test:connection:' + Date.now();
            const testValue = `OpenManager Vibe v5 - ${new Date().toISOString()}`;
            
            const setResponse = await fetch(`${redisUrl}/set/${testKey}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${redisToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value: testValue })
            });
            
            if (setResponse.ok) {
                console.log('✅ 데이터 저장 성공');
                
                // GET 테스트
                const getResponse = await fetch(`${redisUrl}/get/${testKey}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${redisToken}`
                    }
                });
                
                if (getResponse.ok) {
                    const getValue = await getResponse.json();
                    console.log('📊 저장된 데이터:', getValue.result);
                    
                    // 정리
                    await fetch(`${redisUrl}/del/${testKey}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${redisToken}`
                        }
                    });
                    console.log('🧹 테스트 데이터 정리 완료');
                }
            }
            
        } else {
            const errorText = await pingResponse.text();
            console.log('❌ Redis 연결 실패:', pingResponse.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Redis 테스트 중 오류:', error.message);
    }
}

// 3. 직접 접속 방법 안내
function showConnectionMethods() {
    console.log('\n🔧 Redis 직접 접속 방법');
    console.log('------------------------');
    
    if (!redisUrl || !redisToken) {
        console.log('❌ 연결 정보가 없어 접속 방법을 표시할 수 없습니다');
        return;
    }
    
    const host = redisUrl.replace('https://', '').replace('http://', '');
    
    console.log('1️⃣ redis-cli (TLS 연결):');
    console.log(`   redis-cli -h ${host} -p 6379 -a '${redisToken}' --tls`);
    console.log('');
    
    console.log('2️⃣ curl을 이용한 REST API:');
    console.log(`   # PING 테스트`);
    console.log(`   curl -X POST '${redisUrl}/ping' \\`);
    console.log(`        -H 'Authorization: Bearer ${redisToken}'`);
    console.log('');
    console.log(`   # 데이터 저장`);
    console.log(`   curl -X POST '${redisUrl}/set/mykey' \\`);
    console.log(`        -H 'Authorization: Bearer ${redisToken}' \\`);
    console.log(`        -H 'Content-Type: application/json' \\`);
    console.log(`        -d '{"value": "hello world"}'`);
    console.log('');
    console.log(`   # 데이터 조회`);
    console.log(`   curl -X GET '${redisUrl}/get/mykey' \\`);
    console.log(`        -H 'Authorization: Bearer ${redisToken}'`);
    console.log('');
    
    console.log('3️⃣ Node.js 코드 (ioredis):');
    console.log(`const Redis = require('ioredis');`);
    console.log('');
    console.log(`const redis = new Redis({`);
    console.log(`    host: '${host}',`);
    console.log(`    port: 6379,`);
    console.log(`    password: '${redisToken}',`);
    console.log(`    tls: {},`);
    console.log(`    family: 4`);
    console.log(`});`);
    console.log('');
    console.log(`redis.ping().then(console.log);`);
    console.log('');
    
    console.log('4️⃣ Node.js 코드 (@upstash/redis):');
    console.log(`import { Redis } from '@upstash/redis';`);
    console.log('');
    console.log(`const redis = new Redis({`);
    console.log(`    url: '${redisUrl}',`);
    console.log(`    token: '${redisToken}'`);
    console.log(`});`);
    console.log('');
    console.log(`await redis.ping();`);
    console.log('');
    
    console.log('5️⃣ 웹 콘솔:');
    console.log(`   Upstash Console: https://console.upstash.com/`);
    console.log(`   (브라우저에서 GUI로 Redis 관리 가능)`);
}

// 4. 프로젝트 내 Redis 사용 현황
function showProjectRedisUsage() {
    console.log('\n📂 프로젝트 내 Redis 사용 현황');
    console.log('-----------------------------');
    
    console.log('🔧 주요 Redis 관련 파일:');
    console.log('   - src/lib/redis.ts (스마트 하이브리드 Redis 클라이언트)');
    console.log('   - src/config/redis.config.ts (Redis 설정)');
    console.log('   - src/lib/config/runtime-env-decryptor.ts (환경변수 복호화)');
    console.log('   - src/services/RedisConnectionManager.ts (연결 관리)');
    console.log('');
    
    console.log('💡 프로젝트 특징:');
    console.log('   - 하이브리드 전략: Mock Redis ↔ Real Redis 자동 전환');
    console.log('   - Vercel 무료 티어 최적화');
    console.log('   - 런타임 환경변수 복호화 지원');
    console.log('   - ioredis + @upstash/redis 동시 지원');
    console.log('');
    
    console.log('🎯 Redis 사용 컨텍스트:');
    console.log('   - metrics-cache: 서버 메트릭 캐싱');
    console.log('   - realtime-cache: 실시간 데이터');
    console.log('   - keep-alive: 연결 유지');
    console.log('   - bulk-data: 대량 데이터 처리');
}

// 실행
async function main() {
    await testRedisWithFetch();
    showConnectionMethods();
    showProjectRedisUsage();
    
    console.log('\n🎉 Redis 연결 분석 완료');
    console.log('======================');
}

main().catch(console.error);