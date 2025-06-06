import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 클라이언트 설정
 *
 * @description
 * 서버 상태 관리를 위한 React Query 설정입니다.
 * 캐싱, 재시도, 백그라운드 업데이트 등을 최적화합니다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 옵션
      staleTime: 1000 * 60 * 5, // 5분 - 데이터를 fresh로 간주하는 시간
      gcTime: 1000 * 60 * 30, // 30분 - 가비지 컬렉션 시간 (이전 cacheTime)
      retry: 3, // 실패 시 3번까지 재시도
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프

      // 네트워크 관련
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 재요청 비활성화
      refetchOnReconnect: true, // 네트워크 재연결 시 재요청
      refetchOnMount: true, // 컴포넌트 마운트 시 재요청

      // 서버 모니터링 특화 설정
      refetchInterval: 30000, // 30초마다 자동 새로고침 (서버 모니터링용)
      refetchIntervalInBackground: false, // 백그라운드에서는 자동 새로고침 안함
    },
    mutations: {
      // Mutation 기본 옵션
      retry: 1, // 변형 작업은 1번만 재시도
      retryDelay: 1000, // 1초 대기
    },
  },
});

/**
 * 쿼리 키 상수
 *
 * @description
 * 일관된 쿼리 키 관리를 위한 상수들입니다.
 * 타입 안정성과 재사용성을 제공합니다.
 */
export const queryKeys = {
  // 서버 관련
  servers: ['servers'] as const,
  serverList: (filters?: { status?: string; search?: string }) =>
    ['servers', 'list', filters] as const,
  serverDetail: (id: string) => ['servers', 'detail', id] as const,
  serverMetrics: (id: string, interval?: string) =>
    ['servers', 'metrics', id, interval] as const,

  // 시스템 상태
  systemStatus: ['system', 'status'] as const,
  systemHealth: ['system', 'health'] as const,
  systemMetrics: (period?: string) => ['system', 'metrics', period] as const,

  // AI 관련
  aiAnalysis: ['ai', 'analysis'] as const,
  aiPrediction: (type: string, interval?: string) =>
    ['ai', 'prediction', type, interval] as const,
  aiEngineStatus: ['ai', 'engine', 'status'] as const,

  // 데이터 생성기
  dataGenerator: ['data-generator'] as const,
  dataGeneratorStatus: ['data-generator', 'status'] as const,

  // 가상 서버
  virtualServers: ['virtual-servers'] as const,
  virtualServerStatus: ['virtual-servers', 'status'] as const,

  // MCP
  mcpStatus: ['mcp', 'status'] as const,
  mcpHealth: ['mcp', 'health'] as const,
  mcpStats: ['mcp', 'stats'] as const,
} as const;

/**
 * API 요청 함수들
 *
 * @description
 * React Query와 함께 사용할 API 요청 함수들입니다.
 * 타입 안정성과 에러 처리를 제공합니다.
 */
export const api = {
  // 서버 API
  servers: {
    getList: async (): Promise<any> => {
      const response = await fetch('/api/servers');
      if (!response.ok) {
        throw new Error(`서버 목록 조회 실패: ${response.status}`);
      }
      return response.json();
    },

    getDetail: async (id: string): Promise<any> => {
      const response = await fetch(`/api/servers/${id}`);
      if (!response.ok) {
        throw new Error(`서버 상세 정보 조회 실패: ${response.status}`);
      }
      return response.json();
    },
  },

  // 시스템 API
  system: {
    getStatus: async (): Promise<any> => {
      const response = await fetch('/api/system/status');
      if (!response.ok) {
        throw new Error(`시스템 상태 조회 실패: ${response.status}`);
      }
      return response.json();
    },

    getHealth: async (): Promise<any> => {
      const response = await fetch('/api/system/health');
      if (!response.ok) {
        throw new Error(`시스템 헬스 조회 실패: ${response.status}`);
      }
      return response.json();
    },
  },

  // AI API
  ai: {
    getAnalysis: async (request: any): Promise<any> => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`AI 분석 실패: ${response.status}`);
      }
      return response.json();
    },

    getPrediction: async (type: string, interval = '30min'): Promise<any> => {
      const params = new URLSearchParams({ type, interval });
      const response = await fetch(`/api/ai/prediction?${params}`);
      if (!response.ok) {
        throw new Error(`AI 예측 실패: ${response.status}`);
      }
      return response.json();
    },

    getEngineStatus: async (): Promise<any> => {
      const response = await fetch('/api/ai-agent/integrated');
      if (!response.ok) {
        throw new Error(`AI 엔진 상태 조회 실패: ${response.status}`);
      }
      return response.json();
    },
  },

  // 데이터 생성기 API
  dataGenerator: {
    getStatus: async (): Promise<any> => {
      const response = await fetch('/api/data-generator');
      if (!response.ok) {
        throw new Error(`데이터 생성기 상태 조회 실패: ${response.status}`);
      }
      return response.json();
    },

    start: async (pattern?: string): Promise<any> => {
      const response = await fetch('/api/data-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      });
      if (!response.ok) {
        throw new Error(`데이터 생성기 시작 실패: ${response.status}`);
      }
      return response.json();
    },
  },

  // MCP API (강화된 에러 핸들링)
  mcp: {
    getStatus: async (): Promise<any> => {
      try {
        const response = await fetch('/api/mcp/status');
        if (!response.ok) {
          console.warn(`MCP 상태 조회 실패: ${response.status}`);
          // 실패 시 기본 상태 반환
          return {
            success: false,
            error: `HTTP ${response.status}`,
            data: {
              environment: 'unknown',
              configFile: 'unknown',
              servers: {},
            },
          };
        }
        return response.json();
      } catch (error) {
        console.warn('MCP 상태 조회 네트워크 오류:', error);
        return {
          success: false,
          error: 'Network error',
          data: {
            environment: 'offline',
            configFile: 'N/A',
            servers: {},
          },
        };
      }
    },

    getHealth: async (): Promise<any> => {
      try {
        const response = await fetch('/api/ai-agent?action=health');
        if (!response.ok) {
          console.warn(`MCP 헬스 체크 실패: ${response.status}`);
          return { success: false, status: 'unhealthy' };
        }
        return response.json();
      } catch (error) {
        console.warn('MCP 헬스 체크 네트워크 오류:', error);
        return { success: false, status: 'offline' };
      }
    },

    getStats: async (): Promise<any> => {
      try {
        const response = await fetch('/api/ai-agent?action=status');
        if (!response.ok) {
          console.warn(`MCP 통계 조회 실패: ${response.status}`);
          return { success: false, data: {} };
        }
        return response.json();
      } catch (error) {
        console.warn('MCP 통계 조회 네트워크 오류:', error);
        return { success: false, data: {} };
      }
    },
  },
} as const;
