/**
 * 🤖 AI 에이전트 개발 어시스턴트 API
 * 
 * OpenManager Vibe v5의 AI 시스템들을 통합 활용하여
 * 개발 관련 질의응답, 코드 분석, 성능 최적화 제안을 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import { AIEngineChain } from '@/core/ai/AIEngineChain';
import { aiLogger, LogLevel, LogCategory } from '@/services/ai/logging/AILogger';

// 전역 AI 시스템 인스턴스
let unifiedAI: UnifiedAIEngine | null = null;
let aiChain: AIEngineChain | null = null;

function getAISystem() {
    if (!unifiedAI) {
        unifiedAI = UnifiedAIEngine.getInstance();
    }
    if (!aiChain) {
        aiChain = new AIEngineChain();
    }
    return { unifiedAI, aiChain };
}

/**
 * GET: AI 시스템 상태 및 개발 환경 분석
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'status';

        const { unifiedAI, aiChain } = getAISystem();

        switch (action) {
            case 'status':
                // AI 시스템 전체 상태 조회
                const systemHealth = await aiChain.getSystemHealth();
                const unifiedStatus = await unifiedAI.getSystemStatus();

                return NextResponse.json({
                    success: true,
                    data: {
                        timestamp: new Date().toISOString(),
                        aiChain: systemHealth,
                        unifiedEngine: unifiedStatus,
                        environment: {
                            nodeEnv: process.env.NODE_ENV,
                            platform: process.platform,
                            version: process.version
                        },
                        capabilities: {
                            mcp: systemHealth.engines?.MCP || false,
                            rag: systemHealth.engines?.RAG || false,
                            googleAI: systemHealth.engines?.['Google AI'] || false,
                            ml: true // 항상 사용 가능
                        }
                    },
                    message: '🤖 AI 개발 어시스턴트 시스템 상태입니다.'
                });

            case 'health':
                // 상세 건강 상태 체크
                const healthCheck = await Promise.all([
                    aiChain.getSystemHealth(),
                    unifiedAI.getSystemStatus()
                ]);

                const overallHealth = healthCheck[0].overall === 'healthy' &&
                    healthCheck[1].status === 'ready' ? 'healthy' : 'degraded';

                return NextResponse.json({
                    success: true,
                    data: {
                        overall: overallHealth,
                        components: {
                            aiChain: healthCheck[0],
                            unifiedEngine: healthCheck[1]
                        },
                        recommendations: generateHealthRecommendations(healthCheck),
                        timestamp: new Date().toISOString()
                    },
                    message: `시스템 상태: ${overallHealth}`
                });

            case 'capabilities':
                // AI 시스템 기능 목록
                return NextResponse.json({
                    success: true,
                    data: {
                        developmentAssistant: {
                            codeAnalysis: '코드 품질 및 구조 분석',
                            performanceOptimization: '성능 최적화 제안',
                            architectureReview: '아키텍처 검토 및 개선',
                            bugDetection: '잠재적 버그 및 취약점 감지',
                            testGeneration: '테스트 케이스 생성 제안',
                            documentationHelp: '문서화 지원'
                        },
                        aiEngines: {
                            mcp: 'Model Context Protocol - 실시간 컨텍스트 분석',
                            rag: 'Retrieval-Augmented Generation - 지식 기반 조언',
                            googleAI: 'Google AI - 복잡한 문제 해결',
                            ml: 'Machine Learning - 성능 예측 및 최적화'
                        },
                        integrations: {
                            nextjs: 'Next.js 15.3.3 최적화',
                            typescript: 'TypeScript 타입 안전성',
                            react: 'React 모범 사례',
                            serverMonitoring: '서버 모니터링 특화'
                        }
                    },
                    message: 'AI 개발 어시스턴트 기능 목록입니다.'
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: `지원하지 않는 액션: ${action}`
                }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ AI 개발 어시스턴트 GET 오류:', error);

        await aiLogger.logError('DevelopmentAssistantAPI', LogCategory.API, error as Error, {
            action: 'GET',
            endpoint: '/api/ai-agent/development-assistant'
        });

        return NextResponse.json({
            success: false,
            error: error.message || '서버 오류가 발생했습니다.'
        }, { status: 500 });
    }
}

/**
 * POST: 개발 관련 질의응답 및 분석 요청
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, query, context, options } = body;

        if (!action) {
            return NextResponse.json({
                success: false,
                error: 'action 필드가 필요합니다.'
            }, { status: 400 });
        }

        const { unifiedAI, aiChain } = getAISystem();
        const startTime = Date.now();

        switch (action) {
            case 'analyze':
                // 코드/시스템 분석
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'query 필드가 필요합니다.'
                    }, { status: 400 });
                }

                const analysisResult = await performDevelopmentAnalysis(
                    query,
                    context,
                    { unifiedAI, aiChain }
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        ...analysisResult,
                        processingTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    },
                    message: '🔍 개발 분석이 완료되었습니다.'
                });

            case 'consult':
                // AI 개발 컨설팅
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'query 필드가 필요합니다.'
                    }, { status: 400 });
                }

                const consultResult = await performDevelopmentConsulting(
                    query,
                    context,
                    options,
                    { unifiedAI, aiChain }
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        ...consultResult,
                        processingTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    },
                    message: '💬 AI 개발 컨설팅이 완료되었습니다.'
                });

            case 'optimize':
                // 성능 최적화 제안
                const optimizationResult = await performOptimizationAnalysis(
                    query || '전체 시스템',
                    context,
                    { unifiedAI, aiChain }
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        ...optimizationResult,
                        processingTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    },
                    message: '⚡ 성능 최적화 분석이 완료되었습니다.'
                });

            case 'review':
                // 코드 리뷰
                if (!context?.component && !context?.code) {
                    return NextResponse.json({
                        success: false,
                        error: 'context.component 또는 context.code 필드가 필요합니다.'
                    }, { status: 400 });
                }

                const reviewResult = await performCodeReview(
                    context,
                    options,
                    { unifiedAI, aiChain }
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        ...reviewResult,
                        processingTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    },
                    message: '📝 코드 리뷰가 완료되었습니다.'
                });

            case 'suggest':
                // 개발 제안사항
                const suggestionResult = await generateDevelopmentSuggestions(
                    query || '일반적인 개선사항',
                    context,
                    { unifiedAI, aiChain }
                );

                return NextResponse.json({
                    success: true,
                    data: {
                        ...suggestionResult,
                        processingTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    },
                    message: '💡 개발 제안사항이 생성되었습니다.'
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: `지원하지 않는 액션: ${action}`
                }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ AI 개발 어시스턴트 POST 오류:', error);

        await aiLogger.logError('DevelopmentAssistantAPI', LogCategory.API, error as Error, {
            action: 'POST',
            endpoint: '/api/ai-agent/development-assistant'
        });

        return NextResponse.json({
            success: false,
            error: error.message || '서버 오류가 발생했습니다.'
        }, { status: 500 });
    }
}

/**
 * 🔍 개발 분석 수행
 */
async function performDevelopmentAnalysis(
    query: string,
    context: any,
    aiSystems: { unifiedAI: UnifiedAIEngine, aiChain: AIEngineChain }
) {
    const analysisQuery = {
        id: `dev_analysis_${Date.now()}`,
        text: `OpenManager Vibe v5 개발 분석 요청:

**분석 대상:** ${query}

**프로젝트 컨텍스트:**
- Next.js 15.3.3 + TypeScript
- AI 시스템: MCP, RAG, Google AI, ML 엔진 통합
- 서버 모니터링 AI 에이전트 시스템

**분석 요청사항:**
1. 현재 상태 평가
2. 잠재적 문제점 식별
3. 개선 방안 제시
4. 성능 최적화 가능성
5. 보안 고려사항

${context ? `\n**추가 컨텍스트:**\n${JSON.stringify(context, null, 2)}` : ''}

구체적이고 실행 가능한 분석 결과를 제공해주세요.`,
        context: context || {}
    };

    try {
        // AI 체인을 통한 분석 실행
        const aiResponse = await aiSystems.aiChain.processQuery(analysisQuery);

        return {
            query,
            analysis: aiResponse.answer,
            confidence: aiResponse.confidence,
            engine: aiResponse.engine,
            sources: aiResponse.sources,
            recommendations: extractRecommendations(aiResponse.answer),
            issues: extractIssues(aiResponse.answer),
            optimizations: extractOptimizations(aiResponse.answer)
        };

    } catch (error) {
        console.error('개발 분석 실패:', error);
        throw new Error(`개발 분석 실패: ${error.message}`);
    }
}

/**
 * 💬 개발 컨설팅 수행
 */
async function performDevelopmentConsulting(
    query: string,
    context: any,
    options: any,
    aiSystems: { unifiedAI: UnifiedAIEngine, aiChain: AIEngineChain }
) {
    const consultingQuery = {
        id: `dev_consulting_${Date.now()}`,
        text: `OpenManager Vibe v5 개발 컨설팅:

**개발자 질문:** ${query}

**프로젝트 특성:**
- 서버 모니터링 AI 에이전트 시스템
- Multi-AI 엔진 아키텍처 (MCP, RAG, Google AI, ML)
- 실시간 데이터 처리 및 분석
- TypeScript + Next.js 15.3.3

**컨설팅 요청:**
- 구체적이고 실행 가능한 조언
- 코드 예제 포함 (가능한 경우)
- 모범 사례 및 안티패턴
- 성능 및 보안 고려사항
- OpenManager Vibe v5에 특화된 권장사항

${context ? `\n**현재 상황:**\n${JSON.stringify(context, null, 2)}` : ''}
${options ? `\n**옵션:**\n${JSON.stringify(options, null, 2)}` : ''}`,
        context: { ...context, consulting: true }
    };

    try {
        const aiResponse = await aiSystems.aiChain.processQuery(consultingQuery);

        return {
            query,
            advice: aiResponse.answer,
            confidence: aiResponse.confidence,
            engine: aiResponse.engine,
            codeExamples: extractCodeExamples(aiResponse.answer),
            bestPractices: extractBestPractices(aiResponse.answer),
            warnings: extractWarnings(aiResponse.answer),
            nextSteps: extractNextSteps(aiResponse.answer)
        };

    } catch (error) {
        console.error('개발 컨설팅 실패:', error);
        throw new Error(`개발 컨설팅 실패: ${error.message}`);
    }
}

/**
 * ⚡ 성능 최적화 분석
 */
async function performOptimizationAnalysis(
    target: string,
    context: any,
    aiSystems: { unifiedAI: UnifiedAIEngine, aiChain: AIEngineChain }
) {
    const optimizationQuery = {
        id: `optimization_${Date.now()}`,
        text: `OpenManager Vibe v5 성능 최적화 분석:

**최적화 대상:** ${target}

**시스템 특성:**
- AI 엔진 다중 처리 (MCP, RAG, Google AI, ML)
- 실시간 서버 모니터링
- 대용량 데이터 처리
- Next.js 서버리스 환경

**최적화 분석 요청:**
1. 현재 성능 병목점 식별
2. 메모리 사용량 최적화
3. 응답시간 개선 방안
4. 캐싱 전략 제안
5. 데이터베이스 쿼리 최적화
6. AI 엔진 효율성 개선

${context ? `\n**현재 성능 데이터:**\n${JSON.stringify(context, null, 2)}` : ''}

구체적인 최적화 방안과 예상 개선 효과를 제시해주세요.`,
        context: { ...context, optimization: true }
    };

    try {
        const aiResponse = await aiSystems.aiChain.processQuery(optimizationQuery);

        return {
            target,
            analysis: aiResponse.answer,
            confidence: aiResponse.confidence,
            engine: aiResponse.engine,
            bottlenecks: extractBottlenecks(aiResponse.answer),
            optimizations: extractOptimizations(aiResponse.answer),
            cachingStrategies: extractCachingStrategies(aiResponse.answer),
            expectedImprovements: extractExpectedImprovements(aiResponse.answer)
        };

    } catch (error) {
        console.error('성능 최적화 분석 실패:', error);
        throw new Error(`성능 최적화 분석 실패: ${error.message}`);
    }
}

/**
 * 📝 코드 리뷰 수행
 */
async function performCodeReview(
    context: any,
    options: any,
    aiSystems: { unifiedAI: UnifiedAIEngine, aiChain: AIEngineChain }
) {
    const reviewQuery = {
        id: `code_review_${Date.now()}`,
        text: `OpenManager Vibe v5 코드 리뷰:

**리뷰 대상:**
${context.component ? `- 컴포넌트: ${context.component}` : ''}
${context.code ? `- 코드:\n\`\`\`\n${context.code}\n\`\`\`` : ''}

**리뷰 기준:**
1. 코드 품질 및 가독성
2. TypeScript 타입 안전성
3. React/Next.js 모범 사례
4. 성능 최적화 가능성
5. 보안 취약점 검토
6. AI 시스템 통합 관련 개선사항
7. 테스트 가능성
8. 유지보수성

**프로젝트 컨텍스트:**
- OpenManager Vibe v5 AI 에이전트 시스템
- Multi-AI 엔진 아키텍처
- 실시간 모니터링 시스템

${options ? `\n**리뷰 옵션:**\n${JSON.stringify(options, null, 2)}` : ''}

상세한 리뷰 결과와 구체적인 개선 제안을 제공해주세요.`,
        context: { ...context, codeReview: true }
    };

    try {
        const aiResponse = await aiSystems.aiChain.processQuery(reviewQuery);

        return {
            component: context.component,
            review: aiResponse.answer,
            confidence: aiResponse.confidence,
            engine: aiResponse.engine,
            qualityScore: extractQualityScore(aiResponse.answer),
            issues: extractIssues(aiResponse.answer),
            suggestions: extractSuggestions(aiResponse.answer),
            securityConcerns: extractSecurityConcerns(aiResponse.answer),
            performanceImprovements: extractPerformanceImprovements(aiResponse.answer)
        };

    } catch (error) {
        console.error('코드 리뷰 실패:', error);
        throw new Error(`코드 리뷰 실패: ${error.message}`);
    }
}

/**
 * 💡 개발 제안사항 생성
 */
async function generateDevelopmentSuggestions(
    topic: string,
    context: any,
    aiSystems: { unifiedAI: UnifiedAIEngine, aiChain: AIEngineChain }
) {
    const suggestionQuery = {
        id: `suggestions_${Date.now()}`,
        text: `OpenManager Vibe v5 개발 제안사항:

**제안 주제:** ${topic}

**프로젝트 현황:**
- AI 에이전트 서버 모니터링 시스템
- 4종 AI 엔진 통합 (MCP, RAG, Google AI, ML)
- Next.js 15.3.3 + TypeScript
- 실시간 데이터 처리 및 분석

**제안 요청 영역:**
1. 아키텍처 개선
2. 새로운 기능 아이디어
3. 개발 생산성 향상
4. 코드 품질 개선
5. 성능 최적화
6. 사용자 경험 개선
7. 보안 강화
8. 테스트 전략

${context ? `\n**현재 상황:**\n${JSON.stringify(context, null, 2)}` : ''}

혁신적이고 실용적인 개발 제안사항을 제공해주세요.`,
        context: { ...context, suggestions: true }
    };

    try {
        const aiResponse = await aiSystems.aiChain.processQuery(suggestionQuery);

        return {
            topic,
            suggestions: aiResponse.answer,
            confidence: aiResponse.confidence,
            engine: aiResponse.engine,
            innovations: extractInnovations(aiResponse.answer),
            improvements: extractImprovements(aiResponse.answer),
            features: extractFeatures(aiResponse.answer),
            priorities: extractPriorities(aiResponse.answer)
        };

    } catch (error) {
        console.error('개발 제안사항 생성 실패:', error);
        throw new Error(`개발 제안사항 생성 실패: ${error.message}`);
    }
}

/**
 * 🏥 건강 상태 권장사항 생성
 */
function generateHealthRecommendations(healthChecks: any[]) {
    const recommendations = [];

    // AI 체인 상태 기반 권장사항
    const aiChainHealth = healthChecks[0];
    if (aiChainHealth.overall !== 'healthy') {
        recommendations.push({
            type: 'critical',
            title: 'AI 엔진 체인 상태 개선 필요',
            description: `AI 엔진 체인 상태가 ${aiChainHealth.overall}입니다.`,
            actions: [
                'MCP 서버 연결 상태 확인',
                'RAG 엔진 초기화 검토',
                'Google AI API 키 검증'
            ]
        });
    }

    // 통합 엔진 상태 기반 권장사항
    const unifiedHealth = healthChecks[1];
    if (unifiedHealth.status !== 'ready') {
        recommendations.push({
            type: 'warning',
            title: '통합 AI 엔진 초기화 필요',
            description: `통합 AI 엔진 상태가 ${unifiedHealth.status}입니다.`,
            actions: [
                '컴포넌트 초기화 재시도',
                '환경 변수 설정 확인',
                '의존성 모듈 상태 점검'
            ]
        });
    }

    return recommendations;
}

/**
 * 🔍 응답 텍스트에서 정보 추출 헬퍼 함수들
 */
function extractRecommendations(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('권장') || line.includes('제안') || line.includes('추천')
    ).slice(0, 5);
}

function extractIssues(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('문제') || line.includes('이슈') || line.includes('주의')
    ).slice(0, 5);
}

function extractOptimizations(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('최적화') || line.includes('개선') || line.includes('효율')
    ).slice(0, 5);
}

function extractCodeExamples(text: string): string[] {
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    return codeBlocks ? codeBlocks.slice(0, 3) : [];
}

function extractBestPractices(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('모범') || line.includes('베스트') || line.includes('권장사항')
    ).slice(0, 5);
}

function extractWarnings(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('경고') || line.includes('주의') || line.includes('위험')
    ).slice(0, 3);
}

function extractNextSteps(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('다음') || line.includes('단계') || line.includes('순서')
    ).slice(0, 5);
}

function extractBottlenecks(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('병목') || line.includes('느림') || line.includes('지연')
    ).slice(0, 5);
}

function extractCachingStrategies(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('캐시') || line.includes('저장') || line.includes('메모리')
    ).slice(0, 3);
}

function extractExpectedImprovements(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('%') || line.includes('배') || line.includes('향상')
    ).slice(0, 5);
}

function extractQualityScore(text: string): number {
    // 간단한 품질 점수 추출 로직
    if (text.includes('우수') || text.includes('좋음')) return 85;
    if (text.includes('보통') || text.includes('평균')) return 70;
    if (text.includes('개선') || text.includes('문제')) return 55;
    return 75;
}

function extractSuggestions(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('제안') || line.includes('개선') || line.includes('변경')
    ).slice(0, 5);
}

function extractSecurityConcerns(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('보안') || line.includes('취약') || line.includes('위험')
    ).slice(0, 3);
}

function extractPerformanceImprovements(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('성능') || line.includes('속도') || line.includes('최적화')
    ).slice(0, 5);
}

function extractInnovations(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('혁신') || line.includes('새로운') || line.includes('창의')
    ).slice(0, 3);
}

function extractImprovements(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('개선') || line.includes('향상') || line.includes('업그레이드')
    ).slice(0, 5);
}

function extractFeatures(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('기능') || line.includes('특징') || line.includes('추가')
    ).slice(0, 5);
}

function extractPriorities(text: string): string[] {
    const lines = text.split('\n');
    return lines.filter(line =>
        line.includes('우선') || line.includes('중요') || line.includes('핵심')
    ).slice(0, 3);
}