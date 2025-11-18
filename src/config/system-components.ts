/**
 * 🔧 시스템 컴포넌트 상태 체크 설정
 * Next.js 15 Edge Runtime 최적화 버전
 */

import { SystemComponent } from '../types/system-checklist';
import {
  isNetworkError,
  hasOriginalError,
  fetchWithTracking,
  recordNetworkRequest,
} from '../utils/network-tracking';

// 🔧 네트워크 정보 타입 정의 (타입 안전성 강화)
interface NetworkInfo {
  requestId?: string;
  url?: string;
  method?: string;
  duration?: number;
  responseTime?: number;
  startTime?: number;
  endTime?: number;
}

// 🔧 네트워크 에러 타입 정의
interface NetworkError extends Error {
  networkInfo?: NetworkInfo;
  originalError?: Error;
}

// 타입 가드 함수들은 network-tracking utils에서 import됨

// 🔧 네트워크 정보 검증 헬퍼
const getResponseTime = (networkInfo?: NetworkInfo): string => {
  if (!networkInfo || typeof networkInfo.responseTime !== 'number') {
    return 'unknown';
  }
  return `${networkInfo.responseTime}ms`;
};

/**
 * 🌐 시스템 컴포넌트 목록
 * 각 컴포넌트는 독립적으로 상태 체크 수행
 */
export const systemComponents: SystemComponent[] = [
  // 🚀 API 서버 상태 체크
  {
    id: 'api-server',
    name: 'API 서버',
    description: 'Next.js API Routes 응답성',
    category: 'backend',
    icon: '🌐',
    priority: 'critical',
    estimatedTime: 800,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'api-server');
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'api-server');
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('API 서버 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // 📊 메트릭 데이터베이스 체크
  {
    id: 'metrics-database',
    name: '메트릭 데이터베이스',
    description: 'Supabase PostgreSQL 연결',
    category: 'database',
    icon: '📊',
    priority: 'critical',
    estimatedTime: 1000,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/dashboard?action=health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'metrics-database');
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'metrics-database');
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('메트릭 데이터베이스 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // 🤖 Unified AI 엔진 (Graceful Degradation)
  {
    id: 'unified-ai-engine',
    name: 'Unified AI 엔진',
    description: 'AI 분석 및 예측 서비스 (폴백 지원)',
    category: 'ai',
    icon: '🤖',
    priority: 'high',
    estimatedTime: 1200,
    dependencies: ['api-server'],
    checkFunction: async () => {
      try {
        // 🚀 Unified AI 엔진 상태 체크
        const { response, networkInfo } = await fetchWithTracking(
          '/api/ai/unified?action=health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'unified-ai-engine');

        if (!response.ok) {
          console.warn('⚠️ Unified AI 엔진 직접 체크 실패, 폴백 모드로 전환');
          return true; // Graceful degradation - 폴백 모드로 동작
        }

        const data = await response.json();
        console.log('✅ Unified AI 엔진 체크 성공:', {
          engines: data.engines || 'unknown',
          tier: data.tier || 'fallback',
          responseTime: getResponseTime(networkInfo),
        });

        return true;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'unified-ai-engine');
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return typeof error === 'string' ? error : 'Unknown error';
                }
              })();
        const responseTime =
          isNetworkError(error) && error.networkInfo
            ? getResponseTime(error.networkInfo)
            : 'unknown';

        console.warn(
          '⚠️ Unified AI 엔진 체크 실패, Graceful Degradation 모드:',
          {
            error: errorMessage,
            networkInfo: responseTime,
          }
        );

        // Graceful Degradation: AI 엔진 실패해도 시스템은 동작
        return true;
      }
    },
  },

  // 🖥️ 서버 데이터 생성기
  {
    id: 'server-generator',
    name: '서버 데이터 생성기',
    description: '실시간 서버 메트릭 생성',
    category: 'data',
    icon: '🖥️',
    priority: 'high',
    estimatedTime: 600,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/servers/next',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'server-generator');
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'server-generator');
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('서버 데이터 생성기 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // 🔐 인증 시스템
  {
    id: 'auth-system',
    name: '인증 시스템',
    description: 'GitHub OAuth & Supabase Auth',
    category: 'auth',
    icon: '🔐',
    priority: 'critical',
    estimatedTime: 900,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/auth/session',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'auth-system');
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'auth-system');
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('인증 시스템 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // 📡 실시간 통신 (WebSocket/SSE)
  {
    id: 'realtime-communication',
    name: '실시간 통신',
    description: 'WebSocket & SSE 스트림',
    category: 'realtime',
    icon: '📡',
    priority: 'medium',
    estimatedTime: 700,
    dependencies: ['api-server'],
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/realtime/status',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(
          networkInfo,
          response.ok,
          'realtime-communication'
        );
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(
            error.networkInfo,
            false,
            'realtime-communication'
          );
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('실시간 통신 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // ⚡ 캐시 시스템 (Memory Cache)
  {
    id: 'memory-cache',
    name: '메모리 캐시',
    description: '서버리스 최적화 LRU Cache',
    category: 'cache',
    icon: '⚡',
    priority: 'medium',
    estimatedTime: 400,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/cache/health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'memory-cache');
        return response.ok;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'memory-cache');
        }

        const errorToLog = hasOriginalError(error)
          ? error.originalError
          : error;

        console.error('메모리 캐시 체크 실패:', errorToLog);
        return false;
      }
    },
  },

  // 🔍 GCP Functions (서버리스)
  {
    id: 'gcp-functions',
    name: 'GCP Functions',
    description: 'Python 서버리스 AI 처리',
    category: 'external',
    icon: '🔍',
    priority: 'low',
    estimatedTime: 1500,
    dependencies: ['api-server'],
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/gcp/health',
          {
            method: 'GET',
            headers: {
              'X-Skip-Validation': 'true', // 선택적 체크
            },
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'gcp-functions');

        // GCP Functions는 선택적 서비스이므로 실패해도 전체 시스템에 영향 없음
        if (!response.ok) {
          console.warn('⚠️ GCP Functions 일시적 비활성화, 로컬 AI로 폴백');
          return true; // Graceful degradation
        }

        return true;
      } catch (error: unknown) {
        if (isNetworkError(error)) {
          recordNetworkRequest(error.networkInfo, false, 'gcp-functions');
        }

        console.warn('⚠️ GCP Functions 연결 실패, 로컬 처리 모드:', error);
        return true; // 외부 서비스 실패 시에도 시스템은 동작
      }
    },
  },
];
