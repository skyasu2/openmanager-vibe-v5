#!/usr/bin/env node

const https = require('https');

async function testVercelAI() {
  console.log('��� Vercel AI 어시스턴트 테스트 시작...');

  try {
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        query: '현재 서버 상태를 분석해주세요.',
        mode: 'AUTO',
        includeServerData: true,
      });

      const req = https.request(
        {
          hostname: 'openmanager-vibe-v5.vercel.app',
          port: 443,
          path: '/api/ai/unified-query',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 15000,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode,
                data: JSON.parse(data),
              });
            } catch (e) {
              resolve({ status: res.statusCode, data: null, error: e.message });
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
      req.write(postData);
      req.end();
    });

    console.log('✅ Vercel AI 어시스턴트 응답:', response.status);
    if (response.data) {
      console.log('   - 응답 있음:', !!response.data.response);
      console.log('   - 처리 시간:', response.data.processingTime || 0, 'ms');
      console.log('   - 신뢰도:', response.data.confidence || 0);
    }
  } catch (error) {
    console.log('❌ Vercel AI 테스트 실패:', error.message);
  }
}

async function testMCPServer() {
  console.log('\n��� MCP 서버 테스트 시작...');

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'openmanager-vibe-v5.onrender.com',
          port: 443,
          path: '/health',
          method: 'GET',
          timeout: 10000,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              data: data,
            });
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
      req.end();
    });

    console.log('✅ MCP 서버 헬스체크 응답:', response.status);
    console.log('   - 응답 데이터:', response.data.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ MCP 서버 테스트 실패:', error.message);
  }
}

async function runTests() {
  console.log('��� Vercel & MCP 시스템 테스트 시작\n');

  await testVercelAI();
  await testMCPServer();

  console.log('\n��� 모든 테스트 완료!');
}

runTests();
