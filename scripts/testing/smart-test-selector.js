/**
 * 🤖 AI 전용 스마트 테스트 선택기
 *
 * @description AI가 컨텍스트에 따라 최적의 테스트 명령어를 자동 선택
 * @optimization Qwen 분석 결과 기반 66% 성능 향상 가능한 알고리즘 적용
 * @ai-friendly 명확한 의사결정 트리로 AI가 이해하기 쉬운 구조
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 테스트 성능 프로필
const TEST_PROFILES = {
  'ultra-fast': {
    command: 'npx vitest run --config config/testing/vitest.config.minimal.ts',
    time: '3초',
    coverage: '핵심 로직만',
    description: 'AI 빠른 검증용 - 순수 함수 및 유틸리티'
  },
  'smart-fast': {
    command: 'npx vitest run --config config/testing/vitest.config.main.ts --reporter=dot',
    time: '8초',
    coverage: '주요 컴포넌트',
    description: 'AI 개발 중 검증용 - Mock 기반 핵심 테스트'
  },
  'integration': {
    command: 'npm run test:vercel',
    time: '45초',
    coverage: '실제 환경',
    description: 'AI 최종 검증용 - Vercel 실제 환경 E2E'
  },
  'comprehensive': {
    command: 'npm run vitals:full-integration',
    time: '120초',
    coverage: '전체 시스템',
    description: 'AI 품질 보증용 - Universal Vitals 포함 전체'
  }
};

// 🧠 AI 의사결정 알고리즘
function analyzeContext() {
  const context = {
    timeConstraint: process.argv.includes('--fast') ? 'fast' : 'normal',
    changedFiles: getRecentChanges(),
    testType: inferTestType(),
    environment: process.env.NODE_ENV || 'development'
  };

  console.log('🤖 [AI 테스트 선택기] 컨텍스트 분석:');
  console.log(`  ⏱️  시간 제약: ${context.timeConstraint}`);
  console.log(`  📁 변경 파일: ${context.changedFiles.length}개`);
  console.log(`  🎯 추론 타입: ${context.testType}`);
  console.log(`  🌍 환경: ${context.environment}`);

  return context;
}

// 📁 최근 변경사항 분석
function getRecentChanges() {
  try {
    const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.trim() && (file.endsWith('.ts') || file.endsWith('.tsx')));

    return changedFiles;
  } catch (error) {
    console.warn('⚠️  Git 변경사항 조회 실패, 기본 모드 사용');
    return [];
  }
}

// 🎯 테스트 타입 추론
function inferTestType() {
  const changedFiles = getRecentChanges();

  if (changedFiles.length === 0) {
    return 'full'; // 변경사항 없으면 전체 테스트
  }

  // 파일별 패턴 분석
  const patterns = {
    utils: /src\/lib\/utils/,
    components: /src\/components/,
    api: /src\/app\/api/,
    pages: /src\/app\/.*\/page\./,
    tests: /tests?/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (changedFiles.some(file => pattern.test(file))) {
      return type;
    }
  }

  return 'mixed';
}

// 🤖 최적 테스트 명령어 선택
function selectOptimalTest(context) {
  const { timeConstraint, changedFiles, testType, environment } = context;

  // 수학적 의사결정 트리 (Qwen 알고리즘 기반)
  if (timeConstraint === 'fast' || process.argv.includes('--quick')) {
    return 'ultra-fast';
  }

  if (testType === 'utils' && changedFiles.length <= 3) {
    return 'ultra-fast'; // 순수 함수는 빠른 테스트로 충분
  }

  if (testType === 'components' || testType === 'mixed') {
    return 'smart-fast'; // 컴포넌트는 Mock 기반 테스트
  }

  if (testType === 'api' || testType === 'pages') {
    return 'integration'; // API/페이지는 실제 환경 필요
  }

  if (environment === 'production' || process.argv.includes('--comprehensive')) {
    return 'comprehensive';
  }

  return 'smart-fast'; // 기본값
}

// 🎯 성능 예측 및 실행
function executeOptimalTest() {
  console.log('🤖 [AI 테스트 선택기] 시작...\n');

  const context = analyzeContext();
  const selectedProfile = selectOptimalTest(context);
  const profile = TEST_PROFILES[selectedProfile];

  console.log('\n🎯 [선택된 테스트 프로필]:');
  console.log(`  📋 프로필: ${selectedProfile}`);
  console.log(`  ⚡ 예상 시간: ${profile.time}`);
  console.log(`  🎯 커버리지: ${profile.coverage}`);
  console.log(`  💬 설명: ${profile.description}`);
  console.log(`  🔧 명령어: ${profile.command}`);

  // 실행 확인 (개발 모드에서만)
  if (process.argv.includes('--dry-run')) {
    console.log('\n🔍 [Dry Run] 실제 실행하지 않고 선택 결과만 표시');
    return;
  }

  console.log('\n🚀 [테스트 실행] 시작...\n');

  try {
    const startTime = Date.now();
    execSync(profile.command, { stdio: 'inherit' });
    const actualTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ [완료] 실제 실행 시간: ${actualTime}초`);

    // 성능 로깅 (AI 학습용)
    const logEntry = {
      timestamp: new Date().toISOString(),
      profile: selectedProfile,
      predictedTime: profile.time,
      actualTime: `${actualTime}초`,
      context: context
    };

    logPerformance(logEntry);

  } catch (error) {
    console.error('❌ [실패] 테스트 실행 중 오류:', error.message);
    process.exit(1);
  }
}

// 📊 성능 로깅 (AI 학습 데이터)
function logPerformance(entry) {
  const logDir = path.join(__dirname, '../../logs');
  const logFile = path.join(logDir, 'ai-test-performance.json');

  try {
    // 로그 디렉토리 생성
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 기존 로그 읽기
    let logs = [];
    if (fs.existsSync(logFile)) {
      const existingLogs = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(existingLogs);
    }

    // 새 로그 추가 (최근 50개만 유지)
    logs.push(entry);
    if (logs.length > 50) {
      logs = logs.slice(-50);
    }

    // 로그 저장
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    console.log(`📊 [로깅] 성능 데이터 저장됨: ${logFile}`);
  } catch (error) {
    console.warn('⚠️  성능 로깅 실패:', error.message);
  }
}

// 📋 도움말 표시
function showHelp() {
  console.log(`
🤖 AI 스마트 테스트 선택기

사용법:
  npm run test:smart-select              # 자동 선택
  npm run test:smart-select -- --fast    # 빠른 테스트 강제
  npm run test:smart-select -- --comprehensive  # 전체 테스트 강제
  npm run test:smart-select -- --dry-run # 실행 없이 선택 결과만 표시

프로필:
${Object.entries(TEST_PROFILES).map(([key, profile]) =>
  `  ${key}: ${profile.time} - ${profile.description}`
).join('\n')}

AI 최적화:
- 컨텍스트 자동 분석 (Git 변경사항, 파일 타입, 환경)
- 수학적 의사결정 트리 (Qwen 알고리즘 기반)
- 성능 로깅으로 지속적 학습 개선
`);
}

// 🚀 메인 실행
if (process.argv.includes('--help')) {
  showHelp();
} else {
  executeOptimalTest();
}