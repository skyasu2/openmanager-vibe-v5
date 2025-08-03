/**
 * 🎭 개발용 Mock Supabase
 * 
 * 개발/테스트 환경에서 실제 Supabase 대신 사용
 * - 서버 모니터링 도메인에 특화된 Mock 데이터
 * - 전체 Supabase 기능 시뮬레이션 (DB, Auth, Storage, Realtime)
 * - 통계 수집 및 디버깅 지원
 * - 영속성: 메모리 기반 (필요시 localStorage 확장 가능)
 */

import type { 
  SupabaseClient,
  User,
  Session,
  PostgrestResponse,
  PostgrestSingleResponse,
  RealtimeChannel,
  AuthChangeEvent
} from '@supabase/supabase-js';

// Error message helper
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface MockUser extends User {
  id: string;
  email?: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

interface MockSession extends Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: MockUser;
}

interface MockTable {
  [id: string]: Record<string, any>;
}

interface MockDatabase {
  [tableName: string]: MockTable;
}

interface MockStats {
  queries: number;
  inserts: number;
  updates: number;
  deletes: number;
  authCalls: number;
  storageCalls: number;
  realtimeConnections: number;
  rpcCalls: number;
  errors: number;
  startTime: number;
}

// 서버 모니터링 도메인 특화 데이터
const MOCK_SERVERS = [
  {
    id: 'srv-001',
    name: 'web-prd-01',
    type: 'web',
    status: 'healthy',
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'srv-002',
    name: 'api-prd-01',
    type: 'api',
    status: 'warning',
    cpu: 78,
    memory: 85,
    disk: 45,
    network: 340,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'srv-003',
    name: 'db-prd-01',
    type: 'database',
    status: 'healthy',
    cpu: 35,
    memory: 72,
    disk: 82,
    network: 560,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

const MOCK_METRICS = [
  {
    id: 'metric-001',
    server_id: 'srv-001',
    cpu_usage: 45,
    memory_usage: 62,
    disk_usage: 78,
    network_throughput: 120,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'metric-002',
    server_id: 'srv-001',
    cpu_usage: 48,
    memory_usage: 64,
    disk_usage: 78,
    network_throughput: 125,
    timestamp: new Date().toISOString(),
  },
];

const MOCK_USERS = [
  {
    id: 'user-001',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    email: 'developer@example.com',
    role: 'developer',
    created_at: '2024-01-02T00:00:00Z',
  },
];

/**
 * Mock Supabase Client
 */
export class DevMockSupabase {
  private database: MockDatabase = {
    servers: Object.fromEntries(MOCK_SERVERS.map(s => [s.id, s])),
    server_metrics: Object.fromEntries(MOCK_METRICS.map(m => [m.id, m])),
    users: Object.fromEntries(MOCK_USERS.map(u => [u.id, u])),
    command_vectors: {
      'vec-001': {
        id: 'vec-001',
        content: '서버 상태 확인 명령어',
        embedding: Array(1536).fill(0.1),
        metadata: { type: 'command', category: 'monitoring' },
      },
      'vec-002': {
        id: 'vec-002',
        content: 'CPU 사용률 분석',
        embedding: Array(1536).fill(0.2),
        metadata: { type: 'analysis', category: 'performance' },
      },
    },
  };

  private currentUser: MockUser | null = null;
  private currentSession: MockSession | null = null;
  private realtimeSubscribers: Map<string, Set<Function>> = new Map();
  private stats: MockStats = {
    queries: 0,
    inserts: 0,
    updates: 0,
    deletes: 0,
    authCalls: 0,
    storageCalls: 0,
    realtimeConnections: 0,
    rpcCalls: 0,
    errors: 0,
    startTime: Date.now(),
  };

  constructor(
    private config: {
      enableLogging?: boolean;
      latency?: number; // 시뮬레이션 지연
      errorRate?: number; // 0-1, 에러 발생 확률
      persistence?: boolean; // localStorage 사용 여부
    } = {}
  ) {
    this.config = {
      enableLogging: true,
      latency: 50,
      errorRate: 0,
      persistence: false,
      ...config,
    };

    if (this.config.persistence && typeof window !== 'undefined') {
      this.loadFromStorage();
    }

    this.log('🎭 DevMockSupabase 초기화 완료');
  }

  private log(...args: unknown[]) {
    if (this.config.enableLogging) {
      console.log('[DevMockSupabase]', ...args);
    }
  }

  private async delay() {
    if (this.config.latency && this.config.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.latency));
    }
  }

  private shouldError(): boolean {
    return Math.random() < (this.config.errorRate || 0);
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('dev-mock-supabase-db');
      if (stored) {
        this.database = JSON.parse(stored);
      }
    } catch (error) {
      this.log('스토리지 로드 실패:', error);
    }
  }

  private saveToStorage() {
    if (this.config.persistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem('dev-mock-supabase-db', JSON.stringify(this.database));
      } catch (error) {
        this.log('스토리지 저장 실패:', error);
      }
    }
  }

  /**
   * Database 쿼리 빌더
   */
  from<T = any>(table: string): MockQueryBuilder<T> {
    this.stats.queries++;
    return new MockQueryBuilder<T>(
      table,
      this.database,
      this.realtimeSubscribers,
      this.stats,
      this.config,
      () => this.saveToStorage()
    );
  }

  /**
   * RPC 함수 호출
   */
  async rpc<T = any>(
    fn: string,
    params?: Record<string, any>
  ): Promise<PostgrestSingleResponse<T>> {
    this.stats.rpcCalls++;
    await this.delay();

    if (this.shouldError()) {
      this.stats.errors++;
      return {
        data: null,
        error: { message: 'Mock RPC error', code: 'MOCK_ERROR' },
        status: 500,
        statusText: 'Internal Server Error',
      } as any;
    }

    // 벡터 검색 시뮬레이션
    if (fn === 'match_documents' || fn === 'similarity_search') {
      const vectors = Object.values(this.database.command_vectors || {});
      const results = vectors.map(v => ({
        ...v,
        similarity: 0.85 + Math.random() * 0.15,
      }));
      
      return {
        data: results.slice(0, params?.match_count || 5) as any,
        error: null,
        status: 200,
        statusText: 'OK',
      } as any;
    }

    // 통계 조회
    if (fn === 'get_stats') {
      return {
        data: this.getStats() as any,
        error: null,
        status: 200,
        statusText: 'OK',
      } as any;
    }

    return {
      data: null,
      error: null,
      status: 200,
      statusText: 'OK',
    } as any;
  }

  /**
   * Auth 관련 메서드
   */
  auth = {
    getUser: async () => {
      this.stats.authCalls++;
      await this.delay();
      
      return {
        data: { user: this.currentUser },
        error: null,
      };
    },

    getSession: async () => {
      this.stats.authCalls++;
      await this.delay();
      
      return {
        data: { session: this.currentSession },
        error: null,
      };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      this.stats.authCalls++;
      await this.delay();

      const user = Object.values(this.database.users || {})
        .find(u => u.email === email) as any;

      if (user && password === 'password') {
        this.currentUser = {
          id: user.id,
          email: user.email,
          app_metadata: { role: user.role },
          user_metadata: {},
          aud: 'authenticated',
          created_at: user.created_at,
        } as MockUser;

        this.currentSession = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          user: this.currentUser,
        } as MockSession;

        return {
          data: { user: this.currentUser, session: this.currentSession },
          error: null,
        };
      }

      return {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      };
    },

    signInWithOAuth: async ({ provider }: { provider: string }) => {
      this.stats.authCalls++;
      this.log(`OAuth 로그인 시뮬레이션: ${provider}`);
      
      // 실제로는 리다이렉트가 발생하지만 Mock에서는 시뮬레이션만
      return {
        data: { url: `https://mock-oauth.com/${provider}` },
        error: null,
      };
    },

    signOut: async () => {
      this.stats.authCalls++;
      await this.delay();
      
      this.currentUser = null;
      this.currentSession = null;
      
      return { error: null };
    },

    onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      // 실시간 Auth 상태 변경 리스너
      const unsubscribe = () => {
        this.log('Auth 상태 변경 리스너 해제');
      };
      
      return { data: { subscription: { unsubscribe } as any }, error: null };
    },
  };

  /**
   * Storage 관련 메서드
   */
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File | Blob | ArrayBuffer) => {
        this.stats.storageCalls++;
        await this.delay();
        
        return {
          data: { path: `${bucket}/${path}` },
          error: null,
        };
      },
      
      download: async (path: string) => {
        this.stats.storageCalls++;
        await this.delay();
        
        return {
          data: new Blob(['mock file content']),
          error: null,
        };
      },
      
      getPublicUrl: (path: string) => {
        return {
          data: { publicUrl: `https://mock-storage.supabase.co/${bucket}/${path}` },
        };
      },
      
      remove: async (paths: string[]) => {
        this.stats.storageCalls++;
        await this.delay();
        
        return {
          data: paths,
          error: null,
        };
      },
    }),
  };

  /**
   * Realtime 채널
   */
  channel(name: string): MockRealtimeChannel {
    return new MockRealtimeChannel(
      name,
      this.realtimeSubscribers,
      this.stats,
      this.config
    );
  }

  /**
   * 통계 조회
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      uptime,
      uptimeFormatted: `${Math.floor(uptime / 1000)}s`,
      errorRate: this.stats.queries > 0 
        ? (this.stats.errors / this.stats.queries * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Mock 데이터 추가/수정
   */
  addMockData(table: string, data: Record<string, any> | Record<string, any>[]) {
    if (!this.database[table]) {
      this.database[table] = {};
    }

    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => {
      const id = item.id || `mock-${Date.now()}-${Math.random()}`;
      this.database[table][id] = { ...item, id };
    });

    this.saveToStorage();
    this.log(`Mock 데이터 추가: ${table}`, items.length);
  }

  /**
   * Mock 데이터 초기화
   */
  reset() {
    this.database = {
      servers: Object.fromEntries(MOCK_SERVERS.map(s => [s.id, s])),
      server_metrics: Object.fromEntries(MOCK_METRICS.map(m => [m.id, m])),
      users: Object.fromEntries(MOCK_USERS.map(u => [u.id, u])),
    };
    this.currentUser = null;
    this.currentSession = null;
    this.realtimeSubscribers.clear();
    this.stats = {
      queries: 0,
      inserts: 0,
      updates: 0,
      deletes: 0,
      authCalls: 0,
      storageCalls: 0,
      realtimeConnections: 0,
      rpcCalls: 0,
      errors: 0,
      startTime: Date.now(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev-mock-supabase-db');
    }
    
    this.log('Mock 데이터 초기화 완료');
  }
}

/**
 * Mock Query Builder - Supabase 쿼리 체인 시뮬레이션
 */
class MockQueryBuilder<T = any> {
  private filters: Array<{ type: string; column?: string; value?: unknown }> = [];
  private selectedColumns: string | '*' = '*';
  private orderByColumn?: string;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitCount?: number;
  private singleResult = false;

  constructor(
    private table: string,
    private database: MockDatabase,
    private realtimeSubscribers: Map<string, Set<Function>>,
    private stats: MockStats,
    private config: Record<string, unknown>,
    private onUpdate: () => void
  ) {}

  select(columns: string = '*'): this {
    this.selectedColumns = columns;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this.filters.push({ type: 'insert', value: data });
    return this;
  }

  update(data: Partial<T>): this {
    this.filters.push({ type: 'update', value: data });
    return this;
  }

  delete(): this {
    this.filters.push({ type: 'delete' });
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ type: 'like', column, value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderByColumn = column;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  async then<TResult>(
    onfulfilled?: (value: PostgrestResponse<T> | PostgrestSingleResponse<T>) => TResult | PromiseLike<TResult>
  ): Promise<TResult> {
    await this.delay();
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result as any) : result as any;
  }

  private async delay() {
    if (this.config.latency && this.config.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.latency));
    }
  }

  private async execute(): Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>> {
    // 에러 시뮬레이션
    if (Math.random() < (this.config.errorRate || 0)) {
      this.stats.errors++;
      return {
        data: null,
        error: { message: 'Mock database error', code: 'MOCK_ERROR' },
        status: 500,
        statusText: 'Internal Server Error',
      } as any;
    }

    const tableData = this.database[this.table] || {};
    let results = Object.values(tableData);

    // INSERT 처리
    const insertFilter = this.filters.find(f => f.type === 'insert');
    if (insertFilter) {
      this.stats.inserts++;
      const items = Array.isArray(insertFilter.value) ? insertFilter.value : [insertFilter.value];
      const inserted: unknown[] = [];
      
      items.forEach(item => {
        const id = item.id || `mock-${Date.now()}-${Math.random()}`;
        const newItem = {
          ...item,
          id,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        tableData[id] = newItem;
        inserted.push(newItem);
      });

      this.onUpdate();
      this.notifyRealtime('INSERT', inserted);
      
      return {
        data: this.singleResult ? inserted[0] : inserted,
        error: null,
        status: 201,
        statusText: 'Created',
      } as any;
    }

    // UPDATE 처리
    const updateFilter = this.filters.find(f => f.type === 'update');
    if (updateFilter) {
      this.stats.updates++;
      const filtered = this.applyFilters(results);
      const updated: unknown[] = [];

      filtered.forEach(item => {
        const id = (item as any).id;
        tableData[id] = {
          ...tableData[id],
          ...updateFilter.value,
          updated_at: new Date().toISOString(),
        };
        updated.push(tableData[id]);
      });

      this.onUpdate();
      this.notifyRealtime('UPDATE', updated);

      return {
        data: this.singleResult ? updated[0] : updated,
        error: null,
        status: 200,
        statusText: 'OK',
      } as any;
    }

    // DELETE 처리
    const deleteFilter = this.filters.find(f => f.type === 'delete');
    if (deleteFilter) {
      this.stats.deletes++;
      const filtered = this.applyFilters(results);
      const deleted: unknown[] = [];

      filtered.forEach(item => {
        const id = (item as any).id;
        deleted.push({ ...tableData[id] });
        delete tableData[id];
      });

      this.onUpdate();
      this.notifyRealtime('DELETE', deleted);

      return {
        data: deleted,
        error: null,
        status: 200,
        statusText: 'OK',
      } as any;
    }

    // SELECT 처리
    results = this.applyFilters(results);
    results = this.applyOrdering(results);
    
    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    // 컬럼 선택
    if (this.selectedColumns !== '*') {
      const columns = this.selectedColumns.split(',').map(c => c.trim());
      results = results.map(item => {
        const selected: unknown = {};
        columns.forEach(col => {
          if (col in item) {
            selected[col] = (item as any)[col];
          }
        });
        return selected;
      });
    }

    return {
      data: this.singleResult ? results[0] || null : results,
      error: null,
      status: 200,
      statusText: 'OK',
    } as any;
  }

  private applyFilters(data: unknown[]): unknown[] {
    return data.filter(item => {
      return this.filters.every(filter => {
        switch (filter.type) {
          case 'eq':
            return item[filter.column!] === filter.value;
          case 'neq':
            return item[filter.column!] !== filter.value;
          case 'gt':
            return item[filter.column!] > filter.value;
          case 'gte':
            return item[filter.column!] >= filter.value;
          case 'lt':
            return item[filter.column!] < filter.value;
          case 'lte':
            return item[filter.column!] <= filter.value;
          case 'like':
            return new RegExp(filter.value.replace(/%/g, '.*')).test(item[filter.column!]);
          case 'ilike':
            return new RegExp(filter.value.replace(/%/g, '.*'), 'i').test(item[filter.column!]);
          case 'in':
            return filter.value.includes(item[filter.column!]);
          default:
            return true;
        }
      });
    });
  }

  private applyOrdering(data: unknown[]): unknown[] {
    if (!this.orderByColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[this.orderByColumn!];
      const bVal = b[this.orderByColumn!];

      if (aVal === bVal) return 0;
      
      const result = aVal < bVal ? -1 : 1;
      return this.orderDirection === 'desc' ? -result : result;
    });
  }

  private notifyRealtime(event: string, data: unknown[]) {
    const channelKey = `public:${this.table}`;
    const subscribers = this.realtimeSubscribers.get(channelKey);
    
    if (subscribers) {
      subscribers.forEach(callback => {
        data.forEach(item => {
          callback({
            event,
            schema: 'public',
            table: this.table,
            new: event !== 'DELETE' ? item : null,
            old: event === 'DELETE' ? item : null,
          });
        });
      });
    }
  }
}

/**
 * Mock Realtime Channel
 */
class MockRealtimeChannel {
  private subscriptions: Set<Function> = new Set();

  constructor(
    private name: string,
    private globalSubscribers: Map<string, Set<Function>>,
    private stats: MockStats,
    private config: Record<string, unknown>
  ) {}

  on(
    event: string,
    filter: unknown,
    callback: Function
  ): this {
    if (event === 'postgres_changes') {
      const key = `${filter.schema}:${filter.table}`;
      if (!this.globalSubscribers.has(key)) {
        this.globalSubscribers.set(key, new Set());
      }
      this.globalSubscribers.get(key)!.add(callback);
      this.subscriptions.add(callback);
    }
    return this;
  }

  subscribe(): RealtimeChannel {
    this.stats.realtimeConnections++;
    if (this.config.enableLogging) {
      console.log(`[DevMockSupabase] Realtime 채널 구독: ${this.name}`);
    }
    return this as any;
  }

  unsubscribe(): void {
    // 구독 해제
    this.subscriptions.forEach(callback => {
      this.globalSubscribers.forEach(subscribers => {
        subscribers.delete(callback);
      });
    });
    this.subscriptions.clear();
    
    if (this.config.enableLogging) {
      console.log(`[DevMockSupabase] Realtime 채널 구독 해제: ${this.name}`);
    }
  }
}

// 싱글톤 인스턴스
let instance: DevMockSupabase | null = null;

export function getDevMockSupabase(config?: unknown): DevMockSupabase {
  if (!instance) {
    instance = new DevMockSupabase(config);
  }
  return instance;
}

// Supabase 호환 인터페이스
export function createMockSupabaseClient(
  url?: string,
  key?: string,
  options?: unknown
): SupabaseClient {
  const mock = getDevMockSupabase(options);
  
  // SupabaseClient 인터페이스에 맞춰 반환
  return {
    from: mock.from.bind(mock),
    rpc: mock.rpc.bind(mock),
    auth: mock.auth,
    storage: mock.storage,
    channel: mock.channel.bind(mock),
    // 기타 필수 메서드들
    removeChannel: () => Promise.resolve({ error: null }),
    removeAllChannels: () => Promise.resolve({ error: null }),
    getChannels: () => [],
  } as any;
}