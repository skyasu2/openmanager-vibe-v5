#!/usr/bin/env node

/**
 * AI 자연어 질의 간단 테스트 스크립트
 * 빠른 테스트를 위한 간소화 버전
 */

const https = require('https');

// 서버 설정
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// HTTP 요청 함수
function testQuery(mode, query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query,
      mode,
      temperature: 0.7,
      maxTokens: 1000,
      context: 'general',
      includeThinking: false,
      timeoutMs: 450
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-AI-Mode': mode
      },
      rejectUnauthorized: false
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const result = JSON.parse(responseData);
          resolve({
            ...result,
            actualResponseTime: responseTime,
            statusCode: res.statusCode
          });
        } catch (e) {
          reject(new Error(`JSON 파싱 실패: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 메인 실행
async function main() {
  const query = process.argv[2] || "현재 서버 상태를 확인해줘";
  const mode = process.argv[3] || "local-ai";
  
  console.log('🚀 AI 자연어 질의 테스트\n');
  console.log('=' .repeat(60));
  console.log(`📝 질의: "${query}"`);
  console.log(`🔧 모드: ${mode}`);
  console.log('=' .repeat(60));
  
  try {
    console.log('\n⏳ 요청 전송 중...\n');
    const result = await testQuery(mode, query);
    
    if (result.success) {
      console.log('✅ 성공!\n');
      console.log('📊 메타데이터:');
      console.log(`   - 엔진: ${result.engine}`);
      console.log(`   - 응답 시간: ${result.responseTime || result.actualResponseTime}ms`);
      console.log(`   - 신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   - 캐시 히트: ${result.metadata?.cacheHit ? '예' : '아니오'}`);
      
      console.log('\n💬 응답:');
      console.log('-'.repeat(60));
      console.log(result.response);
      console.log('-'.repeat(60));
      
      if (result.metadata?.thinkingSteps && result.metadata.thinkingSteps.length > 0) {
        console.log('\n🤔 사고 과정:');
        result.metadata.thinkingSteps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step}`);
        });
      }
      
      if (result.metadata?.complexity) {
        console.log('\n📐 복잡도 분석:');
        console.log(`   - 점수: ${result.metadata.complexity.score}/10`);
        console.log(`   - 수준: ${result.metadata.complexity.level}`);
        console.log(`   - 권장: ${result.metadata.complexity.recommendation}`);
      }
    } else {
      console.log('❌ 실패!');
      console.log(`에러: ${result.error || '알 수 없는 오류'}`);
    }
  } catch (error) {
    console.error('❌ 요청 실패:', error.message);
    process.exit(1);
  }
  
  console.log('\n✨ 테스트 완료!\n');
}

// 사용법 출력
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
사용법: node test-ai-simple.js [질의] [모드]

매개변수:
  질의: AI에게 보낼 자연어 질의 (기본: "현재 서버 상태를 확인해줘")
  모드: local-ai 또는 google-ai (기본: local-ai)

예시:
  node test-ai-simple.js
  node test-ai-simple.js "CPU 사용률이 높은 서버는?"
  node test-ai-simple.js "서버 최적화 방법" google-ai
  `);
  process.exit(0);
}

// 스크립트 실행
main();