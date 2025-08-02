/**
 * 🔴 Redis Mock Provider
 * 
 * Redis의 간소화된 Mock 구현
 */

import { MockBase } from '../core/MockBase';

export class RedisMock extends MockBase {
  private store = new Map<string, { value: any; expiry?: number; type: string }>();
  private persistFile = '.redis-mock-data/store.json';

  constructor() {
    super('Redis', {
      enablePersistence: process.env.NODE_ENV === 'development',
      responseDelay: 5,
    });

    if (this.options.enablePersistence) {
      this.loadData();
    }
  }

  /**
   * GET 명령어
   */
  async get(key: string): Promise<string | null> {
    return this.execute('get', () => {
      const item = this.store.get(key);
      
      if (!item || (item.expiry && Date.now() > item.expiry)) {
        this.store.delete(key);
        return null;
      }
      
      return String(item.value);
    });
  }

  /**
   * SET 명령어
   */
  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    return this.execute('set', () => {
      const expiry = options?.ex ? Date.now() + options.ex * 1000 : undefined;
      this.store.set(key, { value: String(value), expiry, type: 'string' });
      
      if (this.options.enablePersistence) {
        this.saveData();
      }
      
      return 'OK';
    });
  }

  /**
   * DEL 명령어
   */
  async del(key: string): Promise<number> {
    return this.execute('del', () => {
      const existed = this.store.has(key);
      this.store.delete(key);
      
      if (this.options.enablePersistence && existed) {
        this.saveData();
      }
      
      return existed ? 1 : 0;
    });
  }

  /**
   * EXISTS 명령어
   */
  async exists(key: string): Promise<number> {
    return this.execute('exists', () => {
      const item = this.store.get(key);
      if (item && (!item.expiry || Date.now() <= item.expiry)) {
        return 1;
      }
      return 0;
    });
  }

  /**
   * INCR 명령어
   */
  async incr(key: string): Promise<number> {
    return this.execute('incr', () => {
      const item = this.store.get(key);
      const current = item ? parseInt(String(item.value)) || 0 : 0;
      const newValue = current + 1;
      
      this.store.set(key, { value: String(newValue), type: 'string' });
      
      if (this.options.enablePersistence) {
        this.saveData();
      }
      
      return newValue;
    });
  }

  /**
   * EXPIRE 명령어
   */
  async expire(key: string, seconds: number): Promise<number> {
    return this.execute('expire', () => {
      const item = this.store.get(key);
      if (!item) return 0;
      
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    });
  }

  /**
   * PING 명령어
   */
  async ping(): Promise<string> {
    return this.execute('ping', () => 'PONG');
  }

  /**
   * 데이터 영속성 - 저장
   */
  private saveData(): void {
    if (typeof window !== 'undefined') return;
    
    try {
      const data = Array.from(this.store.entries());
      // 실제 구현에서는 fs를 사용하여 파일에 저장
      this.logger.debug('데이터 저장됨', { entries: data.length });
    } catch (error) {
      this.logger.error('데이터 저장 실패', error);
    }
  }

  /**
   * 데이터 영속성 - 로드
   */
  private loadData(): void {
    if (typeof window !== 'undefined') return;
    
    try {
      // 실제 구현에서는 fs를 사용하여 파일에서 로드
      this.logger.debug('데이터 로드됨');
    } catch (error) {
      this.logger.debug('저장된 데이터 없음');
    }
  }

  /**
   * 만료된 키 정리
   */
  evictExpired(): void {
    let evicted = 0;
    const now = Date.now();
    
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
        evicted++;
      }
    }
    
    if (evicted > 0) {
      this.logger.debug(`${evicted}개 키 만료 처리`);
    }
  }

  /**
   * Mock 리셋
   */
  reset(): void {
    this.store.clear();
    this.stats.reset();
    this.logger.info('Redis Mock 리셋됨');
  }

  /**
   * 현재 저장된 키 개수
   */
  size(): number {
    return this.store.size;
  }
}