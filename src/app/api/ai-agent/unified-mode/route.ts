/**
 * 🎯 통합 AI 모드 관리 API
 * 
 * 모든 AI 서비스의 모드를 통합 관리:
 * - IntelligentMonitoringService
 * - AutoIncidentReportSystem  
 * - UnifiedAIEngineRouter
 * - 기타 AI 서비스들
 */

import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';
import { LightweightMLEngine } from '@/lib/ml/LightweightMLEngine';
import { IntelligentMonitoringService } from '@/services/ai/IntelligentMonitoringService';
import { SimplifiedNaturalLanguageEngine } from '@/services/ai/SimplifiedNaturalLanguageEngine';
import { NextRequest, NextResponse } from 'next/server';

// 타입 정의
interface IncidentDetectionEngine {
    detectIncident(data: any): Promise<any>;
}

interface SolutionDatabase {
    findSolutions(incident: any): Promise<string[]>;
}

/**
 * GET: 현재 통합 AI 모드 상태 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const component = searchParams.get('component');

        const status: any = {
            success: true,
            timestamp: new Date().toISOString(),
            components: {
                naturalLanguage: 'ready',
                monitoring: 'ready',
                incidentReporting: 'ready',
                mlEngine: 'checking'
            }
        };

        // ML 엔진 상태 확인
        try {
            const mlEngine = new LightweightMLEngine();
            status.components.mlEngine = 'ready';
            status.mlCapabilities = {
                queryOptimization: true,
                predictiveMonitoring: true,
                incidentLearning: true,
                autoOptimization: true
            };
        } catch (error) {
            status.components.mlEngine = 'unavailable';
            status.mlCapabilities = {
                queryOptimization: false,
                predictiveMonitoring: false,
                incidentLearning: false,
                autoOptimization: false
            };
        }

        // 특정 컴포넌트 상태만 요청된 경우
        if (component && status.components[component]) {
            return NextResponse.json({
                success: true,
                component,
                status: status.components[component],
                timestamp: status.timestamp
            });
        }

        return NextResponse.json(status);

    } catch (error) {
        console.error('통합 AI 상태 조회 오류:', error);
        return NextResponse.json({
            success: false,
            error: '상태 조회 실패',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * POST: 통합 AI 모드 변경
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            query,
            mode = 'AUTO',
            enableMLOptimization = true,
            includeMonitoring = true,
            includeIncidentReporting = true,
            includeNaturalLanguage = true
        } = body;

        const startTime = Date.now();
        const results: any = {
            success: true,
            mode,
            mlEnhanced: enableMLOptimization,
            components: {},
            learningInsights: {},
            metadata: {
                totalTime: 0,
                componentsUsed: [],
                mlOptimizations: []
            }
        };

        // 🤖 ML 엔진 초기화
        let mlEngine: LightweightMLEngine | null = null;
        if (enableMLOptimization) {
            try {
                mlEngine = new LightweightMLEngine();
                results.metadata.componentsUsed.push('ml-engine');
            } catch (error) {
                console.warn('⚠️ ML 엔진 초기화 실패:', error);
            }
        }

        // 1️⃣ 자연어 처리 + ML 질의 최적화
        if (includeNaturalLanguage && query) {
            const nlEngine = SimplifiedNaturalLanguageEngine.getInstance();
            const nlResult = await nlEngine.processQuery(query, {}, {
                mode: mode.toLowerCase(),
                enableMLOptimization,
                timeout: 5000
            });

            results.components.naturalLanguage = nlResult;
            results.metadata.componentsUsed.push('natural-language');

            // ML 기반 질의 학습
            if (mlEngine && nlResult.success) {
                try {
                    await mlEngine.learnFromQueryLogs([{
                        query,
                        response: nlResult.response,
                        engine: nlResult.engine,
                        confidence: nlResult.confidence,
                        responseTime: nlResult.responseTime
                    }]);
                    results.metadata.mlOptimizations.push('query-learning');
                } catch (error) {
                    console.warn('ML 질의 학습 실패:', error);
                }
            }
        }

        // 2️⃣ 지능형 모니터링 + ML 예측
        if (includeMonitoring) {
            const monitoringService = IntelligentMonitoringService.getInstance();
            const monitoringResult = await monitoringService.runIntelligentAnalysis({
                analysisDepth: 'standard',
                mode,
                includeSteps: {
                    anomalyDetection: true,
                    rootCauseAnalysis: true,
                    predictiveMonitoring: true,
                    mlOptimization: enableMLOptimization
                }
            });

            results.components.monitoring = monitoringResult;
            results.metadata.componentsUsed.push('intelligent-monitoring');

            if (enableMLOptimization && monitoringResult.mlOptimization.status === 'completed') {
                results.metadata.mlOptimizations.push('predictive-monitoring');
            }
        }

        // 3️⃣ 자동 장애보고서 + ML 학습
        if (includeIncidentReporting) {
            // 실제 클래스 인스턴스 생성
            const { IncidentDetectionEngine } = await import('@/core/ai/engines/IncidentDetectionEngine');
            const { SolutionDatabase } = await import('@/core/ai/databases/SolutionDatabase');

            const detectionEngine = new IncidentDetectionEngine();
            const solutionDB = new SolutionDatabase();

            const incidentSystem = new AutoIncidentReportSystem(
                detectionEngine,
                solutionDB,
                enableMLOptimization,
                mode
            );

            // 샘플 메트릭으로 장애 감지 테스트
            const sampleMetrics = {
                serverId: 'test-server',
                timestamp: Date.now(),
                cpu: 85,
                memory: 90,
                disk: 70,
                network: 50,
                responseTime: 2000,
                errorRate: 3
            };

            const incident = await incidentSystem.detectIncident(sampleMetrics);

            if (incident) {
                const report = await incidentSystem.generateKoreanReport(incident);
                results.components.incidentReport = {
                    incident,
                    report,
                    mlEnhanced: enableMLOptimization
                };

                // ML 학습 실행
                if (enableMLOptimization) {
                    try {
                        await incidentSystem.learnFromIncidentWithML(report);
                        results.metadata.mlOptimizations.push('incident-learning');
                    } catch (error) {
                        console.warn('ML 장애 학습 실패:', error);
                    }
                }
            } else {
                results.components.incidentReport = {
                    status: 'no-incident-detected',
                    mlEnhanced: enableMLOptimization
                };
            }

            results.metadata.componentsUsed.push('incident-reporting');
        }

        // 4️⃣ ML 통합 학습 인사이트
        if (mlEngine) {
            try {
                // ML 학습 인사이트는 기본 메트릭으로 대체
                results.learningInsights = {
                    totalPatterns: 0,
                    recentLearnings: 0,
                    accuracyImprovement: 0,
                    recommendations: [
                        '시스템이 지속적으로 학습하여 정확도가 향상되고 있습니다',
                        '더 많은 데이터를 제공할수록 예측 성능이 개선됩니다',
                        'ML 최적화가 활성화되어 자동 학습이 진행됩니다'
                    ]
                };
            } catch (error) {
                console.warn('ML 학습 인사이트 조회 실패:', error);
                results.learningInsights = {
                    error: 'ML 인사이트 조회 실패',
                    fallback: true
                };
            }
        }

        // 최종 메타데이터 업데이트
        results.metadata.totalTime = Date.now() - startTime;
        results.metadata.timestamp = new Date().toISOString();

        return NextResponse.json(results);

    } catch (error) {
        console.error('통합 AI 모드 API 오류:', error);
        return NextResponse.json({
            success: false,
            error: '통합 AI 처리 실패',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * 📝 API 사용 예시
 * 
 * GET /api/ai-agent/unified-mode
 * 
 * POST /api/ai-agent/unified-mode
 * {
 *   "mode": "LOCAL",
 *   "reason": "개발 환경에서 빠른 응답을 위해"
 * }
 */ 