/**
 * Smart Mode Detector
 * 
 * 🧠 질문 유형 자동 분석 및 모드 선택 시스템
 * - 장애/문제 해결 → Advanced 모드
 * - 보고서/분석 요청 → Advanced 모드  
 * - 간단한 조회 → Basic 모드
 */

export type AIAgentMode = 'basic' | 'advanced';

export interface QueryAnalysis {
  detectedMode: AIAgentMode;
  confidence: number;
  triggers: string[];
  reasoning: string;
}

export class SmartModeDetector {
  private advancedTriggers = {
    // 🔥 장애/문제 해결 관련 (높은 우선순위)
    critical: [
      '장애', '문제', '오류', '에러', 'error', 'failure', 'down', 'crash',
      '작동 안 함', '응답 없음', '연결 실패', '시스템 다운', '서비스 중단',
      'outage', 'incident', 'critical', 'emergency', '긴급'
    ],
    
    // 📊 보고서/분석 관련
    reports: [
      '보고서', '리포트', 'report', '분석', 'analysis', '종합', '요약', 'summary',
      '현황', '상태', 'status', '통계', 'statistics', '트렌드', 'trend',
      '성능 분석', '용량 분석', '보안 분석', '월간', '주간', '일간'
    ],
    
    // 🔮 예측/계획 관련
    prediction: [
      '예측', 'predict', '전망', 'forecast', '계획', 'plan', '향후', 'future',
      '용량 계획', '확장', 'scaling', '최적화', 'optimization', '개선',
      '언제까지', '얼마나', '추세', '패턴', 'pattern'
    ],
    
    // 🌐 복합/상관관계 분석
    correlation: [
      '상관관계', 'correlation', '연관', '관련', '영향', 'impact', '원인',
      '다중', 'multiple', '전체', '모든', 'all', '시스템 전반', '통합',
      '비교', 'compare', '차이', 'difference', '관계', 'relationship'
    ],
    
    // ⚙️ 고급 기술 용어
    technical: [
      'latency', 'throughput', 'bottleneck', '병목', 'scalability', '확장성',
      'performance tuning', '성능 튜닝', 'architecture', '아키텍처',
      'microservice', '마이크로서비스', 'load balancing', '로드밸런싱'
    ]
  };

  private basicTriggers = [
    // 간단한 조회
    '확인', 'check', '보기', 'show', '현재', 'current', '지금',
    '상태 확인', '간단히', '빠르게', 'quick', 'simple',
    
    // 기본 질문
    '뭐', '어떻게', 'what', 'how', '어디', 'where', '언제', 'when'
  ];

  /**
   * 질문을 분석하여 적절한 모드를 결정
   */
  analyzeQuery(query: string): QueryAnalysis {
    const normalizedQuery = query.toLowerCase();
    const triggers: string[] = [];
    let score = 0;
    
    // Advanced 모드 트리거 점수 계산
    Object.entries(this.advancedTriggers).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          triggers.push(`${category}:${keyword}`);
          
          // 카테고리별 가중치 적용
          switch (category) {
            case 'critical': score += 10; break;  // 장애는 최고 우선순위
            case 'reports': score += 8; break;   // 보고서는 높은 우선순위  
            case 'prediction': score += 6; break;
            case 'correlation': score += 5; break;
            case 'technical': score += 4; break;
          }
        }
      });
    });
    
    // 질문 길이 고려 (긴 질문 = 복잡한 요청)
    if (query.length > 100) score += 2;
    if (query.length > 200) score += 3;
    
    // 물음표 개수 (복합 질문)
    const questionMarks = (query.match(/\?/g) || []).length;
    if (questionMarks > 1) score += 2;
    
    // Basic 모드 트리거 확인 (점수 감소)
    this.basicTriggers.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score -= 2;
      }
    });

    // 모드 결정
    const detectedMode: AIAgentMode = score >= 5 ? 'advanced' : 'basic';
    const confidence = Math.min(Math.abs(score) * 10, 100);
    
    return {
      detectedMode,
      confidence,
      triggers,
      reasoning: this.generateReasoning(detectedMode, score, triggers, query)
    };
  }

  private generateReasoning(mode: AIAgentMode, score: number, triggers: string[], query: string): string {
    if (mode === 'advanced') {
      const reasons = [];
      
      if (triggers.some(t => t.startsWith('critical:'))) {
        reasons.push('장애/문제 해결이 필요한 상황');
      }
      if (triggers.some(t => t.startsWith('reports:'))) {
        reasons.push('상세한 분석 보고서가 요구됨');
      }
      if (triggers.some(t => t.startsWith('prediction:'))) {
        reasons.push('예측 분석이 필요함');
      }
      if (triggers.some(t => t.startsWith('correlation:'))) {
        reasons.push('복합적인 상관관계 분석이 필요함');
      }
      if (query.length > 150) {
        reasons.push('복잡하고 상세한 질문');
      }
      
      return `Advanced 모드 선택 이유: ${reasons.join(', ')} (점수: ${score})`;
    } else {
      return `Basic 모드 선택: 간단한 조회/확인 요청 (점수: ${score})`;
    }
  }

  /**
   * 실시간 모드 제안 (사용자가 기본 모드로 복잡한 질문을 할 때)
   */
  suggestModeUpgrade(query: string, currentMode: AIAgentMode): boolean {
    if (currentMode === 'basic') {
      const analysis = this.analyzeQuery(query);
      return analysis.detectedMode === 'advanced' && analysis.confidence > 70;
    }
    return false;
  }
} 