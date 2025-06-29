/**
 * 🗄️ Supabase Metrics Client
 *
 * 서버 메트릭 데이터를 위한 Supabase 클라이언트
 */

import { createClient } from '@supabase/supabase-js';

// 메트릭 데이터 타입 정의
export interface DailyMetric {
  id?: number;
  timestamp: string; // ISO8601 format
  server_id: string;
  cpu: number; // 0-100
  memory: number; // 0-100
  disk: number; // 0-100
  response_time: number; // milliseconds
  status: 'healthy' | 'warning' | 'critical';
  created_at?: string;
}

// 서버 타입 정의
export type ServerType = 'web' | 'api' | 'db' | 'cache' | 'worker';

export interface ServerConfig {
  id: string;
  type: ServerType;
  baseLoad: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
  characteristics: {
    cpuVolatility: number; // CPU 변동성
    memoryGrowthRate: number; // 메모리 증가율
    diskGrowthRate: number; // 디스크 증가율
    responseTimeSpike: number; // 응답시간 스파이크 확률
  };
}

// Supabase 클라이언트 생성
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found in environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// 메트릭 데이터 삽입 함수
export const insertMetrics = async (metrics: DailyMetric[]) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.from('daily_metrics').insert(metrics);

  if (error) {
    throw new Error(`Failed to insert metrics: ${error.message}`);
  }

  return data;
};

// 메트릭 데이터 조회 함수
export const getMetrics = async (
  serverId?: string,
  startTime?: string,
  endTime?: string,
  limit?: number
) => {
  const supabase = createSupabaseClient();

  let query = supabase
    .from('daily_metrics')
    .select('*')
    .order('timestamp', { ascending: true });

  if (serverId) {
    query = query.eq('server_id', serverId);
  }

  if (startTime) {
    query = query.gte('timestamp', startTime);
  }

  if (endTime) {
    query = query.lte('timestamp', endTime);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  return data as DailyMetric[];
};

// 메트릭 데이터 삭제 함수 (개발용)
export const clearMetrics = async () => {
  const supabase = createSupabaseClient();

  const { error } = await supabase.from('daily_metrics').delete().neq('id', 0); // 모든 레코드 삭제

  if (error) {
    throw new Error(`Failed to clear metrics: ${error.message}`);
  }

  console.log('✅ All metrics data cleared');
};
