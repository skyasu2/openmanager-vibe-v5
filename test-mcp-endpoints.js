/**
 * GCP VM MCP 서버 엔드포인트 탐색 스크립트
 * 가능한 여러 경로를 시도하여 올바른 엔드포인트를 찾습니다.
 */

const testEndpoints = async () => {
  console.log('=' .repeat(60));
  console.log('🔍 GCP VM MCP 서버 엔드포인트 탐색');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://104.154.205.25:10000';
  
  // 테스트할 엔드포인트 목록
  const endpoints = [
    '/health',           // 이미 확인됨 - 성공
    '/mcp/query',        // 이미 확인됨 - 404
    '/query',            // 시도 1
    '/api/query',        // 시도 2  
    '/ai/query',         // 시도 3
    '/mcp',              // 시도 4
    '/api/mcp',          // 시도 5
    '/api',              // 시도 6
    '/',                 // 시도 7 (루트)
    '/api/ai',           // 시도 8
    '/process',          // 시도 9
    '/api/process',      // 시도 10
  ];
  
  const testRequest = {
    query: '서버 상태 분석',
    mode: 'natural-language',
    context: {
      source: 'endpoint-test',
      timestamp: new Date().toISOString(),
    },
    options: {
      temperature: 0.7,
      maxTokens: 500,
    }
  };
  
  console.log('\n📋 테스트 요청 데이터:');
  console.log(JSON.stringify(testRequest, null, 2));
  console.log('\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`\n🔗 테스트: ${endpoint}`);
    console.log(`   URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: endpoint === '/health' || endpoint === '/' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: endpoint === '/health' || endpoint === '/' ? undefined : JSON.stringify(testRequest),
        signal: AbortSignal.timeout(5000),
      });
      
      const statusText = `${response.status} ${response.statusText}`;
      console.log(`   상태: ${statusText}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('   ✅ JSON 응답 수신');
          console.log(`   응답 키: ${Object.keys(data).join(', ')}`);
          
          // AI 응답처럼 보이는지 확인
          if (data.response || data.answer || data.result || data.text || data.message) {
            console.log('   🎯 AI 응답 가능성 높음!');
            results.push({
              endpoint,
              status: 'success',
              hasAIResponse: true,
              responseKeys: Object.keys(data),
            });
          } else {
            results.push({
              endpoint,
              status: 'success',
              hasAIResponse: false,
              responseKeys: Object.keys(data),
            });
          }
        } else {
          const text = await response.text();
          console.log(`   텍스트 응답: ${text.substring(0, 100)}...`);
          results.push({
            endpoint,
            status: 'success',
            hasAIResponse: false,
            responseType: 'text',
          });
        }
      } else {
        results.push({
          endpoint,
          status: 'failed',
          httpStatus: response.status,
        });
      }
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      results.push({
        endpoint,
        status: 'error',
        error: error.message,
      });
    }
  }
  
  // 결과 요약
  console.log('\n' + '=' .repeat(60));
  console.log('📊 탐색 결과 요약');
  console.log('=' .repeat(60));
  
  const successfulEndpoints = results.filter(r => r.status === 'success');
  const aiEndpoints = results.filter(r => r.hasAIResponse);
  
  console.log(`\n✅ 성공한 엔드포인트: ${successfulEndpoints.length}개`);
  successfulEndpoints.forEach(r => {
    console.log(`   - ${r.endpoint}: ${r.hasAIResponse ? '🎯 AI 응답' : '일반 응답'}`);
  });
  
  if (aiEndpoints.length > 0) {
    console.log('\n🎯 권장 엔드포인트:');
    console.log(`   ${aiEndpoints[0].endpoint}`);
    console.log('\n💡 SimplifiedQueryEngine.ts 수정 필요:');
    console.log(`   const mcpUrl = \`\${serverUrl}${aiEndpoints[0].endpoint}\`;`);
  } else {
    console.log('\n⚠️ AI 응답 엔드포인트를 찾지 못했습니다.');
    console.log('   GCP VM 서버 확인이 필요합니다.');
  }
  
  return results;
};

// 실행
testEndpoints().catch(console.error);