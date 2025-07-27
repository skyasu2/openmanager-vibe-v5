#!/usr/bin/env node
/**
 * 테스트 실패 자동 분석 스크립트
 * Jest, Vitest, Playwright 등의 테스트 결과를 분석하고 수정 제안을 생성
 */

const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
};

// 실패 패턴 정의
const failurePatterns = {
  // Assertion 실패
  assertion: {
    patterns: [
      /Expected.*to\s+be.*Received/,
      /expect\(.*\)\.toBe/,
      /Expected.*but.*received/i,
      /AssertionError/,
    ],
    analyze: error => ({
      type: 'assertion',
      diagnosis: '예상값과 실제값이 일치하지 않습니다',
      solutions: [
        '테스트 데이터 확인',
        '비즈니스 로직 검증',
        '타입 불일치 확인 (string vs number)',
      ],
      autoFix: extractAssertionFix(error),
    }),
  },

  // Undefined/Null 에러
  undefinedError: {
    patterns: [
      /Cannot read prop.* of undefined/,
      /Cannot read prop.* of null/,
      /undefined is not an object/,
      /TypeError.*undefined/,
    ],
    analyze: error => ({
      type: 'undefined',
      diagnosis: '객체가 정의되지 않았거나 null입니다',
      solutions: [
        '옵셔널 체이닝 사용: obj?.property',
        '기본값 설정: obj || {}',
        '초기화 확인: 객체가 생성되었는지 검증',
      ],
      autoFix: generateUndefinedFix(error),
    }),
  },

  // Timeout 에러
  timeout: {
    patterns: [
      /Timeout.*exceeded/,
      /Async callback.*not invoked/,
      /Test timeout of.*exceeded/,
      /Promise timed out/,
    ],
    analyze: error => ({
      type: 'timeout',
      diagnosis: '비동기 작업이 제한 시간을 초과했습니다',
      solutions: [
        'async/await 키워드 추가',
        'timeout 값 증가: jest.setTimeout(10000)',
        'Promise 반환 확인',
        '네트워크 요청 mock 처리',
      ],
      autoFix: generateTimeoutFix(error),
    }),
  },

  // Import/Module 에러
  moduleError: {
    patterns: [
      /Cannot find module/,
      /Module not found/,
      /Failed to resolve import/,
      /Cannot resolve/,
    ],
    analyze: error => ({
      type: 'module',
      diagnosis: '모듈을 찾을 수 없습니다',
      solutions: [
        '파일 경로 확인',
        '패키지 설치: npm install',
        '상대 경로 수정: ./components → ../components',
        'tsconfig paths 설정 확인',
      ],
      autoFix: generateModuleFix(error),
    }),
  },

  // Mock 에러
  mockError: {
    patterns: [
      /mock.*is not a function/,
      /Cannot spy on/,
      /jest\.fn\(\) value must be a mock/,
      /not a spy or a call to a spy/,
    ],
    analyze: error => ({
      type: 'mock',
      diagnosis: 'Mock 설정이 올바르지 않습니다',
      solutions: [
        'jest.fn() 사용하여 mock 함수 생성',
        'jest.spyOn() 사용하여 기존 메서드 spy',
        'Mock 구현 추가: jest.fn(() => value)',
        '__mocks__ 디렉토리 확인',
      ],
      autoFix: generateMockFix(error),
    }),
  },
};

// 자동 수정 제안 생성 함수들
function extractAssertionFix(error) {
  const match = error.message.match(
    /Expected[:\s]+"?([^"]+)"?\s*.*Received[:\s]+"?([^"]+)"?/
  );
  if (match) {
    const [, expected, received] = match;
    return {
      description: '실제값으로 assertion 업데이트',
      code: `expect(result).toBe('${received}'); // 기존: '${expected}'`,
      warning: '⚠️ 실제값이 올바른지 확인 필요',
    };
  }
  return null;
}

function generateUndefinedFix(error) {
  const match = error.message.match(/Cannot read prop.*'(\w+)' of undefined/);
  if (match) {
    const property = match[1];
    return {
      description: '옵셔널 체이닝 추가',
      code: `// 수정 전: obj.${property}
// 수정 후: obj?.${property}
// 또는
if (obj && obj.${property}) {
  // 안전하게 접근
}`,
      warning: '객체 초기화 로직도 확인하세요',
    };
  }
  return null;
}

function generateTimeoutFix(error) {
  return {
    description: 'Timeout 설정 증가 및 async/await 추가',
    code: `// 파일 상단에 추가
jest.setTimeout(10000); // 10초로 증가

// 테스트 수정
it('should handle async operation', async () => {
  // async 키워드 추가
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});`,
    warning: '실제 비동기 작업이 너무 오래 걸리는 경우 최적화 필요',
  };
}

function generateModuleFix(error) {
  const match = error.message.match(/Cannot find module '([^']+)'/);
  if (match) {
    const moduleName = match[1];
    const isRelative = moduleName.startsWith('.');

    return {
      description: isRelative ? '상대 경로 수정' : '패키지 설치',
      code: isRelative
        ? `// 경로 확인 필요
import { something } from '../${moduleName}'; // 상위 디렉토리
// 또는
import { something } from './${moduleName}'; // 현재 디렉토리`
        : `# 터미널에서 실행
npm install ${moduleName} --save-dev
# 또는
npm install ${moduleName}`,
      warning: 'tsconfig.json의 paths 설정도 확인하세요',
    };
  }
  return null;
}

function generateMockFix(error) {
  return {
    description: 'Mock 함수 올바르게 생성',
    code: `// Mock 함수 생성
const mockFunction = jest.fn();
const mockWithReturn = jest.fn(() => 'mocked value');
const mockWithPromise = jest.fn().mockResolvedValue('async value');

// 기존 객체의 메서드 spy
const spy = jest.spyOn(object, 'method');
spy.mockReturnValue('mocked');

// 모듈 전체 mock
jest.mock('./module', () => ({
  default: jest.fn(),
  namedExport: jest.fn()
}));`,
    warning: 'Mock은 테스트 후 정리하세요: jest.clearAllMocks()',
  };
}

// 테스트 결과 분석
function analyzeTestResults(resultFile) {
  console.log(`\n${colors.blue}📊 테스트 실패 분석 시작...${colors.reset}`);
  console.log('==========================\n');

  try {
    const results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    const failures = extractFailures(results);

    if (failures.length === 0) {
      console.log(
        `${colors.green}✅ 모든 테스트가 성공했습니다!${colors.reset}`
      );
      return;
    }

    console.log(
      `${colors.red}❌ ${failures.length}개의 테스트 실패 발견${colors.reset}\n`
    );

    // 각 실패 분석
    failures.forEach((failure, index) => {
      console.log(
        `${colors.yellow}테스트 ${index + 1}/${failures.length}${colors.reset}`
      );
      console.log('-------------------');
      analyzeFailure(failure);
      console.log('\n');
    });

    // 요약 리포트 생성
    generateSummaryReport(failures);
  } catch (error) {
    console.error(
      `${colors.red}에러: 결과 파일을 읽을 수 없습니다${colors.reset}`
    );
    console.error(error.message);
    process.exit(1);
  }
}

// 실패한 테스트 추출
function extractFailures(results) {
  const failures = [];

  // Jest 형식
  if (results.testResults) {
    results.testResults.forEach(suite => {
      suite.assertionResults?.forEach(test => {
        if (test.status === 'failed') {
          failures.push({
            file: suite.name,
            testName: test.title || test.fullName,
            error: test.failureMessages?.[0] || 'Unknown error',
            duration: test.duration,
          });
        }
      });
    });
  }

  // Vitest 형식
  if (results.testResults && results.testResults[0]?.assertionResults) {
    results.testResults.forEach(result => {
      if (result.status === 'failed') {
        failures.push({
          file: result.name,
          testName: result.fullName,
          error: result.message || 'Unknown error',
          duration: result.duration,
        });
      }
    });
  }

  return failures;
}

// 개별 실패 분석
function analyzeFailure(failure) {
  console.log(`${colors.purple}📍 파일:${colors.reset} ${failure.file}`);
  console.log(`${colors.purple}🧪 테스트:${colors.reset} ${failure.testName}`);
  console.log(`${colors.purple}⏱️  시간:${colors.reset} ${failure.duration}ms`);
  console.log(`${colors.red}❌ 에러:${colors.reset}`);
  console.log(failure.error.split('\n').slice(0, 5).join('\n'));

  // 패턴 매칭으로 실패 유형 파악
  let matched = false;
  for (const [key, pattern] of Object.entries(failurePatterns)) {
    for (const regex of pattern.patterns) {
      if (regex.test(failure.error)) {
        const analysis = pattern.analyze({ message: failure.error });
        displayAnalysis(analysis);
        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  if (!matched) {
    console.log(
      `\n${colors.yellow}⚠️  알 수 없는 에러 패턴입니다${colors.reset}`
    );
    console.log('일반적인 디버깅 방법을 시도하세요.');
  }
}

// 분석 결과 표시
function displayAnalysis(analysis) {
  console.log(`\n${colors.blue}🔍 진단:${colors.reset} ${analysis.diagnosis}`);

  console.log(`\n${colors.green}💡 해결 방법:${colors.reset}`);
  analysis.solutions.forEach((solution, i) => {
    console.log(`  ${i + 1}. ${solution}`);
  });

  if (analysis.autoFix) {
    console.log(`\n${colors.yellow}🛠️  자동 수정 제안:${colors.reset}`);
    console.log(`설명: ${analysis.autoFix.description}`);
    console.log('\n코드:');
    console.log(analysis.autoFix.code);
    if (analysis.autoFix.warning) {
      console.log(
        `\n${colors.yellow}${analysis.autoFix.warning}${colors.reset}`
      );
    }
  }
}

// 요약 리포트 생성
function generateSummaryReport(failures) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(
    'docs',
    'reports',
    'test-results',
    `failure-analysis-${timestamp}.md`
  );

  // 실패 유형별 분류
  const failuresByType = {};
  failures.forEach(failure => {
    let type = 'unknown';
    for (const [key, pattern] of Object.entries(failurePatterns)) {
      if (pattern.patterns.some(regex => regex.test(failure.error))) {
        type = key;
        break;
      }
    }
    failuresByType[type] = (failuresByType[type] || 0) + 1;
  });

  const report = `# 테스트 실패 분석 리포트

생성일: ${new Date().toLocaleString()}

## 요약
- 총 실패: ${failures.length}개
- 실패 유형:
${Object.entries(failuresByType)
  .map(([type, count]) => `  - ${type}: ${count}개`)
  .join('\n')}

## 상세 분석

${failures
  .map(
    (failure, i) => `
### ${i + 1}. ${failure.testName}
- 파일: \`${failure.file}\`
- 실행 시간: ${failure.duration}ms
- 에러 메시지:
\`\`\`
${failure.error.split('\n').slice(0, 10).join('\n')}
\`\`\`
`
  )
  .join('\n')}

## 권장 조치
1. Assertion 실패는 테스트 데이터나 예상값 확인
2. Undefined 에러는 객체 초기화 및 null 체크 추가
3. Timeout 에러는 비동기 처리 및 제한 시간 조정
4. Module 에러는 import 경로 및 패키지 설치 확인

---
*test-automation-specialist 에이전트에 의해 생성됨*
`;

  // 디렉토리 생성
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(reportPath, report);
  console.log(
    `\n${colors.green}📄 상세 리포트 생성됨: ${reportPath}${colors.reset}`
  );
}

// 메인 실행
const resultFile = process.argv[2];
if (!resultFile) {
  console.error('사용법: node analyze-test-failures.js <result-file.json>');
  process.exit(1);
}

analyzeTestResults(resultFile);
