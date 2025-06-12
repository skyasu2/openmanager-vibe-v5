import { NextRequest, NextResponse } from 'next/server';
import { SmartQueryProcessor } from '@/services/ai/SmartQueryProcessor';
import { metricsCollector } from '../../../../services/ai/RealTimeMetricsCollector';

/**
 * 스마트 질의 처리 API
 * 날짜/시간(로컬)과 날씨(외부 API) 구분 처리
 */

const processor = new SmartQueryProcessor();

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let success = false;

    try {
        const body = await request.json();
        const { query } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json({
                success: false,
                error: '질의가 필요합니다.',
                code: 'MISSING_QUERY'
            }, { status: 400 });
        }

        console.log(`🧠 스마트 질의 처리: ${query}`);

        // 질의 분석
        const analysis = processor.analyzeQuery(query);
        console.log(`📊 분석 결과:`, analysis);

        // 질의 처리
        const result = await processor.processQuery(query);
        console.log(`✅ 처리 결과:`, result);

        // 학습 필요성 판단
        const shouldLearn = processor.shouldLearn(analysis);
        const canProcessLocally = processor.canProcessLocally(analysis);

        success = true;

        return NextResponse.json({
            success: true,
            data: {
                ...result.data,
                analysis: {
                    intent: analysis.intent,
                    confidence: analysis.confidence,
                    hasDateTime: analysis.hasDateTime,
                    hasWeather: analysis.hasWeather,
                    hasTypos: analysis.hasTypos,
                    originalQuery: analysis.originalQuery,
                    correctedQuery: analysis.correctedQuery
                },
                capabilities: {
                    canProcessLocally,
                    shouldLearn,
                    requiresExternalAPI: analysis.hasWeather
                }
            },
            message: result.message,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ 스마트 질의 처리 오류:', error);

        return NextResponse.json({
            success: false,
            error: '스마트 질의 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    } finally {
        // 메트릭 기록
        const responseTime = Date.now() - startTime;
        metricsCollector.recordAPICall({
            endpoint: '/api/ai/smart-query',
            method: 'POST',
            timestamp: Date.now(),
            responseTime,
            success,
            statusCode: success ? 200 : 500,
            userAgent: request.headers.get('user-agent') || undefined
        });
    }
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    let success = false;

    try {
        const { searchParams } = new URL(request.url);
        const testQuery = searchParams.get('q') || '지금 몇시인가요?';

        console.log(`🧪 테스트 질의: ${testQuery}`);

        const analysis = processor.analyzeQuery(testQuery);
        const result = await processor.processQuery(testQuery);
        const shouldLearn = processor.shouldLearn(analysis);
        const canProcessLocally = processor.canProcessLocally(analysis);

        success = true;

        return NextResponse.json({
            success: true,
            test: true,
            query: testQuery,
            data: {
                ...result.data,
                analysis: {
                    intent: analysis.intent,
                    confidence: analysis.confidence,
                    hasDateTime: analysis.hasDateTime,
                    hasWeather: analysis.hasWeather,
                    hasTypos: analysis.hasTypos,
                    originalQuery: analysis.originalQuery,
                    correctedQuery: analysis.correctedQuery
                },
                capabilities: {
                    canProcessLocally,
                    shouldLearn,
                    requiresExternalAPI: analysis.hasWeather
                }
            },
            message: result.message,
            examples: {
                datetime: '지금 몇시인가요?',
                weather: '오늘 날씨는 어때요?',
                mixed: '지금 시간과 날씨를 알려주세요.',
                typo: '지금 몇시인가여? 오늘 날시는 어떄요?'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ 테스트 질의 처리 오류:', error);

        return NextResponse.json({
            success: false,
            error: '테스트 질의 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    } finally {
        // 메트릭 기록
        const responseTime = Date.now() - startTime;
        metricsCollector.recordAPICall({
            endpoint: '/api/ai/smart-query',
            method: 'GET',
            timestamp: Date.now(),
            responseTime,
            success,
            statusCode: success ? 200 : 500,
            userAgent: request.headers.get('user-agent') || undefined
        });
    }
} 