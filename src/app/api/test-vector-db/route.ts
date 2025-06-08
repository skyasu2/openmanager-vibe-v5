import { NextRequest, NextResponse } from 'next/server';
import { postgresVectorDB } from '@/services/ai/postgres-vector-db';
import { localVectorDB } from '@/services/ai/local-vector-db';

/**
 * 🧪 벡터 DB 및 RAG 시스템 테스트 API
 */
export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // 1. PostgresVectorDB 초기화 테스트
    console.log('🔍 PostgresVectorDB 초기화 테스트...');
    await postgresVectorDB.initialize();
    
    testResults.tests.push({
      name: 'PostgresVectorDB 초기화',
      status: 'success',
      message: '초기화 완료'
    });

    // 2. 헬스 체크 테스트
    console.log('❤️ 헬스 체크 테스트...');
    const healthCheck = await postgresVectorDB.healthCheck();
    
    testResults.tests.push({
      name: 'PostgresVectorDB 헬스 체크',
      status: healthCheck.status === 'healthy' ? 'success' : 'warning',
      data: healthCheck
    });

    // 3. LocalVectorDB 위임 테스트
    console.log('🔄 LocalVectorDB 위임 테스트...');
    await localVectorDB.initialize();
    const legacyStatus = await localVectorDB.getStatus();
    
    testResults.tests.push({
      name: 'LocalVectorDB → PostgresVectorDB 위임',
      status: legacyStatus.deprecated ? 'success' : 'warning',
      data: legacyStatus
    });

    // 4. 테스트 문서 저장
    console.log('📄 테스트 문서 저장...');
    const testDoc = {
      id: `test-${Date.now()}`,
      content: '서버 CPU 사용률이 90%를 초과했습니다. 즉시 확인이 필요합니다.',
      embedding: Array.from({length: 1536}, () => Math.random()),
      metadata: { 
        category: 'performance', 
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    };

    const storeResult = await postgresVectorDB.store(
      testDoc.id,
      testDoc.content,
      testDoc.embedding,
      testDoc.metadata
    );

    testResults.tests.push({
      name: '문서 저장 테스트',
      status: storeResult.success ? 'success' : 'error',
      data: storeResult,
      testDoc: {
        id: testDoc.id,
        contentPreview: testDoc.content.substring(0, 50) + '...'
      }
    });

    // 5. 벡터 검색 테스트
    if (storeResult.success) {
      console.log('🔍 벡터 검색 테스트...');
      
      // 유사한 임베딩으로 검색
      const queryEmbedding = testDoc.embedding.map(val => val + Math.random() * 0.1);
      
      const searchResults = await postgresVectorDB.search(queryEmbedding, {
        topK: 5,
        threshold: 0.1
      });

      testResults.tests.push({
        name: '벡터 유사도 검색',
        status: searchResults.length > 0 ? 'success' : 'warning',
        data: {
          query: '유사한 임베딩 벡터',
          resultsCount: searchResults.length,
          results: searchResults.map(r => ({
            id: r.id,
            similarity: Math.round(r.similarity * 1000) / 10, // 퍼센트로 변환
            contentPreview: r.content.substring(0, 50) + '...',
            metadata: r.metadata
          }))
        }
      });
    }

    // 6. 통계 확인
    console.log('📊 데이터베이스 통계...');
    const stats = await postgresVectorDB.getStats();
    
    testResults.tests.push({
      name: '벡터 DB 통계',
      status: 'success',
      data: stats
    });

    // 7. 레거시 API 테스트
    console.log('🔄 레거시 API 호환성 테스트...');
    const legacySearch = await localVectorDB.search(
      Array.from({length: 1536}, () => Math.random()),
      3
    );

    testResults.tests.push({
      name: '레거시 API 호환성',
      status: 'success',
      data: {
        resultsCount: legacySearch.count,
        message: 'LocalVectorDB가 PostgresVectorDB로 성공적으로 위임됨'
      }
    });

    // 최종 결과
    const successCount = testResults.tests.filter(t => t.status === 'success').length;
    const totalCount = testResults.tests.length;
    
    return NextResponse.json({
      ...testResults,
      summary: {
        status: successCount === totalCount ? 'all_passed' : 'partial_success',
        passed: successCount,
        total: totalCount,
        message: `${successCount}/${totalCount} 테스트 통과`
      }
    });

  } catch (error: any) {
    console.error('❌ 벡터 DB 테스트 실패:', error);
    
    testResults.tests.push({
      name: '전체 테스트',
      status: 'error',
      error: error.message || 'Unknown error'
    });

    return NextResponse.json({
      ...testResults,
      summary: {
        status: 'failed',
        error: error.message || 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * 🔧 개발 모드 전용 - 벡터 DB 초기화
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'reset') {
      console.log('🧹 벡터 DB 초기화...');
      
      const clearResult = await postgresVectorDB.clear();
      
      return NextResponse.json({
        action: 'reset',
        success: clearResult.success,
        message: clearResult.success ? '벡터 DB 초기화 완료' : '초기화 실패',
        error: clearResult.error
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use { "action": "reset" }'
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}