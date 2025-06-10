/**
 * 🗄️ Supabase 최적화 클라이언트 v2.0
 *
 * Transaction Pooler 설정과 환경변수 검증 통합:
 * - Connection pooling 최적화
 * - 재연결 로직 강화
 * - RLS 보안 정책 관리
 * - 실시간 모니터링
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config, { validateEnvironment } from './config';

// 최적화된 클라이언트 인터페이스
interface OptimizedSupabaseClient extends SupabaseClient {
  isConnected: () => Promise<boolean>;
  reconnect: () => Promise<void>;
  getConnectionInfo: () => object;
  getHealthStatus: () => Promise<object>;
}

// 연결 상태 관리
let connectionStatus = {
  isConnected: false,
  lastConnected: null as Date | null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  healthChecks: 0,
  lastHealthCheck: null as Date | null,
};

// Transaction Pooler 최적화 클라이언트 생성
const createOptimizedSupabaseClient = (): OptimizedSupabaseClient => {
  // 환경변수 검증
  const validation = validateEnvironment();
  if (!validation.success) {
    console.error('❌ Supabase 환경변수 검증 실패:', validation.errors);
    throw new Error('Supabase 환경변수 설정이 잘못되었습니다');
  }

  // Transaction Pooler 최적화 설정
  const supabaseClient = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: false, // SSR 환경에서는 세션 비활성화
        autoRefreshToken: true, // 토큰 자동 갱신
        detectSessionInUrl: false, // URL에서 세션 감지 비활성화
      },
      db: {
        schema: 'public', // 기본 스키마 명시
      },
      global: {
        headers: {
          'x-client-info': 'openmanager-vibe-v5-optimized',
          'x-connection-mode': 'transaction-pooler',
          'x-pool-mode': 'transaction',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // 실시간 이벤트 제한
        },
      },
    }
  ) as OptimizedSupabaseClient;

  // 연결 상태 확인 함수 추가
  supabaseClient.isConnected = async (): Promise<boolean> => {
    try {
      // Health check 쿼리 (가벼운 ping)
      const { error } = await supabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (!error) {
        connectionStatus.isConnected = true;
        connectionStatus.lastConnected = new Date();
        connectionStatus.reconnectAttempts = 0;
        connectionStatus.healthChecks++;
        connectionStatus.lastHealthCheck = new Date();
        return true;
      } else {
        connectionStatus.isConnected = false;
        console.warn('⚠️ Supabase 연결 확인 실패:', error.message);
        return false;
      }
    } catch (error) {
      connectionStatus.isConnected = false;
      console.error('❌ Supabase 연결 테스트 실패:', error);
      return false;
    }
  };

  // 재연결 함수 추가
  supabaseClient.reconnect = async (): Promise<void> => {
    if (
      connectionStatus.reconnectAttempts >=
      connectionStatus.maxReconnectAttempts
    ) {
      throw new Error('최대 재연결 시도 횟수 초과');
    }

    connectionStatus.reconnectAttempts++;
    console.log(
      `🔄 Supabase 재연결 시도 ${connectionStatus.reconnectAttempts}/${connectionStatus.maxReconnectAttempts}`
    );

    try {
      const isConnected = await supabaseClient.isConnected();
      if (isConnected) {
        console.log('✅ Supabase 재연결 성공');
      } else {
        throw new Error('재연결 실패');
      }
    } catch (error) {
      console.error('❌ Supabase 재연결 실패:', error);
      throw error;
    }
  };

  // 연결 정보 함수 추가
  supabaseClient.getConnectionInfo = () => ({
    url: config.supabase.url,
    host: config.supabase.host,
    port: config.supabase.port,
    database: config.supabase.database,
    user: config.supabase.user,
    poolMode: config.supabase.poolMode,
    isConnected: connectionStatus.isConnected,
    lastConnected: connectionStatus.lastConnected,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    healthChecks: connectionStatus.healthChecks,
    lastHealthCheck: connectionStatus.lastHealthCheck,
  });

  // 상세 헬스 상태 함수
  supabaseClient.getHealthStatus = async () => {
    try {
      const startTime = Date.now();
      const isConnected = await supabaseClient.isConnected();
      const responseTime = Date.now() - startTime;

      return {
        isConnected,
        responseTime,
        connectionInfo: supabaseClient.getConnectionInfo(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      };
    }
  };

  return supabaseClient;
};

// RLS 보안 정책 설정 함수 (개선)
export const setupRLSPolicies = async (
  client: SupabaseClient
): Promise<{
  success: boolean;
  results: Array<{ table: string; success: boolean; error?: string }>;
}> => {
  const results: Array<{ table: string; success: boolean; error?: string }> =
    [];

  try {
    console.log('🔒 RLS 보안 정책 설정 시작...');

    // RLS 활성화할 테이블 목록
    const tables = [
      'ai_embeddings',
      'organization_settings',
      'custom_rules',
      'user_profiles',
      'document_embeddings',
      'context_embeddings',
    ];

    // Service Role Key가 있는 경우에만 RLS 설정
    if (config.supabase.serviceKey) {
      const adminClient = createClient(
        config.supabase.url,
        config.supabase.serviceKey
      );

      for (const table of tables) {
        try {
          // 테이블 존재 여부 확인
          const { data: tableExists } = await adminClient
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', table)
            .eq('table_schema', 'public');

          if (!tableExists || tableExists.length === 0) {
            results.push({
              table,
              success: false,
              error: '테이블이 존재하지 않음',
            });
            continue;
          }

          // RLS 활성화 (rpc 함수 사용)
          const { error: rlsError } = await adminClient.rpc('enable_rls', {
            table_name: table,
          });

          if (rlsError) {
            console.warn(`⚠️ ${table} RLS 활성화 실패:`, rlsError.message);
          }

          // 개발 환경용 모든 접근 허용 정책
          if (config.isDevelopment) {
            const { error: policyError } = await adminClient.rpc(
              'create_policy',
              {
                table_name: table,
                policy_name: `${table}_dev_policy`,
                policy_definition: 'true',
              }
            );

            if (policyError) {
              console.warn(`⚠️ ${table} 정책 생성 실패:`, policyError.message);
            }
          }

          results.push({ table, success: !rlsError });
          console.log(`✅ ${table} 테이블 RLS 설정 완료`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '알 수 없는 오류';
          results.push({ table, success: false, error: errorMessage });
          console.warn(`⚠️ ${table} 테이블 RLS 설정 실패:`, errorMessage);
        }
      }
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY가 없어 RLS 설정을 건너뜁니다');

      for (const table of tables) {
        results.push({
          table,
          success: false,
          error: 'Service Role Key 없음',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const success = successCount > 0;

    console.log(`🔒 RLS 설정 완료: ${successCount}/${tables.length} 성공`);

    return { success, results };
  } catch (error) {
    console.error('❌ RLS 설정 실패:', error);
    return {
      success: false,
      results: [
        {
          table: 'all',
          success: false,
          error: error instanceof Error ? error.message : '전체 RLS 설정 실패',
        },
      ],
    };
  }
};

// 연결 상태 모니터링 (개선)
export const startConnectionMonitoring = (client: OptimizedSupabaseClient) => {
  const checkInterval = 30000; // 30초마다 확인

  const monitor = setInterval(async () => {
    try {
      const healthStatus = await client.getHealthStatus();

      if (config.development.verboseLogging) {
        console.log(
          '📊 Supabase 헬스체크:',
          JSON.stringify(healthStatus, null, 2)
        );
      }

      // 연결이 끊어졌고 재연결 시도 가능한 경우
      if (
        'isConnected' in healthStatus &&
        !healthStatus.isConnected &&
        connectionStatus.reconnectAttempts <
          connectionStatus.maxReconnectAttempts
      ) {
        console.log('🔄 연결 끊김 감지, 재연결 시도...');
        await client.reconnect();
      }
    } catch (error) {
      console.error('❌ 연결 모니터링 에러:', error);
    }
  }, checkInterval);

  // 프로세스 종료시 정리
  if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
      clearInterval(monitor);
    });
  }

  console.log('🔄 Supabase 연결 모니터링 시작됨 (30초 간격)');
  return monitor;
};

// 메인 최적화 클라이언트 생성
let optimizedSupabaseClient: OptimizedSupabaseClient;

try {
  optimizedSupabaseClient = createOptimizedSupabaseClient();

  // 초기 연결 확인
  if (config.isDevelopment) {
    optimizedSupabaseClient.getHealthStatus().then(status => {
      console.log('✅ Supabase 최적화 클라이언트 초기화 완료');
      console.log('📊 초기 상태:', JSON.stringify(status, null, 2));
    });

    // 개발 환경에서 연결 모니터링 시작
    startConnectionMonitoring(optimizedSupabaseClient);
  }
} catch (error) {
  console.error('❌ Supabase 최적화 클라이언트 초기화 실패:', error);
  throw error;
}

// 연결 테스트 함수 (개선)
export const testOptimizedSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  healthStatus?: any;
  rlsStatus?: object;
}> => {
  try {
    const healthStatus = await optimizedSupabaseClient.getHealthStatus();

    if ('isConnected' in healthStatus && healthStatus.isConnected) {
      // RLS 상태도 함께 테스트
      const rlsStatus = await setupRLSPolicies(optimizedSupabaseClient);

      const responseTime =
        'responseTime' in healthStatus ? healthStatus.responseTime : 'N/A';

      return {
        success: true,
        message: `Supabase 최적화 연결 성공 (응답시간: ${responseTime}ms)`,
        healthStatus,
        rlsStatus,
      };
    } else {
      return {
        success: false,
        message: 'Supabase 최적화 연결 실패',
        healthStatus,
      };
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Supabase 최적화 연결 테스트 실패',
    };
  }
};

// 내보내기
export const supabaseOptimized = optimizedSupabaseClient;
export type { OptimizedSupabaseClient };
