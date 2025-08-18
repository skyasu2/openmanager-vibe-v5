/**
 * 🎯 IntentClassifier - 서버 모니터링 특화 의도 분류기
 *
 * 사용자 질의를 분석하여 적절한 AI 엔진과 처리 방식을 결정
 * Korean NLP 결과와 통합하여 정확도 향상
 */

// Entity 타입 정의 - any 타입 제거
export interface Entity {
  type:
    | 'server'
    | 'metric'
    | 'time'
    | 'action'
    | 'threshold'
    | 'user'
    | 'service';
  value: string;
  confidence?: number;
  position?: {
    start: number;
    end: number;
  };
  metadata?: Record<string, string | number | boolean>;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  name?: string;
  category?: string;
  priority?: number;
  needsTimeSeries?: boolean;
  needsNLP?: boolean;
  needsAnomalyDetection?: boolean;
  needsComplexML?: boolean;
  urgency?: string;
  suggestedActions?: string[];
  entities?: Entity[];
}

interface IntentPattern {
  patterns: RegExp[];
  intent: string;
  name: string;
  category: string;
  priority: number;
  features: {
    needsTimeSeries?: boolean;
    needsNLP?: boolean;
    needsAnomalyDetection?: boolean;
    needsComplexML?: boolean;
  };
}

export class IntentClassifier {
  private intentPatterns: IntentPattern[] = [
    // 서버 상태 관련
    {
      patterns: [
        /서버.*상태/i,
        /server.*status/i,
        /시스템.*현황/i,
        /health.*check/i,
        /서버.*목록/i,
        /모든.*서버/i,
      ],
      intent: 'server_status',
      name: '서버 상태 조회',
      category: 'monitoring',
      priority: 2,
      features: { needsTimeSeries: false, needsNLP: false },
    },

    // 성능 메트릭 관련
    {
      patterns: [
        /cpu.*사용률/i,
        /메모리.*사용/i,
        /디스크.*용량/i,
        /네트워크.*트래픽/i,
        /리소스.*사용/i,
        /performance.*metrics/i,
      ],
      intent: 'performance_metrics',
      name: '성능 메트릭 조회',
      category: 'monitoring',
      priority: 3,
      features: { needsTimeSeries: true, needsNLP: false },
    },

    // 장애/이상 감지
    {
      patterns: [
        /장애.*발생/i,
        /이상.*감지/i,
        /문제.*있/i,
        /에러.*발생/i,
        /alert/i,
        /incident/i,
        /anomaly/i,
      ],
      intent: 'incident_detection',
      name: '장애 감지',
      category: 'alerts',
      priority: 5,
      features: {
        needsTimeSeries: true,
        needsAnomalyDetection: true,
        needsComplexML: true,
      },
    },

    // 예측 분석
    {
      patterns: [
        /예측/i,
        /전망/i,
        /트렌드/i,
        /predict/i,
        /forecast/i,
        /trend.*analysis/i,
      ],
      intent: 'predictive_analysis',
      name: '예측 분석',
      category: 'analytics',
      priority: 4,
      features: {
        needsTimeSeries: true,
        needsComplexML: true,
      },
    },

    // 로그 분석
    {
      patterns: [
        /로그.*분석/i,
        /로그.*조회/i,
        /에러.*로그/i,
        /log.*analysis/i,
        /error.*log/i,
      ],
      intent: 'log_analysis',
      name: '로그 분석',
      category: 'logs',
      priority: 3,
      features: {
        needsNLP: true,
        needsTimeSeries: true,
      },
    },

    // 권장사항/최적화
    {
      patterns: [
        /권장.*사항/i,
        /최적화/i,
        /개선.*방법/i,
        /recommend/i,
        /optimize/i,
        /improve/i,
      ],
      intent: 'recommendations',
      name: '최적화 권장사항',
      category: 'insights',
      priority: 3,
      features: {
        needsNLP: true,
        needsComplexML: true,
      },
    },

    // 비용 분석
    {
      patterns: [
        /비용.*분석/i,
        /요금/i,
        /cost.*analysis/i,
        /billing/i,
        /usage.*cost/i,
      ],
      intent: 'cost_analysis',
      name: '비용 분석',
      category: 'analytics',
      priority: 2,
      features: {
        needsTimeSeries: true,
      },
    },

    // 보안 관련
    {
      patterns: [
        /보안.*취약/i,
        /security/i,
        /vulnerability/i,
        /threat/i,
        /침입.*탐지/i,
      ],
      intent: 'security_analysis',
      name: '보안 분석',
      category: 'security',
      priority: 5,
      features: {
        needsNLP: true,
        needsAnomalyDetection: true,
        needsComplexML: true,
      },
    },
  ];

  /**
   * 사용자 입력을 분석하여 의도 분류
   */
  async classify(
    input: string,
    nlpResult?: { intent?: string; entities?: Entity[]; confidence?: number }
  ): Promise<IntentResult> {
    // 입력 정규화
    const normalizedInput = this.normalizeInput(input);

    // 패턴 매칭으로 의도 찾기
    let bestMatch: IntentPattern | null = null;
    let maxScore = 0;

    for (const pattern of this.intentPatterns) {
      const score = this.calculatePatternScore(normalizedInput, pattern);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = pattern;
      }
    }

    // NLP 결과와 통합
    let confidence = maxScore;
    if (nlpResult?.confidence) {
      // NLP 결과가 있으면 가중 평균
      confidence = maxScore * 0.6 + nlpResult.confidence * 0.4;
    }

    // 긴급도 계산
    const urgency = this.calculateUrgency(normalizedInput, bestMatch);

    // 제안 액션 생성
    const suggestedActions = this.generateSuggestedActions(
      bestMatch,
      nlpResult?.entities
    );

    if (bestMatch && confidence > 0.3) {
      return {
        intent: bestMatch.intent,
        confidence: Math.min(confidence, 1.0),
        name: bestMatch.name,
        category: bestMatch.category,
        priority: bestMatch.priority,
        needsTimeSeries: bestMatch.features.needsTimeSeries || false,
        needsNLP: bestMatch.features.needsNLP || false,
        needsAnomalyDetection:
          bestMatch.features.needsAnomalyDetection || false,
        needsComplexML: bestMatch.features.needsComplexML || false,
        urgency,
        suggestedActions,
        entities: nlpResult?.entities || [],
      };
    }

    // 기본값 반환
    return {
      intent: 'general_query',
      confidence: 0.3,
      name: '일반 질의',
      category: 'general',
      priority: 1,
      needsTimeSeries: false,
      needsNLP: true,
      needsAnomalyDetection: false,
      needsComplexML: false,
      urgency: 'low',
      suggestedActions: ['서버 상태 확인', '메트릭 조회'],
      entities: nlpResult?.entities || [],
    };
  }

  /**
   * 입력 텍스트 정규화
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[.,!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 패턴 매칭 점수 계산
   */
  private calculatePatternScore(input: string, pattern: IntentPattern): number {
    let matchCount = 0;
    const totalPatterns = pattern.patterns.length;

    for (const regex of pattern.patterns) {
      if (regex.test(input)) {
        matchCount++;
      }
    }

    // 매칭 비율 계산
    const matchRatio = matchCount / totalPatterns;

    // 키워드 밀도 보너스
    const keywordBonus = this.calculateKeywordDensity(input, pattern);

    return Math.min(matchRatio + keywordBonus, 1.0);
  }

  /**
   * 키워드 밀도 계산
   */
  private calculateKeywordDensity(
    input: string,
    pattern: IntentPattern
  ): number {
    const keywords = pattern.patterns
      .map((p) => p.source.replace(/[.*+?^${}()|[\]\\]/g, ''))
      .join(' ')
      .split(/\s+/);

    let keywordCount = 0;
    const words = input.split(/\s+/);

    for (const word of words) {
      if (keywords.some((k) => k.includes(word) || word.includes(k))) {
        keywordCount++;
      }
    }

    return Math.min(keywordCount * 0.1, 0.3); // 최대 0.3 보너스
  }

  /**
   * 긴급도 계산
   */
  private calculateUrgency(
    input: string,
    pattern: IntentPattern | null
  ): string {
    // 긴급 키워드 체크
    const urgentKeywords =
      /긴급|즉시|바로|emergency|critical|urgent|immediately/i;
    const highKeywords = /중요|빠른|high|important|asap/i;

    if (urgentKeywords.test(input)) {
      return 'critical';
    }

    if (highKeywords.test(input) || (pattern && pattern.priority >= 4)) {
      return 'high';
    }

    if (pattern && pattern.priority >= 3) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 제안 액션 생성
   */
  private generateSuggestedActions(
    pattern: IntentPattern | null,
    entities?: Entity[]
  ): string[] {
    const actions: string[] = [];

    if (!pattern) {
      return ['서버 상태 확인', '도움말 보기'];
    }

    // 의도별 액션
    switch (pattern.intent) {
      case 'server_status':
        actions.push('전체 서버 상태 조회');
        actions.push('문제 서버 필터링');
        break;
      case 'performance_metrics':
        actions.push('실시간 메트릭 대시보드 열기');
        actions.push('시계열 그래프 보기');
        break;
      case 'incident_detection':
        actions.push('장애 보고서 생성');
        actions.push('영향 범위 분석');
        actions.push('복구 절차 시작');
        break;
      case 'predictive_analysis':
        actions.push('트렌드 분석 실행');
        actions.push('예측 모델 생성');
        break;
      case 'log_analysis':
        actions.push('에러 로그 필터링');
        actions.push('로그 패턴 분석');
        break;
      case 'recommendations':
        actions.push('최적화 제안 생성');
        actions.push('우선순위 설정');
        break;
      case 'cost_analysis':
        actions.push('비용 리포트 생성');
        actions.push('비용 절감 방안 분석');
        break;
      case 'security_analysis':
        actions.push('보안 감사 실행');
        actions.push('취약점 스캔');
        actions.push('보안 권장사항 확인');
        break;
    }

    // 엔티티 기반 액션
    if (entities && entities.length > 0) {
      const serverEntities = entities.filter((e) => e.type === 'server');
      if (serverEntities.length > 0) {
        actions.push(
          `특정 서버 상세 조회: ${serverEntities.map((e) => e.value).join(', ')}`
        );
      }
    }

    return actions;
  }
}
