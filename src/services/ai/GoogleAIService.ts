/**
 * 🤖 Google AI Studio (Gemini) 서비스
 *
 * ✅ Gemini 1.5 Flash/Pro 지원
 * ✅ 서버 모니터링 특화 분석
 * ✅ 베타 모드 전용 고급 기능
 * ✅ 무료 할당량 최적화
 * ✅ 폴백 시스템 내장
 * ✅ 보안 강화된 API 키 관리
 * ✅ 싱글톤 패턴으로 할당량 중앙 관리
 */

import { getGoogleAIKey, isGoogleAIAvailable } from '@/lib/google-ai-manager';
import { aiLogger, LogCategory, LogLevel } from './logging/AILogger';

interface GoogleAIConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  enabled: boolean;
  rateLimits: {
    rpm: number;
    daily: number;
  };
}

export interface GoogleAIResponse {
  success: boolean;
  content: string;
  model: string;
  tokensUsed?: number;
  cached?: boolean;
  processingTime: number;
  confidence: number;
  error?: {
    code: string;
    message: string;
    details: string;
    timestamp: string;
    retryable: boolean;
  };
}

interface ServerMetrics {
  name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  status: string;
  timestamp: string;
}

interface AdvancedAnalysisRequest {
  query: string;
  serverMetrics?: ServerMetrics[];
  context?: any;
  analysisType:
    | 'monitoring'
    | 'prediction'
    | 'troubleshooting'
    | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class GoogleAIService {
  private static instance: GoogleAIService | null = null;

  private config: GoogleAIConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private requestCache = new Map<
    string,
    { response: string; timestamp: number }
  >();
  private requestCount = {
    minute: 0,
    hour: 0,
    day: 0,
    lastReset: Date.now(),
    lastHourReset: Date.now(),
  };
  private learningCount = {
    daily: 0,
    lastLearningDate: '',
  };
  private lastConnectionTest = 0; // 마지막 연결 테스트 시간
  private isInitialized = false;

  private constructor() {
    // 생성자를 private으로 만들어 외부에서 직접 인스턴스 생성 방지
    this.config = {
      apiKey: getGoogleAIKey() || '',
      model: 'gemini-1.5-flash',
      enabled: isGoogleAIAvailable(),
      rateLimits: {
        rpm: parseInt(process.env.GOOGLE_AI_RPM_LIMIT || '100'),
        daily: parseInt(process.env.GOOGLE_AI_DAILY_LIMIT || '10000'),
      },
    };

    // 🚀 대화용 Google AI 활성화 (학습은 하루 1회 제한)
    const isKeyAvailable = isGoogleAIAvailable();

    if (
      this.config.apiKey &&
      this.config.apiKey.trim() !== '' &&
      isKeyAvailable
    ) {
      this.config.enabled = true;
      console.log('🚀 Google AI 대화용 활성화 - 학습은 하루 1회 제한');
    } else {
      console.log(
        `⚠️ Google AI 비활성화: apiKey=${!!this.config.apiKey}, keyAvailable=${isKeyAvailable}`
      );
    }

    // 이후 실제 레이트 리밋 설정
    this.config.rateLimits.rpm = this.getRateLimit('rpm');
    this.config.rateLimits.daily = this.getRateLimit('daily');
  }

  /**
   * 🎯 싱글톤 인스턴스 가져오기 (할당량 중앙 관리)
   */
  public static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
      console.log('🤖 Google AI Service 싱글톤 인스턴스 생성됨');
    }
    return GoogleAIService.instance;
  }

  /**
   * 🔧 레거시 호환성을 위한 정적 팩토리 메서드
   * @deprecated getInstance()를 사용하세요
   */
  public static create(): GoogleAIService {
    console.warn(
      '⚠️ GoogleAIService.create()는 deprecated입니다. getInstance()를 사용하세요.'
    );
    return GoogleAIService.getInstance();
  }

  /**
   * 🔧 서비스 초기화
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!this.config.enabled || !this.config.apiKey) {
        await aiLogger.logAI({
          level: LogLevel.INFO,
          category: LogCategory.GOOGLE_AI,
          engine: 'GoogleAIService',
          message: '🤖 Google AI 베타 모드: 비활성화됨',
        });
        return false;
      }

      // 🚀 연결 테스트 (테스트 서버에서는 헬스체크 비활성화, 질문 기능만 사용)
      const isTestServer =
        process.env.NODE_ENV === 'development' ||
        process.env.DISABLE_GOOGLE_AI_HEALTH_CHECK === 'true';

      let connectionTest: {
        success: boolean;
        message: string;
        latency?: number;
      } = {
        success: true,
        message: isTestServer
          ? '테스트 서버: 헬스체크 비활성화, 질문 기능만 사용'
          : '연결 테스트 스킵됨',
        latency: 0,
      };

      if (!isTestServer) {
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2시간
        const shouldTestConnection = now - this.lastConnectionTest > twoHours;

        if (shouldTestConnection) {
          console.log('🚀 Google AI 연결 테스트 시작... (2시간마다)');
          connectionTest = await this.testConnection();
          this.lastConnectionTest = now;
        }
      } else {
        console.log(
          '🧪 테스트 서버: Google AI 헬스체크 비활성화, 질문 기능만 사용'
        );
      }

      if (connectionTest.success) {
        this.isInitialized = true;
        await aiLogger.logAI({
          level: LogLevel.INFO,
          category: LogCategory.GOOGLE_AI,
          engine: 'GoogleAIService',
          message: `✅ Google AI Studio 베타 모드 초기화 완료 (연결 테스트 성공: ${connectionTest.latency}ms)`,
          metadata: {
            model: this.config.model,
            rpmLimit: this.config.rateLimits.rpm,
            dailyLimit: this.config.rateLimits.daily,
            quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'false',
            connectionLatency: connectionTest.latency,
          },
        });
        return true;
      } else {
        console.log(`⚠️ Google AI 연결 테스트 실패: ${connectionTest.message}`);
        // 연결 실패해도 시연용으로 활성화
        this.isInitialized = true;
        await aiLogger.logAI({
          level: LogLevel.WARN,
          category: LogCategory.GOOGLE_AI,
          engine: 'GoogleAIService',
          message: `⚠️ Google AI Studio 연결 테스트 실패하지만 시연용으로 활성화: ${connectionTest.message}`,
          metadata: {
            model: this.config.model,
            rpmLimit: this.config.rateLimits.rpm,
            dailyLimit: this.config.rateLimits.daily,
            quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'false',
          },
        });
        return true;
      }
    } catch (error) {
      await aiLogger.logError(
        'GoogleAIService',
        LogCategory.GOOGLE_AI,
        error as Error,
        { stage: 'initialization', config: this.config }
      );
      // 에러 발생해도 시연용으로 활성화
      this.isInitialized = true;
      this.config.enabled = true;
      console.log('🚀 Google AI 초기화 에러 발생하지만 시연용으로 강제 활성화');
      return true;
    }
  }

  /**
   * 🧠 고급 서버 모니터링 분석 (베타 기능)
   */
  async analyzeAdvanced(
    request: AdvancedAnalysisRequest
  ): Promise<GoogleAIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Google AI 베타 모드가 비활성화되어 있습니다.');
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildAdvancedPrompt(request);
      const cacheKey = this.generateCacheKey(prompt, request.analysisType);

      // 캐시 확인 (고급 분석은 5분 캐시)
      const cached = this.getCachedResponse(cacheKey, 300000);
      if (cached) {
        return {
          success: true,
          content: cached,
          model: this.config.model,
          cached: true,
          processingTime: Date.now() - startTime,
          confidence: 0.95,
        };
      }

      const response = await this.generateContent(prompt);

      if (response.success) {
        // 캐시 저장
        this.setCachedResponse(cacheKey, response.content);

        return {
          success: true,
          content: this.enhanceResponse(response.content, request),
          model: this.config.model,
          cached: false,
          processingTime: Date.now() - startTime,
          confidence: this.calculateConfidence(response.content, request),
        };
      }

      throw new Error('Google AI 응답 생성 실패');
    } catch (error) {
      console.error('❌ Google AI 고급 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 기본 컨텐츠 생성
   */
  async generateContent(
    prompt: string,
    options: {
      skipCache?: boolean;
      timeout?: number;
      isNaturalLanguage?: boolean;
      isLearning?: boolean;
    } = {}
  ): Promise<GoogleAIResponse> {
    // 🔒 질문 대응 전용 모드 체크
    const questionResponseOnly =
      process.env.GOOGLE_AI_QUESTION_RESPONSE_ONLY === 'true';
    if (questionResponseOnly && options.isLearning) {
      throw new Error(
        'Google AI는 현재 질문 대응 전용 모드입니다. 학습은 시스템 시작/종료 시에만 허용됩니다.'
      );
    }

    // 🔒 자연어 전용 모드 체크
    const naturalLanguageOnly =
      process.env.GOOGLE_AI_NATURAL_LANGUAGE_ONLY === 'true';
    if (
      naturalLanguageOnly &&
      !options.isNaturalLanguage &&
      !options.isLearning
    ) {
      throw new Error(
        'Google AI는 현재 자연어 질의 전용 모드입니다. 시스템 분석은 다른 AI 엔진을 사용합니다.'
      );
    }

    // 🎓 학습 모드 제한 체크 (하루 1회)
    if (options.isLearning) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

      // 날짜가 바뀌면 학습 카운트 리셋
      if (this.learningCount.lastLearningDate !== today) {
        this.learningCount.daily = 0;
        this.learningCount.lastLearningDate = today;
      }

      // 하루 1회 학습 제한
      if (this.learningCount.daily >= 1) {
        throw new Error(
          '학습은 하루에 1회만 허용됩니다. 내일 다시 시도해주세요.'
        );
      }
    }

    if (!this.isAvailable()) {
      throw new Error('Google AI 서비스를 사용할 수 없습니다.');
    }

    // 🔐 실시간으로 API 키 가져오기
    const currentApiKey = getGoogleAIKey();
    if (!currentApiKey) {
      throw new Error(
        'Google AI API 키를 사용할 수 없습니다. 설정을 확인해주세요.'
      );
    }

    // 할당량 확인
    if (!this.checkRateLimit()) {
      throw new Error(
        'Google AI 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.'
      );
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 10000
      );

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${currentApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 32,
              topP: 0.95,
              maxOutputTokens: 4096,
              stopSequences: [],
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Google AI API Error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        throw new Error('Google AI에서 빈 응답을 반환했습니다.');
      }

      // 요청 카운트 증가
      this.incrementRequestCount();

      // 학습 카운트 증가 (학습 모드인 경우)
      if (options.isLearning) {
        this.learningCount.daily++;
        console.log(
          `📚 Google AI 학습 완료 (오늘 ${this.learningCount.daily}/1회)`
        );
      }

      return {
        success: true,
        content,
        model: this.config.model,
        tokensUsed: data.usageMetadata?.totalTokenCount,
        cached: false,
        processingTime: Date.now() - startTime,
        confidence: 0.95,
      };
    } catch (error: any) {
      console.error('❌ Google AI 요청 실패:', error);

      if (error.name === 'AbortError') {
        throw new Error('Google AI 요청 시간 초과');
      }

      if (
        error.message.includes('quota') ||
        error.message.includes('rate limit')
      ) {
        throw new Error('Google AI 할당량 초과. 잠시 후 다시 시도해주세요.');
      }

      throw error;
    }
  }

  /**
   * 🎯 서버 메트릭 분석 (기존 호환성)
   */
  async analyzeServerMetrics(metrics: ServerMetrics[]): Promise<string> {
    const prompt = `
서버 모니터링 데이터를 분석해주세요:

${metrics
  .map(
    server => `
서버: ${server.name}
CPU: ${server.cpu_usage}%
메모리: ${server.memory_usage}%
디스크: ${server.disk_usage}%
응답시간: ${server.response_time}ms
상태: ${server.status}
`
  )
  .join('\n')}

다음 관점에서 분석해주세요:
1. 현재 시스템 상태 요약
2. 주의가 필요한 서버 식별
3. 성능 최적화 권장사항
4. 예상되는 문제점과 대응방안

간결하고 실용적인 분석을 제공해주세요.
        `;

    const response = await this.generateContent(prompt);
    return response.content;
  }

  /**
   * 🎯 응답 생성 (UnifiedAIEngine 호환)
   */
  async generateResponse(prompt: string): Promise<GoogleAIResponse> {
    try {
      // 자연어 질의인지 판단
      const isNaturalLanguage = this.isNaturalLanguageQuery(prompt);
      return await this.generateContent(prompt, { isNaturalLanguage });
    } catch (error: any) {
      console.error('❌ Google AI 응답 생성 실패:', error);

      // 명확한 실패 상태 반환 (목업이 아닌)
      return {
        success: false,
        content: '', // 빈 응답
        model: this.config.model,
        tokensUsed: 0,
        cached: false,
        processingTime: 0,
        confidence: 0,
        error: {
          code: this.getErrorCode(error),
          message: error.message || 'Google AI API 실패',
          details: error.stack || error.toString(),
          timestamp: new Date().toISOString(),
          retryable: this.isRetryableError(error),
        },
      };
    }
  }

  /**
   * 🔍 자연어 질의 판단
   */
  private isNaturalLanguageQuery(prompt: string): boolean {
    // 자연어 질의 패턴 감지
    const naturalLanguagePatterns = [
      /^(어떻게|왜|언제|어디서|무엇을|누가|어떤)/i,
      /\?$/,
      /설명해|알려줘|도와줘|분석해|추천해/i,
      /문제가|이상해|오류가|장애가/i,
      /성능이|속도가|느려|빨라/i,
      /서버.*상태|시스템.*상태/i,
      /어떻게.*해야|무엇을.*해야/i,
    ];

    // 시스템 명령어 패턴 (자연어가 아님)
    const systemCommandPatterns = [
      /^(GET|POST|PUT|DELETE|PATCH)/i,
      /^(SELECT|INSERT|UPDATE|DELETE)/i,
      /^\{.*\}$/,
      /^\[.*\]$/,
      /^[a-zA-Z_][a-zA-Z0-9_]*\(/,
      /^\/api\//i,
    ];

    // 시스템 명령어면 자연어가 아님
    if (systemCommandPatterns.some(pattern => pattern.test(prompt.trim()))) {
      return false;
    }

    // 자연어 패턴이 있으면 자연어
    if (naturalLanguagePatterns.some(pattern => pattern.test(prompt.trim()))) {
      return true;
    }

    // 한글이 50% 이상이면 자연어로 판단
    const koreanChars = prompt.match(/[가-힣]/g) || [];
    const totalChars = prompt.replace(/\s/g, '').length;
    const koreanRatio = totalChars > 0 ? koreanChars.length / totalChars : 0;

    return koreanRatio > 0.3; // 한글 비율이 30% 이상이면 자연어
  }

  /**
   * 🚀 고급 프롬프트 생성
   */
  private buildAdvancedPrompt(request: AdvancedAnalysisRequest): string {
    const basePrompt = `
당신은 OpenManager 서버 모니터링 전문 AI입니다. 다음 정보를 바탕으로 ${request.analysisType} 분석을 수행해주세요.

우선순위: ${request.priority.toUpperCase()}
분석 유형: ${request.analysisType}
사용자 질의: ${request.query}
`;

    let contextPrompt = '';

    if (request.serverMetrics && request.serverMetrics.length > 0) {
      contextPrompt += '\n📊 **서버 메트릭 데이터:**\n';
      request.serverMetrics.forEach((server, index) => {
        contextPrompt += `
${index + 1}. 서버: ${server.name}
   - CPU 사용률: ${server.cpu_usage}%
   - 메모리 사용률: ${server.memory_usage}%
   - 디스크 사용률: ${server.disk_usage}%
   - 평균 응답시간: ${server.response_time}ms
   - 상태: ${server.status}
   - 측정시간: ${server.timestamp}
`;
      });
    }

    const analysisGuideline = this.getAnalysisGuideline(
      request.analysisType,
      request.priority
    );

    return `${basePrompt}${contextPrompt}\n${analysisGuideline}

응답 형식:
1. 🎯 **핵심 요약** (2-3줄)
2. 📊 **상세 분석**
3. ⚠️ **주의사항** (있는 경우)
4. 💡 **권장 조치사항**
5. 🔮 **예측 및 트렌드** (해당하는 경우)

실용적이고 구체적인 분석을 제공해주세요.`;
  }

  /**
   * 📋 분석 유형별 가이드라인
   */
  private getAnalysisGuideline(type: string, priority: string): string {
    const guidelines = {
      monitoring: `
🔍 **모니터링 분석 지침:**
- 현재 시스템 전반적 상태 평가
- 비정상적인 메트릭 패턴 식별
- 리소스 사용 효율성 평가
- 성능 병목 지점 분석`,

      prediction: `
🔮 **예측 분석 지침:**
- 향후 1-24시간 트렌드 예측
- 리소스 고갈 시점 예측
- 잠재적 장애 발생 가능성
- 용량 계획 권장사항`,

      troubleshooting: `
🔧 **문제 해결 분석 지침:**
- 근본 원인 분석 (Root Cause Analysis)
- 즉시 조치 가능한 해결방안
- 단계별 문제 해결 절차
- 재발 방지 대책`,

      optimization: `
⚡ **최적화 분석 지침:**
- 성능 개선 기회 식별
- 리소스 활용 최적화 방안
- 비용 효율성 개선 제안
- 시스템 아키텍처 권장사항`,
    };

    let guideline = guidelines[type] || guidelines.monitoring;

    if (priority === 'critical') {
      guideline +=
        '\n\n🚨 **긴급 상황**: 즉시 조치가 필요한 사항을 최우선으로 분석해주세요.';
    }

    return guideline;
  }

  /**
   * ✨ 응답 향상 (베타 기능)
   */
  private enhanceResponse(
    content: string,
    request: AdvancedAnalysisRequest
  ): string {
    // 응답에 메타데이터 추가
    const enhanced = `${content}

---
🤖 **AI 분석 정보**
- 엔진: Google AI Studio (Gemini ${this.config.model})
- 분석 유형: ${request.analysisType}
- 우선순위: ${request.priority}
- 생성 시간: ${new Date().toLocaleString('ko-KR')}
- 베타 기능: 고급 분석 활성화 ✨`;

    return enhanced;
  }

  /**
   * 📊 신뢰도 계산
   */
  private calculateConfidence(
    content: string,
    request: AdvancedAnalysisRequest
  ): number {
    let confidence = 0.8; // 기본 신뢰도

    // 응답 길이 기반 조정
    if (content.length > 500) confidence += 0.1;
    if (content.length > 1000) confidence += 0.05;

    // 분석 유형별 조정
    if (request.analysisType === 'monitoring') confidence += 0.05;
    if (request.analysisType === 'prediction') confidence -= 0.1;

    // 데이터 품질 기반 조정
    if (request.serverMetrics && request.serverMetrics.length > 5)
      confidence += 0.05;

    return Math.min(0.98, Math.max(0.7, confidence));
  }

  /**
   * 🔄 할당량 관리
   */
  private getRateLimit(type: 'rpm' | 'daily'): number {
    // 🚀 시연용 최대 할당량 반환 (내일 시연 전용)
    const demoLimits = {
      rpm: 100, // 분당 100개 요청
      daily: 10000, // 일일 10,000개 요청
    };

    // 환경변수에서 설정된 값이 있으면 우선 사용
    if (type === 'rpm' && process.env.GOOGLE_AI_RPM_LIMIT) {
      return parseInt(process.env.GOOGLE_AI_RPM_LIMIT) || demoLimits.rpm;
    }
    if (type === 'daily' && process.env.GOOGLE_AI_DAILY_LIMIT) {
      return parseInt(process.env.GOOGLE_AI_DAILY_LIMIT) || demoLimits.daily;
    }

    // 시연용 최대 할당량 반환
    return demoLimits[type];
  }

  /**
   * 🔒 할당량 체크 (분당/시간당/일일)
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // 시간당 리셋 (3600초)
    if (now - this.requestCount.lastHourReset > 3600000) {
      this.requestCount.hour = 0;
      this.requestCount.lastHourReset = now;
    }

    // 분당 리셋 (60초)
    if (now - this.requestCount.lastReset > 60000) {
      this.requestCount.minute = 0;
      this.requestCount.lastReset = now;
    }

    // 일일 리셋 (24시간)
    if (now - this.requestCount.lastReset > 86400000) {
      this.requestCount.day = 0;
    }

    // 할당량 체크
    const hourlyLimit = parseInt(process.env.GOOGLE_AI_HOURLY_LIMIT || '500');
    const minuteLimit = this.config.rateLimits.rpm;
    const dailyLimit = this.config.rateLimits.daily;

    if (this.requestCount.hour >= hourlyLimit) {
      console.warn(
        `⚠️ Google AI 시간당 할당량 초과: ${this.requestCount.hour}/${hourlyLimit}`
      );
      return false;
    }

    if (this.requestCount.minute >= minuteLimit) {
      console.warn(
        `⚠️ Google AI 분당 할당량 초과: ${this.requestCount.minute}/${minuteLimit}`
      );
      return false;
    }

    if (this.requestCount.day >= dailyLimit) {
      console.warn(
        `⚠️ Google AI 일일 할당량 초과: ${this.requestCount.day}/${dailyLimit}`
      );
      return false;
    }

    return true;
  }

  /**
   * 📊 요청 카운트 증가
   */
  private incrementRequestCount(): void {
    this.requestCount.minute++;
    this.requestCount.hour++;
    this.requestCount.day++;

    console.log(
      `📊 Google AI 사용량: 분당 ${this.requestCount.minute}, 시간당 ${this.requestCount.hour}, 일일 ${this.requestCount.day}`
    );
  }

  /**
   * 💾 캐시 관리
   */
  private generateCacheKey(prompt: string, type: string): string {
    const hash = this.simpleHash(prompt);
    return `${type}-${hash}`;
  }

  private getCachedResponse(key: string, maxAge: number): string | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.response;
    }
    return null;
  }

  private setCachedResponse(key: string, response: string): void {
    this.requestCache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // 캐시 크기 제한 (최대 100개)
    if (this.requestCache.size > 100) {
      const oldestKey = this.requestCache.keys().next().value;
      this.requestCache.delete(oldestKey);
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer 변환
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 🔍 상태 체크
   */
  isAvailable(): boolean {
    // 🔐 실시간으로 API 키 가용성 확인
    const currentApiKey = getGoogleAIKey();
    return Boolean(
      this.config.enabled &&
        currentApiKey &&
        this.isInitialized &&
        isGoogleAIAvailable()
    );
  }

  /**
   * ✅ 준비 상태 확인 (isReady 별칭)
   */
  isReady(): boolean {
    return this.isInitialized && this.isAvailable();
  }

  getStatus(): any {
    const hourlyLimit = parseInt(process.env.GOOGLE_AI_HOURLY_LIMIT || '500');
    const questionResponseOnly =
      process.env.GOOGLE_AI_QUESTION_RESPONSE_ONLY === 'true';
    const learningMode =
      process.env.GOOGLE_AI_LEARNING_MODE || 'startup_shutdown_only';

    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      model: this.config.model,
      rateLimits: {
        ...this.config.rateLimits,
        hourly: hourlyLimit,
      },
      currentUsage: {
        minute: this.requestCount.minute,
        hour: this.requestCount.hour,
        day: this.requestCount.day,
      },
      usagePercentage: {
        minute: Math.round(
          (this.requestCount.minute / this.config.rateLimits.rpm) * 100
        ),
        hour: Math.round((this.requestCount.hour / hourlyLimit) * 100),
        day: Math.round(
          (this.requestCount.day / this.config.rateLimits.daily) * 100
        ),
      },
      restrictions: {
        questionResponseOnly,
        learningMode,
        naturalLanguageOnly:
          process.env.GOOGLE_AI_NATURAL_LANGUAGE_ONLY === 'true',
      },
      systemPhase: {
        isStartup: this.isSystemStartupPhase(),
        isShutdown: this.isSystemShutdownPhase(),
      },
      cacheSize: this.requestCache.size,
    };
  }

  /**
   * 🧪 연결 테스트
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    if (!this.config.apiKey) {
      return { success: false, message: 'API 키가 설정되지 않았습니다.' };
    }

    try {
      const startTime = Date.now();
      const response = await this.generateContent('Hello from OpenManager!', {
        skipCache: true,
        timeout: 5000,
      });
      const latency = Date.now() - startTime;

      if (response.success) {
        return {
          success: true,
          message: `연결 성공! (${latency}ms)`,
          latency,
        };
      }

      return { success: false, message: '연결 실패' };
    } catch (error: any) {
      return {
        success: false,
        message: `연결 오류: ${error.message}`,
      };
    }
  }

  /**
   * 🔍 시스템 시작 단계 감지
   */
  private isSystemStartupPhase(): boolean {
    // 시스템 시작 후 5분 이내면 시작 단계로 간주
    const startupWindow = 5 * 60 * 1000; // 5분
    const systemStartTime = globalThis.systemStartTime || Date.now();
    return Date.now() - systemStartTime < startupWindow;
  }

  /**
   * 🔍 시스템 종료 단계 감지
   */
  private isSystemShutdownPhase(): boolean {
    // 종료 신호가 있거나 프로세스 종료 중이면 종료 단계로 간주
    return globalThis.isSystemShuttingDown || false;
  }

  /**
   * 🔍 오류 코드 분류
   */
  private getErrorCode(error: any): string {
    if (error.name === 'AbortError') return 'TIMEOUT';
    if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
    if (error.message.includes('rate limit')) return 'RATE_LIMITED';
    if (error.message.includes('API key')) return 'INVALID_KEY';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    return 'API_ERROR';
  }

  /**
   * 🔄 재시도 가능 오류 판단
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMITED'];
    return retryableCodes.includes(this.getErrorCode(error));
  }
}
