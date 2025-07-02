/**
 * 🚀 Vercel 환경 AI 시스템 테스트
 * OpenManager Vibe v5 - 배포 환경 vs 로컬 환경 비교
 */

async function testVercelAISystem() {
  try {
    console.log('🚀 Vercel 환경 AI 시스템 테스트 시작...');

    const vercelUrl = 'https://openmanager-vibe-v5.vercel.app';
    const localUrl = 'http://localhost:3000';

    const testQueries = [
      '서버 상태 확인',
      'Transformers 엔진 테스트',
      'MCP 서버 연결 확인',
    ];

    console.log('\n📊 환경별 비교 테스트...\n');

    for (const query of testQueries) {
      console.log(`🔍 쿼리: "${query}"`);
      console.log('─'.repeat(60));

      // Vercel 환경 테스트
      console.log('🚀 Vercel 환경:');
      const vercelResult = await testAIEndpoint(vercelUrl, query);

      // 로컬 환경 테스트 (서버가 실행 중인 경우)
      console.log('💻 로컬 환경:');
      const localResult = await testAIEndpoint(localUrl, query);

      // 결과 비교
      console.log('📊 비교 결과:');
      console.log(
        `   응답 성공: Vercel(${vercelResult.success}) vs 로컬(${localResult.success})`
      );
      console.log(
        `   응답 시간: Vercel(${vercelResult.time}ms) vs 로컬(${localResult.time}ms)`
      );
      console.log(
        `   엔진 사용: Vercel(${vercelResult.engine}) vs 로컬(${localResult.engine})`
      );

      if (vercelResult.error || localResult.error) {
        console.log('⚠️ 오류 정보:');
        if (vercelResult.error) console.log(`   Vercel: ${vercelResult.error}`);
        if (localResult.error) console.log(`   로컬: ${localResult.error}`);
      }

      console.log('\n');

      // 요청 간 간격
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Transformers 엔진 전용 테스트
    console.log('🤖 Transformers 엔진 전용 테스트...');
    await testTransformersEngine(vercelUrl, localUrl);

    // MCP 서버 전용 테스트
    console.log('\n🔗 MCP 서버 전용 테스트...');
    await testMCPServer(vercelUrl, localUrl);
  } catch (error) {
    console.error('❌ 테스트 실행 실패:', error.message);
  }
}

async function testAIEndpoint(baseUrl, query) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/ai/unified-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        mode: 'AUTO',
        context: {
          source: 'vercel-test',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const endTime = Date.now();

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        time: endTime - startTime,
        engine: data.engineUsed || 'N/A',
        response: data.response,
        data: data,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        time: endTime - startTime,
        engine: 'N/A',
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}...`,
      };
    }
  } catch (error) {
    return {
      success: false,
      time: Date.now() - startTime,
      engine: 'N/A',
      error: error.message,
    };
  }
}

async function testTransformersEngine(vercelUrl, localUrl) {
  console.log('🔍 Transformers 엔진 초기화 상태 확인...');

  const transformersQuery = {
    query: 'ERROR: Critical system failure detected',
    mode: 'LOCAL', // LOCAL 모드로 강제하여 Transformers 사용
    context: {
      testType: 'transformers-classification',
      expectClassification: true,
    },
  };

  // Vercel 환경 Transformers 테스트
  console.log('🚀 Vercel Transformers:');
  const vercelTransformers = await testSpecificEndpoint(
    vercelUrl,
    '/api/ai/unified-query',
    transformersQuery
  );

  // 로컬 환경 Transformers 테스트
  console.log('💻 로컬 Transformers:');
  const localTransformers = await testSpecificEndpoint(
    localUrl,
    '/api/ai/unified-query',
    transformersQuery
  );

  // Transformers 엔진 직접 테스트
  console.log('\n🔬 Transformers 엔진 직접 호출 테스트:');

  // Vercel 환경
  const vercelDirect = await testSpecificEndpoint(
    vercelUrl,
    '/api/ai/transformers/classify',
    {
      text: 'System is running normally',
      options: { includeConfidence: true },
    }
  );

  // 로컬 환경
  const localDirect = await testSpecificEndpoint(
    localUrl,
    '/api/ai/transformers/classify',
    {
      text: 'System is running normally',
      options: { includeConfidence: true },
    }
  );

  console.log('📊 Transformers 결과:');
  console.log(`   Vercel 통합: ${vercelTransformers.success ? '✅' : '❌'}`);
  console.log(`   로컬 통합: ${localTransformers.success ? '✅' : '❌'}`);
  console.log(`   Vercel 직접: ${vercelDirect.success ? '✅' : '❌'}`);
  console.log(`   로컬 직접: ${localDirect.success ? '✅' : '❌'}`);
}

async function testMCPServer(vercelUrl, localUrl) {
  console.log('🔍 MCP 서버 연결 상태 확인...');

  const mcpQuery = {
    query: 'MCP 파일시스템 조회 테스트',
    mode: 'AUTO',
    context: {
      testType: 'mcp-filesystem',
      enableMCP: true,
    },
  };

  // MCP 서버 직접 연결 테스트
  const mcpServerUrl = 'https://openmanager-vibe-v5.onrender.com';

  console.log('🔗 MCP 서버 직접 연결 테스트:');
  const mcpDirect = await testMCPDirect(mcpServerUrl);

  // Vercel에서 MCP 연동 테스트
  console.log('🚀 Vercel → MCP 연동:');
  const vercelMCP = await testSpecificEndpoint(
    vercelUrl,
    '/api/ai/unified-query',
    mcpQuery
  );

  // 로컬에서 MCP 연동 테스트
  console.log('💻 로컬 → MCP 연동:');
  const localMCP = await testSpecificEndpoint(
    localUrl,
    '/api/ai/unified-query',
    mcpQuery
  );

  console.log('📊 MCP 서버 결과:');
  console.log(`   MCP 서버 직접: ${mcpDirect.success ? '✅' : '❌'}`);
  console.log(`   Vercel → MCP: ${vercelMCP.success ? '✅' : '❌'}`);
  console.log(`   로컬 → MCP: ${localMCP.success ? '✅' : '❌'}`);

  if (!mcpDirect.success) {
    console.log(`   ⚠️ MCP 서버 오류: ${mcpDirect.error}`);
  }
}

async function testSpecificEndpoint(baseUrl, endpoint, payload) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        `   ✅ 성공 (${response.status}): ${data.response?.substring(0, 50) || 'N/A'}...`
      );
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log(
        `   ❌ 실패 (${response.status}): ${errorText.substring(0, 100)}...`
      );
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`   ❌ 연결 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMCPDirect(mcpUrl) {
  try {
    // MCP 서버 헬스체크
    const healthResponse = await fetch(`${mcpUrl}/health`);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ MCP 서버 온라인: ${healthData.status || 'OK'}`);

      // MCP 도구 목록 조회
      const toolsResponse = await fetch(`${mcpUrl}/mcp/tools/list_directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '.' }),
      });

      if (toolsResponse.ok) {
        console.log(`   ✅ MCP 도구 응답 정상`);
        return { success: true };
      } else {
        console.log(`   ⚠️ MCP 도구 응답 실패 (${toolsResponse.status})`);
        return {
          success: false,
          error: `Tools API failed: ${toolsResponse.status}`,
        };
      }
    } else {
      console.log(`   ❌ MCP 서버 오프라인 (${healthResponse.status})`);
      return {
        success: false,
        error: `Server offline: ${healthResponse.status}`,
      };
    }
  } catch (error) {
    console.log(`   ❌ MCP 서버 연결 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Node.js 환경에서 fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testVercelAISystem();
