#!/usr/bin/env node

/**
 * 🚀 Cursor IDE 테스트 러너
 * 
 * 이 스크립트는 Cursor에서 원클릭으로 테스트를 실행할 수 있도록 합니다.
 * 
 * 사용법:
 * - node scripts/cursor-test-runner.js
 * - npm run cursor:test
 * 
 * 기능:
 * - 빠른 테스트 실행
 * - 실시간 결과 표시
 * - 에러 발생 시 자동 중단
 * - 테스트 커버리지 표시
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// 로그 함수들
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
    title: (msg) => console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}`),
};

// 테스트 실행 함수
function runTests(testType = 'unit') {
    return new Promise((resolve, reject) => {
        log.title(`Cursor 테스트 실행: ${testType}`);

        const testCommand = getTestCommand(testType);
        const child = spawn('npm', ['run', testCommand], {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd(),
        });

        child.on('close', (code) => {
            if (code === 0) {
                log.success(`${testType} 테스트 완료`);
                resolve();
            } else {
                log.error(`${testType} 테스트 실패 (exit code: ${code})`);
                reject(new Error(`Test failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            log.error(`테스트 실행 중 오류: ${error.message}`);
            reject(error);
        });
    });
}

// 테스트 명령어 가져오기
function getTestCommand(testType) {
    const commands = {
        unit: 'cursor:test:unit',
        integration: 'cursor:test:integration',
        dev: 'cursor:test:dev',
        all: 'cursor:test:all',
        quick: 'cursor:test:quick',
        watch: 'cursor:test:watch',
    };

    return commands[testType] || 'cursor:test';
}

// 환경 검증
function validateEnvironment() {
    log.info('환경 검증 중...');

    // package.json 확인
    if (!fs.existsSync('package.json')) {
        log.error('package.json 파일을 찾을 수 없습니다.');
        return false;
    }

    // vitest.config.ts 확인
    if (!fs.existsSync('vitest.config.ts')) {
        log.warning('vitest.config.ts 파일을 찾을 수 없습니다.');
    }

    // 테스트 디렉토리 확인
    if (!fs.existsSync('tests')) {
        log.warning('tests 디렉토리를 찾을 수 없습니다.');
    }

    log.success('환경 검증 완료');
    return true;
}

// 테스트 결과 요약
function showTestSummary() {
    log.title('테스트 실행 완료');

    // 테스트 결과 파일이 있다면 요약 표시
    if (fs.existsSync('test-results.json')) {
        try {
            const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
            log.info(`총 테스트: ${results.numTotalTests || 0}`);
            log.info(`성공: ${results.numPassedTests || 0}`);
            log.info(`실패: ${results.numFailedTests || 0}`);
            log.info(`실행 시간: ${results.testResults?.[0]?.perfStats?.runtime || 0}ms`);
        } catch (error) {
            log.warning('테스트 결과 파일을 읽을 수 없습니다.');
        }
    }
}

// 메인 실행 함수
async function main() {
    try {
        // 명령행 인수 처리
        const args = process.argv.slice(2);
        const testType = args[0] || 'unit';

        console.clear();
        log.title('Cursor 테스트 러너 시작');

        // 환경 검증
        if (!validateEnvironment()) {
            process.exit(1);
        }

        // 테스트 실행
        await runTests(testType);

        // 결과 요약
        showTestSummary();

        log.success('모든 테스트가 성공적으로 완료되었습니다! 🎉');

    } catch (error) {
        log.error(`테스트 실행 실패: ${error.message}`);
        process.exit(1);
    }
}

// 도움말 표시
function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}🚀 Cursor 테스트 러너${colors.reset}

사용법:
  node scripts/cursor-test-runner.js [테스트타입]

테스트 타입:
  unit        - 단위 테스트만 실행 (기본값)
  integration - 통합 테스트만 실행
  dev         - 개발 통합 테스트만 실행
  all         - 모든 테스트 실행
  quick       - 빠른 테스트 (변경된 파일만)
  watch       - 감시 모드로 실행

예시:
  node scripts/cursor-test-runner.js unit
  node scripts/cursor-test-runner.js watch
  node scripts/cursor-test-runner.js all

NPM 스크립트:
  npm run cursor:test        - 기본 테스트 실행
  npm run cursor:test:watch  - 감시 모드
  npm run cursor:test:quick  - 빠른 테스트
`);
}

// 도움말 요청 확인
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}

// 스크립트 실행
if (require.main === module) {
    main().catch((error) => {
        log.error(`예상치 못한 오류: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runTests,
    validateEnvironment,
    showTestSummary,
}; 