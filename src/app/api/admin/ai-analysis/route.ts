import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisService } from '@/services/ai-agent/AIAnalysisService';
import { AILogProcessor } from '@/services/ai-agent/AILogProcessor';

/**
 * 관리자 AI 분석 API
 * - 분석 세션 관리
 * - AI 분석 실행
 * - 결과 검토 및 승인
 */

// GET: 분석 세션 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');
    const adminId = searchParams.get('adminId');

    const aiAnalysisService = AIAnalysisService.getInstance();

    switch (action) {
      case 'sessions':
        // 분석 세션 목록 조회
        const sessions = aiAnalysisService.getAnalysisSessions(adminId || undefined);
        return NextResponse.json({
          success: true,
          data: {
            total: sessions.length,
            sessions: sessions.map(session => ({
              id: session.id,
              timestamp: session.timestamp,
              adminId: session.adminId,
              analysisType: session.analysisRequest.analysisType,
              status: session.status,
              logCount: session.analysisRequest.logs.length,
              focusArea: session.analysisRequest.focusArea,
              hasAIResponse: !!session.aiResponse
            }))
          }
        });

      case 'session-detail':
        // 특정 세션 상세 조회
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: '세션 ID가 필요합니다.'
          }, { status: 400 });
        }

        const session = aiAnalysisService.getAnalysisSession(sessionId);
        if (!session) {
          return NextResponse.json({
            success: false,
            error: '세션을 찾을 수 없습니다.'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: session
        });

      case 'log-summary':
        // 로그 요약 정보
        const timeRange = {
          start: new Date(searchParams.get('startDate') || Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(searchParams.get('endDate') || Date.now())
        };
        const focusArea = searchParams.get('focusArea') as any;

        const logProcessor = AILogProcessor.getInstance();
        const logs = await logProcessor.selectLogsForAnalysis(timeRange, focusArea, 100);
        const summary = logProcessor.generateAnalysisSummary(logs, focusArea);

        return NextResponse.json({
          success: true,
          data: {
            summary,
            logCount: logs.length,
            timeRange,
            focusArea,
            estimatedTokens: logProcessor.estimateTokenCount({
              analysisType: 'pattern_discovery',
              logs,
              timeRange: {
                start: timeRange.start.toISOString(),
                end: timeRange.end.toISOString()
              }
            })
          }
        });

      case 'top-failures':
        // 우선순위 실패 로그 조회
        const failureTimeRange = {
          start: new Date(searchParams.get('startDate') || Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(searchParams.get('endDate') || Date.now())
        };
        const limit = parseInt(searchParams.get('limit') || '50');

        const topFailures = await aiAnalysisService.getTopFailuresForReview(failureTimeRange, limit);

        return NextResponse.json({
          success: true,
          data: {
            failures: topFailures,
            summary: {
              total: topFailures.length,
              critical: topFailures.filter(f => f.urgencyLevel === 'critical').length,
              high: topFailures.filter(f => f.urgencyLevel === 'high').length,
              medium: topFailures.filter(f => f.urgencyLevel === 'medium').length,
              low: topFailures.filter(f => f.urgencyLevel === 'low').length
            }
          }
        });

      case 'query-groups':
        // 유사 질의 그룹 분석
        const groupTimeRange = {
          start: new Date(searchParams.get('startDate') || Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(searchParams.get('endDate') || Date.now())
        };
        const similarityThreshold = parseFloat(searchParams.get('threshold') || '0.7');

        const groupAnalysis = await aiAnalysisService.analyzeQueryGroups(groupTimeRange, similarityThreshold);

        return NextResponse.json({
          success: true,
          data: {
            groups: groupAnalysis.groups,
            improvements: groupAnalysis.improvements,
            summary: {
              totalGroups: groupAnalysis.groups.length,
              criticalGroups: groupAnalysis.improvements.filter(i => i.priority === 'critical').length,
              totalEstimatedImpact: groupAnalysis.improvements.reduce((sum, i) => sum + i.estimatedImpact, 0)
            }
          }
        });

      case 'improvement-history':
        // 개선 이력 조회
        const historyFilters = {
          adminId: searchParams.get('adminId') || undefined,
          startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
          endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
          status: searchParams.get('status') as any || undefined
        };

        const history = aiAnalysisService.getImprovementHistory(historyFilters);

        return NextResponse.json({
          success: true,
          data: {
            history,
            total: history.length
          }
        });

      case 'recent-improvements':
        // 최근 개선사항 요약
        const days = parseInt(searchParams.get('days') || '7');
        const recentImprovements = aiAnalysisService.getRecentImprovements(days);

        return NextResponse.json({
          success: true,
          data: recentImprovements
        });

      case 'improvement-effects':
        // 개선 효과 분석
        const effects = aiAnalysisService.analyzeImprovementEffects();

        return NextResponse.json({
          success: true,
          data: effects
        });

      case 'changelog':
        // Changelog 생성
        const changelog = aiAnalysisService.generateChangelog();

        return NextResponse.json({
          success: true,
          data: {
            changelog,
            generatedAt: new Date().toISOString()
          }
        });

      case 'advanced-analysis':
        // 고급 분석 (우선순위 + 그룹핑 통합)
        const advancedTimeRange = {
          start: new Date(searchParams.get('startDate') || Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(searchParams.get('endDate') || Date.now())
        };
        const advancedOptions = {
          priorityLimit: parseInt(searchParams.get('priorityLimit') || '50'),
          similarityThreshold: parseFloat(searchParams.get('similarityThreshold') || '0.7'),
          includeFullText: searchParams.get('includeFullText') === 'true'
        };

        const advancedAnalysis = await aiAnalysisService.executeAdvancedAnalysis(advancedTimeRange, advancedOptions);

        return NextResponse.json({
          success: true,
          data: advancedAnalysis
        });

      case 'context-versions':
        // 컨텍스트 버전 목록 조회
        const contextType = searchParams.get('type') as 'base' | 'advanced' | 'custom';
        const clientId = searchParams.get('clientId') || undefined;
        
        if (!contextType || !['base', 'advanced', 'custom'].includes(contextType)) {
          return NextResponse.json({
            success: false,
            error: '유효한 컨텍스트 타입을 지정해주세요. (base, advanced, custom)'
          }, { status: 400 });
        }
        
        const versions = await aiAnalysisService.getAvailableVersions(contextType, clientId);
        return NextResponse.json({
          success: true,
          data: versions
        });

      case 'context-load':
        // 통합 컨텍스트 로드
        const loadClientId = searchParams.get('clientId') || undefined;
        const context = await aiAnalysisService.loadMergedContext(loadClientId);
        return NextResponse.json({
          success: true,
          data: context
        });

      case 'log-statistics':
        // 로그 통계 조회
        const logStats = await aiAnalysisService.getLogStatistics();
        return NextResponse.json({
          success: true,
          data: logStats
        });

      case 'version-compare':
        // 버전 비교
        const compareType = searchParams.get('type') as 'base' | 'advanced' | 'custom';
        const version1 = searchParams.get('version1');
        const version2 = searchParams.get('version2');
        const compareClientId = searchParams.get('clientId') || undefined;
        
        if (!compareType || !version1 || !version2) {
          return NextResponse.json({
            success: false,
            error: '비교할 타입과 버전을 모두 지정해주세요.'
          }, { status: 400 });
        }
        
        const comparison = await aiAnalysisService.compareVersions(
          compareType, 
          version1, 
          version2, 
          compareClientId
        );
        return NextResponse.json({
          success: true,
          data: comparison
        });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin AI Analysis] GET 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: 'AI 분석 정보 조회 실패'
    }, { status: 500 });
  }
}

// POST: 분석 세션 시작 및 AI 분석 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const aiAnalysisService = AIAnalysisService.getInstance();

    switch (action) {
      case 'start-session':
        // 새로운 분석 세션 시작
        const {
          adminId,
          analysisType,
          timeRange,
          focusArea,
          maxTokens,
          model,
          logLimit
        } = params;

        if (!adminId || !analysisType || !timeRange) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (adminId, analysisType, timeRange)'
          }, { status: 400 });
        }

        const session = await aiAnalysisService.startAnalysisSession(
          adminId,
          analysisType,
          {
            start: new Date(timeRange.start),
            end: new Date(timeRange.end)
          },
          {
            focusArea,
            maxTokens,
            model,
            logLimit
          }
        );

        return NextResponse.json({
          success: true,
          message: '분석 세션이 시작되었습니다.',
          data: {
            sessionId: session.id,
            logCount: session.analysisRequest.logs.length,
            estimatedTokens: AILogProcessor.getInstance().estimateTokenCount(session.analysisRequest)
          }
        });

      case 'execute-analysis':
        // AI 분석 실행
        const { sessionId } = params;

        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: '세션 ID가 필요합니다.'
          }, { status: 400 });
        }

        const aiResponse = await aiAnalysisService.executeAIAnalysis(sessionId);

        return NextResponse.json({
          success: true,
          message: 'AI 분석이 완료되었습니다.',
          data: {
            sessionId,
            analysisId: aiResponse.id,
            summary: aiResponse.summary,
            findingsCount: {
              patterns: aiResponse.findings.patterns.length,
              improvements: aiResponse.findings.improvements.length,
              newIntents: aiResponse.findings.newIntents.length
            },
            tokensUsed: aiResponse.tokensUsed
          }
        });

      case 'complete-review':
        // 관리자 검토 완료
        const {
          sessionId: reviewSessionId,
          adminNotes,
          approvedSuggestions,
          rejectedSuggestions
        } = params;

        if (!reviewSessionId || !adminNotes) {
          return NextResponse.json({
            success: false,
            error: '세션 ID와 관리자 노트가 필요합니다.'
          }, { status: 400 });
        }

        const reviewedSession = await aiAnalysisService.completeAdminReview(
          reviewSessionId,
          adminNotes,
          approvedSuggestions || [],
          rejectedSuggestions || []
        );

        return NextResponse.json({
          success: true,
          message: '관리자 검토가 완료되었습니다.',
          data: {
            sessionId: reviewedSession.id,
            status: reviewedSession.status,
            approvedCount: reviewedSession.approvedSuggestions.length,
            rejectedCount: reviewedSession.rejectedSuggestions.length
          }
        });

      case 'batch-analysis':
        // 배치 분석 (여러 분석 타입을 순차 실행)
        const {
          adminId: batchAdminId,
          timeRange: batchTimeRange,
          analysisTypes,
          focusArea: batchFocusArea
        } = params;

        if (!batchAdminId || !batchTimeRange || !analysisTypes?.length) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다.'
          }, { status: 400 });
        }

        const batchResults = [];
        
        for (const analysisType of analysisTypes) {
          try {
            const batchSession = await aiAnalysisService.startAnalysisSession(
              batchAdminId,
              analysisType,
              {
                start: new Date(batchTimeRange.start),
                end: new Date(batchTimeRange.end)
              },
              {
                focusArea: batchFocusArea,
                logLimit: 200 // 배치 분석은 로그 수 제한
              }
            );

            const batchAIResponse = await aiAnalysisService.executeAIAnalysis(batchSession.id);

            batchResults.push({
              analysisType,
              sessionId: batchSession.id,
              summary: batchAIResponse.summary,
              tokensUsed: batchAIResponse.tokensUsed,
              success: true
            });

          } catch (error) {
            batchResults.push({
              analysisType,
              error: error instanceof Error ? error.message : '분석 실패',
              success: false
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `배치 분석 완료: ${batchResults.filter(r => r.success).length}/${batchResults.length}`,
          data: {
            results: batchResults,
            totalTokensUsed: batchResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
          }
        });

      case 'approve-improvements':
        // 개선 제안 승인
        const {
          sessionId: approveSessionId,
          adminId: approveAdminId,
          approvedSuggestions: approveApprovedSuggestions
        } = params;

        if (!approveSessionId || !approveAdminId || !approveApprovedSuggestions?.length) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (sessionId, adminId, approvedSuggestions)'
          }, { status: 400 });
        }

        const improvementHistory = await aiAnalysisService.approveImprovements(
          approveSessionId,
          approveAdminId,
          approveApprovedSuggestions
        );

        return NextResponse.json({
          success: true,
          message: '개선 제안이 승인되고 이력에 기록되었습니다.',
          data: {
            historyId: improvementHistory.id,
            version: improvementHistory.version,
            approvedCount: improvementHistory.approvedSuggestions.length,
            estimatedTotalImpact: improvementHistory.approvedSuggestions.reduce(
              (sum, s) => sum + s.estimatedImpact, 0
            )
          }
        });

      case 'save-context-document':
        // 컨텍스트 문서 저장
        const {
          type: saveDocType,
          filename: saveDocFilename,
          content: saveDocContent,
          clientId: saveDocClientId
        } = params;

        if (!saveDocType || !saveDocFilename || !saveDocContent) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (type, filename, content)'
          }, { status: 400 });
        }

        const saveDocSuccess = await aiAnalysisService.saveContextDocument(
          saveDocType,
          saveDocFilename,
          saveDocContent,
          saveDocClientId
        );

        return NextResponse.json({
          success: saveDocSuccess,
          message: saveDocSuccess ? '컨텍스트 문서가 저장되었습니다.' : '컨텍스트 문서 저장에 실패했습니다.',
          data: {
            type: saveDocType,
            filename: saveDocFilename,
            clientId: saveDocClientId || null,
            contentLength: saveDocContent.length
          }
        });

      case 'save-pattern-file':
        // 패턴 파일 저장
        const {
          type: savePatternType,
          filename: savePatternFilename,
          patterns: savePatterns,
          clientId: savePatternClientId
        } = params;

        if (!savePatternType || !savePatternFilename || !savePatterns) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (type, filename, patterns)'
          }, { status: 400 });
        }

        const savePatternSuccess = await aiAnalysisService.savePatternFile(
          savePatternType,
          savePatternFilename,
          savePatterns,
          savePatternClientId
        );

        return NextResponse.json({
          success: savePatternSuccess,
          message: savePatternSuccess ? '패턴 파일이 저장되었습니다.' : '패턴 파일 저장에 실패했습니다.',
          data: {
            type: savePatternType,
            filename: savePatternFilename,
            clientId: savePatternClientId || null,
            patternCount: Object.keys(savePatterns.intentPatterns || {}).length
          }
        });

      case 'switch-context-version':
        // 컨텍스트 버전 전환
        const {
          type: switchType,
          targetVersion: switchTargetVersion,
          clientId: switchClientId,
          createBackup: switchCreateBackup
        } = params;

        if (!switchType || !switchTargetVersion) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (type, targetVersion)'
          }, { status: 400 });
        }

        const switchResult = await aiAnalysisService.switchContextVersion(
          switchType,
          switchTargetVersion,
          switchClientId,
          switchCreateBackup !== false // 기본값 true
        );

        return NextResponse.json({
          success: switchResult.success,
          message: switchResult.message,
          data: {
            type: switchType,
            targetVersion: switchTargetVersion,
            clientId: switchClientId || null,
            backupVersion: switchResult.backupVersion || null
          }
        });

      case 'create-release-version':
        // 릴리스 버전 생성
        const {
          type: releaseType,
          version: releaseVersion,
          clientId: releaseClientId,
          description: releaseDescription
        } = params;

        if (!releaseType || !releaseVersion) {
          return NextResponse.json({
            success: false,
            error: '필수 파라미터가 누락되었습니다. (type, version)'
          }, { status: 400 });
        }

        const releaseResult = await aiAnalysisService.createReleaseVersion(
          releaseType,
          releaseVersion,
          releaseClientId,
          releaseDescription
        );

        return NextResponse.json({
          success: releaseResult.success,
          message: releaseResult.message,
          data: {
            type: releaseType,
            version: releaseVersion,
            clientId: releaseClientId || null,
            description: releaseDescription || null,
            versionPath: releaseResult.versionPath || null
          }
        });

      case 'save-failure-log':
        // 실패 분석 로그 저장
        const { failures: saveFailures } = params;

        if (!saveFailures || !Array.isArray(saveFailures)) {
          return NextResponse.json({
            success: false,
            error: '실패 로그 배열이 필요합니다.'
          }, { status: 400 });
        }

        const saveFailureSuccess = await aiAnalysisService.saveFailureAnalysisLog(saveFailures);

        return NextResponse.json({
          success: saveFailureSuccess,
          message: saveFailureSuccess ? '실패 분석 로그가 저장되었습니다.' : '실패 로그 저장에 실패했습니다.',
          data: {
            count: saveFailures.length,
            date: new Date().toISOString().split('T')[0]
          }
        });

      case 'save-improvement-log':
        // 개선 분석 로그 저장
        const { improvements: saveImprovements } = params;

        if (!saveImprovements || !Array.isArray(saveImprovements)) {
          return NextResponse.json({
            success: false,
            error: '개선 로그 배열이 필요합니다.'
          }, { status: 400 });
        }

        const saveImprovementSuccess = await aiAnalysisService.saveImprovementAnalysisLog(saveImprovements);

        return NextResponse.json({
          success: saveImprovementSuccess,
          message: saveImprovementSuccess ? '개선 분석 로그가 저장되었습니다.' : '개선 로그 저장에 실패했습니다.',
          data: {
            count: saveImprovements.length,
            date: new Date().toISOString().split('T')[0]
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin AI Analysis] POST 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: 'AI 분석 요청 처리 실패'
    }, { status: 500 });
  }
}

// PUT: 분석 세션 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, ...params } = body;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '세션 ID가 필요합니다.'
      }, { status: 400 });
    }

    const aiAnalysisService = AIAnalysisService.getInstance();

    switch (action) {
      case 'update-notes':
        // 관리자 노트 업데이트
        const { adminNotes } = params;
        
        const session = aiAnalysisService.getAnalysisSession(sessionId);
        if (!session) {
          return NextResponse.json({
            success: false,
            error: '세션을 찾을 수 없습니다.'
          }, { status: 404 });
        }

        session.adminNotes = adminNotes;
        
        return NextResponse.json({
          success: true,
          message: '관리자 노트가 업데이트되었습니다.',
          data: { sessionId, adminNotes }
        });

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Admin AI Analysis] PUT 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '분석 세션 업데이트 실패'
    }, { status: 500 });
  }
}

// DELETE: 분석 세션 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '세션 ID가 필요합니다.'
      }, { status: 400 });
    }

    // TODO: 실제 세션 삭제 로직 구현
    // 현재는 메모리 기반이므로 별도 삭제 메서드 필요

    return NextResponse.json({
      success: true,
      message: `분석 세션 ${sessionId}가 삭제되었습니다.`
    });

  } catch (error) {
    console.error('❌ [Admin AI Analysis] DELETE 요청 실패:', error);
    return NextResponse.json({
      success: false,
      error: '분석 세션 삭제 실패'
    }, { status: 500 });
  }
} 