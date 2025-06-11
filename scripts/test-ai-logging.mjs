#!/usr/bin/env node
/**
 * 🧪 AI 로깅 시스템 테스트 스크립트
 * 
 * 사용법:
 * npm run test:ai-logging
 * node scripts/test-ai-logging.mjs
 */

import chalk from 'chalk';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';
const AI_LOGGING_API = `${API_BASE}/ai/logging`;
const AI_UNIFIED_API = `${API_BASE}/ai/unified`;

// 테스트 데이터
const testQueries = [
    {
        question: "서버 메모리 사용률이 높은 이유를 분석해주세요",
        options: { includeThinkingLogs: true, includeAnalysis: true }
    },
    {
        question: "CPU 사용률 급증 원인을 파악하고 해결책을 제안해주세요",
        options: { includeThinkingLogs: true, preferFastAPI: false }
    },
    {
        question: "네트워크 지연 문제를 진단해주세요",
        options: { includeThinkingLogs: false, maxTokens: 500 }
    }
];

console.log(chalk.cyan('🔍 AI 로깅 시스템 고도화 테스트 시작\n'));

/**
 * 📊 1. 기본 로깅 API 테스트
 */
async function testBasicLogging() {
    console.log(chalk.yellow('📊 1. 기본 로깅 API 테스트'));

    try {
        // 테스트 로그 생성
        const testLog = {
            level: 'info',
            category: 'ai_engine',
            engine: 'test_engine',
            message: '테스트 로그 메시지입니다',
            metadata: {
                responseTime: 150,
                confidence: 0.95,
                tokens: 250,
                cacheHit: false
            },
            thinking: {
                steps: [
                    {
                        step: 1,
                        type: 'analysis',
                        content: '사용자 질문을 분석하고 있습니다',
                        duration: 50,
                        confidence: 0.9
                    },
                    {
                        step: 2,
                        type: 'reasoning',
                        content: '가능한 해결책들을 검토하고 있습니다',
                        duration: 75,
                        confidence: 0.85
                    }
                ],
                reasoning: '질문의 의도를 파악하고 최적의 답변을 생성했습니다',
                conclusions: ['분석 완료', '답변 생성됨']
            }
        };

        const response = await fetch(AI_LOGGING_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testLog)
        });

        const result = await response.json();

        if (result.success) {
            console.log(chalk.green('   ✅ 테스트 로그 생성 성공'));
            console.log(chalk.gray(`   📝 로그 ID: ${result.logId}`));
        } else {
            console.log(chalk.red(`   ❌ 로그 생성 실패: ${result.error}`));
        }
    } catch (error) {
        console.log(chalk.red(`   ❌ API 호출 오류: ${error.message}`));
    }

    console.log('');
}

/**
 * 🧠 2. AI 엔진 통합 로깅 테스트
 */
async function testAIEngineLogging() {
    console.log(chalk.yellow('🧠 2. AI 엔진 통합 로깅 테스트'));

    for (let i = 0; i < testQueries.length; i++) {
        const query = testQueries[i];
        console.log(chalk.blue(`   📝 질의 ${i + 1}: ${query.question.substring(0, 50)}...`));

        try {
            const response = await fetch(AI_UNIFIED_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });

            const result = await response.json();

            if (result.success) {
                console.log(chalk.green(`   ✅ 질의 처리 성공 (${result.processingTime}ms)`));
                console.log(chalk.gray(`   🎯 응답 길이: ${result.response.length}자`));

                if (result.thinkingLogs && result.thinkingLogs.length > 0) {
                    console.log(chalk.gray(`   🧠 사고 과정: ${result.thinkingLogs.length}단계`));
                }
            } else {
                console.log(chalk.red(`   ❌ 질의 실패: ${result.error}`));
            }
        } catch (error) {
            console.log(chalk.red(`   ❌ 질의 오류: ${error.message}`));
        }

        // 잠시 대기 (로깅 시스템 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('');
}

/**
 * 📋 3. 로그 조회 테스트
 */
async function testLogRetrieval() {
    console.log(chalk.yellow('📋 3. 로그 조회 테스트'));

    const testCases = [
        { type: 'recent', limit: 10, description: '최근 로그 10개' },
        { type: 'errors', limit: 5, description: '에러 로그 5개' },
        { type: 'thinking', limit: 3, description: 'AI 사고 과정 3개' },
        { type: 'engine', engine: 'unified_ai', limit: 5, description: 'unified_ai 엔진 로그' },
        { type: 'metrics', description: '성능 메트릭' }
    ];

    for (const testCase of testCases) {
        console.log(chalk.blue(`   📊 ${testCase.description} 조회`));

        try {
            const params = new URLSearchParams();
            Object.entries(testCase).forEach(([key, value]) => {
                if (key !== 'description' && value !== undefined) {
                    params.append(key, value.toString());
                }
            });

            const response = await fetch(`${AI_LOGGING_API}?${params}`);
            const result = await response.json();

            if (result.success) {
                if (testCase.type === 'metrics') {
                    console.log(chalk.green(`   ✅ 메트릭 조회 성공: ${result.data.metrics.length}개 엔진`));
                    console.log(chalk.gray(`   📈 총 로그: ${result.data.summary.totalLogs}개`));
                } else {
                    console.log(chalk.green(`   ✅ 로그 조회 성공: ${result.data.logs.length}개`));

                    if (result.data.metadata) {
                        console.log(chalk.gray(`   📊 통계: ${JSON.stringify(result.data.metadata.byLevel)}`));
                    }
                }
            } else {
                console.log(chalk.red(`   ❌ 조회 실패: ${result.error}`));
            }
        } catch (error) {
            console.log(chalk.red(`   ❌ 조회 오류: ${error.message}`));
        }
    }

    console.log('');
}

/**
 * 🌊 4. 실시간 스트리밍 테스트
 */
async function testRealTimeStreaming() {
    console.log(chalk.yellow('🌊 4. 실시간 스트리밍 테스트 (5초간)'));

    try {
        const streamUrl = `${AI_LOGGING_API}/stream?engines=unified_ai,test_engine&levels=info,error`;
        console.log(chalk.blue(`   🔗 스트리밍 URL: ${streamUrl}`));

        const response = await fetch(streamUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(chalk.green('   ✅ 스트리밍 연결 성공'));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let messageCount = 0;

        // 5초간 스트리밍 테스트
        const timeout = setTimeout(() => {
            reader.cancel();
        }, 5000);

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            messageCount++;

                            if (data.type === 'connection') {
                                console.log(chalk.cyan(`   📡 연결 확인: ${data.message}`));
                            } else if (data.type === 'log') {
                                console.log(chalk.gray(`   📝 로그: [${data.data.engine}] ${data.data.message.substring(0, 50)}...`));
                            } else if (data.type === 'heartbeat') {
                                console.log(chalk.magenta(`   💓 하트비트: ${data.timestamp}`));
                            }
                        } catch (e) {
                            // JSON 파싱 오류 무시
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }

        clearTimeout(timeout);
        console.log(chalk.green(`   ✅ 스트리밍 테스트 완료: ${messageCount}개 메시지 수신`));

    } catch (error) {
        console.log(chalk.red(`   ❌ 스트리밍 오류: ${error.message}`));
    }

    console.log('');
}

/**
 * 🧹 5. 로그 정리 테스트
 */
async function testLogCleanup() {
    console.log(chalk.yellow('🧹 5. 로그 정리 테스트'));

    try {
        const response = await fetch(`${AI_LOGGING_API}?action=clear`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            console.log(chalk.green('   ✅ 로그 정리 성공'));
        } else {
            console.log(chalk.red(`   ❌ 정리 실패: ${result.error}`));
        }
    } catch (error) {
        console.log(chalk.red(`   ❌ 정리 오류: ${error.message}`));
    }

    console.log('');
}

/**
 * 🎯 메인 테스트 실행
 */
async function runTests() {
    console.log(chalk.cyan('🚀 OpenManager Vibe v5 - AI 로깅 시스템 고도화 테스트\n'));

    try {
        await testBasicLogging();
        await testAIEngineLogging();
        await testLogRetrieval();
        await testRealTimeStreaming();
        await testLogCleanup();

        console.log(chalk.green('🎉 모든 테스트 완료!\n'));

        console.log(chalk.cyan('📋 로깅 시스템 사용법:'));
        console.log(chalk.white('   • 로그 조회: GET /api/ai/logging?type=recent&limit=100'));
        console.log(chalk.white('   • 실시간 스트리밍: GET /api/ai/logging/stream'));
        console.log(chalk.white('   • 메트릭 조회: GET /api/ai/logging?type=metrics'));
        console.log(chalk.white('   • AI 사고 과정: GET /api/ai/logging?type=thinking\n'));

    } catch (error) {
        console.error(chalk.red(`🚨 테스트 실행 오류: ${error.message}`));
        process.exit(1);
    }
}

// 테스트 실행
runTests().catch(console.error); 