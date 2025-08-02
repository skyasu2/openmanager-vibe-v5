/**
 * 🤖 개발 환경 전용 Mock Google AI (Gemini)
 *
 * 개발 환경에서 실제 Google AI API 없이도 완전한 기능을 제공하는 Mock AI
 * - 프롬프트 기반 동적 응답 생성
 * - 토큰 사용량 시뮬레이션
 * - 모델별 차별화된 응답
 * - 서버 모니터링 도메인 특화
 * - 한국어 응답 지원
 */

interface DevMockGoogleAIOptions {
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokens?: number;
  enableLogging?: boolean;
  responseDelay?: number; // 실제 API 응답 시간 시뮬레이션
}

interface MockResponse {
  text: string;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
}

interface ServerMonitoringPatterns {
  [key: string]: {
    keywords: string[];
    responses: string[];
    confidence: number;
  };
}

export class DevMockGoogleAI {
  private options: DevMockGoogleAIOptions;
  private stats = {
    totalRequests: 0,
    totalTokensUsed: 0,
    averageResponseTime: 0,
    modelUsage: new Map<string, number>(),
  };

  // 서버 모니터링 도메인 특화 응답 패턴
  private patterns: ServerMonitoringPatterns = {
    serverStatus: {
      keywords: ['서버', '상태', 'status', 'health', '정상', '확인'],
      responses: [
        '현재 모든 서버가 정상 작동 중입니다. CPU 사용률 평균 45%, 메모리 사용률 62%로 안정적인 상태입니다.',
        '8개 서버 중 7개가 정상, 1개 서버(app-prd-01)에서 메모리 누수 경고가 발생했습니다.',
        '전체 시스템 상태: 양호. 최근 24시간 가동률 99.95%를 기록하고 있습니다.',
      ],
      confidence: 0.9,
    },
    performance: {
      keywords: ['성능', '속도', 'performance', 'cpu', 'memory', '메모리'],
      responses: [
        'CPU 성능 분석: 피크 시간대 평균 72% 사용률, 야간 시간대 15% 사용률. 부하 분산이 필요해 보입니다.',
        '메모리 사용 패턴: 점진적 증가 추세 확인. 메모리 누수 가능성을 조사해야 합니다.',
        '응답 시간 분석: 평균 152ms, 95 percentile 320ms로 목표치 내에서 운영되고 있습니다.',
      ],
      confidence: 0.88,
    },
    anomaly: {
      keywords: ['이상', '문제', '오류', 'error', 'anomaly', '장애'],
      responses: [
        '최근 30분간 db-main-01 서버에서 디스크 I/O 급증이 감지되었습니다. 백업 작업 확인이 필요합니다.',
        '비정상적인 네트워크 트래픽 패턴 감지: DDoS 공격 가능성은 낮으나 모니터링을 강화하겠습니다.',
        '애플리케이션 서버에서 간헐적인 타임아웃 발생. 데이터베이스 연결 풀 설정 검토가 필요합니다.',
      ],
      confidence: 0.85,
    },
    prediction: {
      keywords: ['예측', '예상', '전망', 'predict', 'forecast', '트렌드'],
      responses: [
        '현재 트렌드 기준 3일 내 디스크 용량 80% 도달 예상. 용량 확장을 권장합니다.',
        '다음 주 트래픽 예측: 평소 대비 35% 증가 예상. 스케일 아웃 준비가 필요합니다.',
        'CPU 사용률 패턴 분석 결과, 매주 화요일 오후 2-4시 피크 예상됩니다.',
      ],
      confidence: 0.82,
    },
    recommendation: {
      keywords: ['추천', '권장', '개선', 'recommend', 'suggest', '최적화'],
      responses: [
        '권장 사항: 1) Redis 캐시 TTL 300초로 조정, 2) DB 인덱스 재구성, 3) 로드밸런서 알고리즘 변경',
        '성능 최적화 방안: Nginx 워커 프로세스를 CPU 코어 수에 맞춰 8개로 증설하세요.',
        '비용 절감 방안: 야간 시간대 자동 스케일 다운 정책 적용시 월 30% 비용 절감 가능합니다.',
      ],
      confidence: 0.87,
    },
  };

  constructor(options: DevMockGoogleAIOptions = {}) {
    this.options = {
      defaultModel: 'gemini-pro',
      defaultTemperature: 0.7,
      maxTokens: 1000,
      enableLogging: true,
      responseDelay: 200,
      ...options,
    };

    if (this.options.enableLogging) {
      console.log('🤖 Dev Mock Google AI 초기화됨');
    }
  }

  /**
   * 텍스트 생성 (generateContent 메서드 시뮬레이션)
   */
  async generateContent(params: {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topK?: number;
      topP?: number;
    };
  }): Promise<{
    response: {
      text: () => string;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };
  }> {
    const startTime = Date.now();
    const prompt = params.contents[0]?.parts[0]?.text || '';
    
    // 응답 지연 시뮬레이션
    if (this.options.responseDelay) {
      await new Promise(resolve => setTimeout(resolve, this.options.responseDelay));
    }

    // 프롬프트 분석 및 응답 생성
    const response = this.generateResponse(prompt, params.generationConfig);
    
    // 통계 업데이트
    this.updateStats(response, Date.now() - startTime);

    // Google AI API 형식으로 응답
    return {
      response: {
        text: () => response.text,
        usageMetadata: {
          promptTokenCount: Math.ceil(prompt.length / 4),
          candidatesTokenCount: response.tokensUsed,
          totalTokenCount: Math.ceil(prompt.length / 4) + response.tokensUsed,
        },
      },
    };
  }

  /**
   * 프롬프트 기반 동적 응답 생성
   */
  private generateResponse(
    prompt: string,
    config?: any
  ): MockResponse {
    const lowerPrompt = prompt.toLowerCase();
    
    // 패턴 매칭으로 적절한 응답 선택
    for (const [category, pattern] of Object.entries(this.patterns)) {
      const hasKeyword = pattern.keywords.some(keyword => 
        lowerPrompt.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        const responseText = this.selectResponse(pattern.responses, prompt);
        const enrichedResponse = this.enrichResponse(responseText, prompt, category);
        
        return {
          text: enrichedResponse,
          confidence: pattern.confidence + (Math.random() * 0.05 - 0.025),
          tokensUsed: Math.ceil(enrichedResponse.length / 4),
          processingTime: Math.random() * 100 + 100,
        };
      }
    }

    // 패턴에 매칭되지 않는 경우 일반 응답
    return this.generateGenericResponse(prompt);
  }

  /**
   * 응답 선택 (프롬프트 해시 기반)
   */
  private selectResponse(responses: string[], prompt: string): string {
    const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return responses[hash % responses.length];
  }

  /**
   * 응답 보강 (컨텍스트 추가)
   */
  private enrichResponse(base: string, prompt: string, category: string): string {
    const timestamp = new Date().toLocaleString('ko-KR');
    
    // 서버 이름이 언급된 경우 특정 서버 정보 추가
    const serverMatch = prompt.match(/(web|app|db|file|backup)-[a-z]+-\d+/i);
    if (serverMatch) {
      base = `${serverMatch[0]} 서버 분석 결과:\n${base}`;
    }

    // 시간 정보 추가
    if (prompt.includes('최근') || prompt.includes('현재')) {
      base += `\n\n(기준 시각: ${timestamp})`;
    }

    // 신뢰도 정보 추가 (개발 환경에서만)
    if (this.options.enableLogging) {
      base += `\n\n[Mock AI: ${category} 카테고리, 신뢰도 ${(this.patterns[category].confidence * 100).toFixed(0)}%]`;
    }

    return base;
  }

  /**
   * 일반 응답 생성 (패턴 매칭 실패 시)
   */
  private generateGenericResponse(prompt: string): MockResponse {
    const responses = [
      '입력하신 내용을 분석 중입니다. 서버 모니터링 관련 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.',
      '해당 요청에 대한 분석을 진행하겠습니다. 추가 컨텍스트가 있다면 더 나은 인사이트를 제공할 수 있습니다.',
      '시스템 전반적인 상태는 양호합니다. 특정 메트릭이나 서버에 대해 궁금하신 점이 있으신가요?',
    ];

    const text = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      text,
      confidence: 0.65,
      tokensUsed: Math.ceil(text.length / 4),
      processingTime: Math.random() * 50 + 50,
    };
  }

  /**
   * 통계 업데이트
   */
  private updateStats(response: MockResponse, processingTime: number): void {
    this.stats.totalRequests++;
    this.stats.totalTokensUsed += response.tokensUsed;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + processingTime) / 
      this.stats.totalRequests;

    const model = this.options.defaultModel || 'gemini-pro';
    this.stats.modelUsage.set(
      model,
      (this.stats.modelUsage.get(model) || 0) + 1
    );
  }

  /**
   * 통계 조회
   */
  getStats(): Record<string, any> {
    return {
      ...this.stats,
      modelUsage: Array.from(this.stats.modelUsage.entries()),
      tokensPerRequest: this.stats.totalRequests > 0 
        ? Math.round(this.stats.totalTokensUsed / this.stats.totalRequests)
        : 0,
    };
  }

  /**
   * Mock 시나리오 추가
   */
  addScenario(
    name: string,
    keywords: string[],
    responses: string[],
    confidence: number = 0.85
  ): void {
    this.patterns[name] = { keywords, responses, confidence };
    
    if (this.options.enableLogging) {
      console.log(`📝 새로운 시나리오 추가됨: ${name}`);
    }
  }

  /**
   * Mock 리셋
   */
  reset(): void {
    this.stats = {
      totalRequests: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      modelUsage: new Map<string, number>(),
    };
  }
}

// 싱글톤 인스턴스
let devMockGoogleAIInstance: DevMockGoogleAI | null = null;

export function getDevMockGoogleAI(): DevMockGoogleAI {
  if (!devMockGoogleAIInstance) {
    devMockGoogleAIInstance = new DevMockGoogleAI({
      enableLogging: process.env.NODE_ENV === 'development',
      responseDelay: process.env.NODE_ENV === 'test' ? 0 : 200,
    });
  }

  return devMockGoogleAIInstance;
}

// Google Generative AI 호환 인터페이스
export class MockGoogleGenerativeAI {
  private mockAI: DevMockGoogleAI;

  constructor(apiKey?: string) {
    this.mockAI = getDevMockGoogleAI();
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Mock Google Generative AI 초기화 (API 키 불필요)');
    }
  }

  getGenerativeModel(params: { model: string }): {
    generateContent: typeof DevMockGoogleAI.prototype.generateContent;
  } {
    return {
      generateContent: this.mockAI.generateContent.bind(this.mockAI),
    };
  }
}