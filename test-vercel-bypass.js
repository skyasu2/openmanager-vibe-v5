#!/usr/bin/env node

/**
 * 🔓 Vercel Protection Bypass 테스트 스크립트
 *
 * 이 스크립트는 Vercel에 배포된 OpenManager Vibe v5에
 * 인증 없이 접근할 수 있는지 테스트합니다.
 */

const BYPASS_SECRET = 'ee2aGggamAVy7ti2iycFOXamwgjIhuhr';

// 테스트할 URL들
const TEST_URLS = [
  'https://openmanager-vibe-v5.vercel.app/api/health',
  'https://openmanager-vibe-v5-1ydwc6pr6-skyasus-projects.vercel.app/api/health',
  'https://openmanager-vibe-v5-p6x15zlp7-skyasus-projects.vercel.app/api/health',
];

async function testBypass(url) {
  console.log(`\n🔍 테스트 중: ${url}`);

  try {
    // 1. 일반 요청 (인증 없음)
    console.log('  📡 일반 요청...');
    const normalResponse = await fetch(url);
    console.log(
      `  ❌ 일반 요청: ${normalResponse.status} ${normalResponse.statusText}`
    );

    // 2. Bypass 헤더 포함 요청
    console.log('  🔓 Bypass 헤더 포함 요청...');
    const bypassResponse = await fetch(url, {
      headers: {
        'x-vercel-protection-bypass': BYPASS_SECRET,
        'x-vercel-set-bypass-cookie': 'true',
        'User-Agent': 'OpenManager-Test/1.0',
      },
    });

    console.log(
      `  ✅ Bypass 요청: ${bypassResponse.status} ${bypassResponse.statusText}`
    );

    if (bypassResponse.ok) {
      const data = await bypassResponse.json();
      console.log('  📊 응답 데이터:', {
        status: data.status,
        version: data.version,
        environment: data.environment,
        uptime: `${Math.round(data.uptime)}초`,
        memory: `${data.memory?.used}MB / ${data.memory?.total}MB`,
      });
      return true;
    }
  } catch (error) {
    console.log(`  ❌ 오류: ${error.message}`);
  }

  return false;
}

async function main() {
  console.log('🚀 Vercel Protection Bypass 테스트 시작\n');
  console.log(
    `🔑 사용 중인 Bypass Secret: ${BYPASS_SECRET.substring(0, 8)}...`
  );

  let successCount = 0;

  for (const url of TEST_URLS) {
    const success = await testBypass(url);
    if (success) successCount++;

    // 요청 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 테스트 결과: ${successCount}/${TEST_URLS.length} 성공`);

  if (successCount > 0) {
    console.log('✅ Vercel Protection Bypass가 정상 작동합니다!');
    console.log('\n🎯 사용 방법:');
    console.log('```javascript');
    console.log(`fetch('https://openmanager-vibe-v5.vercel.app/api/health', {`);
    console.log('  headers: {');
    console.log(`    'x-vercel-protection-bypass': '${BYPASS_SECRET}',`);
    console.log(`    'x-vercel-set-bypass-cookie': 'true'`);
    console.log('  }');
    console.log('});');
    console.log('```');
  } else {
    console.log('❌ Vercel Protection Bypass가 작동하지 않습니다.');
    console.log('   - Vercel 환경변수 설정을 확인하세요.');
    console.log('   - 새로운 배포가 완료되었는지 확인하세요.');
  }
}

// Node.js 환경에서만 실행
if (typeof window === 'undefined') {
  main().catch(console.error);
}

module.exports = { testBypass, BYPASS_SECRET };
