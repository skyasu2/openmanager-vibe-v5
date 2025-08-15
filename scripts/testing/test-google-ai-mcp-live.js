/**
 * 🧪 Google AI + GCP VM MCP 실시간 통합 테스트
 * 
 * 이 스크립트는 실제 API를 호출하여 GCP VM MCP 통합을 검증합니다.
 */

// .env.local 파일 로드
require('dotenv').config({ path: '.env.local' });

const testQuery = async (query, mode = 'google-ai') => {
  const apiUrl = 'http://localhost:3000/api/ai/query';
  
  console.log(`\n📤 요청: "${query}" (모드: ${mode})`);
  console.log('   MCP 통합: ' + (process.env.ENABLE_GCP_MCP_INTEGRATION === 'true' ? '활성화' : '비활성화'));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        mode,
        context: {
          source: 'test-script',
          timestamp: new Date().toISOString(),
        },
        options: {
          includeThinking: true,
          temperature: 0.7,
          maxTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📥 응답 요약:');
    console.log('   성공:', data.success);
    console.log('   엔진:', data.engine);
    console.log('   응답 시간:', data.responseTime + 'ms');
    console.log('   답변 길이:', data.response?.length || 0, '자');
    
    // 사고 단계 확인
    if (data.thinkingSteps && data.thinkingSteps.length > 0) {
      console.log('\n🧠 사고 단계:');
      data.thinkingSteps.forEach((step, idx) => {
        console.log(`   ${idx + 1}. ${step.step}: ${step.status} (${step.duration || 0}ms)`);
      });
    }
    
    // MCP 사용 여부 확인
    const mcpUsed = data.thinkingSteps?.some(step => 
      step.step.includes('MCP') || step.description?.includes('MCP')
    );
    
    console.log('\n✨ MCP 서버 활용:', mcpUsed ? '✅ 사용됨' : '❌ 사용 안됨');
    
    if (data.response) {
      console.log('\n📝 AI 답변 (첫 200자):');
      console.log('   "' + data.response.substring(0, 200) + '..."');
    }
    
    return { success: true, mcpUsed, responseTime: data.responseTime };
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return { success: false, error: error.message };
  }
};

const runFullTest = async () => {
  console.log('=' .repeat(60));
  console.log('🚀 Google AI + GCP VM MCP 실시간 통합 테스트');
  console.log('=' .repeat(60));
  
  // 환경변수 상태 확인
  console.log('\n📋 환경변수 설정:');
  console.log('   ENABLE_GCP_MCP_INTEGRATION:', process.env.ENABLE_GCP_MCP_INTEGRATION || 'false');
  console.log('   GCP_VM_IP:', process.env.GCP_VM_IP || '미설정');
  console.log('   GCP_MCP_SERVER_PORT:', process.env.GCP_MCP_SERVER_PORT || '미설정');
  console.log('   GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ 설정됨' : '❌ 미설정');
  
  // 서버 실행 상태 확인
  console.log('\n🔍 서버 상태 확인...');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      console.log('   ✅ Next.js 서버 정상 동작 중');
    } else {
      console.log('   ⚠️ Next.js 서버 응답 이상:', healthResponse.status);
    }
  } catch (error) {
    console.error('   ❌ Next.js 서버가 실행되지 않음. npm run dev 실행 필요');
    return;
  }
  
  // 테스트 쿼리 목록
  const testQueries = [
    { query: '현재 서버 상태를 요약해줘', mode: 'google-ai' },
    { query: 'CPU 사용률이 높은 서버 분석', mode: 'google-ai' },
    { query: '서버 메모리 최적화 방안 제안해줘', mode: 'google-ai' },
  ];
  
  console.log('\n🧪 테스트 시작...\n');
  
  const results = [];
  for (const { query, mode } of testQueries) {
    const result = await testQuery(query, mode);
    results.push(result);
    console.log('-'.repeat(60));
  }
  
  // 최종 결과 요약
  console.log('\n' + '=' .repeat(60));
  console.log('📊 테스트 결과 요약:');
  console.log('=' .repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const mcpUsedCount = results.filter(r => r.mcpUsed).length;
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  
  console.log(`✅ 성공: ${successCount}/${results.length}`);
  console.log(`🌐 MCP 사용: ${mcpUsedCount}/${results.length}`);
  console.log(`⏱️ 평균 응답 시간: ${Math.round(avgResponseTime)}ms`);
  
  // 최종 판정
  console.log('\n🎯 최종 판정:');
  if (process.env.ENABLE_GCP_MCP_INTEGRATION === 'true') {
    if (mcpUsedCount > 0) {
      console.log('   ✅ GCP VM MCP 통합이 정상적으로 작동 중입니다!');
      console.log('   → Google AI 모드에서 MCP 서버를 활용하여 응답 품질을 향상시키고 있습니다.');
    } else {
      console.log('   ⚠️ MCP 통합은 활성화되었지만 실제 사용되지 않았습니다.');
      console.log('   → GCP VM MCP 서버 연결 상태를 확인하세요.');
    }
  } else {
    console.log('   ℹ️ GCP VM MCP 통합이 비활성화되어 있습니다.');
    console.log('   → Google AI 모드는 기본 Gemini API만 사용 중입니다.');
    console.log('   → 활성화하려면 ENABLE_GCP_MCP_INTEGRATION=true 설정 필요');
  }
  
  console.log('\n' + '=' .repeat(60));
};

// 실행
runFullTest().catch(console.error);