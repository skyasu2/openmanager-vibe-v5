/**
 * Google AI (Gemini) API Handlers
 *
 * Google Generative Language API를 모킹합니다.
 *
 * @endpoint https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * @see https://ai.google.dev/api/rest/v1beta/models/generateContent
 */

import { HttpResponse, http } from 'msw';

const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com';

/**
 * Google AI API 핸들러
 */
export const googleAIHandlers = [
  /**
   * generateContent - 텍스트 생성 API
   *
   * @example POST /v1beta/models/gemini-2.5-flash:generateContent?key=API_KEY
   */
  http.post(
    `${GOOGLE_AI_BASE_URL}/v1beta/models/:model\\:generateContent`,
    async ({ request, params }) => {
      const { model } = params;
      const body = (await request.json()) as {
        contents: Array<{
          parts: Array<{ text: string }>;
        }>;
        generationConfig?: {
          temperature?: number;
          topK?: number;
          topP?: number;
          maxOutputTokens?: number;
        };
      };

      // 요청 메시지 추출
      const userMessage = body.contents[0]?.parts[0]?.text || '';

      // Mock 응답 생성
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `[Google AI Mock Response] 질문: "${userMessage}"\n\n모킹된 응답입니다. 실제 Google AI API 호출이 아닙니다.`,
                },
              ],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
            safetyRatings: [
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                probability: 'NEGLIGIBLE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                probability: 'NEGLIGIBLE',
              },
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                probability: 'NEGLIGIBLE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                probability: 'NEGLIGIBLE',
              },
            ],
          },
        ],
        usageMetadata: {
          promptTokenCount: userMessage.length / 4, // 대략적인 토큰 수
          candidatesTokenCount: 50,
          totalTokenCount: userMessage.length / 4 + 50,
        },
      };

      console.log(
        `[MSW] Google AI API Mocked: model=${String(model)}, message="${userMessage.substring(0, 50)}..."`
      );

      return HttpResponse.json(mockResponse, { status: 200 });
    }
  ),

  /**
   * countTokens - 토큰 카운트 API
   *
   * @example POST /v1beta/models/{model}:countTokens
   */
  http.post(
    `${GOOGLE_AI_BASE_URL}/v1beta/models/:model\\:countTokens`,
    async ({ params }) => {
      const { model } = params;

      console.log(`[MSW] Google AI Token Count Mocked: model=${String(model)}`);

      return HttpResponse.json(
        {
          totalTokens: 100,
        },
        { status: 200 }
      );
    }
  ),
];
