// MCP (Model Context Protocol) 엔진
// NPU 기반 경량 AI 추론을 위한 핵심 모듈

export interface MCPIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: string[];
}

export interface MCPResponse {
  intent: MCPIntent;
  response: string;
  actions?: string[];
  metadata?: Record<string, any>;
}

export class MCPProcessor {
  private static instance: MCPProcessor;
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private isInitialized: boolean = false;
  
  constructor() {
    // 초기화는 initialize() 메서드에서 수행
  }

  static getInstance(): MCPProcessor {
    if (!MCPProcessor.instance) {
      MCPProcessor.instance = new MCPProcessor();
    }
    return MCPProcessor.instance;
  }

  /**
   * MCP 프로세서 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.initializePatterns();
    this.isInitialized = true;
    
    console.log('✅ MCP Processor 초기화 완료');
  }

  private initializePatterns() {
    // 서버 상태 관련 패턴
    this.intentPatterns.set('server_status', [
      /서버.*상태/i,
      /상태.*확인/i,
      /서버.*어떤/i,
      /현재.*서버/i,
      /서버.*체크/i
    ]);

    // 성능 분석 관련 패턴
    this.intentPatterns.set('performance_analysis', [
      /성능.*분석/i,
      /리소스.*사용/i,
      /cpu.*메모리/i,
      /느린.*서버/i,
      /최적화/i
    ]);

    // 로그 분석 관련 패턴
    this.intentPatterns.set('log_analysis', [
      /로그.*분석/i,
      /에러.*로그/i,
      /오류.*확인/i,
      /문제.*찾/i,
      /이슈.*분석/i
    ]);

    // 알림/경고 관련 패턴
    this.intentPatterns.set('alert_management', [
      /알림.*설정/i,
      /경고.*확인/i,
      /알람/i,
      /모니터링/i,
      /임계값/i
    ]);

    // 특정 서버 분석 관련 패턴
    this.intentPatterns.set('specific_server_analysis', [
      /\w+-\w+-\d+.*분석/i,
      /서버.*\w+-\w+-\d+/i,
      /\w+-\w+-\d+.*상태/i
    ]);
  }

  async processQuery(query: string, serverData?: any): Promise<MCPResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const intent = this.classifyIntent(query);
    const entities = this.extractEntities(query);
    
    let response: string;
    let actions: string[] = [];

    switch (intent.intent) {
      case 'server_status':
        response = this.generateServerStatusResponse(entities, serverData);
        actions = ['refresh_status', 'view_details'];
        break;
        
      case 'performance_analysis':
        response = this.generatePerformanceAnalysisResponse(entities, serverData);
        actions = ['optimize_performance', 'view_metrics'];
        break;
        
      case 'log_analysis':
        response = this.generateLogAnalysisResponse(entities, serverData);
        actions = ['view_logs', 'export_logs'];
        break;
        
      case 'alert_management':
        response = this.generateAlertManagementResponse(entities, serverData);
        actions = ['configure_alerts', 'view_history'];
        break;
        
      case 'specific_server_analysis':
        response = this.generateSpecificServerAnalysisResponse(entities, serverData);
        actions = ['server_details', 'restart_server'];
        break;
        
      default:
        response = this.generateGeneralResponse();
        actions = ['help', 'examples'];
    }

    return {
      intent,
      response,
      actions,
      metadata: {
        timestamp: new Date().toISOString(),
        query,
        processingTime: Date.now()
      }
    };
  }

  private classifyIntent(query: string): MCPIntent {
    let bestMatch = { intent: 'general', confidence: 0.0 };
    
    for (const [intentName, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          const confidence = this.calculateConfidence(query, pattern);
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent: intentName, confidence };
          }
        }
      }
    }

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities: this.extractEntities(query),
      context: [query]
    };
  }

  private calculateConfidence(query: string, pattern: RegExp): number {
    const match = query.match(pattern);
    if (!match) return 0;
    
    // 매치된 부분의 길이 비율로 confidence 계산
    const matchLength = match[0].length;
    const queryLength = query.length;
    return Math.min(0.9, (matchLength / queryLength) * 2);
  }

  private extractEntities(query: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // 서버 ID 추출 (예: API-US-001, DB-EU-002 형태)
    const serverIdMatch = query.match(/\b([A-Z]+-[A-Z]+-\d+)\b/i);
    if (serverIdMatch) {
      entities.serverId = serverIdMatch[1].toUpperCase();
    }

    // 메트릭 타입 추출
    const metricMatches = query.match(/\b(cpu|memory|disk|network|메모리|디스크|네트워크)\b/gi);
    if (metricMatches) {
      entities.metrics = metricMatches.map(m => m.toLowerCase());
    }

    // 시간 범위 추출
    const timeMatches = query.match(/\b(24시간|1주일|1개월|어제|오늘|최근)\b/gi);
    if (timeMatches) {
      entities.timeRange = timeMatches[0];
    }

    return entities;
  }

  private generateServerStatusResponse(entities: any, serverData?: any): string {
    if (entities.serverId && serverData) {
      return `🔍 **${entities.serverId} 서버 상태**

**현재 상태:** ${serverData.status === 'online' ? '✅ 온라인' : '❌ 오프라인'}
**리소스 사용률:**
- CPU: ${serverData.cpu}%
- 메모리: ${serverData.memory}%  
- 디스크: ${serverData.disk}%

**업타임:** ${serverData.uptime}
**위치:** ${serverData.location}`;
    }

    return `📊 **전체 서버 상태 요약**

**온라인:** 4대 (67%)
**경고:** 1대 (17%)
**오프라인:** 1대 (17%)

**주의 필요 서버:**
- DB-EU-002: CPU 85%, 메모리 91%
- CACHE-US-004: 연결 끊김

**권장 조치:** 리소스 최적화 및 재시작 검토`;
  }

  private generatePerformanceAnalysisResponse(entities: any, serverData?: any): string {
    return `⚡ **성능 분석 결과**

**전체 시스템 성능:**
- 평균 응답시간: 245ms
- 처리량: 1,523 req/sec
- 가용성: 99.7%

**병목 지점:**
1. DB-EU-002: 쿼리 최적화 필요
2. WEB-AP-003: 캐시 적중률 개선 (78%)

**권장사항:**
- 인덱스 재구성
- 캐시 전략 개선
- 로드밸런서 설정 검토`;
  }

  private generateLogAnalysisResponse(entities: any, serverData?: any): string {
    return `📋 **로그 분석 결과**

**최근 24시간 요약:**
- 총 이벤트: 1,247건
- 에러: 3건 (해결됨)
- 경고: 15건

**주요 이슈:**
1. SSL 인증서 만료 경고 (7일 남음)
2. 디스크 사용량 증가 추세
3. 간헐적 네트워크 지연

**해결책:**
- 인증서 갱신 자동화
- 로그 로테이션 최적화
- 네트워크 모니터링 강화`;
  }

  private generateAlertManagementResponse(entities: any, serverData?: any): string {
    return `🚨 **알림 관리 현황**

**활성 알림:** 3건
- DB-EU-002: 높은 리소스 사용률
- BACKUP-AP-006: 디스크 공간 부족 (95%)
- WEB-AP-003: SSL 인증서 만료 임박

**알림 설정:**
- CPU > 80%: 즉시 알림
- 메모리 > 90%: 5분 지연 알림
- 디스크 > 85%: 1시간 지연 알림

**권장 조치:** 임계값 조정 및 자동 대응 설정`;
  }

  private generateSpecificServerAnalysisResponse(entities: any, serverData?: any): string {
    const serverId = entities.serverId || 'UNKNOWN';
    return `🔍 **${serverId} 상세 분석**

**종합 평가:** ${serverData?.status === 'online' ? '정상' : '주의 필요'}

**리소스 분석:**
- CPU 사용률 추세: 증가
- 메모리 누수 의심: 없음
- I/O 대기시간: 정상 범위

**보안 상태:**
- 마지막 업데이트: 3일 전
- 취약점 스캔: 정상
- 방화벽 상태: 활성

**성능 권장사항:**
1. 프로세스 최적화
2. 캐시 설정 조정
3. 모니터링 주기 단축`;
  }

  private generateGeneralResponse(): string {
    return `안녕하세요! 🤖 OpenManager AI입니다.

**도움이 가능한 항목:**
- 서버 상태 확인 및 분석
- 성능 최적화 제안
- 로그 분석 및 문제 해결
- 알림 설정 및 관리

**사용 예시:**
- "전체 서버 상태를 알려주세요"
- "DB-EU-002 서버를 분석해주세요" 
- "성능 이슈가 있는 서버를 찾아주세요"
- "최근 에러 로그를 분석해주세요"

구체적인 질문을 해주시면 더 정확한 분석을 제공해드립니다!`;
  }
} 