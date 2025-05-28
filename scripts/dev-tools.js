#!/usr/bin/env node

/**
 * 🛠️ OpenManager Vibe v5 - 개발 도구 모음
 * 
 * 개발 생산성을 높이는 유틸리티 스크립트들
 * 
 * 사용법:
 * node scripts/dev-tools.js [command] [options]
 * 
 * 명령어:
 * - clean: 개발 환경 정리
 * - reset: 전체 리셋
 * - analyze: 번들 분석
 * - check: 코드 품질 검사
 * - benchmark: 성능 벤치마크
 * - logs: 로그 관리
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  const command = process.argv[2];
  const options = process.argv.slice(3);

  log('🛠️ OpenManager Vibe v5 - 개발 도구', 'cyan');
  log('=' .repeat(50), 'blue');

  try {
    switch (command) {
      case 'clean':
        await cleanDevelopmentEnvironment(options);
        break;
      case 'reset':
        await resetProject(options);
        break;
      case 'analyze':
        await analyzeBundleSize(options);
        break;
      case 'check':
        await checkCodeQuality(options);
        break;
      case 'benchmark':
        await runPerformanceBenchmark(options);
        break;
      case 'logs':
        await manageLogs(options);
        break;
      case 'setup':
        await setupDevelopmentEnvironment(options);
        break;
      case 'test-data':
        await generateTestData(options);
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    log(`❌ 오류: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * 🧹 개발 환경 정리
 */
async function cleanDevelopmentEnvironment(options) {
  log('\n🧹 개발 환경 정리 중...', 'yellow');

  const itemsToClean = [
    { path: '.next', description: 'Next.js 빌드 캐시' },
    { path: 'node_modules/.cache', description: 'Node.js 캐시' },
    { path: 'logs/test-results', description: '테스트 결과 로그' },
    { path: 'logs/interactions', description: '상호작용 로그' },
  ];

  for (const item of itemsToClean) {
    try {
      await fs.rm(item.path, { recursive: true, force: true });
      log(`  ✅ ${item.description} 정리 완료`, 'green');
    } catch (error) {
      log(`  ⚠️ ${item.description} 정리 실패: ${error.message}`, 'yellow');
    }
  }

  // 선택적으로 node_modules 재설치
  if (options.includes('--reinstall')) {
    log('\n📦 의존성 재설치 중...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    log('  ✅ 의존성 재설치 완료', 'green');
  }

  log('\n✨ 개발 환경 정리 완료!', 'green');
}

/**
 * 🔄 프로젝트 전체 리셋
 */
async function resetProject(options) {
  log('\n🔄 프로젝트 전체 리셋 중...', 'yellow');

  // 1. 캐시 정리
  await cleanDevelopmentEnvironment(['--reinstall']);

  // 2. 로그 리셋
  await manageLogs(['clear']);

  // 3. 테스트 데이터 재생성
  if (!options.includes('--no-test-data')) {
    await generateTestData([]);
  }

  log('\n🎉 프로젝트 리셋 완료!', 'green');
}

/**
 * 📊 번들 분석
 */
async function analyzeBundleSize(options) {
  log('\n📊 번들 크기 분석 중...', 'yellow');

  try {
    // 번들 분석 빌드 실행
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
    
    log('✅ 번들 분석 완료! ./analyze 디렉토리를 확인하세요.', 'green');
    
    // 기본 번들 정보 표시
    if (options.includes('--summary')) {
      await showBundleSummary();
    }
  } catch (error) {
    log(`❌ 번들 분석 실패: ${error.message}`, 'red');
  }
}

/**
 * 🔍 코드 품질 검사
 */
async function checkCodeQuality(options) {
  log('\n🔍 코드 품질 검사 중...', 'yellow');

  const checks = [
    { name: 'TypeScript 타입 검사', command: 'npm run type-check' },
    { name: 'ESLint 검사', command: 'npm run lint' },
  ];

  for (const check of checks) {
    try {
      log(`\n📋 ${check.name} 실행 중...`, 'blue');
      execSync(check.command, { stdio: 'inherit' });
      log(`  ✅ ${check.name} 통과`, 'green');
    } catch (error) {
      log(`  ❌ ${check.name} 실패`, 'red');
      if (!options.includes('--continue-on-error')) {
        throw error;
      }
    }
  }

  // 추가 품질 메트릭
  if (options.includes('--detailed')) {
    await showDetailedQualityMetrics();
  }

  log('\n✅ 코드 품질 검사 완료!', 'green');
}

/**
 * ⚡ 성능 벤치마크
 */
async function runPerformanceBenchmark(options) {
  log('\n⚡ 성능 벤치마크 실행 중...', 'yellow');

  try {
    // 개발 서버가 실행 중인지 확인
    const isDevRunning = await checkDevServerRunning();
    
    if (!isDevRunning) {
      log('⚠️ 개발 서버가 실행 중이지 않습니다. npm run dev로 서버를 시작하세요.', 'yellow');
      return;
    }

    // 성능 테스트 실행
    const benchmarks = [
      { name: 'API 응답 시간', test: benchmarkApiResponse },
      { name: '메모리 사용량', test: benchmarkMemoryUsage },
      { name: '동시 요청 처리', test: benchmarkConcurrentRequests },
    ];

    const results = {};

    for (const benchmark of benchmarks) {
      log(`\n📊 ${benchmark.name} 측정 중...`, 'blue');
      results[benchmark.name] = await benchmark.test();
      log(`  ✅ ${benchmark.name} 완료`, 'green');
    }

    // 결과 출력
    log('\n📈 벤치마크 결과:', 'cyan');
    Object.entries(results).forEach(([name, result]) => {
      log(`  ${name}: ${result}`, 'white');
    });

  } catch (error) {
    log(`❌ 벤치마크 실패: ${error.message}`, 'red');
  }
}

/**
 * 📝 로그 관리
 */
async function manageLogs(options) {
  const action = options[0] || 'show';

  switch (action) {
    case 'clear':
      log('\n🗑️ 로그 정리 중...', 'yellow');
      await clearLogs();
      log('✅ 로그 정리 완료', 'green');
      break;
    case 'show':
      await showLogSummary();
      break;
    case 'archive':
      await archiveLogs();
      break;
    default:
      log('사용법: logs [clear|show|archive]', 'yellow');
  }
}

/**
 * 🚀 개발 환경 설정
 */
async function setupDevelopmentEnvironment(options) {
  log('\n🚀 개발 환경 설정 중...', 'yellow');

  const steps = [
    { name: '의존성 확인', task: checkDependencies },
    { name: '환경 변수 확인', task: checkEnvironmentVariables },
    { name: '디렉토리 구조 확인', task: checkDirectoryStructure },
    { name: '기본 데이터 생성', task: () => generateTestData([]) },
  ];

  for (const step of steps) {
    log(`\n📋 ${step.name}...`, 'blue');
    await step.task();
    log(`  ✅ ${step.name} 완료`, 'green');
  }

  log('\n🎉 개발 환경 설정 완료!', 'green');
}

/**
 * 🎲 테스트 데이터 생성
 */
async function generateTestData(options) {
  log('\n🎲 테스트 데이터 생성 중...', 'yellow');

  const testData = {
    servers: generateMockServers(options.includes('--large') ? 50 : 20),
    alerts: generateMockAlerts(10),
    metrics: generateMockMetrics(100),
  };

  // 테스트 데이터 저장
  const dataPath = path.join(__dirname, '..', 'logs', 'test-server-data.json');
  await fs.writeFile(dataPath, JSON.stringify(testData, null, 2));

  log(`✅ 테스트 데이터 생성 완료: ${dataPath}`, 'green');
  log(`  - 서버: ${testData.servers.length}개`, 'white');
  log(`  - 알림: ${testData.alerts.length}개`, 'white');
  log(`  - 메트릭: ${testData.metrics.length}개`, 'white');
}

// 유틸리티 함수들
async function checkDevServerRunning() {
  try {
    // 3001 포트 먼저 시도, 실패하면 3000 포트 시도
    let response = await fetch('http://localhost:3001/api/health').catch(() => null);
    if (!response) {
      response = await fetch('http://localhost:3000/api/health');
    }
    return response && response.ok;
  } catch {
    return false;
  }
}

async function benchmarkApiResponse() {
  const start = Date.now();
  // 동적 포트 감지
  let response = await fetch('http://localhost:3001/api/servers').catch(() => null);
  if (!response) {
    response = await fetch('http://localhost:3000/api/servers');
  }
  const duration = Date.now() - start;
  return `${duration}ms`;
}

function benchmarkMemoryUsage() {
  const usage = process.memoryUsage();
  return `${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
}

async function benchmarkConcurrentRequests() {
  // 동적 포트 감지
  const baseUrl = await fetch('http://localhost:3001/api/health').catch(() => null) 
    ? 'http://localhost:3001' 
    : 'http://localhost:3000';
    
  const requests = Array(10).fill().map(() => 
    fetch(`${baseUrl}/api/health`)
  );
  
  const start = Date.now();
  await Promise.all(requests);
  const duration = Date.now() - start;
  
  return `10 requests in ${duration}ms`;
}

function generateMockServers(count) {
  return Array(count).fill().map((_, i) => ({
    id: `server-${String(i + 1).padStart(3, '0')}`,
    name: `Server-${i + 1}`,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    status: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)]
  }));
}

function generateMockAlerts(count) {
  return Array(count).fill().map((_, i) => ({
    id: `alert-${i + 1}`,
    message: `Test alert ${i + 1}`,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString()
  }));
}

function generateMockMetrics(count) {
  return Array(count).fill().map((_, i) => ({
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100
  }));
}

async function clearLogs() {
  const logDirs = ['interactions', 'patterns', 'summaries', 'test-results'];
  
  for (const dir of logDirs) {
    const dirPath = path.join(__dirname, '..', 'logs', dir);
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // 디렉토리가 없으면 무시
    }
  }
}

async function showLogSummary() {
  log('\n📝 로그 요약:', 'cyan');
  // 로그 요약 구현
}

function showHelp() {
  log('\n📖 사용 가능한 명령어:', 'cyan');
  log('  clean [--reinstall]     - 개발 환경 정리', 'white');
  log('  reset [--no-test-data]  - 프로젝트 전체 리셋', 'white');
  log('  analyze [--summary]     - 번들 크기 분석', 'white');
  log('  check [--detailed]      - 코드 품질 검사', 'white');
  log('  benchmark               - 성능 벤치마크', 'white');
  log('  logs [clear|show]       - 로그 관리', 'white');
  log('  setup                   - 개발 환경 설정', 'white');
  log('  test-data [--large]     - 테스트 데이터 생성', 'white');
}

// 전역 fetch 폴리필
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ 실행 실패: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main }; 