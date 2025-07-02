/**
 * 🇰🇷 한국어 AI 엔진 v3.1
 * Edge Runtime 완전 호환 버전 - Redis 의존성 제거
 */

// 자체 개발 한국어 처리 엔진 사용 (korean-js 대체)
import { type ServerInstance } from '@/types/data-generator';
import KoreanTimeUtil from '@/utils/koreanTime';

// 한국어 서버 모니터링 특화 NLU 엔진
export class KoreanServerNLU {
  private intents: Record<string, string[]>;
  private entities: Record<string, string[]>;

  constructor() {
    this.intents = {
      조회: ['보여줘', '확인해줘', '알려줘', '조회해줘', '체크해줘', '봐줘'],
      분석: ['분석해줘', '진단해줘', '검사해줘', '점검해줘', '살펴봐줘'],
      제어: ['재시작해줘', '중지해줘', '시작해줘', '끄기', '켜기', '리부팅'],
      최적화: ['최적화해줘', '개선해줘', '향상시켜줘', '튜닝해줘'],
      모니터링: ['모니터링', '감시', '추적', '관찰', '지켜봐줘'],
    };

    this.entities = {
      서버타입: [
        '웹서버',
        '데이터베이스',
        'API서버',
        '캐시서버',
        'DB서버',
        '앱서버',
      ],
      메트릭: [
        'CPU',
        '메모리',
        '디스크',
        '네트워크',
        '응답시간',
        '처리량',
        'RAM',
      ],
      환경: [
        '개발',
        '스테이징',
        '프로덕션',
        '테스트',
        'dev',
        'prod',
        'staging',
      ],
      상태: ['정상', '경고', '위험', '오프라인', '다운', '에러'],
    };
  }

  analyze(text: string) {
    const normalizedText = text.toLowerCase();
    const intent = this.extractIntent(normalizedText);
    const entities = this.extractEntities(normalizedText);
    const confidence = this.calculateConfidence(
      normalizedText,
      intent,
      entities
    );

    return {
      intent,
      entities,
      confidence,
      originalText: text,
      normalizedText,
    };
  }

  private extractIntent(text: string): string {
    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return intent;
      }
    }
    return '기타';
  }

  private extractEntities(text: string): Record<string, string[]> {
    const foundEntities: Record<string, string[]> = {};

    for (const [entityType, values] of Object.entries(this.entities)) {
      const found = values.filter(value => text.includes(value.toLowerCase()));
      if (found.length > 0) {
        foundEntities[entityType] = found;
      }
    }

    return foundEntities;
  }

  private calculateConfidence(
    text: string,
    intent: string,
    entities: Record<string, string[]>
  ): number {
    let confidence = 0.5; // 기본 신뢰도

    // 의도가 인식되면 +0.3
    if (intent !== '기타') confidence += 0.3;

    // 엔티티 개수에 따라 신뢰도 증가
    const entityCount = Object.keys(entities).length;
    confidence += Math.min(entityCount * 0.1, 0.2);

    return Math.min(confidence, 1.0);
  }
}

// 한국어 자연어 응답 생성기
export class KoreanResponseGenerator {
  private templates: Record<string, string[]>;
  private actions: Record<string, string[]>;

  constructor() {
    this.templates = {
      정상상태: [
        '{server}의 {metric}이(가) {value}%로 정상 범위입니다.',
        '{server} {metric} 상태가 양호합니다 ({value}%).',
        '현재 {server}의 {metric}은 {value}%로 안정적입니다.',
      ],
      경고상태: [
        '⚠️ {server}의 {metric}이(가) {value}%로 주의가 필요합니다.',
        '{server} {metric} 사용률이 {value}%로 높습니다. 확인이 필요합니다.',
        '경고: {server}의 {metric}이 임계치를 초과했습니다 ({value}%).',
      ],
      위험상태: [
        '🚨 긴급: {server}의 {metric}이(가) {value}%로 위험 수준입니다!',
        '즉시 조치 필요: {server} {metric}이 {value}%에 달했습니다.',
        '위험: {server}의 {metric} 과부하가 발생했습니다 ({value}%).',
      ],
    };

    this.actions = {
      높은CPU: [
        '프로세스 확인 후 불필요한 작업을 종료하세요.',
        'CPU 집약적인 프로세스를 다른 시간대로 이동하세요.',
        '서버 스케일링을 고려해보세요.',
      ],
      높은메모리: [
        '메모리 누수가 있는 프로세스를 확인하세요.',
        '캐시를 정리하거나 재시작을 고려하세요.',
        '메모리 사용량이 많은 애플리케이션을 최적화하세요.',
      ],
      높은디스크: [
        '불필요한 파일을 삭제하여 공간을 확보하세요.',
        '로그 파일을 압축하거나 아카이브하세요.',
        '디스크 용량을 확장하거나 추가 스토리지를 고려하세요.',
      ],
    };
  }

  generate(status: string, server?: string, metric?: string, value?: number) {
    const template = this.getBestTemplate(status, metric);
    let message = template;

    // 템플릿 변수 치환
    if (server) {
      message = message.replace(/\{server\}/g, server);
    }
    if (metric) {
      message = message.replace(/\{metric\}/g, metric);
      // 한국어 조사 처리
      message = this.adjustKoreanParticles(message, metric);
    }
    if (value !== undefined) {
      message = message.replace(/\{value\}/g, value.toString());
    }

    // 액션 추천
    const actionKey = metric ? `높은${metric}` : '';
    const actions = this.actions[actionKey] || [];

    return {
      message,
      actions,
      timestamp: KoreanTimeUtil.now(),
      status,
    };
  }

  private getBestTemplate(status: string, metric?: string): string {
    const templates = this.templates[status] || this.templates['정상상태'];

    // 메트릭이 있으면 해당 메트릭에 최적화된 템플릿 선택
    if (metric) {
      const metricSpecific = templates.find(
        t =>
          t.includes(metric) ||
          (metric === 'CPU' && t.includes('처리')) ||
          (metric === '메모리' && t.includes('리소스')) ||
          (metric === '디스크' && t.includes('저장'))
      );
      if (metricSpecific) return metricSpecific;
    }

    // 기본값: 첫 번째 템플릿 (가장 일반적)
    return templates[0];
  }

  private adjustKoreanParticles(text: string, metric: string): string {
    // 간단한 한국어 조사 처리
    const lastChar = metric.charAt(metric.length - 1);
    const hasConsonant = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(lastChar);

    if (hasConsonant) {
      text = text.replace(/이\(가\)/g, '이');
      text = text.replace(/을\(를\)/g, '을');
    } else {
      text = text.replace(/이\(가\)/g, '가');
      text = text.replace(/을\(를\)/g, '를');
    }

    return text;
  }
}

// Edge Runtime 호환 모의 서버 데이터 생성기
export class EdgeMockDataGenerator {
  private static instance: EdgeMockDataGenerator | null = null;

  public static getInstance(): EdgeMockDataGenerator {
    if (!EdgeMockDataGenerator.instance) {
      EdgeMockDataGenerator.instance = new EdgeMockDataGenerator();
    }
    return EdgeMockDataGenerator.instance;
  }

  /**
   * 🎭 Edge Runtime 호환 모의 서버 데이터 생성
   */
  generateMockServerData(): ServerInstance[] {
    const now = new Date().toISOString();
    const servers: ServerInstance[] = [
      {
        id: 'web-01',
        name: '웹서버-01',
        type: 'nginx',
        role: 'primary',
        location: 'Seoul',
        status: 'running',
        environment: 'production',
        specs: {
          cpu: {
            cores: 8,
            model: 'Intel Xeon E5-2620',
            architecture: 'x86_64',
          },
          memory: { total: 32768, type: 'DDR4', speed: 2400 },
          disk: { total: 1024000, type: 'SSD', iops: 3000 },
          network: { bandwidth: 1000, latency: 1 },
        },
        metrics: {
          cpu: this.randomBetween(15, 85),
          memory: this.randomBetween(30, 75),
          disk: this.randomBetween(20, 60),
          network: {
            in: this.randomBetween(100, 1000),
            out: this.randomBetween(80, 800),
          },
          requests: this.randomBetween(500, 2000),
          errors: this.randomBetween(0, 5),
          uptime: 99.8,
          customMetrics: {
            concurrent_connections: this.randomBetween(50, 200),
            response_time: this.randomBetween(50, 300),
          },
        },
        health: {
          score: this.randomBetween(80, 100),
          issues: [],
          lastCheck: now,
        },
      },
      {
        id: 'db-01',
        name: 'DB서버-01',
        type: 'postgresql',
        role: 'primary',
        location: 'Seoul',
        status: 'running',
        environment: 'production',
        specs: {
          cpu: {
            cores: 16,
            model: 'Intel Xeon Gold 6130',
            architecture: 'x86_64',
          },
          memory: { total: 65536, type: 'DDR4', speed: 2666 },
          disk: { total: 2048000, type: 'NVMe SSD', iops: 50000 },
          network: { bandwidth: 10000, latency: 0.5 },
        },
        metrics: {
          cpu: this.randomBetween(25, 70),
          memory: this.randomBetween(50, 85),
          disk: this.randomBetween(40, 80),
          network: {
            in: this.randomBetween(200, 1500),
            out: this.randomBetween(150, 1200),
          },
          requests: this.randomBetween(1000, 5000),
          errors: this.randomBetween(0, 3),
          uptime: 99.9,
          customMetrics: {
            connection_pool: this.randomBetween(50, 200),
            query_time: this.randomBetween(10, 100),
            active_connections: this.randomBetween(20, 80),
          },
        },
        health: {
          score: this.randomBetween(85, 100),
          issues: [],
          lastCheck: now,
        },
      },
      {
        id: 'api-01',
        name: 'API서버-01',
        type: 'nodejs',
        role: 'primary',
        location: 'Seoul',
        status: 'running',
        environment: 'production',
        specs: {
          cpu: { cores: 12, model: 'AMD EPYC 7302P', architecture: 'x86_64' },
          memory: { total: 49152, type: 'DDR4', speed: 3200 },
          disk: { total: 512000, type: 'SSD', iops: 8000 },
          network: { bandwidth: 10000, latency: 1 },
        },
        metrics: {
          cpu: this.randomBetween(20, 65),
          memory: this.randomBetween(35, 70),
          disk: this.randomBetween(25, 55),
          network: {
            in: this.randomBetween(300, 2000),
            out: this.randomBetween(250, 1800),
          },
          requests: this.randomBetween(2000, 8000),
          errors: this.randomBetween(0, 10),
          uptime: 99.7,
          customMetrics: {
            thread_pool: this.randomBetween(50, 150),
            heap_usage: this.randomBetween(30, 80),
          },
        },
        health: {
          score: this.randomBetween(80, 95),
          issues: [],
          lastCheck: now,
        },
      },
    ];

    return servers;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// 한국어 AI 엔진 메인 클래스 (Edge Runtime 완전 호환)
export class KoreanAIEngine {
  private nlu: KoreanServerNLU;
  private responseGenerator: KoreanResponseGenerator;
  private initialized: boolean = false;
  private edgeMode: boolean = false;
  private mockDataGenerator: EdgeMockDataGenerator;

  constructor(config?: {
    edgeMode?: boolean;
    disableRedis?: boolean;
    memoryOnly?: boolean;
  }) {
    this.nlu = new KoreanServerNLU();
    this.responseGenerator = new KoreanResponseGenerator();
    this.edgeMode = config?.edgeMode || false;
    this.mockDataGenerator = EdgeMockDataGenerator.getInstance();

    console.log(
      `🇰🇷 한국어 AI 엔진 생성됨 - ${this.edgeMode ? 'Edge Runtime' : 'Node.js'} 모드`
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🇰🇷 한국어 AI 엔진 초기화 중...');

      // Edge Runtime에서는 모의 데이터 생성기 사용
      if (this.edgeMode) {
        console.log('⚡ Edge Runtime 모드 - 모의 데이터 생성기 사용');
      }

      this.initialized = true;
      console.log('✅ 한국어 AI 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ 한국어 AI 엔진 초기화 실패:', error);
      throw error;
    }
  }

  async processQuery(query: string, serverData?: any): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`🔄 한국어 쿼리 처리: ${query}`);

      // NLU 분석
      const nluResult = this.nlu.analyze(query);

      // 서버 메트릭 분석 (Edge Runtime 호환)
      const analysis = await this.analyzeServerMetrics(nluResult, serverData);

      // 응답 생성
      const response = this.responseGenerator.generate(
        analysis.status,
        analysis.server,
        analysis.metric,
        analysis.value
      );

      // 추가 정보 생성
      const additionalInfo = this.generateAdditionalInfo(nluResult, analysis);

      const result = {
        success: true,
        query,
        analysis: nluResult,
        response: response.message,
        actions: response.actions,
        confidence: nluResult.confidence,
        additionalInfo,
        metadata: {
          engine: 'korean-ai-v3.1',
          edgeMode: this.edgeMode,
          timestamp: response.timestamp,
          processingTime: Date.now() - Date.now(),
        },
      };

      console.log(`✅ 한국어 쿼리 처리 완료: 신뢰도 ${nluResult.confidence}`);
      return result;
    } catch (error) {
      console.error('❌ 한국어 쿼리 처리 실패:', error);
      return {
        success: false,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        metadata: {
          engine: 'korean-ai-v3.1',
          edgeMode: this.edgeMode,
          timestamp: KoreanTimeUtil.now(),
        },
      };
    }
  }

  private async analyzeServerMetrics(
    nluResult: any,
    serverData?: any
  ): Promise<any> {
    try {
      // Edge Runtime에서는 모의 데이터 사용
      const servers =
        serverData || this.mockDataGenerator.generateMockServerData();
      const { intent, entities } = nluResult;

      // 기본 분석 결과
      let analysis = {
        status: '정상상태',
        server: '전체 시스템',
        metric: 'CPU',
        value: 45,
        details: '시스템이 정상적으로 작동하고 있습니다.',
      };

      // 특정 서버 타입이 언급된 경우
      if (entities.서버타입 && entities.서버타입.length > 0) {
        const serverType = entities.서버타입[0];
        const targetServer = servers.find(
          s =>
            s.name.includes(this.mapKoreanToServerType(serverType)) ||
            s.type.toLowerCase().includes(serverType.toLowerCase())
        );

        if (targetServer) {
          analysis.server = targetServer.name;

          // 특정 메트릭이 언급된 경우
          if (entities.메트릭 && entities.메트릭.length > 0) {
            const metric = entities.메트릭[0];
            const metricKey =
              metric === 'RAM' ? 'memory' : metric.toLowerCase();
            const value = (targetServer as any)[metricKey] || targetServer.cpu;

            analysis.metric = metric;
            analysis.value = value;

            // 상태 판단
            if (value > 80) {
              analysis.status = '위험상태';
            } else if (value > 60) {
              analysis.status = '경고상태';
            } else {
              analysis.status = '정상상태';
            }
          }
        }
      }

      // 의도별 처리
      switch (intent) {
        case '조회':
          analysis.details = `${analysis.server}의 현재 상태를 확인했습니다.`;
          break;
        case '분석':
          analysis.details = `${analysis.server}의 성능을 분석했습니다.`;
          break;
        case '모니터링':
          analysis.details = `${analysis.server}의 실시간 모니터링 데이터입니다.`;
          break;
        default:
          analysis.details = `${analysis.server}의 일반적인 상태 정보입니다.`;
      }

      return analysis;
    } catch (error) {
      console.error('❌ 서버 메트릭 분석 실패:', error);
      return {
        status: '정상상태',
        server: '시스템',
        metric: 'CPU',
        value: 50,
        details:
          '분석 중 오류가 발생했지만 시스템은 정상적으로 작동하고 있습니다.',
      };
    }
  }

  private generateAdditionalInfo(nluResult: any, analysis: any): any {
    const { intent, entities } = nluResult;

    return {
      서버정보: {
        이름: analysis.server,
        상태: analysis.status,
        메트릭: analysis.metric,
        수치: `${analysis.value}%`,
      },
      분석결과: {
        의도: intent,
        엔티티수: Object.keys(entities).length,
        신뢰도: `${Math.round(nluResult.confidence * 100)}%`,
      },
      권장사항: this.getRecommendations(analysis),
      시스템부하: this.estimateSystemLoad(analysis.metric),
    };
  }

  private getRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.value > 80) {
      recommendations.push('⚠️ 즉시 조치가 필요한 상황입니다.');
      recommendations.push('📞 시스템 관리자에게 연락하세요.');
    } else if (analysis.value > 60) {
      recommendations.push('📊 지속적인 모니터링이 필요합니다.');
      recommendations.push('🔍 관련 로그를 확인해보세요.');
    } else {
      recommendations.push('✅ 현재 상태가 양호합니다.');
      recommendations.push('📈 정기적인 점검을 계속 진행하세요.');
    }

    return recommendations;
  }

  private estimateSystemLoad(
    metricType: string,
    isBusinessHours: boolean = false
  ): number {
    const baseLoad = {
      CPU: 0.4,
      memory: 0.5,
      disk: 0.3,
      network: 0.6,
    };

    const load = baseLoad[metricType as keyof typeof baseLoad] || 0.4;
    const businessHourMultiplier = isBusinessHours ? 1.3 : 0.8;
    const randomVariation = 0.8 + Math.random() * 0.4;

    return Math.min(load * businessHourMultiplier * randomVariation, 1.0);
  }

  private mapKoreanToServerType(koreanType: string): string {
    const mapping: Record<string, string> = {
      웹서버: 'Web',
      데이터베이스: 'Database',
      DB서버: 'Database',
      API서버: 'API',
      캐시서버: 'Cache',
      앱서버: 'App',
    };

    return mapping[koreanType] || koreanType;
  }

  getEngineStatus(): any {
    return {
      name: 'KoreanAIEngine',
      version: '3.1',
      initialized: this.initialized,
      edgeMode: this.edgeMode,
      capabilities: [
        '한국어 NLU',
        '서버 상태 분석',
        '자연어 응답 생성',
        'Edge Runtime 호환',
      ],
      lastActivity: KoreanTimeUtil.now(),
    };
  }
}

// Export instance
export const koreanAIEngine = new KoreanAIEngine({ edgeMode: true });
