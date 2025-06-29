// OpenManager Vibe v5 - MCP 개발 테스트 스크립트
// 2025-01-28 15:15 KST

console.log('🚀 OpenManager Vibe v5 MCP 개발 테스트 시작');
console.log('=====================================');

async function testMCPEndpoints() {
  const baseURL = 'http://localhost:3000/api/mcp';

  try {
    // 1. MCP 서버 상태 확인
    console.log('📋 1. MCP 서버 상태 확인');
    const statusResponse = await fetch(baseURL);
    const statusData = await statusResponse.json();
    console.log('✅ 상태:', statusData);
    console.log('');

    // 2. 시스템 상태 조회
    console.log('🖥️ 2. 시스템 상태 조회');
    const systemResponse = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_system_status',
        params: { detailed: true },
      }),
    });
    const systemData = await systemResponse.json();
    console.log('✅ 시스템:', systemData);
    console.log('');

    // 3. AI 엔진 상태 조회
    console.log('🤖 3. AI 엔진 상태 조회');
    const aiResponse = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_ai_engines_status',
      }),
    });
    const aiData = await aiResponse.json();
    console.log('✅ AI 엔진:', aiData);
    console.log('');

    // 4. 서버 메트릭 조회
    console.log('📊 4. 서버 메트릭 조회');
    const metricsResponse = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_server_metrics',
        params: { serverId: 'dev-server' },
      }),
    });
    const metricsData = await metricsResponse.json();
    console.log('✅ 메트릭:', metricsData);
    console.log('');

    // 5. 로그 분석
    console.log('📝 5. 로그 분석');
    const logsResponse = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'analyze_logs',
        params: { level: 'error', limit: 5 },
      }),
    });
    const logsData = await logsResponse.json();
    console.log('✅ 로그 분석:', logsData);
    console.log('');

    console.log('🎉 MCP 개발 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 오류:', error.message);
  }
}

// 테스트 실행
testMCPEndpoints();
