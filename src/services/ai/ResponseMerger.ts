import { MCPTaskResult, MCPResponse, Intent, MCPContext } from './MCPAIRouter';

export class ResponseMerger {
  
  /**
   * 🎯 결과 통합 및 응답 생성
   */
  async mergeResults(
    results: MCPTaskResult[], 
    intent: Intent, 
    context: MCPContext
  ): Promise<Omit<MCPResponse, 'processingTime' | 'metadata'>> {
    
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    // 각 유형별 결과 추출
    const timeSeriesResult = this.extractResult(successfulResults, 'timeseries');
    const nlpResult = this.extractResult(successfulResults, 'nlp');
    const anomalyResult = this.extractResult(successfulResults, 'anomaly');
    const pythonResult = this.extractResult(successfulResults, 'complex_ml');
    
    // 통합 요약 생성
    const summary = this.generateIntegratedSummary(
      intent,
      timeSeriesResult,
      nlpResult, 
      anomalyResult,
      pythonResult,
      context
    );
    
    // 전체 신뢰도 계산
    const confidence = this.calculateOverallConfidence(successfulResults);
    
    // 종합 권장사항 생성
    const recommendations = this.generateIntegratedRecommendations(
      intent,
      timeSeriesResult,
      anomalyResult,
      pythonResult,
      failedResults
    );
    
    // 사용된 엔진 목록
    const enginesUsed = [...new Set(successfulResults.map(r => r.engine))];
    
    return {
      success: successfulResults.length > 0,
      results,
      summary,
      confidence,
      enginesUsed,
      recommendations
    };
  }

  /**
   * 📊 특정 타입의 결과 추출
   */
  private extractResult(results: MCPTaskResult[], type: string): any {
    const result = results.find(r => r.type === type);
    return result?.result || null;
  }

  /**
   * 📝 통합 요약 생성
   */
  private generateIntegratedSummary(
    intent: Intent,
    timeSeriesResult: any,
    nlpResult: any,
    anomalyResult: any,
    pythonResult: any,
    context: MCPContext
  ): string {
    
    const summaryParts: string[] = [];
    
    // 기본 분석 상황 설명
    summaryParts.push(this.getBasicSituation(intent, context));
    
    // 이상 탐지 결과 우선 표시 (긴급도 높음)
    if (anomalyResult) {
      const anomalySummary = this.generateAnomalySummary(anomalyResult);
      if (anomalySummary) summaryParts.push(anomalySummary);
    }
    
    // 시계열 예측 결과
    if (timeSeriesResult) {
      const predictionSummary = this.generatePredictionSummary(timeSeriesResult);
      if (predictionSummary) summaryParts.push(predictionSummary);
    }
    
    // NLP 분석 결과
    if (nlpResult) {
      const nlpSummary = this.generateNLPSummary(nlpResult);
      if (nlpSummary) summaryParts.push(nlpSummary);
    }
    
    // Python 고급 분석 결과
    if (pythonResult) {
      const pythonSummary = this.generatePythonSummary(pythonResult);
      if (pythonSummary) summaryParts.push(pythonSummary);
    }
    
    return summaryParts.join(' ');
  }

  /**
   * 🔍 기본 상황 분석
   */
  private getBasicSituation(intent: Intent, context: MCPContext): string {
    const urgencyMap = {
      'critical': '🚨 긴급 상황',
      'high': '⚠️ 주의 필요',
      'medium': '📊 모니터링 중',
      'low': '✅ 정상 상태'
    };
    
    const situation = urgencyMap[intent.urgency] || '📊 분석 완료';
    
    // 메트릭 기반 현재 상태
    if (context.serverMetrics && context.serverMetrics.length > 0) {
      const latest = context.serverMetrics[context.serverMetrics.length - 1];
      return `${situation}: 현재 CPU ${latest.cpu}%, 메모리 ${latest.memory}% 사용 중입니다.`;
    }
    
    return `${situation}: ${intent.primary.replace('_', ' ')} 분석을 완료했습니다.`;
  }

  /**
   * 🚨 이상 탐지 요약
   */
  private generateAnomalySummary(anomalyResult: any): string {
    if (!anomalyResult.anomalies || anomalyResult.anomalies.length === 0) {
      return '이상 징후가 감지되지 않았습니다.';
    }
    
    const anomalyCount = anomalyResult.anomalies.length;
    const maxScore = anomalyResult.overallScore;
    
    if (maxScore > 0.8) {
      return `🚨 ${anomalyCount}개의 심각한 이상 징후가 감지되었습니다 (위험도: ${(maxScore * 100).toFixed(1)}%).`;
    } else if (maxScore > 0.6) {
      return `⚠️ ${anomalyCount}개의 이상 징후가 발견되었습니다 (위험도: ${(maxScore * 100).toFixed(1)}%).`;
    } else {
      return `📋 ${anomalyCount}개의 경미한 이상이 감지되었습니다.`;
    }
  }

  /**
   * 📈 예측 결과 요약
   */
  private generatePredictionSummary(timeSeriesResult: any): string {
    if (!timeSeriesResult.predictions) return '';
    
    const { cpu, memory } = timeSeriesResult.predictions;
    const timeframe = timeSeriesResult.timeframe || '24시간';
    
    const summaryParts: string[] = [];
    
    if (cpu) {
      const cpuTrend = cpu.trend === 'increasing' ? '증가' : cpu.trend === 'decreasing' ? '감소' : '안정';
      summaryParts.push(`CPU는 ${timeframe} 후 ${cpu.nextValue.toFixed(1)}%로 ${cpuTrend} 추세`);
    }
    
    if (memory) {
      const memoryTrend = memory.trend === 'increasing' ? '증가' : memory.trend === 'decreasing' ? '감소' : '안정';
      summaryParts.push(`메모리는 ${memory.nextValue.toFixed(1)}%로 ${memoryTrend} 예상`);
    }
    
    return summaryParts.length > 0 ? `📈 예측: ${summaryParts.join(', ')}.` : '';
  }

  /**
   * 📝 NLP 분석 요약
   */
  private generateNLPSummary(nlpResult: any): string {
    const summaryParts: string[] = [];
    
    // 감정 분석
    if (nlpResult.sentiment) {
      const sentimentMap: Record<string, string> = {
        'positive': '긍정적',
        'negative': '부정적', 
        'neutral': '중립적'
      };
      const sentimentText = sentimentMap[nlpResult.sentiment.label] || '알 수 없음';
      summaryParts.push(`요청의 감정 상태는 ${sentimentText}입니다`);
    }
    
    // 로그 분석
    if (nlpResult.logAnalysis) {
      const { errorLogs, warningLogs, severity } = nlpResult.logAnalysis;
      if (errorLogs > 0) {
        summaryParts.push(`${errorLogs}개의 오류 로그가 발견되었습니다`);
      }
      if (warningLogs > 5) {
        summaryParts.push(`${warningLogs}개의 경고 로그가 있습니다`);
      }
    }
    
    return summaryParts.length > 0 ? `📝 텍스트 분석: ${summaryParts.join(', ')}.` : '';
  }

  /**
   * 🐍 Python 분석 요약
   */
  private generatePythonSummary(pythonResult: any): string {
    // Python 서비스 결과 또는 fallback 결과 처리
    if (pythonResult.summary) {
      return `🐍 고급 분석: ${pythonResult.summary}`;
    }
    
    if (pythonResult.type === 'statistical_analysis') {
      return `📊 통계 분석: ${pythonResult.summary}`;
    }
    
    return '';
  }

  /**
   * 🎯 전체 신뢰도 계산
   */
  private calculateOverallConfidence(results: MCPTaskResult[]): number {
    if (results.length === 0) return 0;
    
    const confidences = results
      .filter(r => r.confidence !== undefined)
      .map(r => r.confidence!);
    
    if (confidences.length === 0) return 0.5;
    
    // 가중 평균 계산 (더 많은 결과가 있을수록 신뢰도 증가)
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const completeness = Math.min(results.length / 4, 1); // 최대 4개 엔진
    
    return Math.min(average * (0.7 + completeness * 0.3), 1.0);
  }

  /**
   * 💡 통합 권장사항 생성
   */
  private generateIntegratedRecommendations(
    intent: Intent,
    timeSeriesResult: any,
    anomalyResult: any,
    pythonResult: any,
    failedResults: MCPTaskResult[]
  ): string[] {
    
    const recommendations: string[] = [];
    
    // 이상 탐지 기반 권장사항 (우선순위 높음)
    if (anomalyResult && anomalyResult.anomalies?.length > 0) {
      if (anomalyResult.overallScore > 0.8) {
        recommendations.push('🚨 즉시 시스템 점검이 필요합니다');
        recommendations.push('📞 시스템 관리자에게 긴급 연락하세요');
      } else if (anomalyResult.overallScore > 0.6) {
        recommendations.push('⚠️ 시스템 상태를 면밀히 모니터링하세요');
        recommendations.push('📋 상세한 로그 분석을 수행하세요');
      }
    }
    
    // 예측 기반 권장사항
    if (timeSeriesResult?.predictions) {
      const { cpu, memory } = timeSeriesResult.predictions;
      
      if (cpu?.nextValue > 85) {
        recommendations.push('💻 CPU 부하 분산 또는 스케일링을 검토하세요');
      }
      
      if (memory?.nextValue > 80) {
        recommendations.push('🧠 메모리 증설 또는 최적화를 고려하세요');
      }
      
      if (cpu?.trend === 'increasing' && memory?.trend === 'increasing') {
        recommendations.push('📈 리소스 사용량이 지속 증가하고 있어 용량 계획이 필요합니다');
      }
    }
    
    // Python 분석 기반 권장사항
    if (pythonResult?.recommendations) {
      if (Array.isArray(pythonResult.recommendations)) {
        recommendations.push(...pythonResult.recommendations);
      }
    }
    
    // 의도별 기본 권장사항
    this.addIntentBasedRecommendations(intent, recommendations);
    
    // 실패한 분석에 대한 권장사항
    if (failedResults.length > 0) {
      recommendations.push('🔄 일부 분석이 실패했습니다. 네트워크 상태를 확인하세요');
    }
    
    // 기본 권장사항 (없을 경우)
    if (recommendations.length === 0) {
      recommendations.push('✅ 현재 시스템 상태는 안정적입니다');
      recommendations.push('📊 정기적인 모니터링을 지속하세요');
    }
    
    // 중복 제거 및 최대 5개로 제한
    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * 🎯 의도별 기본 권장사항 추가
   */
  private addIntentBasedRecommendations(intent: Intent, recommendations: string[]): void {
    switch (intent.primary) {
      case 'capacity_planning':
        recommendations.push('📊 장기적인 리소스 계획을 수립하세요');
        recommendations.push('💡 비용 효율적인 확장 방안을 검토하세요');
        break;
        
      case 'troubleshooting':
        recommendations.push('🔍 문제의 근본 원인을 파악하세요');
        recommendations.push('📝 문제 해결 과정을 문서화하세요');
        break;
        
      case 'log_analysis':
        recommendations.push('📊 로그 보존 정책을 검토하세요');
        recommendations.push('🔔 자동 알림 시스템을 구성하세요');
        break;
        
      case 'server_performance_prediction':
        recommendations.push('⏰ 예방적 유지보수 일정을 수립하세요');
        recommendations.push('📈 성능 트렌드를 지속 모니터링하세요');
        break;
    }
  }

  /**
   * 📊 결과 통계 생성
   */
  generateResultStatistics(results: MCPTaskResult[]): any {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / total;
    
    const engineUsage = results.reduce((acc, r) => {
      acc[r.engine] = (acc[r.engine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      successful,
      failed,
      successRate: successful / total,
      avgExecutionTime: Math.round(avgExecutionTime),
      engineUsage
    };
  }
} 