#!/usr/bin/env node

/**
 * 🧪 AI 엔진 체인 테스트 스크립트
 * 
 * MCP → RAG → Google AI 폴백 체인 검증
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');

// 테스트 설정
const TEST_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// 테스트 케이스들
const testCases = [
    {
        name: 'MCP 엔진 기본 질문',
        endpoint: '/api/ai/test-chain',
        method: 'POST',
        data: {
            question: '안녕하세요, 서버 상태는 어떤가요?',
            userId: 'test-user-1'
        }
    },
    {
        name: 'RAG 엔진 문서 검색',
        endpoint: '/api/ai/test-chain',
        method: 'POST',
        data: {
            question: 'OpenManager 시스템의 AI 엔진 구조에 대해 설명해주세요',
            userId: 'test-user-2'
        }
    },
    {
        name: 'Google AI 복잡한 추론',
        endpoint: '/api/ai/test-chain',
        method: 'POST',
        data: {
            question: '서버 모니터링 데이터를 분석하여 향후 24시간 내 발생 가능한 문제점을 예측해주세요',
            userId: 'test-user-3'
        }
    },
    {
        name: '시스템 상태 확인',
        endpoint: '/api/ai/test-chain',
        method: 'GET'
    }
];

// 색상 출력 함수들
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

// HTTP 요청 함수
async function makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${BASE_URL}${endpoint}`;

    const curlCommand = method === 'GET'
        ? `curl -s "${url}"`
        : `curl -s -X ${method} -H "Content-Type: application/json" -d '${JSON.stringify(data)}' "${url}"`;

    try {
        const { stdout, stderr } = await execAsync(curlCommand);

        if (stderr) {
            throw new Error(`curl 오류: ${stderr}`);
        }

        return JSON.parse(stdout);
    } catch (error) {
        throw new Error(`요청 실패: ${error.message}`);
    }
}

// 서버 상태 확인
async function checkServer() {
    try {
        const response = await makeRequest('/api/health');
        return true;
    } catch (error) {
        return false;
    }
}

// 개별 테스트 실행
async function runTest(testCase, index) {
    const testNumber = index + 1;
    console.log(colors.cyan(`\n📋 테스트 ${testNumber}: ${testCase.name}`));
    console.log(colors.blue(`   ${testCase.method} ${testCase.endpoint}`));

    if (testCase.data) {
        console.log(colors.yellow(`   데이터: ${JSON.stringify(testCase.data, null, 2)}`));
    }

    const startTime = Date.now();

    try {
        const result = await makeRequest(testCase.endpoint, testCase.method, testCase.data);
        const duration = Date.now() - startTime;

        console.log(colors.green(`   ✅ 성공 (${duration}ms)`));

        // 결과 분석
        if (result.success !== undefined) {
            console.log(colors.blue(`   응답: ${result.success ? '성공' : '실패'}`));
        }

        if (result.result) {
            console.log(colors.blue(`   엔진: ${result.result.engine}`));
            console.log(colors.blue(`   신뢰도: ${result.result.confidence}`));
            console.log(colors.blue(`   처리시간: ${result.result.processingTime}ms`));

            if (result.result.answer) {
                const shortAnswer = result.result.answer.substring(0, 100) +
                    (result.result.answer.length > 100 ? '...' : '');
                console.log(colors.blue(`   답변: ${shortAnswer}`));
            }
        }

        if (result.aiChain) {
            console.log(colors.blue(`   AI 체인 상태: ${result.aiChain.overall}`));
            console.log(colors.blue(`   사용 가능한 엔진: ${Object.keys(result.aiChain.engines).join(', ')}`));
        }

        return { success: true, duration, result };
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(colors.red(`   ❌ 실패 (${duration}ms): ${error.message}`));
        return { success: false, duration, error: error.message };
    }
}

// 전체 테스트 실행
async function runAllTests() {
    console.log(colors.bold(colors.cyan('🧪 AI 엔진 체인 테스트 시작\n')));

    // 서버 상태 확인
    console.log(colors.yellow('🔍 서버 상태 확인 중...'));
    const serverReady = await checkServer();

    if (!serverReady) {
        console.log(colors.red('❌ 서버가 실행되지 않았습니다.'));
        console.log(colors.yellow('다음 명령어로 서버를 시작하세요:'));
        console.log(colors.cyan('  npm run dev'));
        process.exit(1);
    }

    console.log(colors.green('✅ 서버 연결 확인됨'));

    // 테스트 실행
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
        const result = await runTest(testCases[i], i);
        results.push({ ...testCases[i], ...result });

        // 테스트 간 간격
        if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // 결과 요약
    console.log(colors.bold(colors.cyan('\n📊 테스트 결과 요약')));
    console.log('='.repeat(50));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(colors.green(`✅ 성공: ${successful}`));
    console.log(colors.red(`❌ 실패: ${failed}`));
    console.log(colors.blue(`⏱️  총 시간: ${totalDuration}ms`));
    console.log(colors.blue(`⚡ 평균 응답시간: ${Math.round(totalDuration / results.length)}ms`));

    // 실패한 테스트 상세 정보
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log(colors.red('\n❌ 실패한 테스트들:'));
        failedTests.forEach((test, index) => {
            console.log(colors.red(`   ${index + 1}. ${test.name}: ${test.error}`));
        });
    }

    // 성공률 계산
    const successRate = (successful / results.length) * 100;
    console.log(colors.bold(`\n🎯 성공률: ${successRate.toFixed(1)}%`));

    if (successRate >= 80) {
        console.log(colors.green('\n🎉 AI 엔진 체인이 정상적으로 작동하고 있습니다!'));
    } else if (successRate >= 50) {
        console.log(colors.yellow('\n⚠️  일부 문제가 있지만 기본 기능은 동작합니다.'));
    } else {
        console.log(colors.red('\n🚨 심각한 문제가 발견되었습니다. 시스템을 점검하세요.'));
    }

    process.exit(failed > 0 ? 1 : 0);
}

// 메인 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch((error) => {
        console.error(colors.red('테스트 실행 중 오류 발생:'), error);
        process.exit(1);
    });
}

export { runAllTests, runTest }; 