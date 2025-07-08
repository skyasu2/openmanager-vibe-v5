/**
 * 🤖 MCP + RAG 통합 컨텍스트 API
 *
 * Google Cloud VM MCP 서버와 RAG 엔진의 협업 컨텍스트 제공
 * 자연어 처리 및 AI 엔진에서 활용
 *
 * POST /api/mcp/context-integration
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 MCP + RAG 통합 컨텍스트 요청 처리 시작...');

    const body = await request.json();
    const {
      query,
      contextType = 'hybrid', // 'mcp' | 'local' | 'hybrid'
      nlpType, // 'intent_analysis' | 'entity_extraction' | 'sentiment_analysis' | 'command_parsing'
      maxFiles = 10,
      includeSystemContext = true,
      pathFilters = [],
    } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const cloudContextLoader = CloudContextLoader.getInstance();

    let response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      query,
      contextType,
      data: {},
    };

    // NLP 타입별 컨텍스트 제공
    if (nlpType) {
      console.log(`🧠 자연어 처리 컨텍스트 제공: ${nlpType}`);

      const nlpContext = await cloudContextLoader.getContextForNLP(
        query,
        nlpType
      );

      response.data.nlpContext = nlpContext;
      response.data.processingType = 'nlp';
      response.data.nlpType = nlpType;

      console.log(
        `✅ NLP 컨텍스트 완료: ${nlpContext.contextSources.length}개 소스`
      );
    } else {
      // 일반 컨텍스트 요청 처리
      switch (contextType) {
        case 'mcp':
          console.log('🔗 MCP 서버 컨텍스트 전용 요청');
          const mcpContext = await cloudContextLoader.queryMCPContextForRAG(
            query,
            {
              maxFiles,
              includeSystemContext,
              pathFilters,
            }
          );

          response.data.mcpContext = mcpContext;
          response.data.contextSources = ['mcp-server'];
          break;

        case 'local':
          console.log('📚 로컬 컨텍스트 전용 요청');
          const localContexts = await Promise.all([
            cloudContextLoader.loadContextBundle('base'),
            cloudContextLoader.loadContextBundle('advanced'),
          ]);

          response.data.localContexts = localContexts.filter(Boolean);
          response.data.contextSources = ['local-base', 'local-advanced'];
          break;

        case 'hybrid':
        default:
          console.log('🔄 하이브리드 컨텍스트 요청 (MCP + 로컬)');

          // MCP 컨텍스트 조회
          const hybridMcpContext =
            await cloudContextLoader.queryMCPContextForRAG(query, {
              maxFiles: Math.ceil(maxFiles * 0.7), // 70% MCP
              includeSystemContext,
              pathFilters,
            });

          // 로컬 컨텍스트 조회
          const hybridLocalContexts = await Promise.all([
            cloudContextLoader.loadContextBundle('base'),
            cloudContextLoader.loadContextBundle('advanced'),
          ]);

          response.data.mcpContext = hybridMcpContext;
          response.data.localContexts = hybridLocalContexts.filter(Boolean);
          response.data.contextSources = [
            ...(hybridMcpContext ? ['mcp-server'] : []),
            ...hybridLocalContexts.map((_, i) =>
              i === 0 ? 'local-base' : 'local-advanced'
            ),
          ];
          break;
      }
    }

    // 통합 상태 정보 추가
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();
    response.data.serverStatus = integratedStatus;

    console.log(
      `✅ 통합 컨텍스트 제공 완료: ${response.data.contextSources?.length || 0}개 소스`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=120', // 2분 캐싱
      },
    });
  } catch (error) {
    console.error('❌ MCP + RAG 통합 컨텍스트 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Context integration processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 MCP + RAG 통합 상태 조회
 *
 * GET /api/mcp/context-integration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 MCP + RAG 통합 상태 조회 시작...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: integratedStatus,
      capabilities: {
        mcpIntegration: true,
        ragIntegration: true,
        nlpSupport: true,
        contextTypes: ['mcp', 'local', 'hybrid'],
        nlpTypes: [
          'intent_analysis',
          'entity_extraction',
          'sentiment_analysis',
          'command_parsing',
        ],
      },
      endpoints: {
        contextQuery: '/api/mcp/context-integration',
        ragSync: '/api/mcp/context-integration/sync',
        mcpHealth: '/api/mcp/context-integration/health',
      },
    };

    console.log(
      `✅ 통합 상태 조회 완료: MCP ${integratedStatus.mcpServer.status}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // 1분 캐싱
      },
    });
  } catch (error) {
    console.error('❌ 통합 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Integration status retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
