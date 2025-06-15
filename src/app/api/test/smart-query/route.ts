import { NextRequest, NextResponse } from 'next/server';
import { SmartQueryTester } from '@/testing/SmartQueryTester';
import { metricsCollector } from '../../../../services/ai/RealTimeMetricsCollector';

/**
 * 스마트 질의 테스터 API
 * 바로바로 테스트할 수 있는 엔드포인트
 */

const tester = new SmartQueryTester();

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    let success = false;

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'quick';
        const query = searchParams.get('query');
        const category = searchParams.get('category') as 'datetime' | 'weather' | 'mixed' | 'general';

        console.log(`🧪 테스트 API 호출: action=${action}`);

        let result;

        switch (action) {
            case 'quick':
                console.log('⚡ 빠른 테스트 실행');
                result = await tester.runQuickTest();
                break;

            case 'all':
                console.log('🚀 전체 테스트 실행');
                result = await tester.runAllTests();
                break;

            case 'category':
                if (!category) {
                    return NextResponse.json({
                        success: false,
                        error: 'category 파라미터가 필요합니다.',
                        availableCategories: ['datetime', 'weather', 'mixed', 'general']
                    }, { status: 400 });
                }
                console.log(`🎯 ${category} 카테고리 테스트 실행`);
                result = await tester.runCategoryTest(category);
                break;

            case 'custom':
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'query 파라미터가 필요합니다.',
                        example: '/api/test/smart-query?action=custom&query=지금몇시인가요'
                    }, { status: 400 });
                }
                console.log(`🎭 커스텀 질의 테스트: ${query}`);
                result = await tester.testCustomQuery(query);
                break;

            case 'results':
                result = tester.getTestResults();
                break;

            case 'clear':
                tester.clearResults();
                result = { message: '테스트 결과가 초기화되었습니다.' };
                break;

            default:
                return NextResponse.json({
                    success: false,
                    error: '알 수 없는 액션입니다.',
                    availableActions: ['quick', 'all', 'category', 'custom', 'results', 'clear'],
                    examples: {
                        quick: '/api/test/smart-query?action=quick',
                        all: '/api/test/smart-query?action=all',
                        category: '/api/test/smart-query?action=category&category=datetime',
                        custom: '/api/test/smart-query?action=custom&query=지금몇시인가요',
                        results: '/api/test/smart-query?action=results',
                        clear: '/api/test/smart-query?action=clear'
                    }
                }, { status: 400 });
        }

        success = true;
        return NextResponse.json({
            success: true,
            action,
            ...result
        });

    } catch (error) {
        console.error('❌ 테스트 API 오류:', error);

        return NextResponse.json({
            success: false,
            error: '테스트 실행 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    } finally {
        // 메트릭 기록
        const responseTime = Date.now() - startTime;
        metricsCollector.recordAPICall({
            endpoint: '/api/test/smart-query',
            method: 'GET',
            timestamp: Date.now(),
            responseTime,
            success,
            statusCode: success ? 200 : 500,
            userAgent: request.headers.get('user-agent') || undefined
        });
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let success = false;

    try {
        const { action, query, category, testCases } = await request.json();

        console.log(`🧪 테스트 API POST 호출: action=${action}`);

        let result;

        switch (action) {
            case 'custom':
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'query가 필요합니다.'
                    }, { status: 400 });
                }

                result = await tester.testCustomQuery(query);
                break;

            case 'batch':
                if (!testCases || !Array.isArray(testCases)) {
                    return NextResponse.json({
                        success: false,
                        error: 'testCases 배열이 필요합니다.',
                        example: {
                            action: 'batch',
                            testCases: [
                                { query: '지금 몇시인가요?' },
                                { query: '오늘 날씨는?' }
                            ]
                        }
                    }, { status: 400 });
                }

                console.log(`📦 배치 테스트 실행: ${testCases.length}개 질의`);
                const batchResults = [];
                for (const testCase of testCases) {
                    if (testCase.query) {
                        const batchResult = await tester.testCustomQuery(testCase.query);
                        batchResults.push(batchResult);
                    }
                }
                result = {
                    totalTests: batchResults.length,
                    passedTests: batchResults.filter(r => r.passed).length,
                    results: batchResults
                };
                break;

            default:
                return NextResponse.json({
                    success: false,
                    error: '알 수 없는 액션입니다.',
                    availableActions: ['custom', 'batch']
                }, { status: 400 });
        }

        success = true;
        return NextResponse.json({
            success: true,
            action,
            ...result
        });

    } catch (error) {
        console.error('❌ 테스트 API POST 오류:', error);

        return NextResponse.json({
            success: false,
            error: '테스트 실행 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    } finally {
        // 메트릭 기록
        const responseTime = Date.now() - startTime;
        metricsCollector.recordAPICall({
            endpoint: '/api/test/smart-query',
            method: 'POST',
            timestamp: Date.now(),
            responseTime,
            success,
            statusCode: success ? 200 : 500,
            userAgent: request.headers.get('user-agent') || undefined
        });
    }
} 