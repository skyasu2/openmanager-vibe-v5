/**
 * 🔄 MCP + RAG 동기화 API
 *
 * 로컬 MCP 도구와 RAG 엔진 간 컨텍스트 동기화
 *
 * POST /api/mcp/context-integration/sync
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  MCPSyncRequestSchema,
  MCPSyncResponseSchema,
  MCPSyncStatusResponseSchema,
  type MCPSyncRequest,
  type MCPSyncResponse,
  type MCPSyncStatusResponse,
  type MCPSyncResult,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// POST 핸들러
const postHandler = createApiRoute()
  .body(MCPSyncRequestSchema)
  .response(MCPSyncResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<MCPSyncResponse> => {
    console.log('🔄 MCP + RAG 동기화 요청 처리 시작...');

    const {
      ragEngineUrl,
      syncType = 'full',
      force: _force = false,
    } = context.body;

    const cloudContextLoader = CloudContextLoader.getInstance();

    let syncResult: MCPSyncResult = {
      success: false,
      syncedContexts: 0,
      errors: [],
      timestamp: new Date().toISOString(),
      syncType,
    };

    switch (syncType) {
      case 'full':
        console.log('🔄 전체 컨텍스트 동기화 실행...');
        const rawSyncResult = await cloudContextLoader.syncContextWithRAG(ragEngineUrl);
        syncResult = {
          ...rawSyncResult,
          timestamp: new Date().toISOString(),
          syncType: 'full' as const,
        };
        break;

      case 'mcp_only': {
        console.log('🔗 MCP 서버 컨텍스트만 동기화...');
        const mcpContext = await cloudContextLoader.queryMCPContextForRAG(
          '전체 시스템 컨텍스트',
          {
            maxFiles: 50,
            includeSystemContext: true,
          }
        );

        if (mcpContext) {
          const ragSyncResult = await cloudContextLoader['sendContextToRAG'](
            mcpContext,
            ragEngineUrl
          );
          syncResult = {
            success: ragSyncResult.success,
            syncedContexts: ragSyncResult.success ? 1 : 0,
            errors: ragSyncResult.success
              ? []
              : [ragSyncResult.message || 'MCP 동기화 실패'],
            timestamp: new Date().toISOString(),
            syncType: 'mcp_only',
          };
        } else {
          syncResult = {
            success: false,
            syncedContexts: 0,
            errors: ['MCP 컨텍스트 조회 실패'],
            timestamp: new Date().toISOString(),
            syncType: 'mcp_only',
          };
        }
        break;
      }

      case 'local_only': {
        console.log('📚 로컬 컨텍스트만 동기화...');
        const localContexts = await Promise.all([
          cloudContextLoader.loadContextBundle('base'),
          cloudContextLoader.loadContextBundle('advanced'),
          cloudContextLoader.loadContextBundle('custom'),
        ]);

        const validLocalContexts = localContexts.filter(Boolean);
        let localSyncCount = 0;
        const localErrors: string[] = [];

        for (const context of validLocalContexts) {
          if (context) {
            const ragSyncResult = await cloudContextLoader['sendContextToRAG'](
              context,
              ragEngineUrl
            );
            if (ragSyncResult.success) {
              localSyncCount++;
            } else {
              localErrors.push(`로컬 컨텍스트 동기화 실패: ${context.id}`);
            }
          }
        }

        syncResult = {
          success: localErrors.length === 0,
          syncedContexts: localSyncCount,
          errors: localErrors,
          timestamp: new Date().toISOString(),
          syncType: 'local_only',
        };
        break;
      }

      case 'incremental': {
        console.log('📈 증분 동기화 실행...');
        // 실제 구현에서는 마지막 동기화 시간 이후 변경된 컨텍스트만 동기화
        const incrementalContext =
          await cloudContextLoader.queryMCPContextForRAG('최근 변경 컨텍스트', {
            maxFiles: 10,
            includeSystemContext: false,
          });

        if (incrementalContext) {
          const ragSyncResult = await cloudContextLoader['sendContextToRAG'](
            incrementalContext,
            ragEngineUrl
          );
          syncResult = {
            success: ragSyncResult.success,
            syncedContexts: ragSyncResult.success ? 1 : 0,
            errors: ragSyncResult.success
              ? []
              : [ragSyncResult.message || '증분 동기화 실패'],
            timestamp: new Date().toISOString(),
            syncType: 'incremental',
          };
        } else {
          syncResult = {
            success: true,
            syncedContexts: 0,
            errors: [],
            timestamp: new Date().toISOString(),
            syncType: 'incremental',
            message: '동기화할 새로운 컨텍스트 없음',
          };
        }
        break;
      }

      default:
        throw new Error(`지원하지 않는 동기화 타입: ${syncType}`);
    }

    // 동기화 후 통합 상태 조회
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    console.log(
      `✅ 동기화 완료: ${syncResult.syncedContexts}개 컨텍스트, ${syncResult.errors.length}개 오류`
    );

    return {
      ...syncResult,
      integratedStatus,
      performance: {
        mcpServerStatus: integratedStatus.mcpServer.status,
        ragIntegrationEnabled: integratedStatus.ragIntegration.enabled,
        contextCacheSize: integratedStatus.contextCache.size,
      },
    };
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ MCP + RAG 동기화 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Sync processing failed',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 동기화 상태 조회
 *
 * GET /api/mcp/context-integration/sync
 */
// GET 핸들러
const getHandler = createApiRoute()
  .response(MCPSyncStatusResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request): Promise<MCPSyncStatusResponse> => {
    console.log('📊 동기화 상태 조회 시작...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    console.log(
      `✅ 동기화 상태 조회 완료: MCP ${integratedStatus.mcpServer.status}`
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
      syncStatus: {
        mcpServerOnline: integratedStatus.mcpServer.status === 'online',
        ragIntegrationEnabled: integratedStatus.ragIntegration.enabled,
        lastSyncTime: integratedStatus.ragIntegration.lastSync,
        syncCount: integratedStatus.ragIntegration.syncCount,
      },
      availableSyncTypes: [
        {
          type: 'full' as const,
          description: '전체 컨텍스트 동기화 (MCP + 로컬)',
          recommendedFor: '초기 설정 또는 대규모 변경 후',
        },
        {
          type: 'mcp_only' as const,
          description: 'MCP 서버 컨텍스트만 동기화',
          recommendedFor: 'MCP 서버 데이터 업데이트 후',
        },
        {
          type: 'local_only' as const,
          description: '로컬 컨텍스트만 동기화',
          recommendedFor: '로컬 설정 변경 후',
        },
        {
          type: 'incremental' as const,
          description: '변경된 컨텍스트만 동기화',
          recommendedFor: '일반적인 주기적 동기화',
        },
      ],
      performance: integratedStatus.performance,
    };
  });

export async function GET(request: NextRequest) {
  try {
    const response = await getHandler(request);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30', // 30초 캐싱
      },
    });
  } catch (error) {
    console.error('❌ 동기화 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Sync status retrieval failed',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
