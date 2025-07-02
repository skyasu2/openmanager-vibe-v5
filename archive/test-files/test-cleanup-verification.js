#!/usr/bin/env node

/**
 * 🧪 중복 정리 후 시스템 검증 스크립트
 *
 * OpenManager Vibe v5 - Cleanup Verification Test
 * 삭제된 중복 파일들과 수정된 import들이 정상 동작하는지 확인
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 중복 정리 후 시스템 검증 시작...\n');

// 1. 삭제되어야 할 파일들이 실제로 삭제되었는지 확인
const deletedFiles = [
  'src/core/ai/services/GracefulDegradationManager.ts',
  'src/hooks/useRealtimeServers.ts',
  'src/services/ai/lightweight-ml-engine.ts',
  'src/lib/cache/redis.ts',
  'src/utils/utils.ts',
  'src/services/monitoring/AutoReportService.ts',
  'tests/unit/utils.test.ts',
];

console.log('📂 삭제된 파일 확인:');
let deletionSuccess = true;
deletedFiles.forEach(file => {
  const exists = fs.existsSync(file);
  if (exists) {
    console.log(`❌ ${file} - 여전히 존재함`);
    deletionSuccess = false;
  } else {
    console.log(`✅ ${file} - 정상 삭제됨`);
  }
});

// 2. 유지되어야 할 핵심 파일들이 존재하는지 확인
const coreFiles = [
  'src/core/ai/GracefulDegradationManager.ts',
  'src/hooks/api/useRealtimeServers.ts',
  'src/lib/ml/lightweight-ml-engine.ts',
  'src/lib/redis.ts',
  'src/lib/utils.ts',
  'src/services/ai/AutoReportService.ts',
];

console.log('\n📁 핵심 파일 존재 확인:');
let coreFilesSuccess = true;
coreFiles.forEach(file => {
  const exists = fs.existsSync(file);
  if (!exists) {
    console.log(`❌ ${file} - 누락됨`);
    coreFilesSuccess = false;
  } else {
    console.log(`✅ ${file} - 정상 존재`);
  }
});

// 3. 주요 API 라우트들이 존재하는지 확인
const apiRoutes = [
  'src/app/api/redis/stats/route.ts',
  'src/app/api/servers/route.ts',
  'src/app/api/monitoring/auto-report/route.ts',
  'src/app/api/system/unified/status/route.ts',
  'src/app/api/ai/status/route.ts',
];

console.log('\n🛣️ API 라우트 확인:');
let apiSuccess = true;
apiRoutes.forEach(route => {
  const exists = fs.existsSync(route);
  if (!exists) {
    console.log(`❌ ${route} - 누락됨`);
    apiSuccess = false;
  } else {
    console.log(`✅ ${route} - 정상 존재`);
  }
});

// 4. package.json 스크립트 확인
console.log('\n📦 Package.json 스크립트 확인:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'type-check', 'lint'];

  let scriptsSuccess = true;
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script} - 스크립트 존재`);
    } else {
      console.log(`❌ ${script} - 스크립트 누락`);
      scriptsSuccess = false;
    }
  });
} catch (error) {
  console.log(`❌ package.json 읽기 실패: ${error.message}`);
}

// 5. 수정된 파일들의 import 구문 검증
console.log('\n🔗 Import 구문 검증:');
const modifiedFiles = [
  'src/core/ai/components/AnalysisProcessor.ts',
  'src/services/ai/HybridMetricsBridge.ts',
  'src/services/data-collection/UnifiedDataBroker.ts',
  'src/app/api/monitoring/auto-report/route.ts',
];

let importSuccess = true;
modifiedFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // 잘못된 import 패턴 확인
    const badImports = [
      'from.*cache/redis',
      'from.*utils/utils',
      'from.*services/GracefulDegradationManager',
      'from.*hooks/useRealtimeServers',
    ];

    let hasBadImport = false;
    badImports.forEach(pattern => {
      const regex = new RegExp(pattern);
      if (regex.test(content)) {
        hasBadImport = true;
      }
    });

    if (hasBadImport) {
      console.log(`❌ ${file} - 잘못된 import 발견`);
      importSuccess = false;
    } else {
      console.log(`✅ ${file} - import 정상`);
    }
  } catch (error) {
    console.log(`❌ ${file} - 파일 읽기 실패`);
    importSuccess = false;
  }
});

// 6. 최종 결과 요약
console.log('\n🎯 검증 결과 요약:');
console.log('=====================================');
console.log(`📂 파일 삭제: ${deletionSuccess ? '✅ 성공' : '❌ 실패'}`);
console.log(`📁 핵심 파일: ${coreFilesSuccess ? '✅ 정상' : '❌ 문제'}`);
console.log(`🛣️ API 라우트: ${apiSuccess ? '✅ 정상' : '❌ 문제'}`);
console.log(`🔗 Import 구문: ${importSuccess ? '✅ 정상' : '❌ 문제'}`);

const overallSuccess =
  deletionSuccess && coreFilesSuccess && apiSuccess && importSuccess;
console.log(
  `\n🏆 전체 결과: ${overallSuccess ? '✅ 모든 검증 통과' : '❌ 일부 문제 발견'}`
);

if (overallSuccess) {
  console.log('\n🎉 중복 정리 작업이 성공적으로 완료되었습니다!');
  console.log(
    '💡 다음 단계: npm run dev로 서버를 시작하여 실제 동작을 확인하세요.'
  );
} else {
  console.log(
    '\n⚠️ 일부 문제가 발견되었습니다. 위의 오류를 확인하고 수정하세요.'
  );
}

// 7. 추가 권장사항
console.log('\n📋 테스트 권장사항:');
console.log('1. npm run type-check - TypeScript 컴파일 확인');
console.log('2. npm run build - Next.js 빌드 확인');
console.log('3. http://localhost:3002/api/redis/stats - Redis API 테스트');
console.log('4. http://localhost:3002/api/servers - 서버 API 테스트');
console.log('5. http://localhost:3002/dashboard - 대시보드 UI 테스트');

process.exit(overallSuccess ? 0 : 1);
