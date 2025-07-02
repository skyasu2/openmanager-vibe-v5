#!/usr/bin/env node

/**
 * 🧪 통합 AI 엔진 간단 테스트 스크립트
 */

const http = require('http');

const testQueries = [
  '서버 상태 확인',
  'CPU 사용률이 높은 이유',
  '메모리 부족 문제 해결',
];

async function testUnifiedAI(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: query,
      mode: 'AUTO',
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/unified-query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 15000,
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
            rawData: data,
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
  console.log('🧪 통합 AI 엔진 테스트 시작...\n');

  for (const query of testQueries) {
    console.log(`🔍 테스트 쿼리: "${query}"`);

    try {
      const startTime = Date.now();
      const response = await testUnifiedAI(query);
      const endTime = Date.now();

      console.log(`📊 응답 시간: ${endTime - startTime}ms`);
      console.log(`📋 상태 코드: ${response.statusCode}`);

      if (response.result) {
        console.log(`✅ 성공: ${response.result.success}`);
        console.log(`🎯 모드: ${response.result.mode || 'N/A'}`);
        console.log(
          `🔧 엔진 경로: ${response.result.enginePath ? response.result.enginePath.join(' → ') : 'N/A'}`
        );
        console.log(
          `📝 응답: ${response.result.response ? response.result.response.substring(0, 100) + '...' : 'N/A'}`
        );

        if (response.result.error) {
          console.log(`❌ 에러: ${response.result.error}`);
        }
      } else if (response.error) {
        console.log(`❌ 에러: ${response.error}`);
        console.log(
          `📄 원본 데이터: ${response.rawData ? response.rawData.substring(0, 200) + '...' : 'N/A'}`
        );
      }
    } catch (error) {
      console.log(`❌ 요청 실패: ${error.message}`);
    }

    console.log('─'.repeat(60));
  }

  console.log('\n🏁 테스트 완료!');
}

runTests().catch(console.error);
