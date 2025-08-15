// VM API 직접 테스트
const http = require('http');

const VM_HOST = '104.154.205.25';
const VM_PORT = 10000;
const API_TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';

function testAPI(path, needAuth = false) {
  const options = {
    hostname: VM_HOST,
    port: VM_PORT,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (needAuth) {
    options.headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n📍 ${path}:`);
        console.log(`상태 코드: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log('응답:', JSON.stringify(parsed, null, 2));
        } catch(e) {
          console.log('응답:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ ${path}: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 VM API 테스트 시작...\n');
  console.log(`서버: http://${VM_HOST}:${VM_PORT}`);
  console.log(`토큰: ${API_TOKEN.substring(0, 8)}...`);
  console.log('=' .repeat(50));

  // 인증 불필요
  await testAPI('/health');
  await testAPI('/api/health');
  await testAPI('/api/status');
  await testAPI('/api/metrics');
  
  // 인증 필요
  console.log('\n--- 인증이 필요한 엔드포인트 ---');
  await testAPI('/api/logs?lines=5', true);
  await testAPI('/api/pm2', true);
  await testAPI('/api/files?dir=/tmp', true);
  
  console.log('\n✅ 테스트 완료!');
}

runTests();