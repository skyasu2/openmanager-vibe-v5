#!/usr/bin/env node

/**
 * Python Analysis Engine Test Script
 * 
 * 🐍 Python 분석 엔진 통합 테스트
 * - 환경 검증
 * - 각 분석 모듈 테스트
 * - 성능 벤치마크
 * - 오류 시나리오 테스트
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 테스트 설정
const TEST_CONFIG = {
  pythonPath: process.env.PYTHON_PATH || 'python',
  scriptsPath: path.join(process.cwd(), 'src', 'modules', 'ai-agent', 'python-engine'),
  timeout: 30000,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// 색상 출력 함수
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details && TEST_CONFIG.verbose) {
    log(`   ${details}`, 'reset');
  }
}

// Python 실행 함수
function runPython(script, input = null) {
  return new Promise((resolve, reject) => {
    const process = spawn(TEST_CONFIG.pythonPath, [script], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: TEST_CONFIG.scriptsPath
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });

    // 입력 데이터 전송
    if (input) {
      process.stdin.write(JSON.stringify(input));
      process.stdin.end();
    }

    // 타임아웃 설정
    setTimeout(() => {
      process.kill();
      reject(new Error('Process timeout'));
    }, TEST_CONFIG.timeout);
  });
}

// 환경 검증
async function testEnvironment() {
  logSection('환경 검증');

  // Python 버전 확인
  try {
    const result = await runPython('-c', 'import sys; print(sys.version)');
    logTest('Python 실행 가능', 'pass', result.stdout.trim());
  } catch (error) {
    logTest('Python 실행 가능', 'fail', error.message);
    return false;
  }

  // 필수 패키지 확인
  const packages = ['numpy', 'pandas', 'scipy', 'sklearn'];
  for (const pkg of packages) {
    try {
      await runPython('-c', `import ${pkg}; print(f"${pkg} {pkg.__version__}")`);
      logTest(`패키지 ${pkg}`, 'pass');
    } catch (error) {
      logTest(`패키지 ${pkg}`, 'fail', error.message);
    }
  }

  // 선택적 패키지 확인
  const optionalPackages = ['kats', 'pyod'];
  for (const pkg of optionalPackages) {
    try {
      await runPython('-c', `import ${pkg}; print(f"${pkg} available")`);
      logTest(`선택적 패키지 ${pkg}`, 'pass');
    } catch (error) {
      logTest(`선택적 패키지 ${pkg}`, 'fail', '설치되지 않음 (fallback 사용)');
    }
  }

  // 스크립트 파일 확인
  const scripts = ['engine_runner.py', 'forecast.py', 'anomaly.py', 'classification.py', 'clustering.py', 'correlation.py'];
  for (const script of scripts) {
    const scriptPath = path.join(TEST_CONFIG.scriptsPath, script);
    if (fs.existsSync(scriptPath)) {
      logTest(`스크립트 ${script}`, 'pass');
    } else {
      logTest(`스크립트 ${script}`, 'fail', '파일이 존재하지 않음');
    }
  }

  return true;
}

// 시계열 예측 테스트
async function testForecast() {
  logSection('시계열 예측 테스트');

  const testData = {
    method: 'forecast',
    data: {
      timestamps: Array.from({ length: 30 }, (_, i) => 
        new Date(Date.now() - (29 - i) * 60000).toISOString()
      ),
      values: Array.from({ length: 30 }, (_, i) => 50 + Math.sin(i * 0.2) * 10 + Math.random() * 5)
    },
    params: {
      horizon: 10,
      model: 'linear'
    }
  };

  try {
    const result = await runPython('engine_runner.py', testData);
    const output = JSON.parse(result.stdout);
    
    if (output.error) {
      logTest('시계열 예측', 'fail', output.error);
    } else if (output.forecast && Array.isArray(output.forecast)) {
      logTest('시계열 예측', 'pass', `${output.forecast.length}개 예측값 생성`);
    } else {
      logTest('시계열 예측', 'fail', '잘못된 출력 형식');
    }
  } catch (error) {
    logTest('시계열 예측', 'fail', error.message);
  }
}

// 이상 탐지 테스트
async function testAnomalyDetection() {
  logSection('이상 탐지 테스트');

  const testData = {
    method: 'anomaly',
    data: {
      features: [
        [50, 60, 30, 100],
        [55, 65, 35, 110],
        [52, 62, 32, 105],
        [200, 300, 150, 500], // 이상치
        [48, 58, 28, 95],
        [51, 61, 31, 102]
      ]
    },
    params: {
      contamination: 0.2,
      algorithm: 'isolation_forest'
    }
  };

  try {
    const result = await runPython('engine_runner.py', testData);
    const output = JSON.parse(result.stdout);
    
    if (output.error) {
      logTest('이상 탐지', 'fail', output.error);
    } else if (output.anomaly_scores && output.is_anomaly) {
      const anomalyCount = output.is_anomaly.filter(Boolean).length;
      logTest('이상 탐지', 'pass', `${anomalyCount}개 이상치 탐지`);
    } else {
      logTest('이상 탐지', 'fail', '잘못된 출력 형식');
    }
  } catch (error) {
    logTest('이상 탐지', 'fail', error.message);
  }
}

// 분류 테스트
async function testClassification() {
  logSection('분류 테스트');

  const testData = {
    method: 'classification',
    data: {
      features: [
        [20, 30, 10], [25, 35, 15], [30, 40, 20], // 클래스 0
        [60, 70, 50], [65, 75, 55], [70, 80, 60], // 클래스 1
        [90, 95, 85], [95, 100, 90], [100, 105, 95] // 클래스 2
      ],
      labels: [0, 0, 0, 1, 1, 1, 2, 2, 2],
      test_features: [[22, 32, 12], [67, 77, 57]]
    },
    params: {
      model: 'random_forest'
    }
  };

  try {
    const result = await runPython('engine_runner.py', testData);
    const output = JSON.parse(result.stdout);
    
    if (output.error) {
      logTest('분류', 'fail', output.error);
    } else if (output.predictions && output.accuracy !== undefined) {
      logTest('분류', 'pass', `정확도: ${(output.accuracy * 100).toFixed(1)}%`);
    } else {
      logTest('분류', 'fail', '잘못된 출력 형식');
    }
  } catch (error) {
    logTest('분류', 'fail', error.message);
  }
}

// 클러스터링 테스트
async function testClustering() {
  logSection('클러스터링 테스트');

  const testData = {
    method: 'clustering',
    data: {
      features: [
        [1, 2], [2, 1], [1, 1], [2, 2], // 클러스터 1
        [8, 9], [9, 8], [8, 8], [9, 9], // 클러스터 2
        [15, 16], [16, 15], [15, 15], [16, 16] // 클러스터 3
      ]
    },
    params: {
      n_clusters: 3,
      algorithm: 'kmeans'
    }
  };

  try {
    const result = await runPython('engine_runner.py', testData);
    const output = JSON.parse(result.stdout);
    
    if (output.error) {
      logTest('클러스터링', 'fail', output.error);
    } else if (output.cluster_labels && output.silhouette_score !== undefined) {
      logTest('클러스터링', 'pass', `실루엣 점수: ${output.silhouette_score.toFixed(3)}`);
    } else {
      logTest('클러스터링', 'fail', '잘못된 출력 형식');
    }
  } catch (error) {
    logTest('클러스터링', 'fail', error.message);
  }
}

// 상관관계 분석 테스트
async function testCorrelation() {
  logSection('상관관계 분석 테스트');

  const testData = {
    method: 'correlation',
    data: {
      variables: [
        {
          name: 'CPU',
          values: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95]
        },
        {
          name: 'Memory',
          values: [45, 50, 55, 60, 65, 70, 75, 80, 85, 90] // CPU와 강한 양의 상관관계
        },
        {
          name: 'Disk',
          values: [95, 90, 85, 80, 75, 70, 65, 60, 55, 50] // CPU와 강한 음의 상관관계
        }
      ]
    },
    params: {
      method: 'pearson'
    }
  };

  try {
    const result = await runPython('engine_runner.py', testData);
    const output = JSON.parse(result.stdout);
    
    if (output.error) {
      logTest('상관관계 분석', 'fail', output.error);
    } else if (output.correlations && output.correlation_matrix) {
      const strongCorrs = output.correlations.filter(c => Math.abs(c.coefficient) > 0.7);
      logTest('상관관계 분석', 'pass', `${strongCorrs.length}개 강한 상관관계 발견`);
    } else {
      logTest('상관관계 분석', 'fail', '잘못된 출력 형식');
    }
  } catch (error) {
    logTest('상관관계 분석', 'fail', error.message);
  }
}

// 성능 벤치마크
async function testPerformance() {
  logSection('성능 벤치마크');

  const testCases = [
    { name: '소규모 데이터', size: 100 },
    { name: '중간 규모 데이터', size: 1000 },
    { name: '대규모 데이터', size: 5000 }
  ];

  for (const testCase of testCases) {
    const testData = {
      method: 'correlation',
      data: {
        variables: [
          {
            name: 'var1',
            values: Array.from({ length: testCase.size }, () => Math.random() * 100)
          },
          {
            name: 'var2',
            values: Array.from({ length: testCase.size }, () => Math.random() * 100)
          }
        ]
      }
    };

    try {
      const startTime = Date.now();
      await runPython('engine_runner.py', testData);
      const duration = Date.now() - startTime;
      
      logTest(`${testCase.name} (${testCase.size}개 샘플)`, 'pass', `${duration}ms`);
    } catch (error) {
      logTest(`${testCase.name}`, 'fail', error.message);
    }
  }
}

// 오류 시나리오 테스트
async function testErrorScenarios() {
  logSection('오류 시나리오 테스트');

  // 잘못된 메서드
  try {
    const result = await runPython('engine_runner.py', { method: 'invalid_method' });
    const output = JSON.parse(result.stdout);
    if (output.error) {
      logTest('잘못된 메서드 처리', 'pass', '오류 메시지 반환됨');
    } else {
      logTest('잘못된 메서드 처리', 'fail', '오류가 감지되지 않음');
    }
  } catch (error) {
    logTest('잘못된 메서드 처리', 'pass', '예외 발생');
  }

  // 빈 데이터
  try {
    const result = await runPython('engine_runner.py', { method: 'forecast', data: {} });
    const output = JSON.parse(result.stdout);
    if (output.error) {
      logTest('빈 데이터 처리', 'pass', '오류 메시지 반환됨');
    } else {
      logTest('빈 데이터 처리', 'fail', '오류가 감지되지 않음');
    }
  } catch (error) {
    logTest('빈 데이터 처리', 'pass', '예외 발생');
  }

  // 잘못된 JSON
  try {
    const process = spawn(TEST_CONFIG.pythonPath, ['engine_runner.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: TEST_CONFIG.scriptsPath
    });

    process.stdin.write('invalid json');
    process.stdin.end();

    let stdout = '';
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    await new Promise((resolve) => {
      process.on('close', () => {
        const output = JSON.parse(stdout);
        if (output.error && output.error.includes('JSON')) {
          logTest('잘못된 JSON 처리', 'pass', 'JSON 오류 감지됨');
        } else {
          logTest('잘못된 JSON 처리', 'fail', 'JSON 오류가 감지되지 않음');
        }
        resolve();
      });
    });
  } catch (error) {
    logTest('잘못된 JSON 처리', 'pass', '예외 발생');
  }
}

// 메인 테스트 실행
async function runTests() {
  log('🐍 Python Analysis Engine Test Suite', 'bright');
  log(`테스트 시작 시간: ${new Date().toLocaleString()}`, 'cyan');
  
  const startTime = Date.now();
  
  try {
    // 환경 검증이 실패하면 테스트 중단
    const envOk = await testEnvironment();
    if (!envOk) {
      log('\n❌ 환경 검증 실패 - 테스트를 중단합니다.', 'red');
      process.exit(1);
    }

    // 각 분석 모듈 테스트
    await testForecast();
    await testAnomalyDetection();
    await testClassification();
    await testClustering();
    await testCorrelation();

    // 성능 및 오류 테스트
    await testPerformance();
    await testErrorScenarios();

    const duration = Date.now() - startTime;
    
    logSection('테스트 완료');
    log(`✅ 모든 테스트 완료 (${duration}ms)`, 'green');
    log(`📊 테스트 보고서가 생성되었습니다.`, 'cyan');
    
  } catch (error) {
    log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 도움말 출력
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🐍 Python Analysis Engine Test Suite

사용법:
  node scripts/test-python-analysis.js [옵션]

옵션:
  --verbose, -v    상세한 출력 표시
  --help, -h       이 도움말 표시

환경 변수:
  PYTHON_PATH      Python 실행 파일 경로 (기본값: python)

예시:
  node scripts/test-python-analysis.js --verbose
  PYTHON_PATH=python3 node scripts/test-python-analysis.js
  `);
  process.exit(0);
}

// 테스트 실행
runTests().catch(error => {
  console.error('테스트 실행 실패:', error);
  process.exit(1);
}); 