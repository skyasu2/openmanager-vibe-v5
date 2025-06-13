/**
 * 🗄️ Supabase Vector DB 테스트 API
 * 
 * PostgreSQL + pgvector 기반 벡터 검색 시스템 테스트
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseVectorService } from '@/lib/vector/supabase-vector';

/**
 * GET /api/test-supabase-vector
 * Supabase Vector DB 상태 확인 및 테스트
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🗄️ Supabase Vector DB 테스트 시작...');

        // 1. 초기화 및 상태 확인
        await supabaseVectorService.initialize();
        const status = await supabaseVectorService.getStatus();

        // 2. 기본 문서 로드 (문서가 없는 경우)
        if (status.documentCount === 0) {
            console.log('📚 기본 문서 로드 중...');
            await supabaseVectorService.loadDefaultDocuments();
        }

        // 3. 테스트 쿼리 실행
        const testQueries = [
            '서버 모니터링 방법',
            'AI 분석 기능',
            '문제 해결 가이드'
        ];

        const searchResults = [];
        for (const query of testQueries) {
            const results = await supabaseVectorService.searchSimilar(query, {
                limit: 2,
                threshold: 0.3
            });

            searchResults.push({
                query,
                resultCount: results.length,
                results: results.map(r => ({
                    id: r.id,
                    content: r.content.substring(0, 100) + '...',
                    similarity: r.similarity,
                    category: r.metadata.category
                }))
            });
        }

        // 4. 최종 상태 재확인
        const finalStatus = await supabaseVectorService.getStatus();

        return NextResponse.json({
            success: true,
            message: "Supabase Vector DB 테스트 완료",
            data: {
                status: {
                    connected: finalStatus.connected,
                    initialized: finalStatus.initialized,
                    documentCount: finalStatus.documentCount,
                    vectorDimensions: 384,
                    database: 'PostgreSQL + pgvector'
                },
                testResults: {
                    queries: searchResults,
                    totalQueries: testQueries.length,
                    avgResultsPerQuery: searchResults.reduce((sum, r) => sum + r.resultCount, 0) / testQueries.length
                },
                performance: {
                    responseTime: Date.now(),
                    cacheEnabled: true,
                    indexType: 'ivfflat (cosine similarity)'
                }
            }
        });

    } catch (error) {
        console.error('❌ Supabase Vector DB 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            message: "Supabase Vector DB 테스트 실패",
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            data: {
                status: {
                    connected: false,
                    initialized: false,
                    documentCount: 0,
                    vectorDimensions: 384,
                    database: 'PostgreSQL + pgvector'
                }
            }
        }, { status: 500 });
    }
}

/**
 * POST /api/test-supabase-vector
 * 새 문서 추가 테스트
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, metadata = {} } = body;

        if (!content) {
            return NextResponse.json({
                success: false,
                message: "문서 내용이 필요합니다",
            }, { status: 400 });
        }

        // 문서 추가
        const result = await supabaseVectorService.addDocument(content, {
            ...metadata,
            source: 'api-test',
            timestamp: new Date().toISOString()
        });

        if (result) {
            return NextResponse.json({
                success: true,
                message: "문서 추가 완료",
                data: {
                    documentId: result.id,
                    content: result.content,
                    metadata: result.metadata,
                    created_at: result.created_at
                }
            });
        } else {
            throw new Error('문서 추가 실패');
        }

    } catch (error) {
        console.error('❌ 문서 추가 실패:', error);

        return NextResponse.json({
            success: false,
            message: "문서 추가 실패",
            error: error instanceof Error ? error.message : '알 수 없는 오류'
        }, { status: 500 });
    }
} 