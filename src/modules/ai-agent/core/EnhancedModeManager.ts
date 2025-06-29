/**
 * Enhanced Mode Manager
 *
 * 🎛️ 스마트 모드 관리 시스템
 * - 자동 모드 감지 및 전환
 * - 모드별 설정 관리
 * - 성능 최적화
 * - 장애 감지 및 분석 통합
 */

import {
  SmartModeDetector,
  QueryAnalysis,
  AIAgentMode,
  IncidentType,
} from './SmartModeDetector';

export interface ModeConfig {
  maxProcessingTime: number;
  contextLength: number;
  responseDepth: 'standard' | 'comprehensive';
  enableAdvancedAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  enableMultiServerCorrelation: boolean;
  maxResponseLength: number;
  // 장애 분석 관련 설정 추가
  incidentAnalysis: {
    enabled: boolean;
    autoDetectSeverity: boolean;
    autoApplyTemplates: boolean;
    includeRecommendations: boolean;
    collectEvidence: boolean;
    correlateWithPastIncidents: boolean;
    generateReports: boolean;
    maxEvidenceItems: number;
    maxRootCauses: number;
    maxRecommendations: number;
  };
}

// 장애 분석 관련 히스토리 항목 인터페이스
interface IncidentHistoryItem {
  timestamp: number;
  query: string;
  incidentType: IncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  recommendationCount: number;
  rootCausesIdentified: boolean;
}

export class EnhancedModeManager {
  private modeDetector: SmartModeDetector;
  private currentMode: AIAgentMode = 'basic';
  private autoModeEnabled: boolean = true;
  private modeHistory: Array<{
    timestamp: number;
    query: string;
    detectedMode: AIAgentMode;
    confidence: number;
    reasoning: string;
  }> = [];

  // 장애 분석 히스토리 추가
  private incidentHistory: IncidentHistoryItem[] = [];
  private activeIncidents: Map<
    string,
    {
      type: IncidentType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: number;
      lastUpdated: number;
      queryCount: number;
    }
  > = new Map();

  constructor() {
    this.modeDetector = new SmartModeDetector();
  }

  /**
   * 쿼리 분석 후 자동 모드 선택
   */
  analyzeAndSetMode(query: string): QueryAnalysis {
    const analysis = this.modeDetector.analyzeQuery(query);

    if (this.autoModeEnabled) {
      const previousMode = this.currentMode;
      this.currentMode = analysis.detectedMode;

      // 모드 변경 히스토리 기록
      this.modeHistory.push({
        timestamp: Date.now(),
        query: query.substring(0, 100),
        detectedMode: analysis.detectedMode,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
      });

      // 히스토리 크기 제한 (최근 100개만 유지)
      if (this.modeHistory.length > 100) {
        this.modeHistory = this.modeHistory.slice(-100);
      }

      console.log(`🧠 Smart Mode Detection:`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        previousMode,
        detectedMode: analysis.detectedMode,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        triggers: analysis.triggers,
        isIncidentRelated: analysis.isIncidentRelated,
        incidentType: analysis.incidentType,
        incidentSeverity: analysis.incidentSeverity,
      });

      // 장애 관련 쿼리인 경우 장애 이력 관리
      if (analysis.isIncidentRelated && analysis.incidentType) {
        this.trackIncident(
          query,
          analysis.incidentType,
          analysis.incidentSeverity || 'medium'
        );
      }
    }

    return analysis;
  }

  /**
   * 장애 추적 관리
   */
  private trackIncident(
    query: string,
    incidentType: IncidentType,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    const now = Date.now();
    const incidentKey = `${incidentType}_${severity}`;

    // 활성 장애가 있는지 확인
    if (this.activeIncidents.has(incidentKey)) {
      // 기존 장애 업데이트
      const incident = this.activeIncidents.get(incidentKey)!;
      incident.lastUpdated = now;
      incident.queryCount++;
      this.activeIncidents.set(incidentKey, incident);
    } else {
      // 새 장애 추가
      this.activeIncidents.set(incidentKey, {
        type: incidentType,
        severity,
        timestamp: now,
        lastUpdated: now,
        queryCount: 1,
      });

      // 장애 이력에 추가
      this.incidentHistory.push({
        timestamp: now,
        query: query.substring(0, 100),
        incidentType,
        severity,
        resolved: false,
        recommendationCount: 0,
        rootCausesIdentified: false,
      });

      // 이력 크기 제한 (최근 50개만 유지)
      if (this.incidentHistory.length > 50) {
        this.incidentHistory = this.incidentHistory.slice(-50);
      }
    }

    // 1시간 이상 업데이트가 없는 활성 장애는 자동 해결됨으로 처리
    const oneHour = 60 * 60 * 1000;
    for (const [key, incident] of this.activeIncidents.entries()) {
      if (now - incident.lastUpdated > oneHour) {
        this.activeIncidents.delete(key);

        // 이력에서 해당 장애 해결됨으로 표시
        const historyItem = this.incidentHistory.find(
          item =>
            item.incidentType === incident.type &&
            item.severity === incident.severity &&
            !item.resolved
        );

        if (historyItem) {
          historyItem.resolved = true;
        }
      }
    }
  }

  /**
   * 장애 이력 조회
   */
  getIncidentHistory(): typeof this.incidentHistory {
    return [...this.incidentHistory];
  }

  /**
   * 활성 장애 조회
   */
  getActiveIncidents(): {
    type: IncidentType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    lastUpdated: number;
    queryCount: number;
    durationMinutes: number;
  }[] {
    const now = Date.now();
    return Array.from(this.activeIncidents.values()).map(incident => ({
      ...incident,
      durationMinutes: Math.floor((now - incident.timestamp) / (60 * 1000)),
    }));
  }

  /**
   * 장애 해결 처리
   */
  resolveIncident(
    incidentType: IncidentType,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): boolean {
    const key = `${incidentType}_${severity}`;
    const wasActive = this.activeIncidents.has(key);

    if (wasActive) {
      this.activeIncidents.delete(key);

      // 이력에서 해당 장애 해결됨으로 표시
      const historyItem = this.incidentHistory.find(
        item =>
          item.incidentType === incidentType &&
          item.severity === severity &&
          !item.resolved
      );

      if (historyItem) {
        historyItem.resolved = true;
      }
    }

    return wasActive;
  }

  /**
   * 장애 통계 조회
   */
  getIncidentStats(): {
    totalIncidents: number;
    activeIncidents: number;
    resolvedIncidents: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    averageResolutionTimeMinutes: number;
  } {
    const total = this.incidentHistory.length;
    const active = this.activeIncidents.size;
    const resolved = this.incidentHistory.filter(i => i.resolved).length;

    // 심각도별 통계
    const severityStats: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    // 유형별 통계
    const typeStats: Record<string, number> = {};

    // 해결 시간 계산
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const incident of this.incidentHistory) {
      // 심각도별 카운트
      severityStats[incident.severity] =
        (severityStats[incident.severity] || 0) + 1;

      // 유형별 카운트
      typeStats[incident.incidentType] =
        (typeStats[incident.incidentType] || 0) + 1;

      // 활성 장애 중에서 이 장애 유형/심각도가 있는지 확인
      const key = `${incident.incidentType}_${incident.severity}`;
      const activeIncident = this.activeIncidents.get(key);

      // 해결된 장애이고 관련 활성 장애가 없는 경우에만 해결 시간 계산
      if (incident.resolved && !activeIncident) {
        // 여기서는 단순히 평균 1시간으로 가정 (실제로는 정확한 해결 시간 기록 필요)
        totalResolutionTime += 60;
        resolvedCount++;
      }
    }

    const avgResolutionTime =
      resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return {
      totalIncidents: total,
      activeIncidents: active,
      resolvedIncidents: resolved,
      bySeverity: severityStats,
      byType: typeStats,
      averageResolutionTimeMinutes: avgResolutionTime,
    };
  }

  /**
   * 모드별 설정 반환
   */
  getModeConfig(): ModeConfig {
    const configs: Record<AIAgentMode, ModeConfig> = {
      basic: {
        maxProcessingTime: 3000,
        contextLength: 2048,
        responseDepth: 'standard',
        enableAdvancedAnalysis: false,
        enablePredictiveAnalysis: false,
        enableMultiServerCorrelation: false,
        maxResponseLength: 300,
        incidentAnalysis: {
          enabled: true,
          autoDetectSeverity: true,
          autoApplyTemplates: true,
          includeRecommendations: true,
          collectEvidence: false,
          correlateWithPastIncidents: false,
          generateReports: false,
          maxEvidenceItems: 3,
          maxRootCauses: 2,
          maxRecommendations: 3,
        },
      },
      advanced: {
        maxProcessingTime: 10000,
        contextLength: 8192,
        responseDepth: 'comprehensive',
        enableAdvancedAnalysis: true,
        enablePredictiveAnalysis: true,
        enableMultiServerCorrelation: true,
        maxResponseLength: 2000,
        incidentAnalysis: {
          enabled: true,
          autoDetectSeverity: true,
          autoApplyTemplates: true,
          includeRecommendations: true,
          collectEvidence: true,
          correlateWithPastIncidents: true,
          generateReports: true,
          maxEvidenceItems: 10,
          maxRootCauses: 5,
          maxRecommendations: 7,
        },
      },
    };

    return configs[this.currentMode];
  }

  /**
   * 현재 모드 조회
   */
  getCurrentMode(): AIAgentMode {
    return this.currentMode;
  }

  /**
   * 수동 모드 설정
   */
  setMode(mode: AIAgentMode): void {
    this.currentMode = mode;
    console.log(`🔄 Manual mode change to: ${mode}`);
  }

  /**
   * 자동 모드 활성화/비활성화
   */
  setAutoMode(enabled: boolean): void {
    this.autoModeEnabled = enabled;
    console.log(`🔄 Auto mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 자동 모드 상태 확인
   */
  isAutoModeEnabled(): boolean {
    return this.autoModeEnabled;
  }

  /**
   * 모드 변경 히스토리 조회
   */
  getModeHistory(): typeof this.modeHistory {
    return [...this.modeHistory];
  }

  /**
   * 모드 사용 통계
   */
  getModeStats(): {
    totalQueries: number;
    basicModeCount: number;
    advancedModeCount: number;
    basicModePercentage: number;
    advancedModePercentage: number;
    averageConfidence: number;
    incidentRelatedPercentage: number;
  } {
    const total = this.modeHistory.length;
    const basicCount = this.modeHistory.filter(
      h => h.detectedMode === 'basic'
    ).length;
    const advancedCount = this.modeHistory.filter(
      h => h.detectedMode === 'advanced'
    ).length;
    const avgConfidence =
      total > 0
        ? this.modeHistory.reduce((sum, h) => sum + h.confidence, 0) / total
        : 0;
    const incidentRelatedPercentage =
      total > 0 ? Math.round((this.incidentHistory.length / total) * 100) : 0;

    return {
      totalQueries: total,
      basicModeCount: basicCount,
      advancedModeCount: advancedCount,
      basicModePercentage:
        total > 0 ? Math.round((basicCount / total) * 100) : 0,
      advancedModePercentage:
        total > 0 ? Math.round((advancedCount / total) * 100) : 0,
      averageConfidence: Math.round(avgConfidence),
      incidentRelatedPercentage,
    };
  }

  /**
   * 장애 분석 기반 최적화 제안
   */
  getIncidentOptimizationSuggestions(): string[] {
    const stats = this.getIncidentStats();
    const suggestions: string[] = [];

    if (stats.totalIncidents === 0) {
      return ['아직 장애 데이터가 충분하지 않습니다.'];
    }

    // 활성 장애가 많은 경우
    if (stats.activeIncidents > 3) {
      suggestions.push(
        '다수의 활성 장애가 감지되었습니다. 시스템 전반적인 점검이 필요합니다.'
      );
    }

    // 심각도 높은 장애가 많은 경우
    if ((stats.bySeverity.critical || 0) > 2) {
      suggestions.push(
        '심각도 높은 장애가 다수 발생했습니다. 긴급 조치가 필요합니다.'
      );
    }

    // 특정 유형의 장애가 많은 경우
    const mostFrequentType = Object.entries(stats.byType).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (mostFrequentType && mostFrequentType[1] > 3) {
      suggestions.push(
        `'${mostFrequentType[0]}' 유형의 장애가 자주 발생합니다. 근본 원인 분석이 필요합니다.`
      );
    }

    // 해결 시간이 긴 경우
    if (stats.averageResolutionTimeMinutes > 120) {
      suggestions.push(
        '장애 해결에 평균 2시간 이상 소요됩니다. 자동화된 복구 프로세스 검토가 필요합니다.'
      );
    }

    return suggestions;
  }

  /**
   * 모드 최적화 제안
   */
  getOptimizationSuggestions(): string[] {
    const stats = this.getModeStats();
    const suggestions: string[] = [];

    if (stats.totalQueries < 10) {
      suggestions.push(
        '더 많은 질문을 통해 모드 감지 정확도를 향상시킬 수 있습니다.'
      );
    }

    if (stats.averageConfidence < 70) {
      suggestions.push(
        '질문을 더 구체적으로 작성하면 모드 감지 정확도가 향상됩니다.'
      );
    }

    if (stats.advancedModePercentage > 80) {
      suggestions.push(
        '복잡한 질문이 많습니다. 간단한 조회는 기본 모드를 활용해보세요.'
      );
    }

    if (stats.basicModePercentage > 90) {
      suggestions.push(
        '고급 분석 기능을 더 활용해보세요. 상세한 분석이나 예측을 요청해보세요.'
      );
    }

    // 장애 관련 쿼리 비율이 높은 경우
    if (stats.incidentRelatedPercentage > 30) {
      suggestions.push(
        '장애 관련 쿼리 비율이 높습니다. 사전 모니터링을 강화하는 것이 좋습니다.'
      );
    }

    // 장애 최적화 제안 추가
    suggestions.push(...this.getIncidentOptimizationSuggestions());

    return suggestions;
  }

  /**
   * 장애 분석 템플릿 반환
   */
  getIncidentAnalysisTemplate(incidentType: IncidentType): string {
    const templates: Record<IncidentType, string> = {
      service_down: `
# 서비스 중단 분석 템플릿

## 1. 서비스 상태 확인
- [ ] 서비스 가용성 확인
- [ ] 영향받는 사용자/시스템 식별
- [ ] 관련 종속성 확인

## 2. 중단 원인 분석
- [ ] 로그 분석
- [ ] 인프라 모니터링 데이터 확인
- [ ] 최근 변경사항 검토

## 3. 즉각적인 조치
- [ ] 서비스 재시작
- [ ] 부하 분산
- [ ] 실패한 노드 제거

## 4. 추가 분석 계획
- [ ] 상세 로그 분석
- [ ] 성능 프로파일링
- [ ] 코드 리뷰
      `,
      performance: `
# 성능 저하 분석 템플릿

## 1. 성능 지표 확인
- [ ] 응답 시간 측정
- [ ] 처리량(throughput) 측정
- [ ] 자원 사용률 확인 (CPU, 메모리, 디스크, 네트워크)

## 2. 병목 지점 식별
- [ ] 프로파일링 데이터 분석
- [ ] 데이터베이스 쿼리 성능 확인
- [ ] 외부 API 응답 시간 확인

## 3. 즉각적인 조치
- [ ] 캐시 최적화
- [ ] 연결 풀 조정
- [ ] 불필요한 프로세스 중지

## 4. 장기적인 개선 방안
- [ ] 코드 최적화
- [ ] 인프라 스케일링
- [ ] 아키텍처 개선
      `,
      connectivity: `
# 연결 문제 분석 템플릿

## 1. 연결 상태 확인
- [ ] 네트워크 연결성 테스트
- [ ] DNS 해석 확인
- [ ] 방화벽 규칙 검토

## 2. 원인 분석
- [ ] 네트워크 트래픽 분석
- [ ] 라우팅 테이블 확인
- [ ] 보안 그룹/ACL 확인

## 3. 즉각적인 조치
- [ ] 연결 재설정
- [ ] 네트워크 장비 재시작
- [ ] 대체 경로 설정

## 4. 모니터링 설정
- [ ] 연결 상태 지속적 모니터링
- [ ] 패킷 손실 모니터링
- [ ] 지연시간 모니터링
      `,
      resource: `
# 리소스 부족 분석 템플릿

## 1. 리소스 사용량 확인
- [ ] CPU 사용률 확인
- [ ] 메모리 사용률 확인
- [ ] 디스크 공간 확인
- [ ] 네트워크 대역폭 확인

## 2. 리소스 소비 패턴 분석
- [ ] 과도한 소비 프로세스 식별
- [ ] 리소스 누수 확인
- [ ] 사용량 증가 추세 분석

## 3. 즉각적인 조치
- [ ] 불필요한 프로세스 종료
- [ ] 캐시 정리
- [ ] 임시 파일 정리

## 4. 용량 계획
- [ ] 리소스 확장 계획
- [ ] 자동 스케일링 설정
- [ ] 리소스 사용 최적화
      `,
      security: `
# 보안 이슈 분석 템플릿

## 1. 보안 상태 확인
- [ ] 로그인 시도 확인
- [ ] 권한 변경 확인
- [ ] 비정상적인 접근 패턴 확인

## 2. 취약점 분석
- [ ] 시스템 취약점 스캔
- [ ] 패치 상태 확인
- [ ] 보안 설정 검토

## 3. 즉각적인 조치
- [ ] 영향받는 시스템 격리
- [ ] 임시 접근 제한
- [ ] 자격 증명 리셋

## 4. 보안 강화 계획
- [ ] 보안 패치 적용
- [ ] 인증 강화
- [ ] 모니터링 강화
      `,
      data: `
# 데이터 관련 이슈 분석 템플릿

## 1. 데이터 상태 확인
- [ ] 데이터 정합성 확인
- [ ] 데이터베이스 상태 확인
- [ ] 백업 상태 확인

## 2. 데이터 문제 분석
- [ ] 손상된 데이터 식별
- [ ] 데이터 불일치 원인 분석
- [ ] 성능 이슈 분석

## 3. 즉각적인 조치
- [ ] 데이터 복구
- [ ] 일관성 복원
- [ ] 문제 데이터 격리

## 4. 데이터 관리 개선
- [ ] 백업 전략 강화
- [ ] 데이터 검증 절차 개선
- [ ] 모니터링 강화
      `,
      application: `
# 애플리케이션 오류 분석 템플릿

## 1. 애플리케이션 상태 확인
- [ ] 오류 로그 확인
- [ ] 애플리케이션 프로세스 상태 확인
- [ ] 의존성 상태 확인

## 2. 오류 분석
- [ ] 스택 트레이스 분석
- [ ] 예외 패턴 분석
- [ ] 코드 경로 추적

## 3. 즉각적인 조치
- [ ] 애플리케이션 재시작
- [ ] 오류 우회 방법 적용
- [ ] 로깅 강화

## 4. 코드 개선
- [ ] 버그 수정
- [ ] 예외 처리 강화
- [ ] 단위 테스트 추가
      `,
      infrastructure: `
# 인프라 문제 분석 템플릿

## 1. 인프라 상태 확인
- [ ] 서버 상태 확인
- [ ] 가상화 플랫폼 상태 확인
- [ ] 클라우드 서비스 상태 확인

## 2. 인프라 문제 분석
- [ ] 하드웨어 오류 확인
- [ ] 구성 오류 확인
- [ ] 용량 이슈 확인

## 3. 즉각적인 조치
- [ ] 장애 장비 교체/우회
- [ ] 구성 복원
- [ ] 부하 분산

## 4. 인프라 개선
- [ ] 중복성 강화
- [ ] 자동화 개선
- [ ] 모니터링 강화
      `,
      unknown: `
# 일반 장애 분석 템플릿

## 1. 상태 확인
- [ ] 시스템 전반적인 상태 확인
- [ ] 로그 확인
- [ ] 모니터링 대시보드 확인

## 2. 원인 분석
- [ ] 이벤트 시퀀스 분석
- [ ] 변경 사항 검토
- [ ] 관련 시스템 확인

## 3. 즉각적인 조치
- [ ] 영향받는 서비스 재시작
- [ ] 임시 조치 적용
- [ ] 추가 모니터링 설정

## 4. 후속 조치
- [ ] 상세 분석 계획
- [ ] 예방 조치 계획
- [ ] 문서화 및 공유
      `,
    };

    return templates[incidentType] || templates.unknown;
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    this.modeHistory = [];
    this.incidentHistory = [];
    this.activeIncidents.clear();
    console.log('🧹 Enhanced Mode Manager cleanup completed');
  }
}
