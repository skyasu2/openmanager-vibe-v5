/**
 * 🤖 MCP + RAG 통합 컨텍스트 API
 *
 * Google Cloud VM MCP 서버와 RAG 엔진의 협업 컨텍스트 제공
 * 자연어 처리 및 AI 엔진에서 활용
 *
 * POST /api/mcp/context-integration
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  MCPContextIntegrationRequestSchema,
  MCPContextIntegrationResponseSchema,
  MCPIntegrationStatusResponseSchema,
  type MCPContextIntegrationRequest,
  type MCPContextIntegrationResponse,
  type MCPIntegrationStatusResponse,
  type MCPNLPContext,
  type MCPContext,
  type LocalContextBundle,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// POST handler
const postHandler = createApiRoute()
  .body(MCPContextIntegrationRequestSchema)
  .response(MCPContextIntegrationResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<MCPContextIntegrationResponse> => {
    console.log('🤖 MCP + RAG 통합 컨텍스트 요청 처리 시작...');

    const {
      query,
      contextType,
      nlpType,
      maxFiles,
      includeSystemContext,
      pathFilters,
    } = context.body;

    const cloudContextLoader = CloudContextLoader.getInstance();

    const responseData: MCPContextIntegrationResponse['data'] = {
      serverStatus: await cloudContextLoader.getIntegratedStatus(),
    };

    // NLP 타입별 컨텍스트 제공
    if (nlpType) {
      console.log(`🧠 자연어 처리 컨텍스트 제공: ${nlpType}`);

      const nlpContext = await cloudContextLoader.getContextForNLP(
        query,
        nlpType
      );

      // Transform nlpContext to match expected schema
      responseData.nlpContext = {
        query,
        processingType: nlpType,
        contextSources: (nlpContext.contextSources || []).map((source: string) => ({
          source,
          relevance: 1.0,
          content: undefined,
        })),
        metadata: {},
        relevanceScore: 1.0,
      };
      responseData.processingType = 'nlp';
      responseData.nlpType = nlpType;

      console.log(
        `✅ NLP 컨텍스트 완료: ${nlpContext.contextSources.length}개 소스`
      );
    } else {
      // 일반 컨텍스트 요청 처리
      switch (contextType) {
        case 'mcp': {
          console.log('🔗 MCP 서버 컨텍스트 전용 요청');
          const mcpContext = await cloudContextLoader.queryMCPContextForRAG(
            query,
            {
              maxFiles: maxFiles ?? 10,
              includeSystemContext,
              pathFilters,
            }
          ) as MCPContext | null;

          if (mcpContext) {
            responseData.mcpContext = mcpContext;
          }
          responseData.contextSources = ['mcp-server'];
          break;
        }

        case 'local': {
          console.log('📚 로컬 컨텍스트 전용 요청');
          const localContexts = await Promise.all([
            cloudContextLoader.loadContextBundle('base'),
            cloudContextLoader.loadContextBundle('advanced'),
          ]) as (LocalContextBundle | null)[];

          const filteredContexts = localContexts.filter(Boolean) as LocalContextBundle[];
          responseData.localContexts = filteredContexts;
          responseData.contextSources = ['local-base', 'local-advanced'];
          break;
        }

        case 'hybrid':
        default: {
          console.log('🔄 하이브리드 컨텍스트 요청 (MCP + 로컬)');

          // MCP 컨텍스트 조회
          const hybridMcpContext =
            await cloudContextLoader.queryMCPContextForRAG(query, {
              maxFiles: Math.ceil((maxFiles ?? 10) * 0.7), // 70% MCP
              includeSystemContext,
              pathFilters,
            }) as MCPContext | null;

          // 로컬 컨텍스트 조회
          const hybridLocalContexts = await Promise.all([
            cloudContextLoader.loadContextBundle('base'),
            cloudContextLoader.loadContextBundle('advanced'),
          ]) as (LocalContextBundle | null)[];

          if (hybridMcpContext) {
            responseData.mcpContext = hybridMcpContext;
          }
          const filteredLocalContexts = hybridLocalContexts.filter(Boolean) as LocalContextBundle[];
          responseData.localContexts = filteredLocalContexts;
          responseData.contextSources = [
            ...(hybridMcpContext ? ['mcp-server'] : []),
            ...filteredLocalContexts.map((_, i) =>
              i === 0 ? 'local-base' : 'local-advanced'
            ),
          ];
          break;
        }
      }
    }

    console.log(
      `✅ 통합 컨텍스트 제공 완료: ${responseData.contextSources?.length || 0}개 소스`
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
      query,
      contextType: contextType ?? 'hybrid',
      data: responseData,
    };
  });

export async function POST(request: NextRequest) {
  try {
    const response = await postHandler(request);
    return NextResponse.json(response, {
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
        message: getErrorMessage(error),
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
// GET handler
const getHandler = createApiRoute()
  .response(MCPIntegrationStatusResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (): Promise<MCPIntegrationStatusResponse> => {
    console.log('📊 MCP + RAG 통합 상태 조회 시작...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    console.log(
      `✅ 통합 상태 조회 완료: MCP ${integratedStatus.mcpServer.status}`
    );

    return {
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
  });

export async function GET(request: NextRequest) {
  try {
    const response = await getHandler(request);
    return NextResponse.json(response, {
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
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
