// 자체 개발 한국어 처리 엔진 사용 (korean-js 대체)
import * as natural from 'natural';
import compromise from 'compromise';
import {
  type ServerInstance,
  type ServerCluster,
  type ApplicationMetrics,
} from '@/types/data-generator';

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
      timestamp: new Date().toLocaleString('ko-KR'),
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
    // 한국어 조사 자동 처리 (간단한 버전)
    const vowels = [
      'a',
      'e',
      'i',
      'o',
      'u',
      'ㅏ',
      'ㅓ',
      'ㅗ',
      'ㅜ',
      'ㅡ',
      'ㅣ',
    ];
    const lastChar = metric.slice(-1);
    const hasVowel = vowels.some(v => lastChar.includes(v));

    // "이(가)" 처리
    text = text.replace(/이\(가\)/g, hasVowel ? '가' : '이');

    return text;
  }
}

// 한국어 AI 엔진 메인 클래스
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

export class KoreanAIEngine {
  private nlu: KoreanServerNLU;
  private responseGenerator: KoreanResponseGenerator;
  private initialized: boolean = false;
  private dataGenerator: RealServerDataGenerator;

  constructor() {
    this.nlu = new KoreanServerNLU();
    this.responseGenerator = new KoreanResponseGenerator();
    this.dataGenerator = RealServerDataGenerator.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🇰🇷 한국어 AI 엔진 초기화 중...');

    try {
      // 향후 Transformers.js 모델 로드할 수 있음
      console.log('✅ 한국어 AI 엔진 초기화 완료');
      this.initialized = true;
    } catch (error) {
      console.error('❌ 한국어 AI 엔진 초기화 실패:', error);
      throw error;
    }
  }

  async processQuery(query: string, serverData?: any): Promise<any> {
    await this.initialize();

    console.log('🔍 한국어 쿼리 처리:', query);

    try {
      // 1. 자연어 이해 (NLU)
      const nluResult = this.nlu.analyze(query);
      console.log('📝 NLU 결과:', nluResult);

      // 2. 서버 데이터 분석
      const analysis = await this.analyzeServerMetrics(nluResult, serverData);

      // 3. 한국어 응답 생성
      const response = this.responseGenerator.generate(
        analysis.status,
        analysis.server,
        analysis.metric,
        analysis.value
      );

      // 4. 추가 컨텍스트 정보
      const additionalInfo = this.generateAdditionalInfo(nluResult, analysis);

      return {
        success: true,
        understanding: nluResult,
        analysis: analysis,
        response: response,
        additionalInfo,
        processingTime: Date.now(),
        engine: 'korean-ai',
      };
    } catch (error: any) {
      console.error('❌ 한국어 쿼리 처리 실패:', error);

      return {
        success: false,
        error: error.message,
        fallbackResponse:
          '죄송합니다. 요청을 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.',
        engine: 'korean-ai',
      };
    }
  }

  private async analyzeServerMetrics(
    nluResult: any,
    serverData?: any
  ): Promise<any> {
    // RealServerDataGenerator에서 실제 데이터 가져오기
    let metrics;
    let servers: ServerInstance[] = [];
    let targetServerData: ServerInstance | null = null;

    if (serverData && serverData.servers) {
      // 전달받은 실제 서버 데이터 사용
      servers = serverData.servers;

      // 엔티티에서 특정 서버 찾기
      if (nluResult.entities.서버타입) {
        const serverType = nluResult.entities.서버타입[0];
        targetServerData =
          servers.find(
            s =>
              s.type === this.mapKoreanToServerType(serverType) ||
              s.name.includes(serverType)
          ) || servers[0];
      } else {
        // 기본적으로 첫 번째 서버 사용
        targetServerData = servers[0];
      }

      if (targetServerData) {
        metrics = {
          CPU: targetServerData.metrics.cpu,
          메모리: targetServerData.metrics.memory,
          디스크: targetServerData.metrics.disk,
          네트워크:
            (targetServerData.metrics.network.in +
              targetServerData.metrics.network.out) /
            2,
        };
      }
    }

    if (!metrics) {
      // 폴백: 시스템 상태 기반 추정값 생성
      const currentHour = new Date().getHours();
      const isBusinessHours = currentHour >= 9 && currentHour <= 18;

      metrics = {
        CPU: this.estimateSystemLoad('cpu', isBusinessHours),
        메모리: this.estimateSystemLoad('memory', isBusinessHours),
        디스크: this.estimateSystemLoad('disk', isBusinessHours),
        네트워크: this.estimateSystemLoad('network', isBusinessHours),
      };
    }

    // 엔티티에서 메트릭 추출
    let targetMetric = 'CPU';
    let targetServer = '웹서버';

    if (nluResult.entities.메트릭) {
      targetMetric = nluResult.entities.메트릭[0];
    }

    if (nluResult.entities.서버타입) {
      targetServer = nluResult.entities.서버타입[0];
    }

    const value = Math.round(
      metrics[targetMetric as keyof typeof metrics] || metrics.CPU
    );

    // 상태 결정
    let status = '정상상태';
    if (value > 90) status = '위험상태';
    else if (value > 75) status = '경고상태';

    return {
      server: targetServer,
      metric: targetMetric,
      value,
      status,
      intent: nluResult.intent,
      timestamp: new Date().toISOString(),
    };
  }

  private generateAdditionalInfo(nluResult: any, analysis: any): any {
    const tips = [];

    // 의도별 추가 팁
    switch (nluResult.intent) {
      case '분석':
        tips.push(
          '💡 더 자세한 분석을 원하시면 "상세 분석해줘"라고 말씀해 주세요.'
        );
        break;
      case '최적화':
        tips.push(
          '⚡ 최적화 방법을 알려드릴까요? "최적화 방법 알려줘"라고 말씀해 주세요.'
        );
        break;
      case '모니터링':
        tips.push('📊 실시간 모니터링을 위해 대시보드를 확인해보세요.');
        break;
    }

    // 상태별 추가 정보
    if (analysis.status === '위험상태') {
      tips.push(
        '🚨 즉시 조치가 필요한 상황입니다. 담당자에게 알림을 보내드릴까요?'
      );
    }

    return {
      tips,
      relatedCommands: [
        '전체 서버 상태 확인해줘',
        '메모리 사용률 분석해줘',
        '네트워크 상태 체크해줘',
      ],
      confidence: nluResult.confidence,
    };
  }

  private estimateSystemLoad(
    metricType: string,
    isBusinessHours: boolean = false
  ): number {
    // 시스템 메트릭별 기준값 기반 추정
    const baseValues = {
      cpu: isBusinessHours ? 35 : 15, // 비즈니스 시간 기준
      memory: isBusinessHours ? 60 : 45, // 메모리는 상대적으로 안정적
      disk: 25, // 디스크는 시간대 영향 적음
      network: isBusinessHours ? 40 : 10, // 네트워크는 시간대별 차이 큼
    };

    const baseValue = baseValues[metricType as keyof typeof baseValues] || 30;

    // 현재 시간 기반 변동 (±10% 범위)
    const currentMinute = new Date().getMinutes();
    const variation = ((currentMinute % 20) - 10) * 0.01; // -0.1 ~ +0.1

    // 시스템 로드 패턴 시뮬레이션 (실제 환경에서는 process.cpuUsage() 등 사용)
    const estimatedValue = baseValue + baseValue * variation;

    return Math.max(0, Math.min(100, Math.round(estimatedValue)));
  }

  /**
   * 한국어 서버 타입을 영어 서버 타입으로 매핑
   */
  private mapKoreanToServerType(koreanType: string): string {
    const mapping: Record<string, string> = {
      웹서버: 'web',
      API서버: 'api',
      데이터베이스: 'database',
      DB서버: 'database',
      캐시서버: 'cache',
      앱서버: 'web',
      큐서버: 'queue',
      CDN서버: 'cdn',
      GPU서버: 'gpu',
      스토리지서버: 'storage',
    };

    return mapping[koreanType] || 'web';
  }

  // 상태 확인 메서드
  getEngineStatus(): any {
    return {
      initialized: this.initialized,
      engine: 'korean-ai',
      version: '1.0.0',
      features: [
        '한국어 자연어 이해',
        '의도 분석',
        '엔티티 추출',
        '자연어 응답 생성',
        '서버 모니터링 특화',
      ],
      supportedIntents: Object.keys(this.nlu['intents']),
      supportedEntities: Object.keys(this.nlu['entities']),
    };
  }
}

// 싱글톤 인스턴스
export const koreanAIEngine = new KoreanAIEngine();
