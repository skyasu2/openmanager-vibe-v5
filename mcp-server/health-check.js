// health-check.js - MCP 서버 건강 체크
import http from 'http';

const PORT = process.env.PORT || 3002;

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

console.log(`🔍 MCP 서버 건강 체크 시작 (포트: ${PORT})`);

const req = http.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.status === 'healthy' || response.status === 'ok') {
        console.log('✅ MCP 서버 건강 체크 통과');
        console.log(`📊 상태: ${response.status}`);
        console.log(`⏰ 업타임: ${response.uptime || 'N/A'}초`);
        process.exit(0);
      } else {
        console.log('❌ MCP 서버 건강 체크 실패');
        console.log('응답:', response);
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ 건강 체크 응답 파싱 오류:', error.message);
      console.log('응답 데이터:', data);
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.log('❌ 건강 체크 연결 오류:', error.message);
  console.log('💡 MCP 서버가 시작되지 않았을 수 있습니다.');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ 건강 체크 타임아웃 (5초)');
  req.destroy();
  process.exit(1);
});

req.end();
