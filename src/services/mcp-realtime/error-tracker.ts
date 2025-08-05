/**
 * 에러 추적 시스템
 */

export interface ErrorDetails {
  id: string;
  timestamp: number;
  server: string;

  // 에러 정보
  error: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };

  // 컨텍스트
  context: {
    operation: string;
    parameters?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  };

  // 메트릭
  metrics: {
    occurrenceCount: number;
    firstSeen: number;
    lastSeen: number;
    affectedUsers: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };

  // 상태
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  assignedTo?: string;
  resolution?: {
    resolvedAt: number;
    resolvedBy: string;
    notes: string;
    rootCause?: string;
  };
}

// 에러 패턴 분석 결과
export interface ErrorPattern {
  pattern: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedOperations: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
  firstDetected: number;
  lastDetected: number;
}

// 근본 원인 분석 결과
export interface RootCauseAnalysis {
  errorId: string;
  primaryCause: string;
  contributingFactors: string[];
  confidence: number; // 0-100
  impactScope: 'local' | 'service' | 'system' | 'global';
  recommendedActions: string[];
  preventionStrategies: string[];
}

// 복구 권장사항
export interface RecoveryRecommendation {
  type: 'immediate' | 'short-term' | 'long-term';
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class ErrorTracker {
  private errors: Map<string, ErrorDetails> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private analysisCache: Map<string, RootCauseAnalysis> = new Map();

  trackError(error: Error, context: ErrorDetails['context']): ErrorDetails {
    const errorId = this.generateErrorId(error, context);
    const existing = this.errors.get(errorId);

    if (existing) {
      existing.metrics.occurrenceCount++;
      existing.metrics.lastSeen = Date.now();
      return existing;
    }

    const newError: ErrorDetails = {
      id: errorId,
      timestamp: Date.now(),
      server: context.operation.split('.')[0] || 'unknown',
      error: {
        type: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      metrics: {
        occurrenceCount: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        affectedUsers: 1,
        severity: this.calculateSeverity(error),
      },
      status: 'new',
    };

    this.errors.set(errorId, newError);
    return newError;
  }

  private generateErrorId(
    error: Error,
    context: ErrorDetails['context']
  ): string {
    return `${error.name}-${error.message}-${context.operation}`.replace(
      /\s+/g,
      '-'
    );
  }

  private calculateSeverity(error: Error): ErrorDetails['metrics']['severity'] {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    }
    if (error.message.includes('error') || error.name.includes('Error')) {
      return 'high';
    }
    if (error.message.includes('warning')) {
      return 'medium';
    }
    return 'low';
  }

  getErrors(): ErrorDetails[] {
    return Array.from(this.errors.values());
  }

  clearErrors(): void {
    this.errors.clear();
  }

  // 🔍 에러 패턴 분석
  analyzeErrorPatterns(): ErrorPattern[] {
    const patterns = new Map<string, ErrorPattern>();
    const now = Date.now();
    const timeWindow = 24 * 60 * 60 * 1000; // 24시간

    // 최근 24시간 에러만 분석
    const recentErrors = Array.from(this.errors.values())
      .filter(error => now - error.timestamp < timeWindow);

    // 에러 타입별 패턴 분석
    for (const error of recentErrors) {
      const patternKey = `${error.error.type}-${error.context.operation}`;
      
      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.frequency++;
        pattern.lastDetected = Math.max(pattern.lastDetected, error.timestamp);
        
        if (!pattern.affectedOperations.includes(error.context.operation)) {
          pattern.affectedOperations.push(error.context.operation);
        }
      } else {
        patterns.set(patternKey, {
          pattern: patternKey,
          frequency: 1,
          severity: error.metrics.severity,
          affectedOperations: [error.context.operation],
          trend: 'stable',
          firstDetected: error.timestamp,
          lastDetected: error.timestamp,
        });
      }
    }

    // 트렌드 분석
    for (const pattern of patterns.values()) {
      const recentOccurrences = recentErrors.filter(
        error => `${error.error.type}-${error.context.operation}` === pattern.pattern
      );
      
      const halfWindow = timeWindow / 2;
      const firstHalf = recentOccurrences.filter(
        error => now - error.timestamp > halfWindow
      ).length;
      const secondHalf = recentOccurrences.filter(
        error => now - error.timestamp <= halfWindow
      ).length;

      if (secondHalf > firstHalf * 1.5) {
        pattern.trend = 'increasing';
      } else if (firstHalf > secondHalf * 1.5) {
        pattern.trend = 'decreasing';
      }
    }

    return Array.from(patterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  // 🔬 근본 원인 분석
  performRootCauseAnalysis(errorId: string): RootCauseAnalysis | null {
    if (this.analysisCache.has(errorId)) {
      return this.analysisCache.get(errorId)!;
    }

    const error = this.errors.get(errorId);
    if (!error) return null;

    // 유사 에러 패턴 찾기
    const similarErrors = Array.from(this.errors.values())
      .filter(e => 
        e.error.type === error.error.type && 
        e.context.operation === error.context.operation &&
        e.id !== errorId
      );

    // 근본 원인 분석 로직
    let primaryCause = '알 수 없는 원인';
    let confidence = 30;
    const contributingFactors: string[] = [];
    let impactScope: RootCauseAnalysis['impactScope'] = 'local';

    // 에러 메시지 패턴 분석
    if (error.error.message.includes('timeout')) {
      primaryCause = '네트워크 타임아웃 또는 성능 문제';
      confidence = 80;
      contributingFactors.push('네트워크 지연', '서버 과부하');
      impactScope = 'service';
    } else if (error.error.message.includes('authentication') || 
               error.error.message.includes('unauthorized')) {
      primaryCause = '인증 또는 권한 문제';
      confidence = 90;
      contributingFactors.push('토큰 만료', '권한 설정 오류');
      impactScope = 'local';
    } else if (error.error.message.includes('connection')) {
      primaryCause = '연결 실패';
      confidence = 85;
      contributingFactors.push('네트워크 불안정', '서버 다운');
      impactScope = 'system';
    } else if (similarErrors.length > 5) {
      primaryCause = '시스템적 문제 (반복 발생)';
      confidence = 70;
      contributingFactors.push('설정 오류', '리소스 부족');
      impactScope = 'system';
    }

    // 빈도 기반 신뢰도 조정
    if (error.metrics.occurrenceCount > 10) {
      confidence = Math.min(confidence + 20, 95);
      impactScope = impactScope === 'local' ? 'service' : 'system';
    }

    const analysis: RootCauseAnalysis = {
      errorId,
      primaryCause,
      contributingFactors,
      confidence,
      impactScope,
      recommendedActions: this.generateRecommendedActions(error, primaryCause),
      preventionStrategies: this.generatePreventionStrategies(primaryCause),
    };

    this.analysisCache.set(errorId, analysis);
    return analysis;
  }

  // 🛠️ 복구 권장사항 생성
  generateRecoveryRecommendations(errorId: string): RecoveryRecommendation[] {
    const error = this.errors.get(errorId);
    if (!error) return [];

    const recommendations: RecoveryRecommendation[] = [];

    // 즉시 조치
    if (error.metrics.severity === 'critical') {
      recommendations.push({
        type: 'immediate',
        action: '서비스 재시작 및 트래픽 차단',
        priority: 'critical',
        estimatedTime: '5분',
        dependencies: ['운영팀 알림'],
        riskLevel: 'low',
      });
    }

    // 단기 조치
    if (error.error.message.includes('timeout')) {
      recommendations.push({
        type: 'short-term',
        action: '타임아웃 값 증가 및 재시도 로직 개선',
        priority: 'high',
        estimatedTime: '2시간',
        dependencies: ['개발팀', '설정 변경'],
        riskLevel: 'medium',
      });
    }

    // 장기 조치
    if (error.metrics.occurrenceCount > 10) {
      recommendations.push({
        type: 'long-term',
        action: '근본 원인 분석 및 아키텍처 개선',
        priority: 'medium',
        estimatedTime: '1-2주',
        dependencies: ['아키텍트', '개발팀', '테스트팀'],
        riskLevel: 'low',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // 🔍 시스템 병목 식별
  identifySystemBottlenecks(): {
    bottlenecks: Array<{
      component: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      errorCount: number;
      description: string;
      impact: string;
    }>;
    recommendations: string[];
  } {
    const componentErrors = new Map<string, ErrorDetails[]>();
    
    // 컴포넌트별 에러 그룹화
    for (const error of this.errors.values()) {
      const component = error.context.operation.split('.')[0] || 'unknown';
      if (!componentErrors.has(component)) {
        componentErrors.set(component, []);
      }
      componentErrors.get(component)!.push(error);
    }

    const bottlenecks = Array.from(componentErrors.entries())
      .map(([component, errors]) => {
        const criticalCount = errors.filter(e => e.metrics.severity === 'critical').length;
        const highCount = errors.filter(e => e.metrics.severity === 'high').length;
        const totalCount = errors.length;

        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (criticalCount > 0) severity = 'critical';
        else if (highCount > 5) severity = 'high';
        else if (totalCount > 10) severity = 'medium';

        return {
          component,
          severity,
          errorCount: totalCount,
          description: `${component} 컴포넌트에서 ${totalCount}개 에러 발생`,
          impact: severity === 'critical' ? '서비스 중단 위험' : 
                  severity === 'high' ? '성능 저하' : '모니터링 필요',
        };
      })
      .filter(b => b.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount);

    const recommendations = [
      '가장 빈발하는 에러 패턴부터 우선 처리',
      'Critical 에러는 즉시 알림 시스템 구축',
      '반복되는 에러는 자동 복구 메커니즘 구현',
      '시스템 리소스 모니터링 강화',
    ];

    return { bottlenecks, recommendations };
  }

  // Private helper methods
  private generateRecommendedActions(error: ErrorDetails, primaryCause: string): string[] {
    const actions: string[] = [];

    if (primaryCause.includes('타임아웃')) {
      actions.push('타임아웃 설정 검토', '네트워크 연결 상태 확인', '서버 성능 모니터링');
    } else if (primaryCause.includes('인증')) {
      actions.push('토큰 갱신', '권한 설정 확인', '인증 서비스 상태 점검');
    } else if (primaryCause.includes('연결')) {
      actions.push('네트워크 연결 테스트', '서버 상태 확인', '방화벽 설정 점검');
    } else {
      actions.push('로그 상세 분석', '시스템 리소스 확인', '관련 서비스 점검');
    }

    return actions;
  }

  private generatePreventionStrategies(primaryCause: string): string[] {
    const strategies: string[] = [];

    if (primaryCause.includes('타임아웃')) {
      strategies.push('적응형 타임아웃 구현', '서킷 브레이커 패턴 적용', '캐싱 전략 도입');
    } else if (primaryCause.includes('인증')) {
      strategies.push('토큰 자동 갱신 구현', '권한 검증 강화', '보안 정책 업데이트');
    } else if (primaryCause.includes('연결')) {
      strategies.push('연결 풀 최적화', '재시도 로직 구현', '헬스체크 강화');
    } else {
      strategies.push('모니터링 강화', '알림 시스템 구축', '자동 복구 메커니즘 도입');
    }

    return strategies;
  }
}
