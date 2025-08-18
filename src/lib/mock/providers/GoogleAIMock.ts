/**
 * 🤖 Google AI Mock Provider
 *
 * Google Generative AI의 간소화된 Mock 구현
 */

import { MockBase } from '../core/MockBase';
import scenarios from '../data/scenarios.json';

export class GoogleAIMock extends MockBase {
  private currentModel: string = 'gemini-pro';

  constructor() {
    super('GoogleAI', {
      responseDelay: 100,
      enableStats: true,
    });
  }

  /**
   * 모델 설정
   */
  setModel(model: string): void {
    this.currentModel = model;
    this.logger.info(`모델 변경: ${model}`);
  }

  /**
   * 콘텐츠 생성
   */
  async generateContent(prompt: string): Promise<{
    text: string;
    model: string;
    tokensUsed: number;
  }> {
    return this.execute('generateContent', async () => {
      const response = this.findBestResponse(prompt);
      const tokensUsed = this.estimateTokens(prompt + response);

      return {
        text: response,
        model: this.currentModel,
        tokensUsed,
      };
    });
  }

  /**
   * 스트림 생성
   */
  async *generateContentStream(prompt: string): AsyncGenerator<string> {
    await this.simulateDelay();

    const response = this.findBestResponse(prompt);
    const words = response.split(' ');

    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  /**
   * 최적 응답 찾기
   */
  private findBestResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // 시나리오에서 매칭되는 응답 찾기
    for (const [key, scenario] of Object.entries(scenarios.googleAI)) {
      const hasKeyword = scenario.keywords.some((keyword) =>
        lowerPrompt.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        const randomIndex = Math.floor(
          Math.random() * scenario.responses.length
        );
        return scenario.responses[randomIndex];
      }
    }

    // 기본 응답
    return this.generateDefaultResponse(prompt);
  }

  /**
   * 기본 응답 생성
   */
  private generateDefaultResponse(prompt: string): string {
    if (prompt.includes('분석')) {
      return '요청하신 내용을 분석한 결과, 현재 시스템은 안정적으로 운영되고 있습니다.';
    }
    if (prompt.includes('추천') || prompt.includes('제안')) {
      return '현재 상황을 고려할 때, 시스템 모니터링을 강화하는 것을 권장합니다.';
    }
    return '요청을 처리했습니다. 추가 정보가 필요하시면 말씀해주세요.';
  }

  /**
   * 토큰 추정
   */
  private estimateTokens(text: string): number {
    // 간단한 토큰 추정 (실제로는 더 복잡함)
    return Math.ceil(text.length / 4);
  }

  /**
   * Mock 리셋
   */
  reset(): void {
    this.currentModel = 'gemini-pro';
    this.stats.reset();
    this.logger.info('Google AI Mock 리셋됨');
  }
}
