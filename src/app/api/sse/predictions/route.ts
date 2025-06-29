/**
 * 🧠 Server-Sent Events for AI Predictions
 * 
 * Vercel 호환 실시간 AI 예측 결과 스트리밍
 * - AI 분석 결과 실시간 전송
 * - 예측 신뢰도 및 메타데이터 포함
 * - 자동 장애 예측 알림
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('🧠 SSE AI 예측 스트림 시작');

    // SSE 헤더 설정 (Vercel 호환)
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
    });

    // ReadableStream으로 SSE 구현
    const stream = new ReadableStream({
        start(controller) {
            console.log('🧠 AI 예측 SSE 스트림 컨트롤러 시작');

            // 연결 확인 메시지
            const welcomeData = {
                type: 'connection',
                message: 'SSE AI 예측 스트림 연결됨',
                timestamp: new Date().toISOString(),
                connectionId: Math.random().toString(36).substr(2, 9),
                aiEngine: 'UnifiedAIEngine',
            };

            controller.enqueue(`data: ${JSON.stringify(welcomeData)}\n\n`);

            // 데이터 생성기 인스턴스
            // const aiEngine = UnifiedAIEngineRouter.getInstance(); // 실제 AI 엔진은 간소화된 예측 함수 사용
            const generator = RealServerDataGenerator.getInstance();

            // 🎯 30초 간격으로 AI 예측 실행 (분석 최적화)
            const intervalId = setInterval(async () => {
                try {
                    const servers = generator.getAllServers();
                    const criticalServers = servers.filter(
                        server =>
                            server.metrics.cpu > 70 ||
                            server.metrics.memory > 75 ||
                            server.status !== 'running'
                    ).slice(0, 3); // 최대 3개 서버만 분석

                    // 각 서버에 대한 AI 예측 분석
                    for (const server of criticalServers) {
                        try {
                            const analysisContext = {
                                serverId: server.id,
                                serverName: server.name,
                                currentMetrics: server.metrics,
                                status: server.status,
                                historicalData: {
                                    avgCpu: server.metrics.cpu,
                                    avgMemory: server.metrics.memory,
                                    uptime: Math.random() * 720 + 24, // 24-744시간
                                },
                                timestamp: new Date().toISOString(),
                            };

                            // AI 분석 실행 (비동기)
                            const prediction = await generateServerPrediction(analysisContext);

                            const predictionData = {
                                type: 'ai-prediction',
                                serverId: server.id,
                                data: {
                                    serverName: server.name,
                                    prediction: prediction.analysis,
                                    riskLevel: prediction.riskLevel,
                                    confidence: prediction.confidence,
                                    recommendedActions: prediction.actions,
                                    nextCheckIn: prediction.nextCheck,
                                    predictedOutcome: prediction.outcome,
                                    analysisEngine: 'UnifiedAI',
                                    processingTime: prediction.processingTime,
                                },
                                timestamp: new Date().toISOString(),
                                priority: prediction.riskLevel === 'critical' ? 'urgent' :
                                    prediction.riskLevel === 'high' ? 'high' : 'normal',
                            };

                            // SSE 형식으로 예측 데이터 전송
                            controller.enqueue(`data: ${JSON.stringify(predictionData)}\n\n`);

                            console.log(`🧠 AI 예측 전송: ${server.name} (위험도: ${prediction.riskLevel})`);

                        } catch (error) {
                            console.error(`❌ ${server.name} 예측 오류:`, error);

                            // 예측 실패 메시지
                            const errorData = {
                                type: 'prediction-error',
                                serverId: server.id,
                                serverName: server.name,
                                message: '예측 분석 실패',
                                timestamp: new Date().toISOString(),
                            };

                            controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
                        }
                    }

                    // 시스템 전체 위험도 분석
                    const systemRisk = calculateSystemRisk(servers);
                    const systemAnalysis = {
                        type: 'system-analysis',
                        data: {
                            overallRisk: systemRisk.level,
                            riskFactors: systemRisk.factors,
                            affectedServers: systemRisk.affectedCount,
                            totalServers: servers.length,
                            recommendation: systemRisk.recommendation,
                            nextSystemCheck: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                        },
                        timestamp: new Date().toISOString(),
                    };

                    controller.enqueue(`data: ${JSON.stringify(systemAnalysis)}\n\n`);

                } catch (error) {
                    console.error('❌ SSE AI 예측 생성 오류:', error);

                    // 전역 에러 메시지 전송
                    const errorData = {
                        type: 'global-error',
                        message: 'AI 예측 시스템 오류',
                        timestamp: new Date().toISOString(),
                    };

                    controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
                }
            }, 30000); // 🎯 30초 간격 (AI 분석 최적화)

            // Keep-alive 핑 (5분마다)
            const pingIntervalId = setInterval(() => {
                const pingData = {
                    type: 'ping',
                    aiEngine: 'active',
                    timestamp: new Date().toISOString(),
                };

                controller.enqueue(`data: ${JSON.stringify(pingData)}\n\n`);
            }, 300000); // 5분마다 핑

            // 연결 종료 처리
            const cleanup = () => {
                console.log('🔌 SSE AI 예측 스트림 정리');
                clearInterval(intervalId);
                clearInterval(pingIntervalId);
            };

            // 클라이언트 연결 해제 감지
            request.signal.addEventListener('abort', () => {
                console.log('📡 AI 예측 클라이언트 연결 해제 감지');
                cleanup();
                controller.close();
            });

            // 타임아웃 설정 (30분)
            setTimeout(() => {
                console.log('⏰ SSE AI 예측 스트림 타임아웃 (30분)');
                cleanup();
                controller.close();
            }, 30 * 60 * 1000);

        },

        cancel() {
            console.log('🛑 SSE AI 예측 스트림 취소됨');
        }
    });

    return new Response(stream, { headers });
}

/**
 * 서버별 AI 예측 생성 (간소화 버전)
 */
async function generateServerPrediction(context: any) {
    const startTime = Date.now();

    // 간단한 규칙 기반 예측 (실제 AI 엔진 부하 최소화)
    const { currentMetrics } = context;
    let riskLevel = 'low';
    let analysis = '정상 운영 중';
    let confidence = 0.85;
    let actions: string[] = [];
    let outcome = '안정적 운영 유지';

    if (currentMetrics.cpu > 85 || currentMetrics.memory > 90) {
        riskLevel = 'critical';
        analysis = '시스템 과부하 임계 상태';
        confidence = 0.92;
        actions = ['즉시 스케일링 고려', '프로세스 최적화', '리소스 모니터링 강화'];
        outcome = '30분 내 성능 저하 예상';
    } else if (currentMetrics.cpu > 70 || currentMetrics.memory > 75) {
        riskLevel = 'high';
        analysis = '리소스 사용량 높음';
        confidence = 0.88;
        actions = ['프리벤티드 스케일링', '성능 모니터링'];
        outcome = '1시간 내 주의 필요';
    } else if (currentMetrics.cpu > 50 || currentMetrics.memory > 60) {
        riskLevel = 'medium';
        analysis = '정상 범위 내 운영';
        confidence = 0.85;
        actions = ['정기 모니터링 유지'];
        outcome = '안정적 운영 지속';
    }

    return {
        analysis,
        riskLevel,
        confidence,
        actions,
        outcome,
        nextCheck: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        processingTime: Date.now() - startTime,
    };
}

/**
 * 시스템 전체 위험도 계산
 */
function calculateSystemRisk(servers: any[]) {
    const highRiskServers = servers.filter(
        s => s.metrics.cpu > 80 || s.metrics.memory > 85
    );

    const criticalServers = servers.filter(
        s => s.metrics.cpu > 90 || s.metrics.memory > 95 || s.status !== 'running'
    );

    let level = 'low';
    let factors: string[] = [];
    let recommendation = '현재 시스템 안정';

    if (criticalServers.length > 0) {
        level = 'critical';
        factors = ['임계 서버 존재', '즉시 조치 필요'];
        recommendation = '긴급 시스템 점검 및 스케일링';
    } else if (highRiskServers.length > servers.length * 0.3) {
        level = 'high';
        factors = ['고위험 서버 비율 높음', '예방적 조치 권장'];
        recommendation = '프리벤티드 스케일링 및 최적화';
    } else if (highRiskServers.length > 0) {
        level = 'medium';
        factors = ['일부 서버 주의 필요'];
        recommendation = '모니터링 강화';
    }

    return {
        level,
        factors,
        affectedCount: highRiskServers.length,
        recommendation,
    };
}

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Cache-Control',
        },
    });
} 