/**
 * 🤖 AI Agent Virtual Analysis API
 * 
 * AI 에이전트가 가상 서버 데이터를 분석하는 API
 * - 실시간 서버 상태 분석
 * - 시스템 전체 분석 및 예측
 * - 개별 서버 상세 분석
 * - 이상 탐지 및 권장사항 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { virtualServerDataAdapter } from '@/services/ai/VirtualServerDataAdapter';

// GET: 가상 서버 분석 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'system-overview': {
        // 시스템 전체 개요 분석
        const systemAnalysis = await virtualServerDataAdapter.getSystemAnalysisData();
        const realtimeStream = await virtualServerDataAdapter.getRealtimeDataStream();
        
        return NextResponse.json({
          success: true,
          data: {
            analysis: systemAnalysis,
            realtime: realtimeStream,
            summary: {
              status: systemAnalysis.criticalServers > 0 ? 'critical' : 
                     systemAnalysis.warningServers > 0 ? 'warning' : 'healthy',
              totalIssues: systemAnalysis.topIssues.length,
              criticalIssues: systemAnalysis.topIssues.filter(i => i.severity === 'critical').length,
              performanceScore: calculateOverallPerformanceScore(systemAnalysis),
              recommendations: generateSystemRecommendations(systemAnalysis)
            }
          }
        });
      }

      case 'server-analysis': {
        // 개별 서버 상세 분석
        const serverId = searchParams.get('serverId');
        const hours = parseInt(searchParams.get('hours') || '24');
        
        if (!serverId) {
          return NextResponse.json({
            success: false,
            error: 'serverId 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        const serverData = await virtualServerDataAdapter.getServerData(serverId);
        const historyAnalysis = await virtualServerDataAdapter.getServerHistoryForAnalysis(serverId, hours);
        
        if (!serverData) {
          return NextResponse.json({
            success: false,
            error: '서버를 찾을 수 없습니다.'
          }, { status: 404 });
        }

        const analysis = generateServerAnalysisReport(serverData, historyAnalysis);
        
        return NextResponse.json({
          success: true,
          data: {
            server: serverData,
            history: historyAnalysis,
            analysis,
            recommendations: generateServerRecommendations(serverData, historyAnalysis)
          }
        });
      }

      case 'realtime-stream': {
        // 실시간 데이터 스트림
        const realtimeData = await virtualServerDataAdapter.getRealtimeDataStream();
        
        return NextResponse.json({
          success: true,
          data: {
            ...realtimeData,
            timestamp: new Date().toISOString(),
            insights: generateRealtimeInsights(realtimeData)
          }
        });
      }

      case 'anomaly-detection': {
        // 이상 탐지 분석
        const allServersData = await virtualServerDataAdapter.getAllServersData();
        const anomalies = detectAnomalies(allServersData);
        
        return NextResponse.json({
          success: true,
          data: {
            anomalies,
            totalServers: allServersData.length,
            anomalyCount: anomalies.length,
            riskLevel: calculateRiskLevel(anomalies),
            recommendations: generateAnomalyRecommendations(anomalies)
          }
        });
      }

      case 'performance-trends': {
        // 성능 트렌드 분석
        const allServersData = await virtualServerDataAdapter.getAllServersData();
        const trends = analyzePerformanceTrends(allServersData);
        
        return NextResponse.json({
          success: true,
          data: {
            trends,
            insights: generateTrendInsights(trends),
            predictions: generateTrendPredictions(trends)
          }
        });
      }

      case 'health-score': {
        // 시스템 건강도 점수
        const systemAnalysis = await virtualServerDataAdapter.getSystemAnalysisData();
        const healthScore = calculateSystemHealthScore(systemAnalysis);
        
        return NextResponse.json({
          success: true,
          data: {
            healthScore,
            breakdown: healthScore.breakdown,
            recommendations: healthScore.recommendations,
            trend: healthScore.trend
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: system-overview, server-analysis, realtime-stream, anomaly-detection, performance-trends, health-score'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [AI Virtual Analysis API] GET 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: AI 분석 요청 및 액션
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'analyze-query': {
        // 자연어 쿼리 분석
        const { query } = data;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'query 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        const analysisResult = await analyzeNaturalLanguageQuery(query);
        
        return NextResponse.json({
          success: true,
          data: {
            query,
            analysis: analysisResult,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'generate-report': {
        // 종합 분석 보고서 생성
        const { reportType, serverId, timeRange } = data;
        
        const report = await generateAnalysisReport(reportType, serverId, timeRange);
        
        return NextResponse.json({
          success: true,
          data: {
            report,
            generatedAt: new Date().toISOString()
          }
        });
      }

      case 'predict-issues': {
        // 이슈 예측 분석
        const { timeHorizon = '1h' } = data;
        
        const predictions = await predictPotentialIssues(timeHorizon);
        
        return NextResponse.json({
          success: true,
          data: {
            predictions,
            timeHorizon,
            confidence: calculatePredictionConfidence(predictions)
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: analyze-query, generate-report, predict-issues'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [AI Virtual Analysis API] POST 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 헬퍼 함수들

/**
 * 전체 성능 점수 계산
 */
function calculateOverallPerformanceScore(systemAnalysis: any): number {
  const { totalServers, healthyServers, warningServers, criticalServers, averageCpu, averageMemory } = systemAnalysis;
  
  const warningPenalty = (warningServers / totalServers) * 20;
  const criticalPenalty = (criticalServers / totalServers) * 50;
  const resourcePenalty = (averageCpu + averageMemory) / 200 * 30;
  
  const score = Math.max(0, 100 - warningPenalty - criticalPenalty - resourcePenalty);
  return Math.round(score);
}

/**
 * 시스템 권장사항 생성
 */
function generateSystemRecommendations(systemAnalysis: any): string[] {
  const recommendations: string[] = [];
  
  if (systemAnalysis.criticalServers > 0) {
    recommendations.push(`${systemAnalysis.criticalServers}개의 심각한 서버 이슈를 즉시 해결하세요.`);
  }
  
  if (systemAnalysis.averageCpu > 80) {
    recommendations.push('전체 시스템 CPU 사용률이 높습니다. 로드 밸런싱을 고려하세요.');
  }
  
  if (systemAnalysis.averageMemory > 85) {
    recommendations.push('메모리 사용률이 높습니다. 메모리 증설을 검토하세요.');
  }
  
  if (systemAnalysis.topIssues.length > 5) {
    recommendations.push('다수의 이슈가 감지되었습니다. 시스템 전체 점검을 권장합니다.');
  }
  
  return recommendations;
}

/**
 * 서버 분석 보고서 생성
 */
function generateServerAnalysisReport(serverData: any, historyAnalysis: any): any {
  const { metrics, trends } = serverData;
  const { analysis } = historyAnalysis;
  
  return {
    currentStatus: {
      overall: metrics.status,
      cpu: metrics.cpu_usage > 80 ? 'high' : metrics.cpu_usage > 60 ? 'medium' : 'normal',
      memory: metrics.memory_usage > 85 ? 'high' : metrics.memory_usage > 70 ? 'medium' : 'normal',
      disk: metrics.disk_usage > 90 ? 'high' : metrics.disk_usage > 75 ? 'medium' : 'normal',
      network: metrics.response_time > 500 ? 'slow' : metrics.response_time > 200 ? 'medium' : 'fast'
    },
    trends: {
      cpu: trends.cpu_trend,
      memory: trends.memory_trend,
      performance: trends.performance_score > 80 ? 'good' : trends.performance_score > 60 ? 'fair' : 'poor'
    },
    history: {
      averagePerformance: analysis.performanceScore,
      peakUsage: {
        cpu: analysis.peakCpu,
        memory: analysis.peakMemory
      },
      reliability: {
        uptime: ((24 * 60 - analysis.downtimeMinutes) / (24 * 60)) * 100,
        alertFrequency: analysis.alertCount / 24 // per hour
      }
    },
    riskAssessment: {
      level: calculateServerRiskLevel(serverData, analysis),
      factors: identifyRiskFactors(serverData, analysis)
    }
  };
}

/**
 * 서버 권장사항 생성
 */
function generateServerRecommendations(serverData: any, historyAnalysis: any): string[] {
  const recommendations: string[] = [];
  const { metrics, trends } = serverData;
  const { analysis } = historyAnalysis;
  
  if (metrics.cpu_usage > 90) {
    recommendations.push('CPU 사용률이 매우 높습니다. 프로세스 최적화가 필요합니다.');
  }
  
  if (trends.cpu_trend === 'increasing') {
    recommendations.push('CPU 사용률이 증가 추세입니다. 모니터링을 강화하세요.');
  }
  
  if (analysis.downtimeMinutes > 30) {
    recommendations.push('다운타임이 발생했습니다. 안정성 개선이 필요합니다.');
  }
  
  if (analysis.alertCount > 10) {
    recommendations.push('알림이 빈번합니다. 임계값 조정을 검토하세요.');
  }
  
  if (trends.performance_score < 70) {
    recommendations.push('성능 점수가 낮습니다. 전반적인 최적화가 필요합니다.');
  }
  
  return recommendations;
}

/**
 * 실시간 인사이트 생성
 */
function generateRealtimeInsights(realtimeData: any): any {
  const { servers, systemMetrics, alerts } = realtimeData;
  
  const criticalServers = servers.filter((s: any) => s.metrics.status === 'critical');
  const highCpuServers = servers.filter((s: any) => s.metrics.cpu_usage > 80);
  const slowResponseServers = servers.filter((s: any) => s.metrics.response_time > 500);
  
  return {
    summary: {
      totalServers: servers.length,
      healthyServers: servers.filter((s: any) => s.metrics.status === 'healthy').length,
      issuesDetected: criticalServers.length + highCpuServers.length + slowResponseServers.length
    },
    hotspots: {
      criticalServers: criticalServers.map((s: any) => s.hostname),
      highCpuServers: highCpuServers.map((s: any) => s.hostname),
      slowResponseServers: slowResponseServers.map((s: any) => s.hostname)
    },
    systemHealth: {
      averageCpu: systemMetrics.totalCpu,
      averageMemory: systemMetrics.totalMemory,
      networkLoad: systemMetrics.networkThroughput,
      responseTime: systemMetrics.responseTime
    },
    alertSummary: {
      total: alerts.length,
      critical: alerts.filter((a: any) => a.severity === 'critical').length,
      warning: alerts.filter((a: any) => a.severity === 'warning').length
    }
  };
}

/**
 * 이상 탐지
 */
function detectAnomalies(serversData: any[]): any[] {
  const anomalies: any[] = [];
  
  // CPU 사용률 이상
  const avgCpu = serversData.reduce((sum, s) => sum + s.metrics.cpu_usage, 0) / serversData.length;
  const cpuThreshold = avgCpu + 30; // 평균보다 30% 높으면 이상
  
  serversData.forEach(server => {
    if (server.metrics.cpu_usage > cpuThreshold) {
      anomalies.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'cpu_spike',
        value: server.metrics.cpu_usage,
        threshold: cpuThreshold,
        severity: 'high',
        description: `CPU 사용률이 평균보다 ${(server.metrics.cpu_usage - avgCpu).toFixed(1)}% 높습니다.`
      });
    }
    
    // 응답 시간 이상
    if (server.metrics.response_time > 1000) {
      anomalies.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'slow_response',
        value: server.metrics.response_time,
        threshold: 1000,
        severity: 'medium',
        description: `응답 시간이 ${server.metrics.response_time}ms로 매우 느립니다.`
      });
    }
    
    // 메모리 사용률 급증
    if (server.metrics.memory_usage > 95) {
      anomalies.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'memory_critical',
        value: server.metrics.memory_usage,
        threshold: 95,
        severity: 'critical',
        description: `메모리 사용률이 ${server.metrics.memory_usage}%로 위험 수준입니다.`
      });
    }
  });
  
  return anomalies;
}

/**
 * 위험도 계산
 */
function calculateRiskLevel(anomalies: any[]): string {
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (anomalies.length > 0) return 'medium';
  return 'low';
}

/**
 * 이상 탐지 권장사항
 */
function generateAnomalyRecommendations(anomalies: any[]): string[] {
  const recommendations: string[] = [];
  
  const cpuAnomalies = anomalies.filter(a => a.type === 'cpu_spike');
  const memoryAnomalies = anomalies.filter(a => a.type === 'memory_critical');
  const responseAnomalies = anomalies.filter(a => a.type === 'slow_response');
  
  if (cpuAnomalies.length > 0) {
    recommendations.push(`${cpuAnomalies.length}개 서버에서 CPU 스파이크가 감지되었습니다. 프로세스 점검이 필요합니다.`);
  }
  
  if (memoryAnomalies.length > 0) {
    recommendations.push(`${memoryAnomalies.length}개 서버에서 메모리 부족이 감지되었습니다. 즉시 조치가 필요합니다.`);
  }
  
  if (responseAnomalies.length > 0) {
    recommendations.push(`${responseAnomalies.length}개 서버에서 응답 지연이 감지되었습니다. 네트워크 점검을 권장합니다.`);
  }
  
  return recommendations;
}

/**
 * 성능 트렌드 분석
 */
function analyzePerformanceTrends(serversData: any[]): any {
  const increasingCpu = serversData.filter(s => s.trends.cpu_trend === 'increasing').length;
  const increasingMemory = serversData.filter(s => s.trends.memory_trend === 'increasing').length;
  const avgPerformanceScore = serversData.reduce((sum, s) => sum + s.trends.performance_score, 0) / serversData.length;
  
  return {
    cpu: {
      increasing: increasingCpu,
      stable: serversData.filter(s => s.trends.cpu_trend === 'stable').length,
      decreasing: serversData.filter(s => s.trends.cpu_trend === 'decreasing').length
    },
    memory: {
      increasing: increasingMemory,
      stable: serversData.filter(s => s.trends.memory_trend === 'stable').length,
      decreasing: serversData.filter(s => s.trends.memory_trend === 'decreasing').length
    },
    performance: {
      average: Math.round(avgPerformanceScore),
      good: serversData.filter(s => s.trends.performance_score > 80).length,
      fair: serversData.filter(s => s.trends.performance_score > 60 && s.trends.performance_score <= 80).length,
      poor: serversData.filter(s => s.trends.performance_score <= 60).length
    }
  };
}

/**
 * 트렌드 인사이트 생성
 */
function generateTrendInsights(trends: any): string[] {
  const insights: string[] = [];
  
  if (trends.cpu.increasing > trends.cpu.decreasing) {
    insights.push('전체적으로 CPU 사용률이 증가하는 추세입니다.');
  }
  
  if (trends.memory.increasing > trends.memory.decreasing) {
    insights.push('메모리 사용률이 증가하는 서버가 많습니다.');
  }
  
  if (trends.performance.poor > 0) {
    insights.push(`${trends.performance.poor}개 서버의 성능이 저조합니다.`);
  }
  
  if (trends.performance.average < 70) {
    insights.push('전체 시스템 성능이 평균 이하입니다.');
  }
  
  return insights;
}

/**
 * 트렌드 예측 생성
 */
function generateTrendPredictions(trends: any): any[] {
  const predictions: any[] = [];
  
  if (trends.cpu.increasing > trends.cpu.stable + trends.cpu.decreasing) {
    predictions.push({
      metric: 'CPU Usage',
      prediction: 'increase',
      confidence: 0.75,
      timeframe: '1-2 hours',
      impact: 'medium'
    });
  }
  
  if (trends.memory.increasing > trends.memory.stable + trends.memory.decreasing) {
    predictions.push({
      metric: 'Memory Usage',
      prediction: 'increase',
      confidence: 0.70,
      timeframe: '2-4 hours',
      impact: 'high'
    });
  }
  
  return predictions;
}

/**
 * 시스템 건강도 점수 계산
 */
function calculateSystemHealthScore(systemAnalysis: any): any {
  const baseScore = 100;
  let deductions = 0;
  
  // 서버 상태별 점수 차감
  deductions += systemAnalysis.criticalServers * 20;
  deductions += systemAnalysis.warningServers * 10;
  deductions += systemAnalysis.offlineServers * 30;
  
  // 리소스 사용률 점수 차감
  if (systemAnalysis.averageCpu > 80) deductions += 15;
  if (systemAnalysis.averageMemory > 85) deductions += 15;
  
  // 이슈 개수별 점수 차감
  deductions += Math.min(systemAnalysis.topIssues.length * 2, 20);
  
  const finalScore = Math.max(0, baseScore - deductions);
  
  return {
    score: finalScore,
    grade: finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : finalScore >= 60 ? 'D' : 'F',
    breakdown: {
      serverHealth: Math.max(0, 100 - (systemAnalysis.criticalServers * 20 + systemAnalysis.warningServers * 10)),
      resourceUtilization: Math.max(0, 100 - (systemAnalysis.averageCpu + systemAnalysis.averageMemory) / 2),
      systemStability: Math.max(0, 100 - systemAnalysis.topIssues.length * 5)
    },
    recommendations: generateHealthScoreRecommendations(finalScore, systemAnalysis),
    trend: finalScore >= 80 ? 'stable' : finalScore >= 60 ? 'declining' : 'critical'
  };
}

/**
 * 건강도 점수 권장사항
 */
function generateHealthScoreRecommendations(score: number, systemAnalysis: any): string[] {
  const recommendations: string[] = [];
  
  if (score < 60) {
    recommendations.push('시스템 상태가 매우 좋지 않습니다. 즉시 전면적인 점검이 필요합니다.');
  } else if (score < 80) {
    recommendations.push('시스템 개선이 필요합니다. 주요 이슈들을 우선적으로 해결하세요.');
  }
  
  if (systemAnalysis.criticalServers > 0) {
    recommendations.push('심각한 서버 이슈를 최우선으로 해결하세요.');
  }
  
  if (systemAnalysis.averageCpu > 80 || systemAnalysis.averageMemory > 85) {
    recommendations.push('리소스 사용률이 높습니다. 용량 계획을 검토하세요.');
  }
  
  return recommendations;
}

/**
 * 서버 위험도 계산
 */
function calculateServerRiskLevel(serverData: any, analysis: any): string {
  let riskScore = 0;
  
  if (serverData.metrics.status === 'critical') riskScore += 40;
  else if (serverData.metrics.status === 'warning') riskScore += 20;
  
  if (serverData.metrics.cpu_usage > 90) riskScore += 30;
  else if (serverData.metrics.cpu_usage > 80) riskScore += 15;
  
  if (serverData.metrics.memory_usage > 95) riskScore += 25;
  else if (serverData.metrics.memory_usage > 85) riskScore += 10;
  
  if (analysis.downtimeMinutes > 60) riskScore += 20;
  if (analysis.alertCount > 20) riskScore += 15;
  
  if (riskScore >= 70) return 'critical';
  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
}

/**
 * 위험 요소 식별
 */
function identifyRiskFactors(serverData: any, analysis: any): string[] {
  const factors: string[] = [];
  
  if (serverData.metrics.cpu_usage > 90) factors.push('높은 CPU 사용률');
  if (serverData.metrics.memory_usage > 95) factors.push('메모리 부족');
  if (serverData.metrics.response_time > 1000) factors.push('느린 응답 시간');
  if (analysis.downtimeMinutes > 30) factors.push('다운타임 발생');
  if (analysis.alertCount > 15) factors.push('빈번한 알림');
  if (serverData.trends.performance_score < 60) factors.push('낮은 성능 점수');
  
  return factors;
}

/**
 * 자연어 쿼리 분석
 */
async function analyzeNaturalLanguageQuery(query: string): Promise<any> {
  // 간단한 키워드 기반 분석 (실제로는 NLP 모델 사용)
  const keywords = query.toLowerCase();
  
  let analysisType = 'general';
  const targetServers: string[] = [];
  const metrics: string[] = [];
  
  if (keywords.includes('cpu') || keywords.includes('프로세서')) {
    metrics.push('cpu');
  }
  if (keywords.includes('memory') || keywords.includes('메모리') || keywords.includes('ram')) {
    metrics.push('memory');
  }
  if (keywords.includes('disk') || keywords.includes('디스크') || keywords.includes('storage')) {
    metrics.push('disk');
  }
  if (keywords.includes('network') || keywords.includes('네트워크') || keywords.includes('응답')) {
    metrics.push('network');
  }
  
  if (keywords.includes('web') || keywords.includes('웹')) {
    targetServers.push('web');
  }
  if (keywords.includes('database') || keywords.includes('db') || keywords.includes('데이터베이스')) {
    targetServers.push('database');
  }
  
  if (keywords.includes('문제') || keywords.includes('이슈') || keywords.includes('오류')) {
    analysisType = 'problem';
  } else if (keywords.includes('예측') || keywords.includes('미래') || keywords.includes('전망')) {
    analysisType = 'prediction';
  } else if (keywords.includes('성능') || keywords.includes('속도')) {
    analysisType = 'performance';
  }
  
  // 실제 데이터 분석 수행
  const systemAnalysis = await virtualServerDataAdapter.getSystemAnalysisData();
  const realtimeData = await virtualServerDataAdapter.getRealtimeDataStream();
  
  return {
    query,
    interpretation: {
      analysisType,
      targetServers,
      metrics,
      intent: determineQueryIntent(keywords)
    },
    results: generateQueryResults(analysisType, targetServers, metrics, systemAnalysis, realtimeData),
    confidence: 0.85
  };
}

/**
 * 쿼리 의도 파악
 */
function determineQueryIntent(keywords: string): string {
  if (keywords.includes('어떻게') || keywords.includes('왜') || keywords.includes('원인')) {
    return 'explanation';
  } else if (keywords.includes('해결') || keywords.includes('고치') || keywords.includes('개선')) {
    return 'solution';
  } else if (keywords.includes('상태') || keywords.includes('현재') || keywords.includes('지금')) {
    return 'status';
  } else if (keywords.includes('비교') || keywords.includes('차이')) {
    return 'comparison';
  }
  return 'information';
}

/**
 * 쿼리 결과 생성
 */
function generateQueryResults(analysisType: string, targetServers: string[], metrics: string[], systemAnalysis: any, realtimeData: any): any {
  const results: any = {
    summary: '',
    data: {},
    recommendations: []
  };
  
  switch (analysisType) {
    case 'problem':
      results.summary = `현재 ${systemAnalysis.criticalServers + systemAnalysis.warningServers}개의 서버에서 이슈가 감지되었습니다.`;
      results.data = {
        issues: systemAnalysis.topIssues,
        criticalServers: systemAnalysis.criticalServers,
        warningServers: systemAnalysis.warningServers
      };
      break;
      
    case 'performance':
      const avgPerformance = realtimeData.servers.reduce((sum: number, s: any) => sum + s.trends.performance_score, 0) / realtimeData.servers.length;
      results.summary = `전체 시스템 성능 점수는 ${Math.round(avgPerformance)}점입니다.`;
      results.data = {
        averagePerformance: avgPerformance,
        systemMetrics: realtimeData.systemMetrics,
        trends: analyzePerformanceTrends(realtimeData.servers)
      };
      break;
      
    case 'prediction':
      results.summary = '향후 1시간 내 예상되는 변화를 분석했습니다.';
      results.data = {
        predictions: systemAnalysis.predictions,
        trends: analyzePerformanceTrends(realtimeData.servers)
      };
      break;
      
    default:
      results.summary = `총 ${systemAnalysis.totalServers}개 서버 중 ${systemAnalysis.healthyServers}개가 정상 상태입니다.`;
      results.data = {
        systemStatus: systemAnalysis,
        realtimeMetrics: realtimeData.systemMetrics
      };
  }
  
  return results;
}

/**
 * 분석 보고서 생성
 */
async function generateAnalysisReport(reportType: string, serverId?: string, timeRange?: string): Promise<any> {
  const report: any = {
    type: reportType,
    generatedAt: new Date().toISOString(),
    timeRange: timeRange || '24h',
    data: {}
  };
  
  switch (reportType) {
    case 'system-overview':
      const systemAnalysis = await virtualServerDataAdapter.getSystemAnalysisData();
      const realtimeData = await virtualServerDataAdapter.getRealtimeDataStream();
      
      report.data = {
        executive_summary: {
          totalServers: systemAnalysis.totalServers,
          healthyServers: systemAnalysis.healthyServers,
          issuesDetected: systemAnalysis.topIssues.length,
          overallHealth: calculateOverallPerformanceScore(systemAnalysis)
        },
        detailed_analysis: systemAnalysis,
        realtime_status: realtimeData,
        recommendations: generateSystemRecommendations(systemAnalysis)
      };
      break;
      
    case 'server-detail':
      if (!serverId) throw new Error('serverId is required for server-detail report');
      
      const serverData = await virtualServerDataAdapter.getServerData(serverId);
      const historyAnalysis = await virtualServerDataAdapter.getServerHistoryForAnalysis(serverId, 24);
      
      report.data = {
        server_info: serverData,
        performance_analysis: generateServerAnalysisReport(serverData, historyAnalysis),
        history: historyAnalysis,
        recommendations: generateServerRecommendations(serverData, historyAnalysis)
      };
      break;
      
    case 'security-audit':
      const allServersData = await virtualServerDataAdapter.getAllServersData();
      const anomalies = detectAnomalies(allServersData);
      
      report.data = {
        security_status: 'monitoring',
        anomalies_detected: anomalies,
        risk_assessment: calculateRiskLevel(anomalies),
        recommendations: generateAnomalyRecommendations(anomalies)
      };
      break;
  }
  
  return report;
}

/**
 * 이슈 예측
 */
async function predictPotentialIssues(timeHorizon: string): Promise<any[]> {
  const allServersData = await virtualServerDataAdapter.getAllServersData();
  const predictions: any[] = [];
  
  allServersData.forEach(server => {
    const { metrics, trends } = server;
    
    // CPU 예측
    if (trends.cpu_trend === 'increasing' && metrics.cpu_usage > 70) {
      predictions.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'cpu_overload',
        probability: 0.75,
        timeframe: timeHorizon,
        description: 'CPU 사용률이 계속 증가하면 과부하가 예상됩니다.',
        preventive_action: 'CPU 집약적인 프로세스 최적화 또는 스케일링'
      });
    }
    
    // 메모리 예측
    if (trends.memory_trend === 'increasing' && metrics.memory_usage > 80) {
      predictions.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'memory_exhaustion',
        probability: 0.70,
        timeframe: timeHorizon,
        description: '메모리 사용률 증가로 메모리 부족이 예상됩니다.',
        preventive_action: '메모리 누수 점검 또는 메모리 증설'
      });
    }
    
    // 성능 저하 예측
    if (trends.performance_score < 70 && (trends.cpu_trend === 'increasing' || trends.memory_trend === 'increasing')) {
      predictions.push({
        serverId: server.serverId,
        hostname: server.hostname,
        type: 'performance_degradation',
        probability: 0.65,
        timeframe: timeHorizon,
        description: '성능 점수 하락과 리소스 증가로 성능 저하가 예상됩니다.',
        preventive_action: '전반적인 시스템 최적화 및 모니터링 강화'
      });
    }
  });
  
  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * 예측 신뢰도 계산
 */
function calculatePredictionConfidence(predictions: any[]): number {
  if (predictions.length === 0) return 0;
  
  const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
  return Math.round(avgProbability * 100);
} 