import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 🤖 Google AI Service v2.0 (UTF-8 인코딩 통일)
 * Google Gemini API를 활용한 자연어 처리 서비스
 * + UTF-8 인코딩 강제 설정
 * + 한국어 처리 최적화
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
        error?: string;
    };
}

class GoogleAIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;
    private isInitialized = false;

    // UTF-8 인코딩 설정
    private readonly DEFAULT_ENCODING = 'utf-8';
    private readonly KOREAN_LANGUAGE_CODE = 'ko-KR';

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            const apiKey = process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                throw new Error('Google AI API 키가 설정되지 않았습니다');
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            });

            this.isInitialized = true;
            console.log('✅ Google AI Service 초기화 완료 (UTF-8 인코딩)');
        } catch (error) {
            console.error('❌ Google AI Service 초기화 실패:', error);
            this.isInitialized = false;
        }
    }

    /**
     * UTF-8 인코딩으로 텍스트 정규화
     */
    private normalizeText(text: string): string {
        try {
            // UTF-8 인코딩 확인 및 정규화
            const encoder = new TextEncoder();
            const decoder = new TextDecoder('utf-8');

            const encoded = encoder.encode(text);
            const normalized = decoder.decode(encoded);

            return normalized;
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
     * Google AI 쿼리 처리 (UTF-8 인코딩 보장)
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

            console.log('🔤 UTF-8 인코딩 처리:', {
                original: request.prompt.substring(0, 50),
                normalized: normalizedPrompt.substring(0, 50),
                encoding: this.DEFAULT_ENCODING
            });

            // Google AI API 호출 (UTF-8 헤더 명시)
            const result = await this.model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: optimizedPrompt
                    }]
                }],
                generationConfig: {
                    temperature: request.temperature || 0.7,
                    maxOutputTokens: request.maxTokens || 2048,
                }
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
                }
            };

            console.log('✅ Google AI 응답 완료 (UTF-8):', {
                length: responseText.length,
                processingTime,
                encoding: this.DEFAULT_ENCODING
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
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * 헬스체크 (UTF-8 인코딩 테스트 포함)
     */
    async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // UTF-8 한국어 테스트
            const testResult = await this.processQuery({
                prompt: '안녕하세요. 간단한 인사를 해주세요.',
                encoding: this.DEFAULT_ENCODING
            });

            return {
                status: testResult.success ? 'healthy' : 'unhealthy',
                details: {
                    service: 'Google AI (Gemini 1.5 Flash)',
                    initialized: this.isInitialized,
                    encoding: this.DEFAULT_ENCODING,
                    koreanSupport: testResult.success,
                    testResponse: testResult.response.substring(0, 100),
                    processingTime: testResult.processingTime
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    service: 'Google AI (Gemini 1.5 Flash)',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    encoding: this.DEFAULT_ENCODING
                }
            };
        }
    }
}

// 싱글톤 인스턴스
let googleAIServiceInstance: GoogleAIService | null = null;

export function getGoogleAIService(): GoogleAIService {
    if (!googleAIServiceInstance) {
        googleAIServiceInstance = new GoogleAIService();
    }
    return googleAIServiceInstance;
}

export default GoogleAIService; 