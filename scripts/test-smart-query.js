#!/usr/bin/env node

/**
 * 스마트 질의 처리기 테스트 스크립트
 * 바로바로 테스트할 수 있는 CLI 도구
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3004';
const API_PATH = '/api/test/smart-query';

// 색상 코드
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

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
    console.log(colorize(message, color));
}

async function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`JSON 파싱 오류: ${error.message}`));
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('요청 타임아웃'));
        });
    });
}

async function runTest(action, params = {}) {
    try {
        const queryParams = new URLSearchParams({
            action,
            ...params
        });

        const url = `${BASE_URL}${API_PATH}?${queryParams}`;
        log(`🚀 테스트 실행: ${action}`, 'cyan');
        log(`📡 URL: ${url}`, 'blue');

        const result = await makeRequest(url);

        if (result.success) {
            log(`✅ 테스트 성공!`, 'green');

            if (result.summary) {
                log(`📊 결과 요약:`, 'yellow');
                log(`   총 테스트: ${result.summary.totalTests}개`, 'reset');
                log(`   통과: ${result.summary.passedTests}개`, 'green');
                log(`   실패: ${result.summary.failedTests}개`, 'red');
                log(`   성공률: ${result.summary.successRate}`, 'cyan');
            }

            if (result.result) {
                log(`📝 테스트 결과:`, 'yellow');
                log(`   질의: "${result.result.testCase.query}"`, 'reset');
                log(`   통과: ${result.result.passed ? '✅' : '❌'}`, result.result.passed ? 'green' : 'red');
                log(`   실행시간: ${result.result.executionTime}ms`, 'blue');

                if (result.result.result && result.result.result.analysis) {
                    const analysis = result.result.result.analysis;
                    log(`   의도: ${analysis.intent} (${analysis.confidence}%)`, 'magenta');
                    log(`   오타감지: ${analysis.hasTypos ? '있음' : '없음'}`, 'reset');
                    log(`   로컬처리: ${result.result.result.capabilities.canProcessLocally ? '가능' : '불가능'}`, 'reset');
                    log(`   학습필요: ${result.result.result.capabilities.shouldLearn ? '필요' : '불필요'}`, 'reset');
                }

                if (result.result.errors && result.result.errors.length > 0) {
                    log(`🚨 오류들:`, 'red');
                    result.result.errors.forEach(error => {
                        log(`   - ${error}`, 'red');
                    });
                }
            }

        } else {
            log(`❌ 테스트 실패: ${result.error}`, 'red');
            if (result.details) {
                log(`📋 상세: ${result.details}`, 'yellow');
            }
        }

    } catch (error) {
        log(`💥 요청 오류: ${error.message}`, 'red');
    }
}

function showHelp() {
    log('🧪 스마트 질의 처리기 테스트 도구', 'bright');
    log('='.repeat(50), 'cyan');
    log('');
    log('사용법:', 'yellow');
    log('  node scripts/test-smart-query.js [명령어] [옵션]', 'reset');
    log('');
    log('명령어:', 'yellow');
    log('  quick              빠른 테스트 (기본)', 'reset');
    log('  all                전체 테스트', 'reset');
    log('  datetime           날짜/시간 테스트', 'reset');
    log('  weather            날씨 테스트', 'reset');
    log('  mixed              복합 질의 테스트', 'reset');
    log('  general            일반 질의 테스트', 'reset');
    log('  custom "질의"      커스텀 질의 테스트', 'reset');
    log('  results            테스트 결과 조회', 'reset');
    log('  clear              테스트 결과 초기화', 'reset');
    log('  help               도움말 표시', 'reset');
    log('');
    log('예시:', 'yellow');
    log('  node scripts/test-smart-query.js quick', 'green');
    log('  node scripts/test-smart-query.js datetime', 'green');
    log('  node scripts/test-smart-query.js custom "지금 몇시인가요?"', 'green');
    log('  node scripts/test-smart-query.js all', 'green');
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === 'help') {
        showHelp();
        return;
    }

    const command = args[0];

    log('🧠 스마트 질의 처리기 테스트 시작', 'bright');
    log('='.repeat(50), 'cyan');

    switch (command) {
        case 'quick':
            await runTest('quick');
            break;

        case 'all':
            await runTest('all');
            break;

        case 'datetime':
        case 'weather':
        case 'mixed':
        case 'general':
            await runTest('category', { category: command });
            break;

        case 'custom':
            if (args.length < 2) {
                log('❌ 커스텀 질의가 필요합니다.', 'red');
                log('예시: node scripts/test-smart-query.js custom "지금 몇시인가요?"', 'yellow');
                return;
            }
            await runTest('custom', { query: args[1] });
            break;

        case 'results':
            await runTest('results');
            break;

        case 'clear':
            await runTest('clear');
            break;

        default:
            log(`❌ 알 수 없는 명령어: ${command}`, 'red');
            log('도움말을 보려면: node scripts/test-smart-query.js help', 'yellow');
    }

    log('', 'reset');
    log('🎉 테스트 완료!', 'green');
}

// 스크립트 실행
if (require.main === module) {
    main().catch(error => {
        log(`💥 스크립트 실행 오류: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runTest, showHelp }; 