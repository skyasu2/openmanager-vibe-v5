#!/usr/bin/env node

/**
 * 베르셀 MCP 서버 및 AI 엔진 테스트 스크립트
 * OpenManager Vibe v5 - 2가지 모드 테스트
 */

const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

// 색상 출력 함수
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, message) =>
  console.log(`${colors[color]}${message}${colors.reset}`);

// HTTP 요청 함수
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 1. MCP 서버 상태 테스트
async function testMCPStatus() {
  log('cyan', '\n🔍 1. MCP 서버 상태 테스트');

  const result = await makeRequest(`${BASE_URL}/api/mcp/status`);

  if (result.success) {
    log('green', '✅ MCP 서버 연결 성공');
    console.log('📊 서버 정보:', {
      상태: result.data.data.server.status,
      버전: result.data.data.server.version,
      가동시간: `${result.data.data.server.uptime}초`,
      환경: result.data.data.server.environment,
    });
    console.log('🛠️ 사용 가능한 도구:', result.data.data.tools.available);
  } else {
    log('red', '❌ MCP 서버 연결 실패:', result.error);
  }
}

// 2. AI 엔진 상태 테스트
async function testAIEngines() {
  log('cyan', '\n🤖 2. AI 엔진 상태 테스트');

  const result = await makeRequest(`${BASE_URL}/api/ai/engines/status`);

  if (result.success) {
    log('green', '✅ AI 엔진 상태 조회 성공');
    console.log('📈 총 엔진 수:', result.data.data.metrics.totalEngines);
    console.log('⚡ 활성 엔진 수:', result.data.data.metrics.activeEngines);

    result.data.data.engines.forEach(engine => {
      const statusIcon = engine.status === 'active' ? '🟢' : '🔴';
      console.log(
        `${statusIcon} ${engine.name}: ${engine.status} (${engine.description})`
      );
    });
  } else {
    log('red', '❌ AI 엔진 상태 조회 실패:', result.error);
  }
}

// 3. LOCAL 모드 테스트
async function testLocalMode() {
  log('cyan', '\n⚡ 3. LOCAL 모드 테스트 (디폴트 모드)');

  const queries = [
    '현재 시스템 상태는 어떤가요?',
    '서버 메모리 사용량을 분석해주세요',
    'CPU 사용률이 높은 이유는 무엇인가요?',
    '네트워크 트래픽 상태를 확인해주세요',
  ];

  for (const query of queries) {
    log('yellow', `\n📝 질의: "${query}"`);

    const result = await makeRequest(`${BASE_URL}/api/ai/unified-query`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        mode: 'LOCAL',
      }),
    });

    if (result.success) {
      log('green', '✅ LOCAL 모드 응답 성공');
      console.log('💬 응답:', result.data.response.message);
      console.log(
        '🎯 신뢰도:',
        `${(result.data.confidence * 100).toFixed(1)}%`
      );
      console.log('⏱️ 처리시간:', `${result.data.processingTime}ms`);
      console.log('🔧 사용된 엔진:', result.data.engine);
      console.log('📊 메타데이터:', {
        RAG사용: result.data.metadata.ragUsed,
        GoogleAI사용: result.data.metadata.googleAIUsed,
        MCP컨텍스트사용: result.data.metadata.mcpContextUsed,
        캐시사용: result.data.metadata.cacheUsed,
      });
    } else {
      log('red', '❌ LOCAL 모드 응답 실패:', result.error);
    }
  }
}

// 4. AUTO 모드 테스트
async function testAutoMode() {
  log('cyan', '\n🤖 4. AUTO 모드 테스트 (스마트 AI 모드)');

  const queries = [
    '시스템의 전반적인 성능을 분석해주세요',
    '장애 예측과 대응 방안을 제시해주세요',
    '서버 최적화 방안을 추천해주세요',
    '보안 취약점을 분석해주세요',
  ];

  for (const query of queries) {
    log('yellow', `\n📝 질의: "${query}"`);

    const result = await makeRequest(`${BASE_URL}/api/ai/unified-query`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        mode: 'AUTO',
      }),
    });

    if (result.success) {
      log('green', '✅ AUTO 모드 응답 성공');
      console.log('💬 응답:', result.data.response.message);
      console.log(
        '🎯 신뢰도:',
        `${(result.data.confidence * 100).toFixed(1)}%`
      );
      console.log('⏱️ 처리시간:', `${result.data.processingTime}ms`);
      console.log('🔧 사용된 엔진:', result.data.engine);
      console.log('🛤️ 엔진 경로:', result.data.enginePath);
      console.log('🔄 폴백 사용:', result.data.fallbacksUsed);
    } else {
      log('red', '❌ AUTO 모드 응답 실패:', result.error);
    }
  }
}

// 5. 성능 비교 테스트
async function testPerformanceComparison() {
  log('cyan', '\n📊 5. 성능 비교 테스트 (LOCAL vs AUTO)');

  const testQuery = '현재 시스템의 종합적인 상태를 분석해주세요';

  // LOCAL 모드 테스트
  log('yellow', '\n⚡ LOCAL 모드 성능 측정');
  const localStart = Date.now();
  const localResult = await makeRequest(`${BASE_URL}/api/ai/unified-query`, {
    method: 'POST',
    body: JSON.stringify({
      query: testQuery,
      mode: 'LOCAL',
    }),
  });
  const localTime = Date.now() - localStart;

  // AUTO 모드 테스트
  log('yellow', '\n🤖 AUTO 모드 성능 측정');
  const autoStart = Date.now();
  const autoResult = await makeRequest(`${BASE_URL}/api/ai/unified-query`, {
    method: 'POST',
    body: JSON.stringify({
      query: testQuery,
      mode: 'AUTO',
    }),
  });
  const autoTime = Date.now() - autoStart;

  // 결과 비교
  log('magenta', '\n📈 성능 비교 결과:');
  console.log('⚡ LOCAL 모드:');
  console.log(`  - 총 응답시간: ${localTime}ms`);
  console.log(
    `  - 처리시간: ${localResult.success ? localResult.data.processingTime : 'N/A'}ms`
  );
  console.log(
    `  - 신뢰도: ${localResult.success ? (localResult.data.confidence * 100).toFixed(1) : 'N/A'}%`
  );

  console.log('🤖 AUTO 모드:');
  console.log(`  - 총 응답시간: ${autoTime}ms`);
  console.log(
    `  - 처리시간: ${autoResult.success ? autoResult.data.processingTime : 'N/A'}ms`
  );
  console.log(
    `  - 신뢰도: ${autoResult.success ? (autoResult.data.confidence * 100).toFixed(1) : 'N/A'}%`
  );

  if (localResult.success && autoResult.success) {
    const speedDiff = (((autoTime - localTime) / localTime) * 100).toFixed(1);
    log(
      'blue',
      `\n⚡ 속도 차이: AUTO 모드가 LOCAL 모드보다 ${speedDiff}% ${speedDiff > 0 ? '느림' : '빠름'}`
    );
  }
}

// 6. MCP 도구 테스트
async function testMCPTools() {
  log('cyan', '\n🛠️ 6. MCP 도구 테스트');

  const result = await makeRequest(`${BASE_URL}/api/mcp/query`, {
    method: 'POST',
    body: JSON.stringify({
      tool: 'get_system_status',
      params: {},
    }),
  });

  if (result.success) {
    log('green', '✅ MCP 도구 호출 성공');
    console.log('📊 시스템 상태:', result.data);
  } else {
    log('red', '❌ MCP 도구 호출 실패:', result.error);
  }
}

// 메인 테스트 실행
async function runAllTests() {
  log('magenta', '🚀 베르셀 MCP 서버 및 AI 엔진 종합 테스트 시작');
  log('blue', `📍 테스트 대상: ${BASE_URL}`);
  log('blue', '🎯 목표: 2가지 모드 (LOCAL/AUTO) 기능 검증');

  try {
    await testMCPStatus();
    await testAIEngines();
    await testLocalMode();
    await testAutoMode();
    await testPerformanceComparison();
    await testMCPTools();

    log('green', '\n🎉 모든 테스트 완료!');
    log('blue', '\n📋 테스트 요약:');
    log('blue', '✅ MCP 서버 연결 및 상태 확인');
    log('blue', '✅ AI 엔진 상태 및 가용성 확인');
    log('blue', '✅ LOCAL 모드 (디폴트) 기능 검증');
    log('blue', '✅ AUTO 모드 (스마트 AI) 기능 검증');
    log('blue', '✅ 두 모드 간 성능 비교');
    log('blue', '✅ MCP 도구 기능 검증');
  } catch (error) {
    log('red', '❌ 테스트 실행 중 오류 발생:', error.message);
  }
}

// Node.js 환경에서 fetch API 사용을 위한 polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 테스트 실행
runAllTests();
