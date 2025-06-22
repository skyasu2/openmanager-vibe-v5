/**
 * 🚀 Supabase RAG Engine 테스트 API
 * Vercel 환경에서 벡터 검색 시스템 테스트
 */

import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { query, maxResults = 5, threshold = 0.7, category } = body;

        if (!query) {
            return NextResponse.json({
                success: false,
                error: '검색 쿼리가 필요합니다',
                processingTime: Date.now() - startTime
            }, { status: 400 });
        }

        console.log(`🔍 Supabase RAG 테스트 시작: "${query}"`);

        // Supabase RAG Engine 인스턴스 가져오기
        const ragEngine = getSupabaseRAGEngine();

        // 헬스체크 먼저 수행
        const healthCheck = await ragEngine.healthCheck();
        console.log('🏥 RAG Engine 헬스체크:', healthCheck);

        // 벡터 검색 수행
        const searchResult = await ragEngine.searchSimilar(query, {
            maxResults,
            threshold,
            category
        });

        const totalTime = Date.now() - startTime;

        // 상세한 결과 반환
        return NextResponse.json({
            success: true,
            query,
            searchResult,
            healthCheck,
            environment: {
                isVercel: !!process.env.VERCEL,
                nodeEnv: process.env.NODE_ENV,
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                openaiRemoved: true, // OpenAI 의존성 완전 제거
                ragEngineType: 'SUPABASE_ONLY'
            },
            performance: {
                totalTime,
                ragSearchTime: searchResult.processingTime
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Supabase RAG 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || 'top 명령어 사용법';
        const maxResults = parseInt(searchParams.get('maxResults') || '5');
        const threshold = parseFloat(searchParams.get('threshold') || '0.7');
        const category = searchParams.get('category') || undefined;

        console.log(`🔍 Supabase RAG GET 테스트: "${query}"`);

        const ragEngine = getSupabaseRAGEngine();

        // 간단한 테스트 수행
        const [healthCheck, searchResult] = await Promise.all([
            ragEngine.healthCheck(),
            ragEngine.searchSimilar(query, { maxResults, threshold, category })
        ]);

        const totalTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            message: '🚀 Supabase RAG Engine 테스트 완료',
            query,
            results: {
                found: searchResult.results.length,
                topResult: searchResult.results[0] ? {
                    id: searchResult.results[0].id,
                    category: searchResult.results[0].metadata?.category,
                    similarity: searchResult.results[0].similarity
                } : null,
                allResults: searchResult.results.map(r => ({
                    id: r.id,
                    category: r.metadata?.category,
                    similarity: r.similarity,
                    preview: r.content.substring(0, 100) + '...'
                }))
            },
            health: healthCheck,
            performance: {
                totalTime,
                ragSearchTime: searchResult.processingTime,
                efficiency: `${Math.round(searchResult.results.length / (totalTime / 1000))} results/sec`
            },
            environment: {
                platform: process.env.VERCEL ? 'Vercel' : 'Local',
                region: process.env.VERCEL_REGION || 'local',
                nodeVersion: process.version
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Supabase RAG GET 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            message: '❌ Supabase RAG Engine 테스트 실패',
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 