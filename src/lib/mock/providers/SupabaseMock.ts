/**
 * 🗄️ Supabase Mock Provider
 *
 * Supabase의 간소화된 Mock 구현
 */

import { MockBase } from '../core/MockBase';
import mockData from '../data/servers.json';
import userData from '../data/users.json';

interface QueryBuilder {
  table: string;
  filters: Array<{ column: string; operator: string; value: unknown }>;
  orderBy?: { column: string; ascending: boolean };
  limitCount?: number;
}

export class SupabaseMock extends MockBase {
  private tables: Map<string, any[]> = new Map();
  private currentUser: unknown = null;

  constructor() {
    super('Supabase', {
      responseDelay: 20,
      enableStats: true,
    });

    this.initializeTables();
  }

  /**
   * 테이블 초기화
   */
  private initializeTables(): void {
    this.tables.set('servers', [...mockData.servers]);
    this.tables.set('users', [...userData.users]);
    this.tables.set('server_metrics', []);
    this.tables.set('sessions', []);
  }

  /**
   * from() - 테이블 선택
   */
  from(table: string): SupabaseQueryBuilder {
    return new SupabaseQueryBuilder(this, table);
  }

  /**
   * auth.signIn() - 로그인
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: unknown; session: unknown }> {
    return this.execute('auth.signIn', async () => {
      const users = this.tables.get('users') || [];
      const user = users.find((u) => u.email === email);

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      this.currentUser = user;
      const session = {
        access_token: `mock-token-${user.id}`,
        refresh_token: `mock-refresh-${user.id}`,
        expires_in: 3600,
        user,
      };

      return { user, session };
    });
  }

  /**
   * auth.signOut() - 로그아웃
   */
  async signOut(): Promise<void> {
    return this.execute('auth.signOut', async () => {
      this.currentUser = null;
    });
  }

  /**
   * auth.user() - 현재 사용자
   */
  getUser(): unknown {
    return this.currentUser;
  }

  /**
   * 테이블 데이터 가져오기
   */
  getTableData(table: string): unknown[] {
    return this.tables.get(table) || [];
  }

  /**
   * 테이블 데이터 설정
   */
  setTableData(table: string, data: unknown[]): void {
    this.tables.set(table, data);
  }

  /**
   * 쿼리 실행
   */
  async executeQuery(builder: QueryBuilder): Promise<unknown> {
    return this.execute(`query.${builder.table}`, async () => {
      let data = [...this.getTableData(builder.table)];

      // 필터 적용
      for (const filter of builder.filters) {
        data = data.filter((item) => {
          const record = item as Record<string, any>;
          const value = record[filter.column];
          switch (filter.operator) {
            case 'eq':
              return value === filter.value;
            case 'neq':
              return value !== filter.value;
            case 'gt':
              return value > (filter.value as any);
            case 'gte':
              return value >= (filter.value as any);
            case 'lt':
              return value < (filter.value as any);
            case 'lte':
              return value <= (filter.value as any);
            case 'like':
              return String(value).includes(String(filter.value));
            default:
              return true;
          }
        });
      }

      // 정렬 적용
      if (builder.orderBy) {
        data.sort((a, b) => {
          const recordA = a as Record<string, any>;
          const recordB = b as Record<string, any>;
          const aVal = recordA[builder.orderBy!.column];
          const bVal = recordB[builder.orderBy!.column];
          const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return builder.orderBy!.ascending ? result : -result;
        });
      }

      // 제한 적용
      if (builder.limitCount) {
        data = data.slice(0, builder.limitCount);
      }

      return { data, error: null };
    });
  }

  /**
   * Mock 리셋
   */
  reset(): void {
    this.initializeTables();
    this.currentUser = null;
    this.stats.reset();
    this.logger.info('Supabase Mock 리셋됨');
  }
}

/**
 * Supabase 쿼리 빌더
 */
class SupabaseQueryBuilder {
  private mock: SupabaseMock;
  private builder: QueryBuilder;

  constructor(mock: SupabaseMock, table: string) {
    this.mock = mock;
    this.builder = {
      table,
      filters: [],
    };
  }

  select(columns?: string): this {
    // 간단한 구현 - 컬럼 선택은 무시
    return this;
  }

  eq(column: string, value: unknown): this {
    this.builder.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.builder.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.builder.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.builder.filters.push({ column, operator: 'gte', value });
    return this;
  }

  order(column: string, options?: { ascending: boolean }): this {
    this.builder.orderBy = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  limit(count: number): this {
    this.builder.limitCount = count;
    return this;
  }

  async single(): Promise<unknown> {
    const result = await this.mock.executeQuery(this.builder);
    const typedResult = result as { data: unknown[]; error: unknown };
    if (typedResult.data.length === 0) {
      return { data: null, error: new Error('No rows found') };
    }
    return { data: typedResult.data[0], error: null };
  }

  // 쿼리 실행
  then(
    resolve: (value: unknown) => unknown,
    reject?: (reason: unknown) => unknown
  ): Promise<unknown> {
    return this.mock.executeQuery(this.builder).then(resolve, reject);
  }
}
