/**
 * 🧪 AI 엔진과 서버데이터 생성기 통합 테스트
 *
 * 테스트 항목:
 * 1. 서버데이터 생성기 데이터 확인
 * 2. AI 엔진 상태 확인
 * 3. Google AI 연동 테스트
 * 4. RAG 엔진 테스트
 * 5. 실제 질의응답 테스트
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const BYPASS_SECRET =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET || 'test-bypass-secret';

const headers = {
  'Content-Type': 'application/json',
  'x-vercel-protection-bypass': BYPASS_SECRET,
};

async function testServerDataGenerator() {
  console.log('\n🔍 1. 서버데이터 생성기 테스트...');

  try {
    const response = await fetch(
      `${BASE_URL}/api/servers/realtime?type=servers`,
      {
        headers,
      }
    );
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      console.log(
        `✅ 서버데이터 생성기 정상 작동: ${data.data.length}개 서버 데이터 생성됨`
      );

      // 서버 상태 분석
      const runningServers = data.data.filter(
        s => s.status === 'running'
      ).length;
      const errorServers = data.data.filter(s => s.status === 'error').length;
      const warningServers = data.data.filter(
        s => s.status === 'warning'
      ).length;

      console.log(`   - 정상 서버: ${runningServers}개`);
      console.log(`   - 오류 서버: ${errorServers}개`);
      console.log(`   - 경고 서버: ${warningServers}개`);

      return data.data;
    } else {
      console.log('❌ 서버데이터 생성기 오류');
      return null;
    }
  } catch (error) {
    console.log(`❌ 서버데이터 생성기 연결 실패: ${error.message}`);
    return null;
  }
}

async function testAIEngines() {
  console.log('\n🤖 2. AI 엔진 상태 테스트...');

  try {
    const response = await fetch(`${BASE_URL}/api/ai/engines/status`, {
      headers,
    });
    const data = await response.json();

    if (data.success) {
      console.log(
        `✅ AI 엔진 시스템 정상: ${data.data.metrics.activeEngines}/${data.data.metrics.totalEngines} 엔진 활성화`
      );

      data.data.engines.forEach(engine => {
        const status = engine.status === 'active' ? '✅' : '❌';
        console.log(
          `   ${status} ${engine.name}: ${engine.status} (${engine.responseTime}ms)`
        );
      });

      return data.data;
    } else {
      console.log('❌ AI 엔진 상태 확인 실패');
      return null;
    }
  } catch (error) {
    console.log(`❌ AI 엔진 연결 실패: ${error.message}`);
    return null;
  }
}

async function testGoogleAI() {
  console.log('\n🧠 3. Google AI 연동 테스트...');

  try {
    const response = await fetch(`${BASE_URL}/api/ai/google-ai/status`, {
      headers,
    });
    const data = await response.json();

    if (data.success && data.data.overall.isReady) {
      console.log('✅ Google AI 정상 연동됨');
      console.log(`   - API 키: ${data.data.apiKey.masked}`);
      console.log(`   - 모델: ${data.data.service.status.model}`);
      console.log(
        `   - 연결 테스트: ${data.data.service.connectionTest.success ? '성공' : '실패'} (${data.data.service.connectionTest.latency}ms)`
      );
      console.log(
        `   - 할당량: 일일 ${data.data.service.status.rateLimits.daily}개, 분당 ${data.data.service.status.rateLimits.rpm}개`
      );

      return true;
    } else {
      console.log('❌ Google AI 연동 실패');
      return false;
    }
  } catch (error) {
    console.log(`❌ Google AI 연결 실패: ${error.message}`);
    return false;
  }
}

async function testMCPSystem() {
  console.log('\n🔗 4. MCP 시스템 테스트...');

  try {
    const response = await fetch(`${BASE_URL}/api/system/mcp-status`, {
      headers,
    });
    const data = await response.json();

    if (data.status === 'operational') {
      console.log('✅ MCP 시스템 기본 작동 중');
      console.log(
        `   - 로컬 서버: ${Object.keys(data.mcp.servers.local).length}개`
      );
      console.log(
        `   - GCP 서버: ${data.mcp.servers.gcp.healthy ? '정상' : '오류'} (${data.mcp.servers.gcp.latency}ms)`
      );

      return true;
    } else {
      console.log('❌ MCP 시스템 오류');
      return false;
    }
  } catch (error) {
    console.log(`❌ MCP 시스템 연결 실패: ${error.message}`);
    return false;
  }
}

async function testAIQuery() {
  console.log('\n💬 5. 실제 AI 질의응답 테스트...');

  const testQueries = [
    '현재 서버 상태를 간단히 요약해주세요',
    '가장 성능이 좋은 서버는 어떤 것인가요?',
    '오류가 발생한 서버가 있나요?',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 질문: "${query}"`);

    try {
      // 간단한 GET 요청으로 테스트
      const response = await fetch(
        `${BASE_URL}/api/ai/smart-query?q=${encodeURIComponent(query)}`,
        {
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI 응답 성공');
        if (data.response) {
          console.log(`   응답: ${data.response.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ AI 응답 실패: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ AI 질의 실패: ${error.message}`);
    }
  }
}

async function runIntegrationTest() {
  console.log('🚀 OpenManager Vibe v5 - AI 엔진 통합 테스트 시작\n');
  console.log('='.repeat(60));

  const serverData = await testServerDataGenerator();
  const aiEngines = await testAIEngines();
  const googleAI = await testGoogleAI();
  const mcpSystem = await testMCPSystem();

  if (serverData && aiEngines && googleAI) {
    await testAIQuery();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 테스트 결과 요약:');
  console.log(`   서버데이터 생성기: ${serverData ? '✅ 정상' : '❌ 오류'}`);
  console.log(`   AI 엔진 시스템: ${aiEngines ? '✅ 정상' : '❌ 오류'}`);
  console.log(`   Google AI 연동: ${googleAI ? '✅ 정상' : '❌ 오류'}`);
  console.log(`   MCP 시스템: ${mcpSystem ? '✅ 기본작동' : '❌ 오류'}`);

  if (serverData && aiEngines && googleAI) {
    console.log(
      '\n🎉 AI 엔진이 서버데이터를 성공적으로 받아서 처리할 수 있습니다!'
    );
    console.log(
      '   브라우저에서 http://localhost:3000 접속하여 AI 사이드바를 테스트해보세요.'
    );
  } else {
    console.log('\n⚠️  일부 시스템에 문제가 있습니다. 로그를 확인해주세요.');
  }
}

// 테스트 실행
runIntegrationTest().catch(console.error);
