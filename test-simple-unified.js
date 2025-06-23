#!/usr/bin/env node

/**
 * 🧪 간단한 통합 AI 엔드포인트 테스트
 */

const http = require('http');

const testQueries = [
  '서버 상태 확인',
  'CPU 사용률이 높은 이유',
  '메모리 부족 문제 해결',
];

async function testSimpleUnified(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: query,
      mode: 'AUTO',
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/unified-query-simple',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
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
            rawData: data.substring(0, 200),
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
  console.log('🧪 간단한 통합 AI 엔드포인트 테스트 시작...\n');

  for (const query of testQueries) {
    console.log(`🔍 테스트 쿼리: "${query}"`);

    try {
      const startTime = Date.now();
      const response = await testSimpleUnified(query);
      const endTime = Date.now();

      console.log(`📊 전체 응답 시간: ${endTime - startTime}ms`);
      console.log(`📋 HTTP 상태: ${response.statusCode}`);

      if (response.result) {
        console.log(`✅ 성공: ${response.result.success}`);
        console.log(`🎯 모드: ${response.result.mode || 'N/A'}`);
        console.log(
          `🔧 엔진 경로: ${response.result.enginePath ? response.result.enginePath.join(' → ') : 'N/A'}`
        );
        console.log(
          `⏱️ 처리 시간: ${response.result.processingTime || 'N/A'}ms`
        );
        console.log(
          `📝 응답: ${response.result.response ? response.result.response.substring(0, 100) + '...' : 'N/A'}`
        );

        if (response.result.error) {
          console.log(`❌ 에러: ${response.result.error}`);
        }
      } else if (response.error) {
        console.log(`❌ 에러: ${response.error}`);
        console.log(`📄 원본 데이터: ${response.rawData}`);
      }
    } catch (error) {
      console.log(`❌ 요청 실패: ${error.message}`);
    }

    console.log('─'.repeat(80));
  }

  console.log('\n🏁 간단한 통합 AI 테스트 완료!');
}

runTests().catch(console.error);
