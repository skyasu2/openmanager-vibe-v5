#!/usr/bin/env node

/**
 * 🧪 Vercel API 엔드포인트 테스트 스크립트
 *
 * OpenManager Vibe v5의 주요 API들이 베르셀에서 정상 작동하는지 테스트합니다.
 */

const BYPASS_SECRET = 'ee2aGggamAVy7ti2iycFOXamwgjIhuhr';
const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

// 테스트할 API 엔드포인트들
const API_ENDPOINTS = [
  {
    name: 'Health Check',
    url: '/api/health',
    method: 'GET',
    expected: 'healthy',
  },
  {
    name: 'Server List',
    url: '/api/servers?limit=5',
    method: 'GET',
    expected: 'array',
  },
  {
    name: 'Realtime Summary',
    url: '/api/servers/realtime?type=summary',
    method: 'GET',
    expected: 'object',
  },
  {
    name: 'AI Status',
    url: '/api/ai/engines/status',
    method: 'GET',
    expected: 'object',
  },
  {
    name: 'System Status',
    url: '/api/status',
    method: 'GET',
    expected: 'object',
  },
  {
    name: 'Logs',
    url: '/api/logs?limit=3',
    method: 'GET',
    expected: 'array',
  },
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.url}`;
  console.log(`\n🔍 테스트: ${endpoint.name}`);
  console.log(`   📡 ${endpoint.method} ${endpoint.url}`);

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'x-vercel-protection-bypass': BYPASS_SECRET,
        'x-vercel-set-bypass-cookie': 'true',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-Test/1.0',
      },
    });

    console.log(`   📊 응답: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();

      // 응답 데이터 타입 확인
      let dataType = typeof data;
      if (Array.isArray(data)) dataType = 'array';

      console.log(`   ✅ 데이터 타입: ${dataType}`);

      // 간단한 데이터 미리보기
      if (dataType === 'array') {
        console.log(`   📋 배열 길이: ${data.length}`);
        if (data.length > 0) {
          console.log(
            `   🔍 첫 번째 항목 키: ${Object.keys(data[0]).slice(0, 3).join(', ')}`
          );
        }
      } else if (dataType === 'object') {
        const keys = Object.keys(data).slice(0, 5);
        console.log(`   🔍 주요 키: ${keys.join(', ')}`);
      }

      return { success: true, status: response.status, dataType };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ 오류 응답: ${errorText.substring(0, 100)}...`);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.log(`   💥 네트워크 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Vercel API 엔드포인트 테스트 시작');
  console.log(`🌐 베이스 URL: ${BASE_URL}`);
  console.log(`🔑 Bypass Secret: ${BYPASS_SECRET.substring(0, 8)}...`);

  const results = [];

  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });

    // 요청 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 결과 요약
  console.log('\n📊 테스트 결과 요약:');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ 성공: ${successful.length}/${results.length}`);
  console.log(`❌ 실패: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 성공한 API들:');
    successful.forEach(r => {
      console.log(`   ✅ ${r.name} (${r.status})`);
    });
  }

  if (failed.length > 0) {
    console.log('\n⚠️ 실패한 API들:');
    failed.forEach(r => {
      console.log(`   ❌ ${r.name} (${r.status || 'Network Error'})`);
    });
  }

  // 전체 시스템 상태 판정
  const healthScore = (successful.length / results.length) * 100;
  console.log(`\n🏥 시스템 건강도: ${healthScore.toFixed(1)}%`);

  if (healthScore >= 80) {
    console.log('🟢 시스템 상태: 양호');
  } else if (healthScore >= 60) {
    console.log('🟡 시스템 상태: 주의');
  } else {
    console.log('🔴 시스템 상태: 위험');
  }
}

// Node.js 환경에서만 실행
if (typeof window === 'undefined') {
  main().catch(console.error);
}

module.exports = { testEndpoint, API_ENDPOINTS };
