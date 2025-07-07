import { getGoogleAIKey } from '@/utils/google-ai-key-resolver';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 🤖 Google AI Service v3.0 (통합 키 해결사)
 * Google Gemini API를 활용한 자연어 처리 서비스
 * + 통합 키 관리 시스템
 * + UTF-8 인코딩 강제 설정
 * + 한국어 처리 최적화
 * + 서버 사이드 렌더링 호환
 */

interface GoogleAIRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  encoding?: string; // UTF-8 강제 설정
}

interface GoogleAIResponse {
  success: boolean;
  response: string;
  confidence: number;
  processingTime: number;
  encoding: string;
  metadata: {
    model: string;
    tokensUsed?: number;
    inputEncoding: string;
    outputEncoding: string;
    keySource?: string;
    error?: string;
  };
}

class GoogleAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;
  private keySource: string = 'unknown';

  // UTF-8 인코딩 설정
  private readonly DEFAULT_ENCODING = 'utf-8';
  private readonly KOREAN_LANGUAGE_CODE = 'ko-KR';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // 통합 키 해결사 사용
      const apiKey = getGoogleAIKey();
      if (!apiKey) {
        throw new Error(
          'Google AI API 키를 찾을 수 없습니다. 환경변수를 확인해주세요.'
        );
      }

      // 키 소스 확인
      if (process.env.GOOGLE_AI_API_KEY) {
        this.keySource = 'env_plain';
      } else if (process.env.NODE_ENV === 'development') {
        this.keySource = 'development';
      } else {
        this.keySource = 'team_config';
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      this.isInitialized = true;
      console.log(
        `✅ Google AI Service 초기화 완료 (키 소스: ${this.keySource})`
      );
    } catch (error) {
      console.error('❌ Google AI Service 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * UTF-8 인코딩으로 텍스트 정규화 (SSR 호환)
   */
  private normalizeText(text: string): string {
    try {
      // 브라우저 환경에서만 TextEncoder/TextDecoder 사용
      if (
        typeof window !== 'undefined' &&
        window.TextEncoder &&
        window.TextDecoder
      ) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8');
        const encoded = encoder.encode(text);
        const normalized = decoder.decode(encoded);
        return normalized;
      }

      // Node.js 환경에서는 Buffer 사용
      if (typeof Buffer !== 'undefined') {
        const buffer = Buffer.from(text, 'utf8');
        return buffer.toString('utf8');
      }

      // 기본적으로 원본 텍스트 반환
      return text;
    } catch (error) {
      console.warn('텍스트 정규화 실패, 원본 사용:', error);
      return text;
    }
  }

  /**
   * 한국어 프롬프트 최적화
   */
  private optimizeKoreanPrompt(prompt: string): string {
    const normalizedPrompt = this.normalizeText(prompt);

    // 한국어 컨텍스트 명시적 추가
    const optimizedPrompt = `다음은 한국어로 작성된 질문입니다. 한국어로 정확하게 답변해주세요.

질문: ${normalizedPrompt}

답변 요구사항:
- 반드시 한국어로 답변
- 명확하고 구체적인 설명
- 기술적 내용은 한국어 용어 사용`;

    return optimizedPrompt;
  }

  /**
   * Google AI 쿼리 처리 (통합 키 관리)
   */
  async processQuery(request: GoogleAIRequest): Promise<GoogleAIResponse> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized || !this.model) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Google AI 서비스가 초기화되지 않았습니다');
        }
      }

      // UTF-8 인코딩 정규화
      const normalizedPrompt = this.normalizeText(request.prompt);
      const optimizedPrompt = this.optimizeKoreanPrompt(normalizedPrompt);

      console.log(`🔤 UTF-8 인코딩 처리 (키 소스: ${this.keySource}):`, {
        original: request.prompt.substring(0, 50),
        normalized: normalizedPrompt.substring(0, 50),
        encoding: this.DEFAULT_ENCODING,
      });

      // Google AI API 호출
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: optimizedPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048,
        },
      });

      const response = await result.response;
      let responseText = response.text();

      // 응답 텍스트 UTF-8 정규화
      responseText = this.normalizeText(responseText);

      const processingTime = Date.now() - startTime;

      const aiResponse: GoogleAIResponse = {
        success: true,
        response: responseText,
        confidence: 0.95,
        processingTime,
        encoding: this.DEFAULT_ENCODING,
        metadata: {
          model: 'gemini-1.5-flash',
          tokensUsed: response.candidates?.[0]?.tokenCount,
          inputEncoding: this.DEFAULT_ENCODING,
          outputEncoding: this.DEFAULT_ENCODING,
          keySource: this.keySource,
        },
      };

      console.log(`✅ Google AI 응답 완료 (키 소스: ${this.keySource}):`, {
        length: responseText.length,
        processingTime,
        encoding: this.DEFAULT_ENCODING,
      });

      return aiResponse;
    } catch (error) {
      console.error('❌ Google AI 처리 실패:', error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        response: `Google AI 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        processingTime,
        encoding: this.DEFAULT_ENCODING,
        metadata: {
          model: 'gemini-1.5-flash',
          inputEncoding: this.DEFAULT_ENCODING,
          outputEncoding: this.DEFAULT_ENCODING,
          keySource: this.keySource,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * 헬스체크 (통합 키 관리)
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const testPrompt = '안녕하세요. 테스트 메시지입니다.';
      const result = await this.processQuery({
        prompt: testPrompt,
        maxTokens: 50,
        temperature: 0.1,
      });

      return {
        status: result.success ? 'healthy' : 'unhealthy',
        details: {
          initialized: this.isInitialized,
          encoding: this.DEFAULT_ENCODING,
          keySource: this.keySource,
          testResponse: result.response.substring(0, 100),
          processingTime: result.processingTime,
          serverSideRendering: typeof window === 'undefined',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          initialized: this.isInitialized,
          encoding: this.DEFAULT_ENCODING,
          keySource: this.keySource,
          error: error instanceof Error ? error.message : 'Unknown error',
          serverSideRendering: typeof window === 'undefined',
        },
      };
    }
  }
}

// 싱글톤 인스턴스 생성
let googleAIServiceInstance: GoogleAIService | null = null;

export function getGoogleAIService(): GoogleAIService {
  if (!googleAIServiceInstance) {
    googleAIServiceInstance = new GoogleAIService();
  }
  return googleAIServiceInstance;
}

export default GoogleAIService;
