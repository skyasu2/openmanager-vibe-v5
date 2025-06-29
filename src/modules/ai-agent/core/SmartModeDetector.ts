/**
 * Smart Mode Detector
 *
 * 🧠 질문 유형 자동 분석 및 모드 선택 시스템
 * - 장애/문제 해결 → Advanced 모드
 * - 보고서/분석 요청 → Advanced 모드
 * - 간단한 조회 → Basic 모드
 */

import { AIAgentMode } from '@/types/ai-types';

export type { AIAgentMode };

// 장애 유형 분류
export type IncidentType =
  | 'service_down' // 서비스 중단
  | 'performance' // 성능 저하
  | 'connectivity' // 연결 문제
  | 'resource' // 리소스 부족
  | 'security' // 보안 이슈
  | 'data' // 데이터 관련
  | 'application' // 애플리케이션 오류
  | 'infrastructure' // 인프라 문제
  | 'unknown'; // 알 수 없음

export interface QueryAnalysis {
  detectedMode: AIAgentMode;
  confidence: number;
  triggers: string[];
  reasoning: string;
  incidentType?: IncidentType; // 감지된 장애 유형
  incidentSeverity?: 'low' | 'medium' | 'high' | 'critical'; // 장애 심각도
  isIncidentRelated?: boolean; // 장애 관련 쿼리인지 여부
}

export class SmartModeDetector {
  private advancedTriggers = {
    // 🔥 장애/문제 해결 관련 (높은 우선순위)
    critical: [
      '장애',
      '문제',
      '오류',
      '에러',
      'error',
      'failure',
      'down',
      'crash',
      '작동 안 함',
      '응답 없음',
      '연결 실패',
      '시스템 다운',
      '서비스 중단',
      'outage',
      'incident',
      'critical',
      'emergency',
      '긴급',
      '복구',
      '서버 장애',
      '네트워크 장애',
      '데이터베이스 장애',
      'API 장애',
      '인프라 장애',
      '하드웨어 장애',
      '소프트웨어 장애',
      '클라우드 장애',
      '클러스터 장애',
      '노드 장애',
      '마이크로서비스 장애',
      '컨테이너 장애',
      '디스크 오류',
      '메모리 누수',
      'CPU 병목',
      'I/O 병목',
      '인증 실패',
      '타임아웃',
      '크래시',
      '중단',
      '멈춤',
      '느림',
      '지연',
      '과부하',
    ],

    // 📊 보고서/분석 관련
    reports: [
      '보고서',
      '리포트',
      'report',
      '분석',
      'analysis',
      '종합',
      '요약',
      'summary',
      '현황',
      '상태',
      'status',
      '통계',
      'statistics',
      '트렌드',
      'trend',
      '성능 분석',
      '용량 분석',
      '보안 분석',
      '월간',
      '주간',
      '일간',
      '위험 분석',
      '장애 보고서',
      '인시던트 리포트',
      '장애 분석',
      '원인 분석',
      '근본 원인',
      'root cause',
      '사후 분석',
      'post-mortem',
      '문제 해결 보고서',
      'RCA',
      '트러블슈팅 보고서',
      '이슈 보고서',
      '진단 보고서',
      '모니터링 보고서',
      '성능 보고서',
      '로그 분석',
      '이벤트 분석',
      '알람 분석',
      '알림 분석',
    ],

    // 🔮 예측/계획 관련
    prediction: [
      '예측',
      'predict',
      '전망',
      'forecast',
      '계획',
      'plan',
      '향후',
      'future',
      '용량 계획',
      '확장',
      'scaling',
      '최적화',
      'optimization',
      '개선',
      '언제까지',
      '얼마나',
      '추세',
      '패턴',
      'pattern',
      '용량 예측',
      '성능 예측',
      '장애 예측',
      '선제적 대응',
      'proactive',
      '사전 예방',
      '이상 감지',
      'anomaly detection',
      '이상치 감지',
      '트렌드 분석',
    ],

    // 🌐 복합/상관관계 분석
    correlation: [
      '상관관계',
      'correlation',
      '연관',
      '관련',
      '영향',
      'impact',
      '원인',
      '다중',
      'multiple',
      '전체',
      '모든',
      'all',
      '시스템 전반',
      '통합',
      '비교',
      'compare',
      '차이',
      'difference',
      '관계',
      'relationship',
      '의존성',
      'dependency',
      '연쇄 장애',
      '도미노 효과',
      '파급 효과',
      '다중 장애',
      '복합 장애',
      '장애 전파',
      '장애 확산',
      '분산 추적',
    ],

    // ⚙️ 고급 기술 용어
    technical: [
      'latency',
      'throughput',
      'bottleneck',
      '병목',
      'scalability',
      '확장성',
      'performance tuning',
      '성능 튜닝',
      'architecture',
      '아키텍처',
      'microservice',
      '마이크로서비스',
      'load balancing',
      '로드밸런싱',
      'kubernetes',
      'docker',
      'container',
      'orchestration',
      'cloud',
      'infrastructure',
      'virtualization',
      'CI/CD',
      'DevOps',
      'SRE',
      'observability',
      'monitoring',
      'alerting',
      'logging',
      'tracing',
      'metrics',
      'dashboard',
      'clustering',
      'failover',
      'resilience',
      'high availability',
      'disaster recovery',
      'backup',
      'restore',
    ],
  };

  // 장애 유형별 키워드
  private incidentTypeKeywords: Record<IncidentType, string[]> = {
    service_down: [
      '서비스 중단',
      '다운',
      'down',
      '접속 불가',
      'unavailable',
      '서버 다운',
      '애플리케이션 중단',
      '중단',
      '정지',
      '작동 안 함',
    ],
    performance: [
      '느림',
      '느려짐',
      'slow',
      '지연',
      'latency',
      '병목',
      'bottleneck',
      '응답 시간',
      'response time',
      '처리량',
      'throughput',
      '과부하',
    ],
    connectivity: [
      '연결 실패',
      '연결 끊김',
      'connection',
      '네트워크',
      'network',
      '통신 오류',
      '접속 불가',
      '타임아웃',
      'timeout',
      'DNS',
    ],
    resource: [
      'CPU',
      '메모리',
      'memory',
      '디스크',
      'disk',
      '스토리지',
      'storage',
      '용량 부족',
      '메모리 누수',
      'memory leak',
      '부하',
      'load',
    ],
    security: [
      '보안',
      'security',
      '해킹',
      '침입',
      'breach',
      '취약점',
      'vulnerability',
      '인증',
      'authentication',
      '권한',
      'permission',
      '자격 증명',
    ],
    data: [
      '데이터',
      'data',
      'DB',
      '데이터베이스',
      'database',
      '쿼리',
      'query',
      '데이터 손실',
      '데이터 불일치',
      '무결성',
      'integrity',
      '손상',
    ],
    application: [
      '애플리케이션',
      'application',
      '프로그램',
      'program',
      '소프트웨어',
      'software',
      '버그',
      'bug',
      '예외',
      'exception',
      '크래시',
      'crash',
      '코드',
    ],
    infrastructure: [
      '인프라',
      'infrastructure',
      '하드웨어',
      'hardware',
      '서버',
      'server',
      '클라우드',
      'cloud',
      '가상화',
      'virtualization',
      '컨테이너',
      'container',
    ],
    unknown: [],
  };

  // 심각도 키워드
  private severityKeywords: Record<string, string[]> = {
    critical: [
      '심각',
      'critical',
      '긴급',
      'emergency',
      '중대',
      '완전',
      '전체',
      '치명적',
      'fatal',
      '완전 중단',
      '서비스 불가',
      '재해',
      'disaster',
    ],
    high: [
      '높은',
      'high',
      '주요',
      'major',
      '심각한',
      'severe',
      '중요',
      '대규모',
      '광범위한',
      '대부분',
      '심대한',
      '상당한',
    ],
    medium: [
      '중간',
      'medium',
      '일부',
      'partial',
      '간헐적',
      'intermittent',
      '약간',
      '일시적',
      '부분적',
      '제한적',
    ],
    low: [
      '낮은',
      'low',
      '경미한',
      'minor',
      '사소한',
      '작은',
      '미미한',
      '거의 없는',
      '미약한',
      '영향 적은',
    ],
  };

  private basicTriggers = [
    // 간단한 조회
    '확인',
    'check',
    '보기',
    'show',
    '현재',
    'current',
    '지금',
    '상태 확인',
    '간단히',
    '빠르게',
    'quick',
    'simple',

    // 기본 질문
    '뭐',
    '어떻게',
    'what',
    'how',
    '어디',
    'where',
    '언제',
    'when',
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
            case 'critical':
              score += 10;
              break; // 장애는 최고 우선순위
            case 'reports':
              score += 8;
              break; // 보고서는 높은 우선순위
            case 'prediction':
              score += 6;
              break;
            case 'correlation':
              score += 5;
              break;
            case 'technical':
              score += 4;
              break;
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

    // 장애 관련 쿼리인지 확인
    const isIncidentRelated = triggers.some(t => t.startsWith('critical:'));

    // 장애 관련이면 추가 분석 수행
    let incidentType: IncidentType | undefined;
    let incidentSeverity: 'low' | 'medium' | 'high' | 'critical' | undefined;

    if (isIncidentRelated) {
      incidentType = this.detectIncidentType(normalizedQuery);
      incidentSeverity = this.detectIncidentSeverity(normalizedQuery);
    }

    return {
      detectedMode,
      confidence,
      triggers,
      reasoning: this.generateReasoning(
        detectedMode,
        score,
        triggers,
        query,
        incidentType,
        incidentSeverity
      ),
      incidentType,
      incidentSeverity,
      isIncidentRelated,
    };
  }

  /**
   * 장애 유형 감지
   */
  private detectIncidentType(query: string): IncidentType {
    const types = Object.entries(this.incidentTypeKeywords);

    // 각 유형별 키워드 일치 수 계산
    const scores: Record<IncidentType, number> = types.reduce(
      (acc, [type, keywords]) => {
        const typeScore = keywords.filter(keyword =>
          query.toLowerCase().includes(keyword.toLowerCase())
        ).length;

        return { ...acc, [type as IncidentType]: typeScore };
      },
      {} as Record<IncidentType, number>
    );

    // 최대 점수 유형 선택
    let maxScore = 0;
    let detectedType: IncidentType = 'unknown';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as IncidentType;
      }
    }

    return detectedType;
  }

  /**
   * 장애 심각도 감지
   */
  private detectIncidentSeverity(
    query: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severities = Object.entries(this.severityKeywords);

    // 각 심각도별 키워드 일치 수 계산
    const scores: Record<string, number> = severities.reduce(
      (acc, [severity, keywords]) => {
        const severityScore = keywords.filter(keyword =>
          query.toLowerCase().includes(keyword.toLowerCase())
        ).length;

        return { ...acc, [severity]: severityScore };
      },
      {} as Record<string, number>
    );

    // 최대 점수 심각도 선택
    let maxScore = 0;
    let detectedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    for (const [severity, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedSeverity = severity as 'low' | 'medium' | 'high' | 'critical';
      }
    }

    // 기본값은 medium
    return detectedSeverity;
  }

  private generateReasoning(
    mode: AIAgentMode,
    score: number,
    triggers: string[],
    query: string,
    incidentType?: IncidentType,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    if (mode === 'advanced') {
      const reasons: string[] = [];

      if (triggers.some(t => t.startsWith('critical:'))) {
        const incidentInfo = incidentType
          ? `${this.translateIncidentType(incidentType)} 유형의 ${severity || '중간'} 심각도 장애`
          : '장애/문제 해결이 필요한 상황';

        reasons.push(incidentInfo);
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
   * 장애 유형 한글 변환
   */
  private translateIncidentType(type: IncidentType): string {
    const typeMap: Record<IncidentType, string> = {
      service_down: '서비스 중단',
      performance: '성능 저하',
      connectivity: '연결 문제',
      resource: '리소스 부족',
      security: '보안 이슈',
      data: '데이터 관련',
      application: '애플리케이션 오류',
      infrastructure: '인프라 문제',
      unknown: '알 수 없음',
    };

    return typeMap[type] || '알 수 없음';
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

  /**
   * 장애 관련 쿼리인지 판단
   */
  isIncidentQuery(query: string): boolean {
    const analysis = this.analyzeQuery(query);
    return !!analysis.isIncidentRelated;
  }

  /**
   * 장애 유형 및 심각도 정보 반환
   */
  getIncidentInfo(
    query: string
  ): { type: IncidentType; severity: string } | null {
    const analysis = this.analyzeQuery(query);

    if (analysis.isIncidentRelated && analysis.incidentType) {
      return {
        type: analysis.incidentType,
        severity: analysis.incidentSeverity || 'medium',
      };
    }

    return null;
  }
}
