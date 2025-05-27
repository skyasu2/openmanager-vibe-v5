#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, method = 'GET') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

async function testRateLimiting() {
  console.log('🧪 Rate Limiting 시스템 테스트 시작\n');

  // 1. data-generator API 테스트 (1분에 10회 제한)
  console.log('📊 1. data-generator API 연속 호출 테스트...');
  for (let i = 1; i <= 12; i++) {
    const result = await makeRequest('/api/data-generator?type=metrics&count=3');
    console.log(`  ${i}. Status: ${result.status} | Remaining: ${result.headers['x-ratelimit-remaining'] || 'N/A'}`);
    
    if (result.status === 429) {
      console.log(`     ⏳ Rate Limited! Retry-After: ${result.headers['retry-after']}s`);
      console.log(`     📝 Message: ${result.data?.message}`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100)); // 0.1초 간격
  }

  console.log('\n📡 2. servers/next API 연속 호출 테스트...');
  for (let i = 1; i <= 22; i++) {
    const result = await makeRequest('/api/servers/next');
    console.log(`  ${i}. Status: ${result.status} | Remaining: ${result.headers['x-ratelimit-remaining'] || 'N/A'}`);
    
    if (result.status === 429) {
      console.log(`     ⏳ Rate Limited! Retry-After: ${result.headers['retry-after']}s`);
      console.log(`     📝 Message: ${result.data?.message}`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🚫 3. 존재하지 않는 API 테스트...');
  const nonExistentTests = [
    '/api/nonexistent',
    '/api/old-endpoint',
    '/api/servers/generate',
    '/api/data/metrics'
  ];

  for (const endpoint of nonExistentTests) {
    const result = await makeRequest(endpoint);
    console.log(`  ${endpoint}:`);
    console.log(`    Status: ${result.status}`);
    if (result.data?.suggestions) {
      console.log(`    Suggestions: ${result.data.suggestions.join(', ')}`);
    }
  }

  console.log('\n📈 4. 모니터링 API 테스트...');
  const monitoringResult = await makeRequest('/api/admin/monitoring?type=realtime');
  console.log(`  Status: ${monitoringResult.status}`);
  console.log(`  Rate Limit Headers: ${JSON.stringify({
    limit: monitoringResult.headers['x-ratelimit-limit'],
    remaining: monitoringResult.headers['x-ratelimit-remaining'],
    reset: monitoringResult.headers['x-ratelimit-reset']
  })}`);

  console.log('\n✅ Rate Limiting 테스트 완료!');
  
  console.log('\n💡 테스트 결과 요약:');
  console.log('  - data-generator: 1분에 10회 제한');
  console.log('  - servers/next: 1분에 20회 제한');
  console.log('  - monitoring: 1분에 30회 제한');
  console.log('  - 존재하지 않는 API: 친절한 오류 메시지와 제안');
  console.log('  - Rate Limit 헤더: X-RateLimit-* 제공');
}

async function testApiClient() {
  console.log('\n🔧 API Client 재시도 로직 테스트...');
  
  // API Client 시뮬레이션
  class TestApiClient {
    async requestWithRetry(endpoint, retries = 3) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const result = await makeRequest(endpoint);
        
        if (result.status === 429) {
          const retryAfter = parseInt(result.headers['retry-after'] || '1');
          console.log(`  Attempt ${attempt + 1}: Rate limited, waiting ${retryAfter}s...`);
          
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
        }
        
        return result;
      }
    }
  }

  const client = new TestApiClient();
  const result = await client.requestWithRetry('/api/data-generator');
  console.log(`  Final result: ${result.status}`);
}

// 메인 실행
async function main() {
  try {
    await testRateLimiting();
    await testApiClient();
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

if (require.main === module) {
  main();
} 