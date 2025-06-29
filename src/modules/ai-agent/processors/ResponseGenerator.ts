/**
 * 💬 AI 에이전트 프로세서용 응답 생성기 (래퍼)
 *
 * 통합 응답 생성 시스템의 래퍼 클래스
 * 기존 API 호환성 유지하면서 UnifiedResponseGenerator 사용
 */

import { Intent } from './IntentClassifier';
import {
  unifiedResponseGenerator,
  UnifiedResponseRequest,
} from '../../../services/ai/response/UnifiedResponseGenerator';

export interface ResponseRequest {
  query: string;
  intent: Intent;
  context: any;
  serverData?: any;
  mcpResponse?: any;
}

export interface ResponseResult {
  text: string;
  confidence: number;
  metadata: Record<string, any>;
  format?: string;
  template?: string;
  tone?: string;
  audience?: string;
}

export class ResponseGenerator {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 통합 응답 생성기 초기화
    await unifiedResponseGenerator.initialize();

    this.isInitialized = true;
    console.log(
      '💬 [ResponseGenerator] AI 에이전트 프로세서용 응답 생성기가 초기화되었습니다 (통합 시스템 사용)'
    );
  }

  /**
   * 메인 응답 생성 메서드 (통합 시스템 사용)
   */
  async generate(request: ResponseRequest): Promise<ResponseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 통합 응답 생성기로 요청 변환
    const unifiedRequest: UnifiedResponseRequest = {
      query: request.query,
      context: request.context,
      intent: request.intent,
      serverData: request.serverData,
      mcpResponse: request.mcpResponse,
      language: 'ko',
      responseType: 'intent',
    };

    // 통합 응답 생성기로 응답 생성
    const unifiedResult =
      await unifiedResponseGenerator.generateResponse(unifiedRequest);

    // 기존 인터페이스로 변환하여 반환
    return {
      text: unifiedResult.text,
      confidence: unifiedResult.confidence,
      metadata: {
        intentName: request.intent.name,
        entitiesFound: Object.keys(request.intent.entities).length,
        hasServerData: unifiedResult.metadata.hasServerData,
        hasMCPResponse: unifiedResult.metadata.hasMCPResponse,
        generatorUsed: unifiedResult.metadata.generatorUsed,
        processingTime: unifiedResult.metadata.processingTime,
        reasoning: unifiedResult.metadata.reasoning,
      },
      format: unifiedResult.format,
      template: unifiedResult.template,
      tone: unifiedResult.tone,
      audience: unifiedResult.audience,
    };
  }

  /**
   * 📊 통계 조회 (통합 시스템 위임)
   */
  public getStats() {
    return {
      isInitialized: this.isInitialized,
      unifiedGeneratorStats: unifiedResponseGenerator.getStats(),
      wrapperType: 'IntentBasedResponseGenerator',
    };
  }
}
