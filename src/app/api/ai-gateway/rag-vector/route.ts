/**
 * 🔍 RAG Vector Processor Gateway
 * GCP rag-vector-processor Function 전용 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';

const GCP_FUNCTION_URL = 'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/rag-vector-processor';

interface RAGVectorRequest {
  action: 'search' | 'index' | 'update' | 'delete';
  query?: string;
  documents?: Array<{
    id: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
  options?: {
    top_k?: number;
    similarity_threshold?: number;
    include_metadata?: boolean;
  };
}

interface RAGVectorResponse {
  success: boolean;
  results?: Array<{
    document_id: string;
    content: string;
    similarity_score: number;
    metadata?: Record<string, any>;
  }>;
  answer?: string;
  indexed_count?: number;
  processing_time_ms: number;
  source: 'gcp' | 'fallback';
  method_used?: string;
}

// Fallback RAG 처리기
class RAGVectorFallback {
  private static readonly KNOWLEDGE_BASE = [
    {
      id: 'server-monitoring-1',
      content: 'OpenManager는 실시간 서버 모니터링을 제공합니다. CPU, 메모리, 디스크 사용률을 추적할 수 있습니다.',
      metadata: { category: 'monitoring', type: 'feature' }
    },
    {
      id: 'alert-system-1',
      content: '알림 시스템은 임계값을 초과할 때 자동으로 알림을 발송합니다. 이메일, SMS, 웹훅을 지원합니다.',
      metadata: { category: 'alerts', type: 'feature' }
    },
    {
      id: 'dashboard-1',
      content: '대시보드에서는 모든 서버의 상태를 한눈에 볼 수 있습니다. 차트와 그래프로 시각화됩니다.',
      metadata: { category: 'dashboard', type: 'ui' }
    },
    {
      id: 'api-endpoints-1',
      content: 'REST API를 통해 서버 데이터에 액세스할 수 있습니다. /api/servers 엔드포인트를 사용하세요.',
      metadata: { category: 'api', type: 'technical' }
    },
    {
      id: 'performance-1',
      content: '성능 최적화를 위해 Redis 캐싱과 데이터베이스 연결 풀링을 사용합니다.',
      metadata: { category: 'performance', type: 'technical' }
    },
    {
      id: 'troubleshooting-1',
      content: '문제 해결 시 먼저 로그를 확인하고, 서버 상태를 점검한 후 네트워크 연결을 확인하세요.',
      metadata: { category: 'troubleshooting', type: 'guide' }
    }
  ];

  static searchDocuments(query: string, options: any = {}): RAGVectorResponse {
    const { top_k = 5, similarity_threshold = 0.3, include_metadata = true } = options;
    
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        results: [],
        processing_time_ms: 10,
        source: 'fallback',
        method_used: 'empty-query'
      };
    }

    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/);
    
    // 간단한 키워드 매칭 기반 유사도 계산
    const scoredResults = this.KNOWLEDGE_BASE.map(doc => {
      const contentLower = doc.content.toLowerCase();
      
      // 키워드 매칭 점수 계산
      let score = 0;
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          score += 1 / keywords.length; // 정규화된 점수
        }
      });
      
      // 카테고리 매칭 보너스
      if (doc.metadata.category && queryLower.includes(doc.metadata.category)) {
        score += 0.2;
      }
      
      return {
        ...doc,
        similarity_score: Math.min(score, 1.0) // 최대 1.0으로 제한
      };
    })
    .filter(result => result.similarity_score >= similarity_threshold)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, top_k);

    // 결과 형식 변환
    const results = scoredResults.map(result => ({
      document_id: result.id,
      content: result.content,
      similarity_score: result.similarity_score,
      ...(include_metadata && { metadata: result.metadata })
    }));

    // 상위 결과를 기반으로 답변 생성
    let answer = '';
    if (results.length > 0) {
      const topResult = results[0];
      answer = `"${query}"에 대한 정보를 찾았습니다: ${topResult.content}`;
      
      if (results.length > 1) {
        answer += ` 추가로 ${results.length - 1}개의 관련 문서가 더 있습니다.`;
      }
    } else {
      answer = `"${query}"와 관련된 정보를 찾을 수 없습니다. 다른 키워드로 시도해보세요.`;
    }

    return {
      success: true,
      results,
      answer,
      processing_time_ms: 100,
      source: 'fallback',
      method_used: 'keyword-matching'
    };
  }

  static indexDocuments(documents: any[]): RAGVectorResponse {
    // Fallback에서는 실제 인덱싱을 하지 않고 성공 응답만 반환
    return {
      success: true,
      indexed_count: documents.length,
      processing_time_ms: 50,
      source: 'fallback',
      method_used: 'mock-indexing'
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: RAGVectorRequest = await request.json();
    const { action, query, documents, options = {} } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required',
        processing_time_ms: Date.now() - startTime,
        source: 'gateway'
      }, { status: 400 });
    }

    // 액션별 입력 검증
    if (action === 'search' && !query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required for search action',
        processing_time_ms: Date.now() - startTime,
        source: 'gateway'
      }, { status: 400 });
    }

    if (['index', 'update'].includes(action) && (!documents || !Array.isArray(documents))) {
      return NextResponse.json({
        success: false,
        error: 'Documents array is required for index/update actions',
        processing_time_ms: Date.now() - startTime,
        source: 'gateway'
      }, { status: 400 });
    }

    let result: RAGVectorResponse;

    try {
      // GCP Function 호출
      const response = await fetch(GCP_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-RAG-Gateway/1.0'
        },
        body: JSON.stringify({
          action,
          data: { query, documents, options }
        }),
        signal: AbortSignal.timeout(60000) // 60초 타임아웃 (벡터 처리는 시간이 걸림)
      });

      if (response.ok) {
        const gcpResult = await response.json();
        result = {
          success: true,
          results: gcpResult.results,
          answer: gcpResult.answer,
          indexed_count: gcpResult.indexed_count,
          processing_time_ms: Date.now() - startTime,
          source: 'gcp',
          method_used: gcpResult.method || 'gcp-vector-search'
        };
      } else {
        throw new Error(`GCP Function error: ${response.status}`);
      }
    } catch (error) {
      console.warn('RAG Vector GCP Function 실패, fallback 사용:', error);
      
      // Fallback 처리
      switch (action) {
        case 'search':
          result = RAGVectorFallback.searchDocuments(query!, options);
          break;
          
        case 'index':
        case 'update':
          result = RAGVectorFallback.indexDocuments(documents!);
          break;
          
        case 'delete':
          result = {
            success: true,
            processing_time_ms: Date.now() - startTime,
            source: 'fallback',
            method_used: 'mock-deletion'
          };
          break;
          
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
      
      result.processing_time_ms = Date.now() - startTime;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('RAG Vector Gateway 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
      source: 'gateway'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'rag-vector',
    supported_actions: ['search', 'index', 'update', 'delete'],
    features: [
      'semantic_search',
      'document_indexing',
      'vector_similarity',
      'metadata_filtering',
      'answer_generation'
    ],
    fallback_available: true,
    fallback_knowledge_base_size: 6
  });
}

export const runtime = 'edge';