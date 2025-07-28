/**
 * 🔄 MCP + RAG 동기화 API
 *
 * Google Cloud VM MCP 서버와 RAG 엔진 간 컨텍스트 동기화
 *
 * POST /api/mcp/context-integration/sync
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 MCP + RAG 동기화 요청 처리 시작...');

    const body = await request.json();
    const {
      ragEngineUrl,
      syncType = 'full', // 'full' | 'incremental' | 'mcp_only' | 'local_only'
      force: _force = false,
    } = body;

    const cloudContextLoader = CloudContextLoader.getInstance();

    let syncResult: any = {
      success: false,
      syncedContexts: 0,
      errors: [],
      timestamp: new Date().toISOString(),
      syncType,
    };

    switch (syncType) {
      case 'full':
        console.log('🔄 전체 컨텍스트 동기화 실행...');
        syncResult = await cloudContextLoader.syncContextWithRAG(ragEngineUrl);
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

    const response = {
      ...syncResult,
      integratedStatus,
      performance: {
        mcpServerStatus: integratedStatus.mcpServer.status,
        ragIntegrationEnabled: integratedStatus.ragIntegration.enabled,
        contextCacheSize: integratedStatus.contextCache.size,
      },
    };

    console.log(
      `✅ 동기화 완료: ${syncResult.syncedContexts}개 컨텍스트, ${syncResult.errors.length}개 오류`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache', // 동기화 결과는 캐싱하지 않음
      },
    });
  } catch (error) {
    console.error('❌ MCP + RAG 동기화 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Sync processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
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
export async function GET(_request: NextRequest) {
  try {
    console.log('📊 동기화 상태 조회 시작...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    const response = {
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
          type: 'full',
          description: '전체 컨텍스트 동기화 (MCP + 로컬)',
          recommendedFor: '초기 설정 또는 대규모 변경 후',
        },
        {
          type: 'mcp_only',
          description: 'MCP 서버 컨텍스트만 동기화',
          recommendedFor: 'MCP 서버 데이터 업데이트 후',
        },
        {
          type: 'local_only',
          description: '로컬 컨텍스트만 동기화',
          recommendedFor: '로컬 설정 변경 후',
        },
        {
          type: 'incremental',
          description: '변경된 컨텍스트만 동기화',
          recommendedFor: '일반적인 주기적 동기화',
        },
      ],
      performance: integratedStatus.performance,
    };

    console.log(
      `✅ 동기화 상태 조회 완료: MCP ${integratedStatus.mcpServer.status}`
    );

    return NextResponse.json(response, {
      status: 200,
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
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
