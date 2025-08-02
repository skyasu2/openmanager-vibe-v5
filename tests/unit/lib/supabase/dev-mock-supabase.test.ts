/**
 * 🧪 DevMockSupabase 테스트
 * 
 * Mock Supabase의 기능을 검증:
 * - CRUD 작업
 * - Auth 기능
 * - Storage 기능
 * - Realtime 기능
 * - 통계 수집
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DevMockSupabase, createMockSupabaseClient } from '@/lib/supabase/dev-mock-supabase';

describe('DevMockSupabase', () => {
  let mockSupabase: DevMockSupabase;

  beforeEach(() => {
    mockSupabase = new DevMockSupabase({
      enableLogging: false,
      latency: 0, // 테스트에서는 지연 없음
      errorRate: 0,
    });
  });

  describe('Database 작업', () => {
    it('SELECT 작업이 정상 동작해야 함', async () => {
      const result = await mockSupabase.from('servers').select('*');
      
      expect(result.data).toBeTruthy();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('INSERT 작업이 정상 동작해야 함', async () => {
      const newServer = {
        name: 'test-server',
        type: 'api',
        status: 'healthy',
      };

      const result = await mockSupabase.from('servers').insert(newServer);
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.[0]).toMatchObject(newServer);
      expect(result.data?.[0].id).toBeTruthy();
    });

    it('UPDATE 작업이 정상 동작해야 함', async () => {
      const result = await mockSupabase
        .from('servers')
        .update({ status: 'warning' })
        .eq('type', 'web');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('DELETE 작업이 정상 동작해야 함', async () => {
      // 먼저 삭제할 항목 추가
      await mockSupabase.from('servers').insert({ 
        id: 'to-delete',
        name: 'delete-me' 
      });

      const result = await mockSupabase
        .from('servers')
        .delete()
        .eq('id', 'to-delete');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('필터링이 정상 동작해야 함', async () => {
      const result = await mockSupabase
        .from('servers')
        .select('*')
        .eq('type', 'web');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      if (result.data) {
        result.data.forEach((server: any) => {
          expect(server.type).toBe('web');
        });
      }
    });

    it('정렬이 정상 동작해야 함', async () => {
      const result = await mockSupabase
        .from('servers')
        .select('*')
        .order('cpu', { ascending: false });
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      
      // CPU 값이 내림차순으로 정렬되어 있는지 확인
      if (result.data && result.data.length > 1) {
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i - 1].cpu).toBeGreaterThanOrEqual(result.data[i].cpu);
        }
      }
    });
  });

  describe('Auth 기능', () => {
    it('로그인이 정상 동작해야 함', async () => {
      const result = await mockSupabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password',
      });
      
      expect(result.error).toBeNull();
      expect(result.data.user).toBeTruthy();
      expect(result.data.user?.email).toBe('admin@example.com');
      expect(result.data.session).toBeTruthy();
    });

    it('잘못된 비밀번호로 로그인 실패해야 함', async () => {
      const result = await mockSupabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'wrongpassword',
      });
      
      expect(result.error).toBeTruthy();
      expect(result.data.user).toBeNull();
      expect(result.data.session).toBeNull();
    });

    it('현재 사용자 조회가 정상 동작해야 함', async () => {
      // 먼저 로그인
      await mockSupabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password',
      });

      const result = await mockSupabase.auth.getUser();
      
      expect(result.error).toBeNull();
      expect(result.data.user).toBeTruthy();
      expect(result.data.user?.email).toBe('admin@example.com');
    });

    it('로그아웃이 정상 동작해야 함', async () => {
      // 먼저 로그인
      await mockSupabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password',
      });

      const result = await mockSupabase.auth.signOut();
      
      expect(result.error).toBeNull();

      // 로그아웃 후 사용자 조회
      const userResult = await mockSupabase.auth.getUser();
      expect(userResult.data.user).toBeNull();
    });
  });

  describe('RPC 함수', () => {
    it('벡터 검색이 정상 동작해야 함', async () => {
      const result = await mockSupabase.rpc('match_documents', {
        query_embedding: [0.1, 0.2, 0.3],
        match_count: 5,
      });
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(Array.isArray(result.data)).toBe(true);
      
      if (result.data) {
        result.data.forEach((doc: any) => {
          expect(doc.similarity).toBeGreaterThan(0);
          expect(doc.similarity).toBeLessThanOrEqual(1);
        });
      }
    });

    it('통계 조회가 정상 동작해야 함', async () => {
      const result = await mockSupabase.rpc('get_stats');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.queries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Storage 기능', () => {
    it('파일 업로드가 정상 동작해야 함', async () => {
      const bucket = mockSupabase.storage.from('avatars');
      const file = new Blob(['test content'], { type: 'text/plain' });
      
      const result = await bucket.upload('test.txt', file);
      
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.path).toBe('avatars/test.txt');
    });

    it('Public URL 생성이 정상 동작해야 함', () => {
      const bucket = mockSupabase.storage.from('avatars');
      const result = bucket.getPublicUrl('test.txt');
      
      expect(result.data.publicUrl).toBeTruthy();
      expect(result.data.publicUrl).toContain('avatars/test.txt');
    });
  });

  describe('Realtime 기능', () => {
    it('채널 구독이 정상 동작해야 함', () => {
      const channel = mockSupabase.channel('test-channel');
      
      let receivedPayload: any = null;
      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'servers' },
        (payload) => {
          receivedPayload = payload;
        }
      );
      
      const subscription = channel.subscribe();
      expect(subscription).toBeTruthy();
      
      // 구독 해제
      subscription.unsubscribe();
    });
  });

  describe('통계 및 Mock 기능', () => {
    it('통계가 정확하게 수집되어야 함', async () => {
      // 여러 작업 수행
      await mockSupabase.from('servers').select('*');
      await mockSupabase.from('servers').insert({ name: 'test' });
      await mockSupabase.auth.getUser();
      await mockSupabase.rpc('get_stats');
      
      const stats = mockSupabase.getStats();
      
      expect(stats.queries).toBe(1);
      expect(stats.inserts).toBe(1);
      expect(stats.authCalls).toBe(1);
      expect(stats.rpcCalls).toBe(1);
      expect(stats.totalCalls).toBe(4);
    });

    it('Mock 데이터 추가가 정상 동작해야 함', async () => {
      mockSupabase.addMockData('custom_table', [
        { id: '1', name: 'Custom 1' },
        { id: '2', name: 'Custom 2' },
      ]);
      
      const result = await mockSupabase.from('custom_table').select('*');
      
      expect(result.error).toBeNull();
      expect(result.data?.length).toBe(2);
    });

    it('Mock 초기화가 정상 동작해야 함', async () => {
      // 데이터 추가
      await mockSupabase.from('servers').insert({ name: 'test' });
      
      // 초기화
      mockSupabase.reset();
      
      // 통계 확인
      const stats = mockSupabase.getStats();
      expect(stats.totalCalls).toBe(0);
    });
  });

  describe('Supabase 호환 인터페이스', () => {
    it('createMockSupabaseClient가 SupabaseClient 인터페이스를 구현해야 함', () => {
      const client = createMockSupabaseClient();
      
      expect(client.from).toBeTruthy();
      expect(client.rpc).toBeTruthy();
      expect(client.auth).toBeTruthy();
      expect(client.storage).toBeTruthy();
      expect(client.channel).toBeTruthy();
    });
  });

  describe('에러 처리', () => {
    it('에러 시뮬레이션이 정상 동작해야 함', async () => {
      const errorMock = new DevMockSupabase({
        enableLogging: false,
        errorRate: 1, // 100% 에러
      });
      
      const result = await errorMock.from('servers').select('*');
      
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });
});