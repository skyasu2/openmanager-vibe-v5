#!/usr/bin/env node

/**
 * 🧪 개별 AI 컴포넌트 테스트 스크립트
 */

const http = require('http');

const testCases = [
  { query: '서버 상태 확인', engine: 'basic' },
  { query: '서버 상태 확인', engine: 'google' },
  { query: '서버 상태 확인', engine: 'rag' },
];

async function testSimpleQuery(query, engine) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: query,
      engine: engine,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/test-simple-query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 20000,
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            result: result,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            error: 'JSON 파싱 실패',
            rawData: data.substring(0, 300),
          });
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('요청 시간 초과'));
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 개별 AI 컴포넌트 테스트 시작...\n');

  for (const testCase of testCases) {
    console.log(`🔍 테스트: "${testCase.query}" (엔진: ${testCase.engine})`);

    try {
      const startTime = Date.now();
      const response = await testSimpleQuery(testCase.query, testCase.engine);
      const endTime = Date.now();

      console.log(`📊 전체 응답 시간: ${endTime - startTime}ms`);
      console.log(`📋 HTTP 상태: ${response.statusCode}`);

      if (response.result) {
        console.log(`✅ 성공: ${response.result.success}`);
        console.log(`🔧 엔진: ${response.result.engine}`);
        console.log(`⏱️ 처리 시간: ${response.result.processingTime}ms`);

        if (response.result.success) {
          console.log(
            `📝 응답: ${response.result.response.substring(0, 150)}...`
          );
          if (response.result.confidence) {
            console.log(`🎯 신뢰도: ${response.result.confidence}`);
          }
        } else {
          console.log(`❌ 에러: ${response.result.error || 'Unknown error'}`);
        }
      } else if (response.error) {
        console.log(`❌ 파싱 에러: ${response.error}`);
        console.log(`📄 원본: ${response.rawData}`);
      }
    } catch (error) {
      console.log(`❌ 요청 실패: ${error.message}`);
    }

    console.log('─'.repeat(80));
  }

  console.log('\n🏁 개별 컴포넌트 테스트 완료!');
}

runTests().catch(console.error);
