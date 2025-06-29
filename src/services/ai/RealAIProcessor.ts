/**
 * 🤖 실제 AI 처리 서비스
 *
 * 기술 스택:
 * - 기본: 로컬 MCP 엔진으로 LLM 없이 동작
 * - 차후 개발: OpenAI GPT-3.5-turbo 연동 (예정)
 * - 차후 개발: Google Gemini 연동 (예정)
 * - 차후 개발: Anthropic Claude 연동 (예정)
 * - Redis 캐싱
 * - Render Python 서버 연동
 */

import { z } from 'zod';
import { getRedisClient } from '@/lib/redis';

// AI 응답 스키마
const AIResponseSchema = z.object({
  intent: z.enum([
    'status_check',
    'troubleshooting',
    'analysis',
    'recommendation',
    'prediction',
  ]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  details: z.array(z.string()),
  actions: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
});

const SystemAnalysisSchema = z.object({
  status: z.enum(['healthy', 'warning', 'critical']),
  issues: z.array(
    z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      solution: z.string(),
    })
  ),
  metrics: z.object({
    cpu: z.number(),
    memory: z.number(),
    disk: z.number(),
    network: z.number().optional(),
  }),
  recommendations: z.array(z.string()),
});

export interface AIProcessingRequest {
  query: string;
  context?: {
    serverMetrics?: any[];
    logEntries?: any[];
    systemState?: any;
  };
  options?: {
    model?: 'gpt-3.5-turbo' | 'claude-3-haiku' | 'gemini-1.5-flash';
    temperature?: number;
    maxTokens?: number;
    useCache?: boolean;
    usePython?: boolean;
  };
}

export interface AIProcessingResponse {
  success: boolean;
  intent: string;
  confidence: number;
  summary: string;
  details: string[];
  actions: string[];
  urgency: string;
  processingTime: number;
  model: string;
  cached: boolean;
  pythonAnalysis?: any;
}

export class RealAIProcessor {
  private static instance: RealAIProcessor | null = null;
  private redis: any;
  private pythonServiceUrl: string;
  private enabledModels: string[] = [];

  private constructor() {
    // Render Python 서버 URL (무료 tier)
    this.pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL ||
      'https://openmanager-ai-python.onrender.com';

    // 사용 가능한 모델들 확인
    this.initializeModels();
  }

  public static getInstance(): RealAIProcessor {
    if (!RealAIProcessor.instance) {
      RealAIProcessor.instance = new RealAIProcessor();
    }
    return RealAIProcessor.instance;
  }

  /**
   * 🚀 모델 초기화
   */
  private async initializeModels(): Promise<void> {
    try {
      this.redis = await getRedisClient();

      // API 키가 있는 모델들만 활성화
      if (process.env.OPENAI_API_KEY) {
        this.enabledModels.push('gpt-3.5-turbo');
      }
      if (process.env.ANTHROPIC_API_KEY) {
        this.enabledModels.push('claude-3-haiku');
      }
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        this.enabledModels.push('gemini-1.5-flash');
      }

      console.log(`✅ AI 모델 초기화 완료: ${this.enabledModels.join(', ')}`);
    } catch (error) {
      console.warn('⚠️ AI 모델 초기화 실패:', error);
      // 환경 설정이 없어도 기본 기능은 제공
    }
  }

  /**
   * 🧠 실제 AI 쿼리 처리
   */
  public async processQuery(
    request: AIProcessingRequest
  ): Promise<AIProcessingResponse> {
    const startTime = Date.now();

    try {
      // 캐시 확인
      if (request.options?.useCache !== false) {
        const cached = await this.getCachedResponse(request.query);
        if (cached) {
          return {
            ...cached,
            processingTime: Date.now() - startTime,
            cached: true,
          };
        }
      }

      // 모델 선택
      const model = this.selectBestModel(request.options?.model);

      // AI 처리 수행
      let aiResponse: AIProcessingResponse;

      if (this.enabledModels.length > 0) {
        aiResponse = await this.processWithAI(request, model);
      } else {
        aiResponse = await this.processWithLocalAI(request);
      }

      // Python 분석 추가 (선택적)
      if (request.options?.usePython) {
        aiResponse.pythonAnalysis = await this.getPythonAnalysis(request);
      }

      aiResponse.processingTime = Date.now() - startTime;
      aiResponse.cached = false;

      // 캐시 저장
      if (request.options?.useCache !== false) {
        await this.setCachedResponse(request.query, aiResponse);
      }

      return aiResponse;
    } catch (error) {
      console.error('❌ AI 처리 실패:', error);
      return this.createFallbackResponse(
        request,
        Date.now() - startTime,
        error
      );
    }
  }

  /**
   * 🤖 실제 AI 모델로 처리
   */
  private async processWithAI(
    request: AIProcessingRequest,
    model: string
  ): Promise<AIProcessingResponse> {
    const systemPrompt = this.buildSystemPrompt(request.context);
    const userPrompt = this.buildUserPrompt(request.query, request.context);

    const jsonPrompt =
      `${systemPrompt}\n\n사용자 질문: ${userPrompt}\n\n` +
      '다음 형식의 JSON으로만 응답하세요: ' +
      '{"intent":"","confidence":0,"summary":"","details":[],"actions":[],"urgency":""}';

    try {
      const raw = await this.callModelAPI(
        model,
        jsonPrompt,
        request.options?.temperature || 0.7,
        request.options?.maxTokens || 1000
      );
      const object = AIResponseSchema.parse(JSON.parse(raw));
      return {
        success: true,
        intent: object.intent,
        confidence: object.confidence,
        summary: object.summary,
        details: object.details,
        actions: object.actions,
        urgency: object.urgency,
        processingTime: 0,
        model,
        cached: false,
      };
    } catch (error) {
      console.warn(`⚠️ ${model} 처리 실패, 텍스트 생성으로 대체:`, error);
      const text = await this.callModelAPI(
        model,
        `${systemPrompt}\n\n사용자 질문: ${userPrompt}\n\n한국어로 답변해주세요.`,
        request.options?.temperature || 0.7,
        request.options?.maxTokens || 800
      );
      return this.parseTextResponse(text, model);
    }
  }

  /**
   * 🛠️ 로컬 AI 처리 (API 키 없을 때)
   */
  private async processWithLocalAI(
    request: AIProcessingRequest
  ): Promise<AIProcessingResponse> {
    console.log('🛠️ 로컬 AI 처리 모드');

    // 키워드 기반 intent 분류
    const intent = this.classifyIntentLocal(request.query);

    // 컨텍스트 기반 분석
    const analysis = this.analyzeContextLocal(request.context, intent);

    return {
      success: true,
      intent: intent.type,
      confidence: intent.confidence,
      summary: analysis.summary,
      details: analysis.details,
      actions: analysis.actions,
      urgency: analysis.urgency,
      processingTime: 0,
      model: 'local-analyzer',
      cached: false,
    };
  }

  /**
   * 🐍 Python 서버 분석
   */
  private async getPythonAnalysis(request: AIProcessingRequest): Promise<any> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          metrics: request.context?.serverMetrics || [],
          logs: request.context?.logEntries || [],
        }),
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`Python 서버 응답 오류: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Python 분석 실패:', error);
      return {
        status: 'unavailable',
        message: 'Python 분석 서버가 응답하지 않습니다',
      };
    }
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private selectBestModel(preferred?: string): string {
    if (preferred && this.enabledModels.includes(preferred)) {
      return preferred;
    }

    // 기본 우선순위: GPT-3.5 > Claude > Gemini
    const priority = ['gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash'];

    for (const model of priority) {
      if (this.enabledModels.includes(model)) {
        return model;
      }
    }

    return 'local-analyzer';
  }

  private async callModelAPI(
    model: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const controller = new AbortController();
    const options = { signal: controller.signal } as RequestInit;
    setTimeout(() => controller.abort(), 20000);

    let url = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any = {};

    if (model === 'gpt-3.5-turbo') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
      body = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      };
    } else if (model === 'claude-3-haiku') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = process.env.ANTHROPIC_API_KEY || '';
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: 'claude-3-haiku-20250630',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      };
    } else if (model === 'gemini-1.5-flash') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;
      body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      };
    } else {
      throw new Error(`지원하지 않는 모델: ${model}`);
    }

    options.method = 'POST';
    options.headers = headers;
    options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`${model} API error: ${res.status}`);
    }
    const data = await res.json();

    if (model === 'gpt-3.5-turbo') {
      return data.choices[0].message.content as string;
    }
    if (model === 'claude-3-haiku') {
      return data.content[0].text as string;
    }
    // gemini
    return (data.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text)
      .join('');
  }

  private buildSystemPrompt(context?: any): string {
    return `당신은 서버 모니터링 시스템의 AI 분석가입니다.

주요 역할:
1. 서버 상태 분석 및 진단
2. 성능 이슈 식별 및 해결방안 제시
3. 시스템 최적화 권장사항 제공
4. 장애 예측 및 예방책 제안

응답 규칙:
- 한국어로 명확하고 구체적으로 답변
- 기술적 정확성 확보
- 실행 가능한 해결책 제시
- 우선순위별 정리

컨텍스트 정보:
${context ? JSON.stringify(context, null, 2) : '추가 컨텍스트 없음'}`;
  }

  private buildUserPrompt(query: string, context?: any): string {
    let prompt = query;

    if (context?.serverMetrics?.length > 0) {
      prompt += `\n\n서버 메트릭 정보:\n${JSON.stringify(context.serverMetrics.slice(-3), null, 2)}`;
    }

    if (context?.logEntries?.length > 0) {
      prompt += `\n\n최근 로그 정보:\n${JSON.stringify(context.logEntries.slice(-5), null, 2)}`;
    }

    return prompt;
  }

  private classifyIntentLocal(query: string): {
    type: string;
    confidence: number;
  } {
    const lowercaseQuery = query.toLowerCase();

    // 상태 확인
    if (
      lowercaseQuery.includes('상태') ||
      lowercaseQuery.includes('status') ||
      lowercaseQuery.includes('어때') ||
      lowercaseQuery.includes('괜찮')
    ) {
      return { type: 'status_check', confidence: 0.9 };
    }

    // 문제 해결
    if (
      lowercaseQuery.includes('문제') ||
      lowercaseQuery.includes('오류') ||
      lowercaseQuery.includes('error') ||
      lowercaseQuery.includes('장애')
    ) {
      return { type: 'troubleshooting', confidence: 0.95 };
    }

    // 분석 요청
    if (
      lowercaseQuery.includes('분석') ||
      lowercaseQuery.includes('analyze') ||
      lowercaseQuery.includes('보여줘') ||
      lowercaseQuery.includes('알려줘')
    ) {
      return { type: 'analysis', confidence: 0.85 };
    }

    // 예측
    if (
      lowercaseQuery.includes('예측') ||
      lowercaseQuery.includes('predict') ||
      lowercaseQuery.includes('앞으로') ||
      lowercaseQuery.includes('향후')
    ) {
      return { type: 'prediction', confidence: 0.8 };
    }

    return { type: 'recommendation', confidence: 0.6 };
  }

  private analyzeContextLocal(context?: any, intent?: any): any {
    const analysis = {
      summary: '시스템 분석을 완료했습니다.',
      details: [] as string[],
      actions: [] as string[],
      urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    };

    // 메트릭 분석
    if (context?.serverMetrics?.length > 0) {
      const latest = context.serverMetrics[context.serverMetrics.length - 1];

      if (latest.cpu > 80) {
        analysis.details.push(`CPU 사용률이 높습니다: ${latest.cpu}%`);
        analysis.actions.push('CPU 사용률이 높은 프로세스를 확인하세요');
        analysis.urgency = 'high';
      }

      if (latest.memory > 85) {
        analysis.details.push(`메모리 사용률이 높습니다: ${latest.memory}%`);
        analysis.actions.push('메모리 누수 가능성을 점검하세요');
        analysis.urgency = 'high';
      }

      if (latest.disk > 90) {
        analysis.details.push(`디스크 사용률이 위험합니다: ${latest.disk}%`);
        analysis.actions.push('디스크 정리를 즉시 수행하세요');
        analysis.urgency = 'critical';
      }
    }

    // 로그 분석
    if (context?.logEntries?.length > 0) {
      const errorLogs = context.logEntries.filter(
        (log: any) => log.level === 'ERROR'
      );
      if (errorLogs.length > 0) {
        analysis.details.push(
          `${errorLogs.length}개의 에러 로그가 발견되었습니다`
        );
        analysis.actions.push('에러 로그를 자세히 확인하세요');
      }
    }

    if (analysis.details.length === 0) {
      analysis.details.push('시스템이 정상적으로 작동 중입니다');
      analysis.actions.push('정기적인 모니터링을 계속하세요');
      analysis.urgency = 'low';
    }

    return analysis;
  }

  private parseTextResponse(text: string, model: string): AIProcessingResponse {
    // 텍스트에서 의도와 내용 추출 (간단한 파싱)
    const lines = text.split('\n').filter(line => line.trim());

    return {
      success: true,
      intent: 'analysis',
      confidence: 0.7,
      summary: lines[0] || text.substring(0, 100),
      details: lines.slice(1, 4),
      actions: lines.slice(-2) || ['추가 모니터링 권장'],
      urgency: 'medium',
      processingTime: 0,
      model,
      cached: false,
    };
  }

  private createFallbackResponse(
    request: AIProcessingRequest,
    processingTime: number,
    error: any
  ): AIProcessingResponse {
    return {
      success: false,
      intent: 'error',
      confidence: 0,
      summary: `처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      details: ['시스템이 일시적으로 응답하지 않습니다'],
      actions: ['잠시 후 다시 시도해보세요', '시스템 관리자에게 문의하세요'],
      urgency: 'medium',
      processingTime,
      model: 'fallback',
      cached: false,
    };
  }

  private async getCachedResponse(
    query: string
  ): Promise<AIProcessingResponse | null> {
    try {
      if (!this.redis) return null;

      const cacheKey = `ai:response:${Buffer.from(query).toString('base64').substring(0, 50)}`;
      const cached = await this.redis.get(cacheKey);

      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('⚠️ 캐시 조회 실패:', error);
      return null;
    }
  }

  private async setCachedResponse(
    query: string,
    response: AIProcessingResponse
  ): Promise<void> {
    try {
      if (!this.redis) return;

      const cacheKey = `ai:response:${Buffer.from(query).toString('base64').substring(0, 50)}`;
      await this.redis.setex(cacheKey, 300, JSON.stringify(response)); // 5분 캐시
    } catch (error) {
      console.warn('⚠️ 캐시 저장 실패:', error);
    }
  }

  /**
   * 📊 시스템 상태 분석
   */
  public async analyzeSystemMetrics(metrics: any[]): Promise<any> {
    if (metrics.length === 0) return { status: 'no_data' };

    const request: AIProcessingRequest = {
      query: '시스템 메트릭을 분석해주세요',
      context: { serverMetrics: metrics },
      options: { model: 'gpt-3.5-turbo', useCache: true },
    };

    return await this.processQuery(request);
  }

  /**
   * 🔍 로그 분석
   */
  public async analyzeLogs(logs: any[]): Promise<any> {
    if (logs.length === 0) return { status: 'no_data' };

    const request: AIProcessingRequest = {
      query: '로그 엔트리를 분석해서 문제점을 찾아주세요',
      context: { logEntries: logs },
      options: { model: 'claude-3-haiku', useCache: true },
    };

    return await this.processQuery(request);
  }

  /**
   * 🎯 스마트 권장사항
   */
  public async generateRecommendations(context: any): Promise<string[]> {
    const request: AIProcessingRequest = {
      query: '현재 시스템 상태를 기반으로 개선 권장사항을 제시해주세요',
      context,
      options: { model: 'gemini-1.5-flash', useCache: false },
    };

    const response = await this.processQuery(request);
    return response.actions;
  }

  /**
   * 📈 성능 점수 계산
   */
  public calculatePerformanceScore(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const latest = metrics[metrics.length - 1];
    const cpuScore = Math.max(0, (100 - latest.cpu) / 100);
    const memoryScore = Math.max(0, (100 - latest.memory) / 100);
    const diskScore = Math.max(0, (100 - latest.disk) / 100);

    return Math.round(((cpuScore + memoryScore + diskScore) / 3) * 100);
  }

  /**
   * 🏥 헬스체크
   */
  public async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      enabledModels: this.enabledModels,
      redisConnected: !!this.redis,
      pythonServiceUrl: this.pythonServiceUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

// 싱글톤 인스턴스
export const realAIProcessor = RealAIProcessor.getInstance();
