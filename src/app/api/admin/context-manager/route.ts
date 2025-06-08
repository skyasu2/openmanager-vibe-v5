import { NextRequest, NextResponse } from 'next/server';
import { ContextLoader } from '@/modules/mcp/ContextLoader';
import { ContextUpdateEngine } from '@/modules/ai-agent/learning/ContextUpdateEngine';

/**
 * 관리자 컨텍스트 관리 API
 * - 컨텍스트 번들 업로드/관리
 * - 학습 제안 승인/거부
 * - 번들 버전 관리
 */

// GET: 컨텍스트 상태 및 대기 중인 제안 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const contextLoader = ContextLoader.getInstance();
    const contextUpdateEngine = ContextUpdateEngine.getInstance();

    switch (action) {
      case 'bundles':
        // 사용 가능한 번들 목록
        const bundles = await contextLoader.getAvailableBundles();
        return NextResponse.json({
          success: true,
          data: bundles
        });

      case 'pending-suggestions':
        // 관리자 승인 대기 중인 제안들
        const pendingSuggestions = contextUpdateEngine.getPendingUpdates()
          .filter(update => update.status === 'pending_admin_approval');
        
        return NextResponse.json({
          success: true,
          data: {
            total: pendingSuggestions.length,
            suggestions: pendingSuggestions.map(suggestion => ({
              id: suggestion.id,
              type: suggestion.type,
              confidence: suggestion.confidence,
              timestamp: suggestion.timestamp,
              content: JSON.parse(suggestion.content),
              metadata: suggestion.metadata
            }))
          }
        });

      case 'approved-suggestions':
        // 승인된 제안들
        const approvedSuggestions = contextUpdateEngine.getAppliedUpdates()
          .filter(update => update.status === 'admin_approved');
        
        return NextResponse.json({
          success: true,
          data: {
            total: approvedSuggestions.length,
            suggestions: approvedSuggestions.map(suggestion => ({
              id: suggestion.id,
              type: suggestion.type,
              confidence: suggestion.confidence,
              timestamp: suggestion.timestamp,
              appliedAt: suggestion.appliedAt,
              bundleTarget: suggestion.bundleTarget,
              adminNotes: suggestion.adminNotes,
              content: JSON.parse(suggestion.content)
            }))
          }
        });

      case 'context-status':
        // 현재 컨텍스트 상태
        const mergedContext = await contextLoader.loadMergedContext();
        return NextResponse.json({
          success: true,
          data: {
            version: mergedContext.metadata.version,
            sources: mergedContext.metadata.sources,
            mergedAt: mergedContext.metadata.mergedAt,
            patternsCount: Object.keys(mergedContext.patterns.intentPatterns || {}).length,
            templatesCount: Object.keys(mergedContext.templates).length,
            intentMappingsCount: Object.keys(mergedContext.intentMappings).length
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin Context Manager] GET 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '컨텍스트 정보 조회 실패'
    }, { status: 500 });
  }
}

// POST: 제안 승인/거부, 번들 업로드
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // const contextLoader = ContextLoader.getInstance();
    const contextUpdateEngine = ContextUpdateEngine.getInstance();

    switch (action) {
      case 'approve-suggestion':
        // 제안 승인
        const { suggestionId, adminNotes, bundleTarget = 'advanced' } = params;
        
        if (!suggestionId) {
          return NextResponse.json({
            success: false,
            error: '제안 ID가 필요합니다.'
          }, { status: 400 });
        }

        const approved = await contextUpdateEngine.adminApproveUpdate(
          suggestionId, 
          adminNotes, 
          bundleTarget
        );

        if (approved) {
          return NextResponse.json({
            success: true,
            message: `제안 ${suggestionId}가 승인되었습니다.`,
            data: { suggestionId, bundleTarget, adminNotes }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '제안 승인에 실패했습니다.'
          }, { status: 500 });
        }

      case 'reject-suggestion':
        // 제안 거부
        const { suggestionId: rejectId, reason } = params;
        
        if (!rejectId || !reason) {
          return NextResponse.json({
            success: false,
            error: '제안 ID와 거부 사유가 필요합니다.'
          }, { status: 400 });
        }

        const rejected = await contextUpdateEngine.adminRejectUpdate(rejectId, reason);

        if (rejected) {
          return NextResponse.json({
            success: true,
            message: `제안 ${rejectId}가 거부되었습니다.`,
            data: { suggestionId: rejectId, reason }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '제안 거부에 실패했습니다.'
          }, { status: 500 });
        }

      case 'upload-bundle':
        // 컨텍스트 번들 업로드
        const { bundleType, bundleData, clientId } = params;
        
        if (!bundleType || !bundleData) {
          return NextResponse.json({
            success: false,
            error: '번들 타입과 데이터가 필요합니다.'
          }, { status: 400 });
        }

        // base 번들은 업로드 금지
        if (bundleType === 'base') {
          return NextResponse.json({
            success: false,
            error: 'Base 번들은 변경할 수 없습니다.'
          }, { status: 403 });
        }

        const uploaded = await ContextLoader
          .getInstance()
          .uploadContextBundle(bundleType, bundleData, clientId);

        if (uploaded) {
          return NextResponse.json({
            success: true,
            message: `${bundleType} 번들이 업로드되었습니다.`,
            data: { bundleType, clientId }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '번들 업로드에 실패했습니다.'
          }, { status: 500 });
        }

      case 'export-approved-bundle':
        // 승인된 제안들을 번들로 내보내기
        const { exportBundleType = 'advanced', exportClientId } = params;
        
        const exportedBundle = await contextUpdateEngine.exportApprovedUpdatesToBundle(
          exportBundleType, 
          exportClientId
        );

        return NextResponse.json({
          success: true,
          message: '승인된 제안들이 번들로 내보내졌습니다.',
          data: exportedBundle
        });

      case 'invalidate-cache':
        // 컨텍스트 캐시 무효화
        ContextLoader.getInstance().invalidateCache();
        
        return NextResponse.json({
          success: true,
          message: '컨텍스트 캐시가 무효화되었습니다.'
        });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin Context Manager] POST 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '요청 처리 실패'
    }, { status: 500 });
  }
}

// PUT: 번들 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // const contextLoader = ContextLoader.getInstance();

    switch (action) {
      case 'update-bundle-metadata':
        // 번들 메타데이터 업데이트
        const { bundleType, clientId, metadata } = params;

        const metadataUpdated = await ContextLoader
          .getInstance()
          .updateBundleMetadata(bundleType, metadata, clientId);

        if (metadataUpdated) {
          return NextResponse.json({
            success: true,
            message: '번들 메타데이터가 업데이트되었습니다.',
            data: { bundleType, clientId, metadata }
          });
        }
        return NextResponse.json({
          success: false,
          error: '메타데이터 업데이트에 실패했습니다.'
        }, { status: 500 });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin Context Manager] PUT 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '업데이트 실패'
    }, { status: 500 });
  }
}

// DELETE: 번들 삭제, 제안 취소
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const bundleType = searchParams.get('bundleType');
    const clientId = searchParams.get('clientId');

    const contextUpdateEngine = ContextUpdateEngine.getInstance();

    switch (action) {
      case 'cancel-suggestion':
        // 대기 중인 제안 취소
        if (!id) {
          return NextResponse.json({
            success: false,
            error: '제안 ID가 필요합니다.'
          }, { status: 400 });
        }

        const cancelled = await contextUpdateEngine.adminRejectUpdate(id, '관리자에 의한 취소');

        if (cancelled) {
          return NextResponse.json({
            success: true,
            message: `제안 ${id}가 취소되었습니다.`
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '제안 취소에 실패했습니다.'
          }, { status: 500 });
        }

      case 'delete-bundle':
        // 번들 삭제 (base 제외)
        if (bundleType === 'base') {
          return NextResponse.json({
            success: false,
            error: 'Base 번들은 삭제할 수 없습니다.'
          }, { status: 403 });
        }

        const deleted = await ContextLoader
          .getInstance()
          .deleteContextBundle(bundleType, clientId);

        if (deleted) {
          return NextResponse.json({
            success: true,
            message: `${bundleType} 번들이 삭제되었습니다.`,
            data: { bundleType, clientId }
          });
        }
        return NextResponse.json({
          success: false,
          error: '번들 삭제에 실패했습니다.'
        }, { status: 500 });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin Context Manager] DELETE 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '삭제 실패'
    }, { status: 500 });
  }
} 