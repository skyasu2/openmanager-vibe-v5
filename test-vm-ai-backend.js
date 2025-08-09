/**
 * GCP VM AI Backend 전체 테스트
 * 포트 10000과 10001 모두 테스트
 */

const testVMBackend = async () => {
  console.log('=' .repeat(60));
  console.log('🔍 GCP VM AI Backend 전체 테스트');
  console.log('=' .repeat(60));
  
  const vmIP = '104.154.205.25';
  const ports = [10000, 10001];
  
  // 테스트할 엔드포인트 목록 (더 많은 경우의 수)
  const endpoints = [
    '',                    // 루트
    '/health',            
    '/api',
    '/api/health',
    '/api/ai',
    '/api/ai/query',
    '/api/ai/session',
    '/api/ai/deep-analysis',
    '/api/ai/feedback',
    '/ai',
    '/ai/query',
    '/ai/process',
    '/query',
    '/process',
    '/analyze',
    '/chat',
    '/completion',
    '/v1/query',
    '/v1/completions',
    '/generate',
  ];
  
  const testRequest = {
    query: '서버 상태를 분석해줘',
    prompt: '서버 상태를 분석해줘',  // 다른 필드명 시도
    text: '서버 상태를 분석해줘',     // 다른 필드명 시도
    message: '서버 상태를 분석해줘',  // 다른 필드명 시도
    mode: 'natural-language',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    max_tokens: 500,
    maxTokens: 500,  // 다른 형식도 시도
  };
  
  console.log('\n📋 테스트 요청 데이터:');
  console.log(JSON.stringify(testRequest, null, 2));
  
  const allResults = [];
  
  for (const port of ports) {
    console.log('\n' + '='.repeat(40));
    console.log(`🌐 포트 ${port} 테스트`);
    console.log('='.repeat(40));
    
    for (const endpoint of endpoints) {
      const url = `http://${vmIP}:${port}${endpoint}`;
      console.log(`\n📍 ${endpoint || '/'}`);
      
      // GET 요청 시도
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000),
        });
        
        if (getResponse.ok) {
          const contentType = getResponse.headers.get('content-type');
          if (contentType && contentType.includes('json')) {
            const data = await getResponse.json();
            console.log(`   ✅ GET 성공: ${Object.keys(data).join(', ')}`);
            allResults.push({
              port,
              endpoint,
              method: 'GET',
              success: true,
              responseKeys: Object.keys(data),
            });
            
            // 메타데이터가 있으면 출력
            if (data.endpoints || data.routes || data.methods || data.apis) {
              console.log('   📚 API 정보 발견:');
              console.log(JSON.stringify(data, null, 4).substring(0, 500));
            }
          } else {
            const text = await getResponse.text();
            console.log(`   GET 응답: ${text.substring(0, 100)}`);
          }
        } else {
          console.log(`   GET ${getResponse.status}`);
        }
      } catch (error) {
        // GET 실패는 조용히 넘어감
      }
      
      // POST 요청 시도 (데이터 처리 엔드포인트)
      if (!endpoint.includes('health')) {
        try {
          const postResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(testRequest),
            signal: AbortSignal.timeout(5000),
          });
          
          if (postResponse.ok) {
            const contentType = postResponse.headers.get('content-type');
            if (contentType && contentType.includes('json')) {
              const data = await postResponse.json();
              console.log(`   ✅ POST 성공: ${Object.keys(data).join(', ')}`);
              
              // AI 응답 패턴 확인
              const aiFields = ['response', 'answer', 'result', 'text', 'completion', 'generated_text', 'output'];
              const hasAI = aiFields.some(field => data[field]);
              
              if (hasAI) {
                console.log('   🎯 AI 응답 감지!');
                const aiField = aiFields.find(field => data[field]);
                console.log(`   응답 필드: ${aiField}`);
                console.log(`   응답 내용: "${data[aiField].substring(0, 100)}..."`);
                
                allResults.push({
                  port,
                  endpoint,
                  method: 'POST',
                  success: true,
                  hasAI: true,
                  aiField,
                  responseKeys: Object.keys(data),
                });
              } else {
                allResults.push({
                  port,
                  endpoint,
                  method: 'POST',
                  success: true,
                  hasAI: false,
                  responseKeys: Object.keys(data),
                });
              }
            }
          } else {
            console.log(`   POST ${postResponse.status}`);
          }
        } catch (error) {
          // POST 실패도 조용히 넘어감
        }
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '=' .repeat(60));
  console.log('📊 전체 테스트 결과');
  console.log('=' .repeat(60));
  
  const successfulAPIs = allResults.filter(r => r.success);
  const aiAPIs = allResults.filter(r => r.hasAI);
  
  console.log(`\n✅ 응답한 엔드포인트: ${successfulAPIs.length}개`);
  successfulAPIs.forEach(r => {
    console.log(`   - ${r.port}${r.endpoint} [${r.method}]${r.hasAI ? ' 🎯 AI' : ''}`);
  });
  
  if (aiAPIs.length > 0) {
    console.log('\n🎯 발견된 AI 엔드포인트:');
    aiAPIs.forEach(api => {
      console.log(`   포트: ${api.port}`);
      console.log(`   경로: ${api.endpoint}`);
      console.log(`   메서드: ${api.method}`);
      console.log(`   응답 필드: ${api.aiField}`);
      console.log(`   ---`);
    });
    
    const bestAPI = aiAPIs[0];
    console.log('\n💡 SimplifiedQueryEngine.ts 수정 제안:');
    console.log(`const mcpUrl = 'http://104.154.205.25:${bestAPI.port}${bestAPI.endpoint}';`);
    console.log(`// Method: ${bestAPI.method}`);
    console.log(`// Response field: ${bestAPI.aiField}`);
  } else {
    console.log('\n⚠️ AI 엔드포인트를 찾지 못했습니다.');
    console.log('   VM에 AI 서버가 실행 중인지 확인이 필요합니다.');
  }
};

// 실행
testVMBackend().catch(console.error);