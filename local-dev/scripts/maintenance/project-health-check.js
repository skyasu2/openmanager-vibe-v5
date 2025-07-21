#!/usr/bin/env node
/**
 * 프로젝트 건강도 체크 및 작업 효율성 모니터링 스크립트
 * 새로운 구조에서의 작업 효율성을 측정하고 개선 사항을 제안
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 프로젝트 루트 경로
const ROOT_DIR = path.resolve(__dirname, '../../../..');

/**
 * 프로젝트 구조 분석
 */
function analyzeProjectStructure() {
  console.log('🏗️  프로젝트 구조 분석 중...\n');

  const results = {
    development: {},
    infra: {},
    root: {},
  };

  // Development 구조 분석
  const devPath = path.join(ROOT_DIR, 'development');
  if (fs.existsSync(devPath)) {
    results.development = {
      scripts: countFiles(path.join(devPath, 'scripts'), ['.js', '.ts', '.sh']),
      docs: countFiles(path.join(devPath, 'docs'), ['.md']),
      config: countFiles(path.join(devPath, 'config')),
      tests: countFiles(path.join(devPath, 'tests')),
      security: countFiles(path.join(devPath, 'security')),
    };
  }

  // Infra 구조 분석
  const infraPath = path.join(ROOT_DIR, 'infra');
  if (fs.existsSync(infraPath)) {
    results.infra = {
      docs: countFiles(path.join(infraPath, 'docs'), ['.md']),
      config: countFiles(path.join(infraPath, 'config')),
      deployment: countFiles(path.join(infraPath, 'deployment')),
    };
  }

  // 루트 구조 분석
  results.root = {
    configFiles: countFiles(
      ROOT_DIR,
      ['.json', '.js', '.ts', '.yaml', '.yml'],
      true
    ),
    sourceFiles: countFiles(path.join(ROOT_DIR, 'src'), [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
    ]),
  };

  return results;
}

/**
 * 파일 수 계산
 */
function countFiles(dirPath, extensions = [], onlyRoot = false) {
  if (!fs.existsSync(dirPath)) {
    return { count: 0, details: 'Directory not found' };
  }

  try {
    let count = 0;
    const details = {};

    function scanDirectory(currentPath, isRoot = true) {
      const items = fs.readdirSync(currentPath);

      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.length === 0 || extensions.includes(ext)) {
            count++;
            details[ext] = (details[ext] || 0) + 1;
          }
        } else if (stat.isDirectory() && !onlyRoot) {
          scanDirectory(fullPath, false);
        }
      });
    }

    scanDirectory(dirPath);
    return { count, details };
  } catch (error) {
    return { count: 0, details: `Error: ${error.message}` };
  }
}

/**
 * Git 활동 분석
 */
function analyzeGitActivity() {
  console.log('📊 Git 활동 분석 중...\n');

  try {
    // 최근 7일간 커밋 수
    const recentCommits = execSync('git log --since="7 days ago" --oneline', {
      encoding: 'utf8',
    });
    const commitCount = recentCommits
      .trim()
      .split('\n')
      .filter(line => line.length > 0).length;

    // 활성 브랜치 수
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    const branchCount = branches.trim().split('\n').length;

    // 마지막 커밋 시간
    const lastCommit = execSync('git log -1 --format="%cr"', {
      encoding: 'utf8',
    }).trim();

    return {
      recentCommits: commitCount,
      totalBranches: branchCount,
      lastCommit,
    };
  } catch (error) {
    return {
      recentCommits: 0,
      totalBranches: 0,
      lastCommit: 'Unknown',
      error: `Git 정보를 가져올 수 없습니다: ${error.message}`,
    };
  }
}

/**
 * 종속성 분석
 */
function analyzeDependencies() {
  console.log('📦 종속성 분석 중...\n');

  try {
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { error: 'package.json을 찾을 수 없습니다' };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return {
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      scripts: Object.keys(packageJson.scripts || {}).length,
      version: packageJson.version,
    };
  } catch (error) {
    return {
      dependencies: 0,
      devDependencies: 0,
      scripts: 0,
      version: 'Unknown',
      error: `패키지 분석 실패: ${error.message}`,
    };
  }
}

/**
 * 성능 메트릭 수집
 */
function collectPerformanceMetrics() {
  console.log('⚡ 성능 메트릭 수집 중...\n');

  const metrics = {
    buildTime: null,
    testTime: null,
    lintTime: null,
  };

  try {
    // 빌드 시간 측정
    console.log('  📋 빌드 시간 측정...');
    const buildStart = Date.now();
    execSync('npm run build', { stdio: 'pipe' });
    metrics.buildTime = Date.now() - buildStart;

    // 테스트 시간 측정
    console.log('  🧪 테스트 시간 측정...');
    const testStart = Date.now();
    execSync('npm run test:unit', { stdio: 'pipe' });
    metrics.testTime = Date.now() - testStart;

    // 린트 시간 측정
    console.log('  🔍 린트 시간 측정...');
    const lintStart = Date.now();
    execSync('npm run lint', { stdio: 'pipe' });
    metrics.lintTime = Date.now() - lintStart;
  } catch (error) {
    console.log(`  ⚠️  성능 측정 중 오류: ${error.message}`);
  }

  return metrics;
}

/**
 * 건강도 점수 계산
 */
function calculateHealthScore(analysis) {
  let score = 100;
  const issues = [];

  // 구조 점수 - 안전한 접근
  const devScripts = analysis.structure.development.scripts?.count || 0;
  const devDocs = analysis.structure.development.docs?.count || 0;

  if (devScripts < 10) {
    score -= 10;
    issues.push('개발 스크립트가 부족합니다');
  }

  if (devDocs < 5) {
    score -= 15;
    issues.push('개발 문서가 부족합니다');
  }

  // Git 활동 점수
  if (analysis.git.recentCommits < 5) {
    score -= 10;
    issues.push('최근 Git 활동이 저조합니다');
  }

  // 종속성 점수
  if (analysis.dependencies.dependencies > 100) {
    score -= 5;
    issues.push('종속성이 너무 많습니다');
  }

  // 성능 점수
  if (
    analysis.performance.buildTime &&
    analysis.performance.buildTime > 120000
  ) {
    // 2분 초과
    score -= 15;
    issues.push('빌드 시간이 너무 깁니다');
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 개선 제안 생성
 */
function generateRecommendations(analysis, health) {
  const recommendations = [];

  // 구조 관련 제안
  const devDocs = analysis.structure.development.docs?.count || 0;
  if (devDocs < 10) {
    recommendations.push({
      category: '📚 문서화',
      priority: 'high',
      suggestion: 'API 문서와 사용자 가이드를 추가로 작성하세요',
      action: 'development/docs/api/ 폴더에 API 문서 추가',
    });
  }

  const devTests = analysis.structure.development.tests?.count || 0;
  if (devTests < 50) {
    recommendations.push({
      category: '🧪 테스트',
      priority: 'high',
      suggestion: '테스트 커버리지를 높이세요',
      action: 'npm run test:coverage로 현재 커버리지 확인',
    });
  }

  // 성능 관련 제안
  if (
    analysis.performance.buildTime &&
    analysis.performance.buildTime > 60000
  ) {
    recommendations.push({
      category: '⚡ 성능',
      priority: 'medium',
      suggestion: '빌드 시간을 최적화하세요',
      action: 'webpack-bundle-analyzer로 번들 크기 분석',
    });
  }

  // Git 활동 제안
  if (analysis.git.recentCommits < 3) {
    recommendations.push({
      category: '📈 개발 활동',
      priority: 'low',
      suggestion: '정기적인 커밋을 유지하세요',
      action: '작은 단위로 자주 커밋하는 습관 기르기',
    });
  }

  return recommendations;
}

/**
 * 보고서 출력
 */
function printReport(analysis, health, recommendations) {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 OpenManager Vibe v5 - 프로젝트 건강도 보고서');
  console.log('='.repeat(60));

  // 전체 건강도 점수
  const scoreColor =
    health.score >= 80 ? '🟢' : health.score >= 60 ? '🟡' : '🔴';
  console.log(`\n${scoreColor} 전체 건강도: ${health.score}/100점`);

  // 구조 분석 결과
  console.log('\n📊 프로젝트 구조 분석:');
  console.log(
    `  📁 개발 스크립트: ${analysis.structure.development.scripts?.count || 0}개`
  );
  console.log(
    `  📚 개발 문서: ${analysis.structure.development.docs?.count || 0}개`
  );
  console.log(
    `  ⚙️  설정 파일: ${analysis.structure.development.config?.count || 0}개`
  );
  console.log(
    `  🚀 인프라 문서: ${analysis.structure.infra.docs?.count || 0}개`
  );

  // Git 활동
  console.log('\n📈 Git 활동:');
  console.log(`  📝 최근 7일 커밋: ${analysis.git.recentCommits}개`);
  console.log(`  🌿 총 브랜치: ${analysis.git.totalBranches}개`);
  console.log(`  ⏰ 마지막 커밋: ${analysis.git.lastCommit}`);

  // 종속성 정보
  console.log('\n📦 종속성 정보:');
  console.log(`  📦 Dependencies: ${analysis.dependencies.dependencies}개`);
  console.log(
    `  🔧 DevDependencies: ${analysis.dependencies.devDependencies}개`
  );
  console.log(`  📜 NPM Scripts: ${analysis.dependencies.scripts}개`);

  // 성능 메트릭
  console.log('\n⚡ 성능 메트릭:');
  console.log(
    `  🏗️  빌드 시간: ${analysis.performance.buildTime ? (analysis.performance.buildTime / 1000).toFixed(1) + 's' : 'N/A'}`
  );
  console.log(
    `  🧪 테스트 시간: ${analysis.performance.testTime ? (analysis.performance.testTime / 1000).toFixed(1) + 's' : 'N/A'}`
  );
  console.log(
    `  🔍 린트 시간: ${analysis.performance.lintTime ? (analysis.performance.lintTime / 1000).toFixed(1) + 's' : 'N/A'}`
  );

  // 문제점
  if (health.issues.length > 0) {
    console.log('\n⚠️  발견된 문제점:');
    health.issues.forEach(issue => console.log(`  • ${issue}`));
  }

  // 개선 제안
  if (recommendations.length > 0) {
    console.log('\n💡 개선 제안:');
    recommendations.forEach(rec => {
      const priority =
        rec.priority === 'high'
          ? '🔴'
          : rec.priority === 'medium'
            ? '🟡'
            : '🟢';
      console.log(`  ${priority} ${rec.category}: ${rec.suggestion}`);
      console.log(`     ↳ ${rec.action}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📅 보고서 생성 시간:', new Date().toLocaleString('ko-KR'));
  console.log('='.repeat(60));
}

/**
 * 메인 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
프로젝트 건강도 체크 스크립트

사용법:
  node project-health-check.js [옵션]

옵션:
  --no-performance    성능 측정 건너뛰기 (빠른 실행)
  --help, -h         도움말 표시

예시:
  node project-health-check.js              # 전체 건강도 체크
  node project-health-check.js --no-performance  # 성능 측정 제외
`);
    return;
  }

  console.log('🏥 OpenManager Vibe v5 - 프로젝트 건강도 체크 시작\n');

  // 분석 실행
  const structure = analyzeProjectStructure();
  const git = analyzeGitActivity();
  const dependencies = analyzeDependencies();

  let performance = { buildTime: null, testTime: null, lintTime: null };
  if (!args.includes('--no-performance')) {
    performance = collectPerformanceMetrics();
  }

  const analysis = { structure, git, dependencies, performance };

  // 건강도 점수 계산
  const health = calculateHealthScore(analysis);

  // 개선 제안 생성
  const recommendations = generateRecommendations(analysis, health);

  // 보고서 출력
  printReport(analysis, health, recommendations);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 중 오류:', error.message);
    process.exit(1);
  });
}

module.exports = { analyzeProjectStructure, calculateHealthScore };
