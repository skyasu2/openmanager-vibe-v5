/**
 * 🤖 Google AI Studio (Gemini) 서비스
 *
 * ✅ Gemini 1.5 Flash/Pro 지원
 * ✅ 서버 모니터링 특화 분석
 * ✅ 베타 모드 전용 고급 기능
 * ✅ 무료 할당량 최적화
 * ✅ 폴백 시스템 내장
 * ✅ 보안 강화된 API 키 관리
 */

import { getGoogleAIKey, isGoogleAIAvailable } from '@/lib/google-ai-manager';

interface GoogleAIConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  enabled: boolean;
  rateLimits: {
    rpm: number;
    daily: number;
  };
}

interface GoogleAIResponse {
  success: boolean;
  content: string;
  model: string;
  tokensUsed?: number;
  cached?: boolean;
  processingTime: number;
  confidence: number;
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
  private config: GoogleAIConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private requestCache = new Map<
    string,
    { response: string; timestamp: number }
  >();
  private requestCount = { minute: 0, day: 0, lastReset: Date.now() };
  private isInitialized = false;

  constructor() {
    // 🔐 보안 강화된 API 키 관리 사용
    const apiKey = getGoogleAIKey();

    this.config = {
      apiKey: apiKey || '',
      model: (process.env.GOOGLE_AI_MODEL as any) || 'gemini-1.5-flash',
      enabled:
        process.env.GOOGLE_AI_ENABLED === 'true' && isGoogleAIAvailable(),
      rateLimits: {
        rpm: this.getRateLimit('rpm'),
        daily: this.getRateLimit('daily'),
      },
    };
  }

  /**
   * 🔧 서비스 초기화
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!this.config.enabled || !this.config.apiKey) {
        console.log('🤖 Google AI 베타 모드: 비활성화됨');
        return false;
      }

      // 연결 테스트
      const testResponse = await this.generateContent(
        'Hello, this is a connection test.',
        {
          skipCache: true,
          timeout: 5000,
        }
      );

      if (testResponse.success) {
        this.isInitialized = true;
        console.log('✅ Google AI Studio 베타 모드 초기화 완료');
        console.log(`🎯 모델: ${this.config.model}`);
        console.log(
          `⚡ 할당량: ${this.config.rateLimits.rpm}RPM, ${this.config.rateLimits.daily}/일`
        );
        return true;
      }

      throw new Error('연결 테스트 실패');
    } catch (error) {
      console.warn('⚠️ Google AI 초기화 실패:', error);
      this.config.enabled = false;
      return false;
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
    options: { skipCache?: boolean; timeout?: number } = {}
  ): Promise<GoogleAIResponse> {
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
    const limits = {
      'gemini-1.5-flash': { rpm: 15, daily: 1500 },
      'gemini-1.5-pro': { rpm: 2, daily: 50 },
    };

    return (
      limits[this.config.model]?.[type] || limits['gemini-1.5-flash'][type]
    );
  }

  private checkRateLimit(): boolean {
    const now = Date.now();

    // 분당 리셋
    if (now - this.requestCount.lastReset > 60000) {
      this.requestCount.minute = 0;
      this.requestCount.lastReset = now;
    }

    // 일일 리셋
    if (now - this.requestCount.lastReset > 86400000) {
      this.requestCount.day = 0;
    }

    return (
      this.requestCount.minute < this.config.rateLimits.rpm &&
      this.requestCount.day < this.config.rateLimits.daily
    );
  }

  private incrementRequestCount(): void {
    this.requestCount.minute++;
    this.requestCount.day++;
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
    return (
      this.config.enabled &&
      currentApiKey &&
      this.isInitialized &&
      isGoogleAIAvailable()
    );
  }

  getStatus(): any {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      model: this.config.model,
      rateLimits: this.config.rateLimits,
      currentUsage: {
        minute: this.requestCount.minute,
        day: this.requestCount.day,
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
}
