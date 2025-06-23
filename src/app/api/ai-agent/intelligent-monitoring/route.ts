import { IntelligentMonitoringService } from '@/services/ai/IntelligentMonitoringService';
import { PerformanceMonitor } from '@/services/ai/PerformanceMonitor';
import { UnifiedLogger } from '@/services/ai/UnifiedLogger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧠 지능형 모니터링 + ML 엔진 통합 API
 * 
 * 4단계 워크플로우:
 * 1. 이상 탐지
 * 2. 근본 원인 분석
 * 3. 예측적 모니터링
 * 4. ML 기반 최적화 및 자동 학습
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            serverId,
            timeRange,
            analysisDepth = 'standard',
            mode = 'AUTO',
            includeSteps = {
                anomalyDetection: true,
                rootCauseAnalysis: true,
                predictiveMonitoring: true,
                mlOptimization: true // 🤖 ML 최적화 기본 활성화
            }
        } = body;

        console.log(`🧠 [API] 지능형 모니터링 요청 - 모드: ${mode}`);

        // 지능형 모니터링 서비스 인스턴스 가져오기
        const intelligentMonitoring = IntelligentMonitoringService.getInstance();

        // 🎯 모드별 분석 실행
        const analysisResult = await intelligentMonitoring.runIntelligentAnalysis({
            serverId,
            timeRange: timeRange ? {
                start: new Date(timeRange.start),
                end: new Date(timeRange.end),
            } : undefined,
            analysisDepth,
            mode: mode as 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY' | 'MONITORING',
            includeSteps,
        });

        // 성능 메트릭 로깅
        const performanceMonitor = PerformanceMonitor.getInstance();
        performanceMonitor.recordMetric({
            engine: 'intelligent-monitoring',
            mode: mode,
            responseTime: analysisResult.overallResult.totalProcessingTime,
            success: analysisResult.overallResult.severity !== 'critical',
            confidence: analysisResult.overallResult.mlEnhanced ? 0.9 : 0.7,
            fallbacksUsed: 0,
            queryType: 'monitoring'
        });

        // 통합 로깅
        const unifiedLogger = UnifiedLogger.getInstance();
        unifiedLogger.info(
            'ai-engine',
            'intelligent-monitoring',
            `지능형 모니터링 분석 완료 - ${analysisResult.analysisId}`,
            {
                analysisId: analysisResult.analysisId,
                mode,
                includeSteps,
                result: {
                    severity: analysisResult.overallResult.severity,
                    mlEnhanced: analysisResult.overallResult.mlEnhanced,
                    totalTime: analysisResult.overallResult.totalProcessingTime
                }
            },
            {
                engine: 'intelligent-monitoring',
                mode: mode,
                responseTime: analysisResult.overallResult.totalProcessingTime,
                success: true
            }
        );

        // 🚀 성능 최적화된 응답
        const response = {
            success: true,
            data: analysisResult,
            metadata: {
                timestamp: new Date().toISOString(),
                mlEnhanced: analysisResult.overallResult.mlEnhanced,
                processingTime: analysisResult.overallResult.totalProcessingTime
            }
        };

        console.log(`✅ [API] 지능형 모니터링 완료 - ${analysisResult.analysisId}`);

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('❌ [API] 지능형 모니터링 실패:', error);

        // 오류 로깅
        const unifiedLogger = UnifiedLogger.getInstance();
        unifiedLogger.error(
            'ai-engine',
            'intelligent-monitoring',
            '지능형 모니터링 분석 중 오류가 발생했습니다.',
            error,
            {
                engine: 'intelligent-monitoring',
                success: false
            }
        );

        return NextResponse.json(
            {
                success: false,
                error: '지능형 모니터링 분석 중 오류가 발생했습니다.',
                details: error.message,
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const analysisId = searchParams.get('analysisId');
        const action = searchParams.get('action');

        const intelligentMonitoring = IntelligentMonitoringService.getInstance();

        if (action === 'status' && analysisId) {
            // 특정 분석 상태 조회
            const status = intelligentMonitoring.getAnalysisStatus(analysisId);
            return NextResponse.json({
                success: true,
                data: status
            });
        }

        if (action === 'active') {
            // 활성 분석 목록 조회
            const activeAnalyses = intelligentMonitoring.getActiveAnalyses();
            return NextResponse.json({
                success: true,
                data: activeAnalyses
            });
        }

        // 기본: 서비스 상태 및 정보
        return NextResponse.json({
            success: true,
            service: 'IntelligentMonitoringService',
            version: '3.0',
            modes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY', 'MONITORING'],
            capabilities: {
                anomalyDetection: true,
                rootCauseAnalysis: true,
                predictiveMonitoring: true,
                multiAIEngine: true,
                realTimeOptimization: true,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('❌ [API] 지능형 모니터링 조회 실패:', error);

        return NextResponse.json(
            {
                success: false,
                error: '지능형 모니터링 서비스 조회 중 오류가 발생했습니다.',
                details: error.message,
            },
            { status: 500 }
        );
    }
} 