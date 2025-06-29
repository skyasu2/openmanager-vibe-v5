/**
 * 🚀 Cursor-Vercel API 테스터
 * Cursor에서 Vercel 프로덕션 환경에 직접 접속하여 API 테스트하는 유틸리티
 *
 * 사용 예시:
 * ```ts
 * import { CursorVercelAPITester } from '@/utils/cursor-vercel-api-tester';
 *
 * const tester = new CursorVercelAPITester();
 * const result = await tester.testAPI('/api/ai/engines');
 * ```
 *
 * @author AI Assistant
 * @date 2025-01-28 04:42 KST
 */

interface APITestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
  endpoint: string;
  timestamp: string;
}

interface VercelAPIConfig {
  baseUrl: string;
  authToken?: string;
  timeout: number;
  retries: number;
  bypassAuth?: boolean;
}

export class CursorVercelAPITester {
  private config: VercelAPIConfig;

  constructor(customConfig?: Partial<VercelAPIConfig>) {
    this.config = {
      baseUrl:
        'https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app',
      timeout: 30000,
      retries: 3,
      bypassAuth: true,
      ...customConfig,
    };
  }

  /**
   * 🔧 Vercel API 엔드포인트 테스트
   */
  async testAPI(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<APITestResult> {
    const startTime = Date.now();
    const fullUrl = `${this.config.baseUrl}${endpoint}`;

    console.log(`🚀 [Cursor-Vercel API 테스트] ${method} ${fullUrl}`);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cursor-API-Tester/1.0',
      };

      // 인증 토큰이 있으면 추가
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      // 개발 환경에서 인증 우회
      if (this.config.bypassAuth) {
        headers['X-Cursor-Dev-Mode'] = 'true';
        headers['X-Bypass-Auth'] = 'true';
      }

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => null);

      const result: APITestResult = {
        success: response.ok,
        status: response.status,
        data: responseData,
        responseTime,
        endpoint,
        timestamp: new Date().toISOString(),
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      console.log(
        `✅ [API 테스트 완료] ${response.status} (${responseTime}ms)`
      );
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
        endpoint,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🧪 주요 API 엔드포인트 일괄 테스트
   */
  async testAllAPIs(): Promise<APITestResult[]> {
    const endpoints = [
      '/api/ai/engines',
      '/api/ai/status',
      '/api/system/state',
      '/api/metrics',
      '/api/ai/unified-query',
      '/api/ai/insights',
    ];

    console.log('🧪 [일괄 API 테스트 시작]');

    const results: APITestResult[] = [];
    for (const endpoint of endpoints) {
      const result = await this.testAPI(endpoint);
      results.push(result);

      // API 부하 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 결과 요약
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const avgResponseTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount;

    console.log(
      `📊 [테스트 완료] 성공: ${successCount}/${totalCount}, 평균 응답시간: ${avgResponseTime.toFixed(0)}ms`
    );

    return results;
  }

  /**
   * 🔍 특정 API의 헬스체크
   */
  async healthCheck(): Promise<APITestResult> {
    return this.testAPI('/api/health-check');
  }

  /**
   * 🤖 AI 엔진 상태 확인
   */
  async checkAIStatus(): Promise<APITestResult> {
    return this.testAPI('/api/ai/status');
  }

  /**
   * 📊 시스템 메트릭 조회
   */
  async getMetrics(): Promise<APITestResult> {
    return this.testAPI('/api/metrics');
  }

  /**
   * 💬 AI 자연어 질의 테스트
   */
  async testNaturalLanguageQuery(query: string): Promise<APITestResult> {
    return this.testAPI('/api/ai/unified-query', 'POST', {
      query,
      mode: 'AUTO',
      includeThinking: true,
    });
  }
}

/**
 * 🛠️ Cursor에서 바로 사용할 수 있는 헬퍼 함수들
 */
export const cursorVercelAPI = {
  /**
   * 빠른 API 테스트
   */
  quick: async (endpoint: string) => {
    const tester = new CursorVercelAPITester();
    return tester.testAPI(endpoint);
  },

  /**
   * 전체 시스템 헬스체크
   */
  healthCheck: async () => {
    const tester = new CursorVercelAPITester();
    return tester.healthCheck();
  },

  /**
   * AI 엔진 상태 확인
   */
  aiStatus: async () => {
    const tester = new CursorVercelAPITester();
    return tester.checkAIStatus();
  },

  /**
   * 자연어 질의 테스트
   */
  ask: async (question: string) => {
    const tester = new CursorVercelAPITester();
    return tester.testNaturalLanguageQuery(question);
  },

  /**
   * 메트릭 조회
   */
  metrics: async () => {
    const tester = new CursorVercelAPITester();
    return tester.getMetrics();
  },
};

/**
 * 🎯 사용 예시 및 테스트 템플릿
 */
export const CursorVercelTestExamples = {
  /**
   * 기본 사용 예시
   */
  basic: `
// 🚀 기본 API 테스트
import { cursorVercelAPI } from '@/utils/cursor-vercel-api-tester';

const result = await cursorVercelAPI.quick('/api/ai/engines');
console.log(result);
  `,

  /**
   * 고급 사용 예시
   */
  advanced: `
// 🔧 고급 API 테스트
import { CursorVercelAPITester } from '@/utils/cursor-vercel-api-tester';

const tester = new CursorVercelAPITester({
  authToken: 'your-token-here',
  timeout: 60000,
  retries: 5
});

const results = await tester.testAllAPIs();
console.log('테스트 결과:', results);
  `,

  /**
   * AI 질의 테스트
   */
  aiQuery: `
// 🤖 AI 자연어 질의 테스트
import { cursorVercelAPI } from '@/utils/cursor-vercel-api-tester';

const result = await cursorVercelAPI.ask('현재 서버 상태는 어떻게 되나요?');
console.log('AI 응답:', result.data);
  `,
};
