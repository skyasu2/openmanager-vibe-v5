#!/usr/bin/env node
/**
 * 🤖 test-automation-specialist 서브에이전트 전용 테스트 실행기
 *
 * @description 서브에이전트가 명령줄에서 쉽게 실행할 수 있는 테스트 도구
 * @usage node scripts/testing/subagent-test-runner.js [options]
 * @integration SubagentTestController와 연동하여 완전한 테스트 자동화 제공
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎯 서브에이전트용 명령줄 옵션
const args = process.argv.slice(2);
const options = {
  priority: 'fast',      // fast, thorough, comprehensive
  focus: null,           // e2e, api, unit, integration
  timeout: null,         // 타임아웃 (초)
  verbose: false,        // 상세 로그
  dryRun: false,         // 실제 실행 없이 계획만 표시
  history: false,        // 테스트 히스토리 조회
  trend: false,          // 성능 트렌드 분석
  recommendations: false // 이전 권장사항 조회
};

// 명령줄 파싱
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--fast' || arg === '-f') {
    options.priority = 'fast';
  } else if (arg === '--thorough' || arg === '-t') {
    options.priority = 'thorough';
  } else if (arg === '--comprehensive' || arg === '-c') {
    options.priority = 'comprehensive';
  } else if (arg === '--focus') {
    options.focus = args[++i];
  } else if (arg === '--timeout') {
    options.timeout = parseInt(args[++i]) * 1000;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--dry-run' || arg === '-n') {
    options.dryRun = true;
  } else if (arg === '--history' || arg === '-h') {
    options.history = true;
  } else if (arg === '--trend') {
    options.trend = true;
  } else if (arg === '--recommendations' || arg === '-r') {
    options.recommendations = true;
  } else if (arg === '--help') {
    showHelp();
    process.exit(0);
  }
}

// 🚀 메인 실행
async function main() {
  console.log('🤖 [SubagentTestRunner] 시작...\n');

  try {
    // 히스토리 조회
    if (options.history) {
      return showHistory();
    }

    // 트렌드 분석
    if (options.trend) {
      return showTrend();
    }

    // 이전 권장사항 조회
    if (options.recommendations) {
      return showRecommendations();
    }

    // Dry run
    if (options.dryRun) {
      return showExecutionPlan();
    }

    // 실제 테스트 실행
    await runTests();

  } catch (error) {
    console.error('❌ [SubagentTestRunner] 실행 실패:', error.message);
    process.exit(1);
  }
}

// 🧪 테스트 실행
async function runTests() {
  console.log('📊 [SubagentTestRunner] 테스트 설정:');
  console.log(`  우선순위: ${options.priority}`);
  console.log(`  포커스: ${options.focus || '자동 선택'}`);
  console.log(`  타임아웃: ${options.timeout ? `${options.timeout / 1000}초` : '기본값'}`);
  console.log(`  상세 로그: ${options.verbose ? '활성화' : '비활성화'}\n`);

  // TypeScript 컨트롤러 실행
  const command = buildTestCommand();

  if (options.verbose) {
    console.log(`🔧 실행 명령어: ${command}\n`);
  }

  try {
    const result = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit'
    });

    console.log('\n✅ [SubagentTestRunner] 완료');

  } catch (error) {
    console.error('\n❌ [SubagentTestRunner] 실패');
    throw error;
  }
}

// 🔧 테스트 명령어 구성
function buildTestCommand() {
  // TypeScript 컨트롤러 실행을 위한 Node.js 스크립트
  const controllerScript = `
// TypeScript 파일을 직접 실행하기 위해 ts-node 사용
const tsNodePath = path.resolve(__dirname, '../../node_modules/.bin/ts-node');
const controllerPath = path.resolve(__dirname, '../../src/lib/testing/subagent-test-controller.ts');

(async function() {
  try {
    const context = {
      priority: '${options.priority}',
      ${options.focus ? `focus: '${options.focus}',` : ''}
      ${options.timeout ? `timeout: ${options.timeout},` : ''}
    };

    let result;
    if ('${options.focus}') {
      result = await subagentTesting.focusTest('${options.focus}', '${options.priority}');
    } else {
      result = await subagentTesting.quickTest('${options.priority}');
    }

    // 결과는 이미 컨트롤러에서 출력됨
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('실행 오류:', error.message);
    process.exit(1);
  }
})();
  `;

  // 임시 스크립트 파일 생성 및 실행
  const tempScript = path.join(__dirname, 'temp-subagent-test.js');
  fs.writeFileSync(tempScript, controllerScript);

  // ts-node 또는 tsx를 사용한 실행
  const hastsNode = hasPackage('ts-node');
  const hasTsx = hasPackage('tsx');

  if (hasTsx) {
    return `npx tsx ${tempScript}`;
  } else if (hastsNode) {
    return `npx ts-node ${tempScript}`;
  } else {
    // 폴백: 미리 정의된 npm 스크립트 실행
    return getFallbackCommand();
  }
}

// 📦 패키지 존재 확인
function hasPackage(packageName) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.devDependencies?.[packageName] || packageJson.dependencies?.[packageName];
  } catch {
    return false;
  }
}

// 🔄 폴백 명령어
function getFallbackCommand() {
  const priorityCommandMap = {
    'fast': 'npm run test:ai-priority-2',           // 11초 빠른 테스트
    'thorough': 'npm run test:ai-priority-1',      // 45초 E2E 테스트
    'comprehensive': 'npm run vitals:full-integration' // 2분 종합 테스트
  };

  const focusCommandMap = {
    'e2e': 'npm run test:vercel',
    'api': 'npm run test:integration',
    'unit': 'npm run test:super-fast',
    'playwright': 'npx playwright test --reporter=html',
    'vitals': 'npm run vitals:universal'
  };

  if (options.focus && focusCommandMap[options.focus]) {
    return focusCommandMap[options.focus];
  }

  return priorityCommandMap[options.priority] || priorityCommandMap['fast'];
}

// 📋 실행 계획 표시
function showExecutionPlan() {
  console.log('🔍 [Dry Run] 실행 계획:\n');

  const command = getFallbackCommand();

  console.log('📋 선택된 설정:');
  console.log(`  우선순위: ${options.priority}`);
  console.log(`  포커스: ${options.focus || '자동 선택'}`);
  console.log(`  예상 명령어: ${command}`);

  // 예상 실행 시간
  const timeEstimates = {
    'fast': '3-11초',
    'thorough': '45초',
    'comprehensive': '2분'
  };

  console.log(`  예상 실행 시간: ${timeEstimates[options.priority] || '알 수 없음'}`);

  // 테스트 범위
  const scopeDescriptions = {
    'fast': '핵심 로직만, Mock 기반',
    'thorough': 'Vercel 실제 환경, E2E',
    'comprehensive': 'Universal Vitals 포함 전체'
  };

  console.log(`  테스트 범위: ${scopeDescriptions[options.priority] || '기본'}`);

  console.log('\n💡 실제 실행하려면 --dry-run 옵션을 제거하세요.');
}

// 📊 테스트 히스토리 표시
function showHistory() {
  console.log('📊 [SubagentTestRunner] 테스트 히스토리:\n');

  const logDir = path.join(process.cwd(), 'logs', 'subagent-tests');

  if (!fs.existsSync(logDir)) {
    console.log('📝 아직 테스트 히스토리가 없습니다.');
    console.log('   테스트를 실행하면 히스토리가 생성됩니다.\n');
    return;
  }

  try {
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 5);

    if (logFiles.length === 0) {
      console.log('📝 아직 테스트 히스토리가 없습니다.\n');
      return;
    }

    console.log(`📋 최근 ${logFiles.length}개 테스트 결과:\n`);

    logFiles.forEach((file, idx) => {
      try {
        const content = fs.readFileSync(path.join(logDir, file), 'utf8');
        const result = JSON.parse(content);

        const timestamp = new Date(result.timestamp).toLocaleString('ko-KR');
        const duration = (result.duration / 1000).toFixed(1);
        const status = result.success ? '✅' : '❌';

        console.log(`${idx + 1}. ${status} ${result.profile.name} (${duration}초) - ${timestamp}`);
        console.log(`   점수: ${result.analysis.overallScore}/100, ${result.analysis.summary}`);

        if (result.recommendations.length > 0) {
          const topRec = result.recommendations[0];
          console.log(`   권장사항: ${topRec.title}`);
        }
        console.log();
      } catch (error) {
        console.log(`${idx + 1}. ⚠️ 로그 파일 읽기 실패: ${file}`);
      }
    });

    console.log(`💡 전체 로그 위치: ${logDir}\n`);

  } catch (error) {
    console.error('⚠️ 히스토리 조회 실패:', error.message);
  }
}

// 📈 성능 트렌드 표시
function showTrend() {
  console.log('📈 [SubagentTestRunner] 성능 트렌드 분석:\n');

  const logDir = path.join(process.cwd(), 'logs', 'subagent-tests');

  if (!fs.existsSync(logDir)) {
    console.log('📝 성능 트렌드 분석을 위한 충분한 데이터가 없습니다.\n');
    return;
  }

  try {
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 10);

    if (logFiles.length < 2) {
      console.log('📝 트렌드 분석을 위해서는 최소 2개의 테스트 결과가 필요합니다.\n');
      return;
    }

    const results = logFiles.map(file => {
      const content = fs.readFileSync(path.join(logDir, file), 'utf8');
      return JSON.parse(content);
    });

    // 평균 실행 시간
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`⏱️ 평균 실행 시간: ${(avgDuration / 1000).toFixed(1)}초`);

    // 성공률
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    console.log(`✅ 성공률: ${successRate.toFixed(1)}%`);

    // 평균 점수
    const avgScore = results.reduce((sum, r) => sum + r.analysis.overallScore, 0) / results.length;
    console.log(`📊 평균 품질 점수: ${avgScore.toFixed(1)}/100`);

    // 트렌드 분석
    if (results.length >= 6) {
      const recent = results.slice(0, 3);
      const previous = results.slice(3, 6);

      const recentAvg = recent.reduce((sum, r) => sum + r.analysis.overallScore, 0) / recent.length;
      const previousAvg = previous.reduce((sum, r) => sum + r.analysis.overallScore, 0) / previous.length;

      let trend = '📊 안정적';
      if (recentAvg > previousAvg + 5) {
        trend = '📈 개선 중';
      } else if (recentAvg < previousAvg - 5) {
        trend = '📉 하락 중';
      }

      console.log(`📊 품질 트렌드: ${trend}`);
    }

    // 최근 문제점
    const recentFailed = results.filter(r => !r.success).slice(0, 3);
    if (recentFailed.length > 0) {
      console.log('\n🚨 최근 실패 이유:');
      recentFailed.forEach((result, idx) => {
        const timestamp = new Date(result.timestamp).toLocaleString('ko-KR');
        console.log(`  ${idx + 1}. ${timestamp}: ${result.errors[0]?.message || '알 수 없음'}`);
      });
    }

    console.log();

  } catch (error) {
    console.error('⚠️ 트렌드 분석 실패:', error.message);
  }
}

// 💡 이전 권장사항 표시
function showRecommendations() {
  console.log('💡 [SubagentTestRunner] 이전 권장사항:\n');

  const logDir = path.join(process.cwd(), 'logs', 'subagent-tests');

  if (!fs.existsSync(logDir)) {
    console.log('📝 아직 권장사항이 없습니다.\n');
    return;
  }

  try {
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 3); // 최근 3개 테스트

    const allRecommendations = [];

    logFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(logDir, file), 'utf8');
        const result = JSON.parse(content);

        result.recommendations.forEach(rec => {
          const timestamp = new Date(result.timestamp).toLocaleString('ko-KR');
          allRecommendations.push({
            ...rec,
            timestamp,
            testId: result.testId
          });
        });
      } catch (error) {
        // 개별 파일 에러 무시
      }
    });

    if (allRecommendations.length === 0) {
      console.log('📝 최근 권장사항이 없습니다.\n');
      return;
    }

    // 우선순위별로 정렬
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`📋 최근 권장사항 (${allRecommendations.length}개):\n`);

    allRecommendations.slice(0, 10).forEach((rec, idx) => {
      const priorityIcon = {
        critical: '🔴',
        high: '🟡',
        medium: '🟠',
        low: '🟢'
      }[rec.priority];

      console.log(`${idx + 1}. ${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   📝 ${rec.description}`);
      console.log(`   ⏱️ 예상 시간: ${rec.estimatedTime}`);
      console.log(`   📅 제안 시간: ${rec.timestamp}`);

      if (rec.commands.length > 0) {
        console.log(`   🔧 실행 명령어:`);
        rec.commands.slice(0, 2).forEach(cmd => {
          console.log(`      ${cmd}`);
        });
      }
      console.log();
    });

    if (allRecommendations.length > 10) {
      console.log(`💡 ${allRecommendations.length - 10}개의 추가 권장사항이 있습니다.\n`);
    }

  } catch (error) {
    console.error('⚠️ 권장사항 조회 실패:', error.message);
  }
}

// 📖 도움말
function showHelp() {
  console.log(`
🤖 test-automation-specialist 서브에이전트 테스트 실행기

사용법:
  node scripts/testing/subagent-test-runner.js [옵션]

우선순위 옵션:
  -f, --fast           빠른 테스트 (기본값, 3-11초)
  -t, --thorough       철저한 테스트 (45초, E2E 포함)
  -c, --comprehensive  종합 테스트 (2분, Vitals 포함)

포커스 옵션:
  --focus <영역>       특정 영역에 집중 (e2e, api, unit, integration, playwright, vitals)

기타 옵션:
  --timeout <초>       타임아웃 설정
  -v, --verbose        상세 로그 출력
  -n, --dry-run        실제 실행 없이 계획만 표시

분석 옵션:
  -h, --history        최근 테스트 히스토리 조회
  --trend              성능 트렌드 분석
  -r, --recommendations 이전 권장사항 조회

  --help               이 도움말 표시

사용 예시:
  # 빠른 테스트 실행
  node scripts/testing/subagent-test-runner.js --fast

  # E2E 테스트에 집중
  node scripts/testing/subagent-test-runner.js --focus e2e --thorough

  # 실행 계획만 확인
  node scripts/testing/subagent-test-runner.js --comprehensive --dry-run

  # 성능 트렌드 분석
  node scripts/testing/subagent-test-runner.js --trend

  # 테스트 히스토리 조회
  node scripts/testing/subagent-test-runner.js --history

AI 워크플로우:
  이 도구는 AI 워크플로우 최적화 시스템과 완전히 통합되어
  서브에이전트가 테스트 실행부터 결과 분석, 액션 제안까지
  원스톱으로 처리할 수 있도록 설계되었습니다.
`);
}

// 🚀 메인 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [SubagentTestRunner] 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  runTests,
  showHistory,
  showTrend,
  showRecommendations,
  showHelp
};