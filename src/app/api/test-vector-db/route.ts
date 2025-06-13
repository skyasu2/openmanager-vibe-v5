/**
 * 📚 벡터 DB 테스트 API
 * 
 * RAG 엔진의 벡터 데이터베이스 상태를 테스트하고 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';

let ragEngine: LocalRAGEngine | null = null;

/**
 * GET /api/test-vector-db
 * 벡터 DB 상태 확인 및 테스트
 */
export async function GET(request: NextRequest) {
    try {
        // RAG 엔진 초기화 (싱글톤)
        if (!ragEngine) {
            ragEngine = new LocalRAGEngine();
            await ragEngine.initialize();
        }

        // 벡터 DB 상태 확인
        const stats = ragEngine.getStats();

        // 테스트 쿼리 실행
        const testQuery = "서버 모니터링 방법";
        const testResult = await ragEngine.search({
            query: testQuery,
            maxResults: 3,
            threshold: 0.3
        });

        return NextResponse.json({
            success: true,
            message: "벡터 DB 테스트 완료",
            data: {
                status: {
                    initialized: stats.initialized,
                    totalDocuments: stats.totalDocuments,
                    totalEmbeddings: stats.totalEmbeddings
                },
                testQuery: {
                    query: testQuery,
                    results: testResult.results.length,
                    confidence: testResult.confidence,
                    processingTime: testResult.processingTime
                },
                vectorCache: {
                    directory: "data/vector-cache/",
                    exists: true
                }
            }
        });

    } catch (error) {
        console.error('❌ 벡터 DB 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            message: "벡터 DB 테스트 실패",
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            data: {
                status: {
                    initialized: false,
                    totalDocuments: 0,
                    totalEmbeddings: 0
                }
            }
        }, { status: 500 });
    }
}

/**
 * POST /api/test-vector-db
 * 벡터 DB에 테스트 문서 추가
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, documents } = body;

        // RAG 엔진 초기화
        if (!ragEngine) {
            ragEngine = new LocalRAGEngine();
            await ragEngine.initialize();
        }

        let result;

        if (documents && Array.isArray(documents)) {
            // 문서 추가 모드
            for (const doc of documents) {
                await ragEngine.addDocument(doc);
            }

            result = {
                action: 'documents_added',
                count: documents.length,
                stats: ragEngine.getStats()
            };
        } else if (query) {
            // 검색 모드
            const searchResult = await ragEngine.search({
                query,
                maxResults: 5,
                threshold: 0.2
            });

            result = {
                action: 'search_performed',
                query,
                results: searchResult
            };
        } else {
            throw new Error('query 또는 documents 파라미터가 필요합니다.');
        }

        return NextResponse.json({
            success: true,
            message: "벡터 DB 작업 완료",
            data: result
        });

    } catch (error) {
        console.error('❌ 벡터 DB 작업 실패:', error);

        return NextResponse.json({
            success: false,
            message: "벡터 DB 작업 실패",
            error: error instanceof Error ? error.message : '알 수 없는 오류'
        }, { status: 500 });
    }
} 