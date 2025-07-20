/**
 * OpenSource AI 엔진들 (8% 가중치)
 * 하위 AI 엔진들 통합 관리
 */

import { OpenSourceEngines } from '../../../services/ai/engines/OpenSourceEngines';

export interface OpenSourceRequest {
  query: string;
  category?: string;
  context?: any;
}

export interface OpenSourceResponse {
  success: boolean;
  response?: string;
  data?: any;
  confidence: number;
  error?: string;
}

export class OpenSourceAIEngines {
  private openSourceEngines: OpenSourceEngines;
  private initialized = false;

  constructor() {
    this.openSourceEngines = new OpenSourceEngines();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // OpenSource 엔진들은 별도 초기화 없이 사용 가능
      this.initialized = true;
      console.log('✅ OpenSource AI 엔진들 초기화 완료');
    } catch (error) {
      console.error('❌ OpenSource AI 엔진들 초기화 실패:', error);
      this.initialized = true; // 실패해도 계속 진행
    }
  }

  public async processQuery(
    request: OpenSourceRequest
  ): Promise<OpenSourceResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 기본적인 패턴 매칭 및 응답 생성
      const response = await this.generateBasicResponse(request.query);

      return {
        success: true,
        response,
        data: { query: request.query, engine: 'opensource' },
        confidence: 0.6, // 오픈소스는 낮은 신뢰도
      };
    } catch (error) {
      console.error('OpenSource AI 엔진들 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '오픈소스 엔진 오류',
        confidence: 0,
      };
    }
  }

  private async generateBasicResponse(query: string): Promise<string> {
    // 기본적인 키워드 기반 응답 생성
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('서버') || lowerQuery.includes('server')) {
      return '서버 상태를 확인하고 있습니다. 모니터링 데이터를 분석 중입니다.';
    }

    if (lowerQuery.includes('오류') || lowerQuery.includes('error')) {
      return '오류 로그를 분석하고 해결 방안을 제시하겠습니다.';
    }

    if (lowerQuery.includes('성능') || lowerQuery.includes('performance')) {
      return '성능 메트릭을 분석하여 최적화 방안을 제안하겠습니다.';
    }

    return `"${query}"에 대한 정보를 분석하고 있습니다. 추가 컨텍스트가 필요할 수 있습니다.`;
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
