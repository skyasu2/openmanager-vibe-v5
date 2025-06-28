/**
 * 🎨 AI Response Formatter
 *
 * ✅ AI 응답 포맷팅 전담 모듈
 * ✅ 단일 책임: 응답 생성/포맷팅만 담당
 * ✅ SOLID 원칙 적용
 */

import { AIMode, AIRequest, AIResponse } from '@/types/ai-types';

export class AIResponseFormatter {
  private static instance: AIResponseFormatter | null = null;

  private constructor() {}

  public static getInstance(): AIResponseFormatter {
    if (!this.instance) {
      this.instance = new AIResponseFormatter();
    }
    return this.instance;
  }

  /**
   * 🚀 폴백 응답 생성 (즉시)
   */
  public generateFallbackResponse(request: AIRequest): string {
    const isKorean = this.isKoreanQuery(request.query);

    if (isKorean) {
      return `안녕하세요! 베르셀 환경에서 최적화된 응답을 제공합니다.

🚀 **베르셀 고속 모드**
- 타임아웃 방지를 위한 경량화된 처리
- 기본적인 시스템 정보 제공
- 빠른 응답 시간 보장

요청하신 내용에 대한 자세한 분석이 필요하시면, 로컬 환경에서 더 상세한 정보를 확인하실 수 있습니다.`;
    }

    return `Hello! This is an optimized response for Vercel environment.

🚀 **Vercel Fast Mode**
- Lightweight processing to prevent timeouts
- Basic system information provided
- Fast response time guaranteed

For detailed analysis, please check in local environment.`;
  }

  /**
   * 🚀 오류 응답 생성
   */
  public generateErrorResponse(request: AIRequest, error: Error): string {
    const isKorean = this.isKoreanQuery(request.query);

    if (isKorean) {
      return `죄송합니다. 베르셀 환경에서 처리 중 문제가 발생했습니다.

❌ **오류 정보**
- 오류 유형: ${error.message}
- 환경: 베르셀 서버리스
- 권장사항: 로컬 환경에서 재시도

🔧 **해결 방법**
1. 쿼리를 단순화해서 다시 시도
2. 로컬 환경에서 상세 분석 요청
3. 영어로 질문 시도`;
    }

    return `Sorry, an error occurred while processing in Vercel environment.

❌ **Error Information**
- Error type: ${error.message}
- Environment: Vercel Serverless
- Recommendation: Retry in local environment

🔧 **Solutions**
1. Simplify query and retry
2. Request detailed analysis in local environment
3. Try asking in English`;
  }

  /**
   * 🚀 성공 응답 포맷팅
   */
  public formatSuccessResponse(
    response: string,
    enginePath: string[],
    supportEngines: string[],
    startTime: number,
    mode: AIMode = 'LOCAL',
    confidence: number = 0.85,
    fallbacksUsed: number = 0
  ): AIResponse {
    return {
      success: true,
      response,
      confidence,
      mode,
      enginePath,
      processingTime: Date.now() - startTime,
      fallbacksUsed,
      metadata: {
        mainEngine: enginePath[0] || 'local-fast',
        supportEngines,
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: supportEngines,
        cacheUsed: false,
      },
    };
  }

  /**
   * 🚀 오류 응답 포맷팅
   */
  public formatErrorResponse(
    response: string,
    enginePath: string[],
    supportEngines: string[],
    startTime: number,
    mode: AIMode = 'LOCAL',
    confidence: number = 0.3,
    fallbacksUsed: number = 1
  ): AIResponse {
    return {
      success: false,
      response,
      confidence,
      mode,
      enginePath,
      processingTime: Date.now() - startTime,
      fallbacksUsed,
      metadata: {
        mainEngine: 'error-handler',
        supportEngines,
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: supportEngines,
      },
    };
  }

  /**
   * 🚀 응급 폴백 응답 생성 (다양한 모드 대응)
   */
  public createEmergencyFallback(
    request: AIRequest,
    mode: AIMode,
    startTime: number,
    fallbacksUsed: number = 1
  ): AIResponse {
    const isKorean = this.isKoreanQuery(request.query);
    let response: string;

    switch (mode) {
      case 'LOCAL':
        response = isKorean
          ? `🏠 LOCAL 모드 응급 응답: 현재 Supabase RAG와 로컬 AI가 일시적으로 사용할 수 없습니다. 기본 응답을 제공합니다.`
          : `🏠 LOCAL mode emergency response: Supabase RAG and local AI are temporarily unavailable. Providing basic response.`;
        break;

      case 'GOOGLE_AI':
        response = isKorean
          ? `🤖 GOOGLE_AI 모드 응급 응답: Google AI 서비스가 일시적으로 사용할 수 없습니다. 기본 응답을 제공합니다.`
          : `🤖 GOOGLE_AI mode emergency response: Google AI service is temporarily unavailable. Providing basic response.`;
        break;

      case 'AUTO':
        response = isKorean
          ? `🔄 AUTO 모드 응급 응답: 자동 모드 선택 중 문제가 발생했습니다. 기본 응답을 제공합니다.`
          : `🔄 AUTO mode emergency response: Problem occurred during automatic mode selection. Providing basic response.`;
        break;

      default:
        response = isKorean
          ? `⚠️ 응급 응답: 모든 AI 엔진이 일시적으로 사용할 수 없습니다. 나중에 다시 시도해주세요.`
          : `⚠️ Emergency response: All AI engines are temporarily unavailable. Please try again later.`;
        break;
    }

    return this.formatErrorResponse(
      response,
      ['emergency-fallback'],
      [],
      startTime,
      mode,
      0.2,
      fallbacksUsed
    );
  }

  /**
   * 🚀 LOCAL 모드 전용 응급 폴백
   */
  public createLocalModeEmergencyFallback(
    request: AIRequest,
    startTime: number,
    fallbacksUsed: number
  ): AIResponse {
    const isKorean = this.isKoreanQuery(request.query);

    const response = isKorean
      ? `🏠 LOCAL 모드 응급 응답

❌ **사용 불가 서비스들**
- Supabase RAG 엔진
- Korean AI 엔진  
- Transformers 엔진
- MCP 컨텍스트 수집

🔧 **권장사항**
1. 잠시 후 다시 시도
2. 쿼리를 단순화
3. 로컬 환경 상태 확인

💡 **기본 정보**: OpenManager는 서버 모니터링 및 AI 분석 도구입니다.`
      : `🏠 LOCAL Mode Emergency Response

❌ **Unavailable Services**
- Supabase RAG Engine
- Korean AI Engine
- Transformers Engine
- MCP Context Collection

🔧 **Recommendations**
1. Try again later
2. Simplify your query
3. Check local environment status

💡 **Basic Info**: OpenManager is a server monitoring and AI analysis tool.`;

    return this.formatErrorResponse(
      response,
      ['local-emergency-fallback'],
      [],
      startTime,
      'LOCAL',
      0.25,
      fallbacksUsed
    );
  }

  /**
   * 🚀 Google AI 모드 전용 응급 폴백
   */
  public createGoogleOnlyModeEmergencyFallback(
    request: AIRequest,
    startTime: number,
    fallbacksUsed: number
  ): AIResponse {
    const isKorean = this.isKoreanQuery(request.query);

    const response = isKorean
      ? `🤖 GOOGLE_AI 모드 응급 응답

❌ **Google AI 서비스 일시 중단**
- Google AI API 연결 실패
- 네트워크 또는 인증 문제 가능성

🔧 **해결 방안**
1. LOCAL 모드로 전환 시도
2. API 키 및 네트워크 상태 확인
3. 잠시 후 재시도

💡 **대안**: LOCAL 모드에서 Supabase RAG 사용 가능`
      : `🤖 GOOGLE_AI Mode Emergency Response

❌ **Google AI Service Temporarily Down**
- Google AI API connection failed
- Possible network or authentication issue

🔧 **Solutions**
1. Try switching to LOCAL mode
2. Check API key and network status
3. Retry later

💡 **Alternative**: Supabase RAG available in LOCAL mode`;

    return this.formatErrorResponse(
      response,
      ['google-emergency-fallback'],
      [],
      startTime,
      'GOOGLE_AI',
      0.25,
      fallbacksUsed
    );
  }

  /**
   * 🔍 한국어 쿼리 감지
   */
  private isKoreanQuery(query: string): boolean {
    return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query);
  }

  /**
   * 🎨 응답 텍스트 정규화
   */
  public normalizeResponseText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 정리
      .replace(/\s{2,}/g, ' ') // 과도한 공백 정리
      .trim();
  }

  /**
   * 🎨 메타데이터 강화
   */
  public enhanceMetadata(
    baseMetadata: any,
    options: {
      ragUsed?: boolean;
      googleAIUsed?: boolean;
      mcpContextUsed?: boolean;
      cacheUsed?: boolean;
      additionalEngines?: string[];
    } = {}
  ) {
    return {
      ...baseMetadata,
      ragUsed: options.ragUsed || baseMetadata.ragUsed || false,
      googleAIUsed: options.googleAIUsed || baseMetadata.googleAIUsed || false,
      mcpContextUsed:
        options.mcpContextUsed || baseMetadata.mcpContextUsed || false,
      cacheUsed: options.cacheUsed || baseMetadata.cacheUsed || false,
      subEnginesUsed: [
        ...(baseMetadata.subEnginesUsed || []),
        ...(options.additionalEngines || []),
      ].filter((engine, index, array) => array.indexOf(engine) === index), // 중복 제거
      timestamp: new Date().toISOString(),
      version: '5.44.3',
    };
  }
}

export const aiResponseFormatter = AIResponseFormatter.getInstance();
