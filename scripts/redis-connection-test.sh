#!/bin/bash

# 🔍 Redis 연결 테스트 스크립트
# OpenManager Vibe v5 - Redis 연결 정보 분석 및 직접 접속 테스트

echo "🚀 OpenManager Vibe v5 - Redis 연결 분석 시작"
echo "=================================================="

# 환경변수 로드 (프로젝트 루트에서 실행 가정)
if [ -f ".env.local" ]; then
    echo "📄 .env.local 파일에서 환경변수 로드 중..."
    export $(grep -v '^#' .env.local | xargs)
else
    echo "⚠️ .env.local 파일을 찾을 수 없습니다"
fi

echo ""
echo "🔍 Redis 연결 정보 분석"
echo "------------------------"

# Upstash Redis 정보 출력
if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
    echo "✅ Upstash Redis URL: $UPSTASH_REDIS_REST_URL"
    # URL에서 호스트 추출
    REDIS_HOST=$(echo $UPSTASH_REDIS_REST_URL | sed 's|https://||' | cut -d'/' -f1)
    echo "🌐 Redis 호스트: $REDIS_HOST"
else
    echo "❌ UPSTASH_REDIS_REST_URL 환경변수가 설정되지 않음"
fi

if [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
    # 토큰의 앞 10자리만 표시 (보안)
    TOKEN_PREVIEW=$(echo $UPSTASH_REDIS_REST_TOKEN | head -c 10)
    echo "🔐 Redis 토큰: ${TOKEN_PREVIEW}... (길이: ${#UPSTASH_REDIS_REST_TOKEN})"
else
    echo "❌ UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않음"
fi

echo ""
echo "🧪 Redis 연결 테스트"
echo "-------------------"

# Node.js 기반 연결 테스트
if command -v node &> /dev/null; then
    echo "💻 Node.js로 Redis 연결 테스트 중..."
    
    # 임시 Node.js 스크립트 생성
    cat << 'EOF' > /tmp/redis_test.js
const Redis = require('ioredis');

async function testRedisConnection() {
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'your_redis_host_here',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.UPSTASH_REDIS_REST_TOKEN,
        connectTimeout: 10000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        family: 4,
        tls: process.env.REDIS_TLS !== 'false' ? {} : undefined
    });

    try {
        console.log('🔗 Redis 연결 시도 중...');
        await redis.ping();
        console.log('✅ Redis 연결 성공!');
        
        // 기본 테스트
        await redis.set('test:connection', 'OpenManager Vibe v5 - ' + new Date().toISOString());
        const result = await redis.get('test:connection');
        console.log('📊 테스트 데이터:', result);
        
        // 정보 조회
        try {
            const info = await redis.info();
            console.log('ℹ️ Redis 서버 정보 (일부):');
            const lines = info.split('\n').slice(0, 10);
            lines.forEach(line => {
                if (line.trim()) console.log('   ', line);
            });
        } catch (e) {
            console.log('⚠️ Redis INFO 명령어 실행 불가 (권한 제한)');
        }
        
        redis.disconnect();
        
    } catch (error) {
        console.error('❌ Redis 연결 실패:', error.message);
        
        // Upstash REST API로 시도
        console.log('\n🔄 Upstash REST API로 재시도...');
        await testUpstashRestAPI();
    }
}

async function testUpstashRestAPI() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.log('❌ Upstash REST API 환경변수 누락');
        return;
    }
    
    try {
        const { Redis } = await import('@upstash/redis');
        
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        
        console.log('🔗 Upstash REST API 연결 시도 중...');
        const pong = await redis.ping();
        console.log('✅ Upstash REST API 연결 성공:', pong);
        
        // 기본 테스트
        await redis.set('test:rest', 'OpenManager Vibe v5 REST - ' + new Date().toISOString());
        const result = await redis.get('test:rest');
        console.log('📊 REST API 테스트 데이터:', result);
        
    } catch (error) {
        console.error('❌ Upstash REST API 연결 실패:', error.message);
    }
}

// 실행
testRedisConnection().catch(console.error);
EOF

    # Node.js 스크립트 실행
    node /tmp/redis_test.js
    rm -f /tmp/redis_test.js
    
else
    echo "❌ Node.js가 설치되지 않음"
fi

echo ""
echo "🔧 로컬 Redis 클라이언트 접속 방법"
echo "---------------------------------"

echo "1. redis-cli 직접 접속 (TLS 연결):"
echo "   redis-cli -h $REDIS_HOST -p 6379 -a '$UPSTASH_REDIS_REST_TOKEN' --tls"
echo ""

echo "2. Node.js ioredis 라이브러리 코드:"
cat << EOF
const Redis = require('ioredis');

const redis = new Redis({
    host: '$REDIS_HOST',
    port: 6379,
    password: '$UPSTASH_REDIS_REST_TOKEN',
    tls: {},
    family: 4
});

// 사용 예시
redis.ping().then(console.log);
EOF

echo ""
echo "3. Upstash REST API (브라우저/curl):"
echo "   URL: $UPSTASH_REDIS_REST_URL"
echo "   Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
echo ""
echo "   curl 예시:"
echo "   curl -X POST '$UPSTASH_REDIS_REST_URL/ping' \\"
echo "        -H 'Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN'"

echo ""
echo "🎯 권장 접속 방법"
echo "----------------"
echo "1. Node.js 환경: @upstash/redis 라이브러리 (REST API)"
echo "2. CLI 환경: redis-cli --tls 옵션 사용"
echo "3. 웹 환경: Upstash Console (https://console.upstash.com/)"

echo ""
echo "🔍 Redis 연결 분석 완료"
echo "======================="