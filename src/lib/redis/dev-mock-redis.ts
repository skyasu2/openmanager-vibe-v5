/**
 * 🧪 개발 환경 전용 Mock Redis
 *
 * 개발 환경에서 실제 Redis 없이도 완전한 기능을 제공하는 향상된 Mock Redis
 * - 영속성 지원 (localStorage/파일시스템)
 * - Redis 명령어 완벽 지원
 * - 개발자 도구 통합
 * - 성능 모니터링
 */

// Edge Runtime 호환성을 위해 동적 import 사용
let fs: any;
let path: any;

// Node.js 환경에서만 fs와 path 모듈 로드
if (
  typeof process !== 'undefined' &&
  process.versions &&
  process.versions.node
) {
  try {
    fs = require('fs/promises');
    path = require('path');
  } catch (error) {
    // Edge Runtime에서는 무시
    console.warn('⚠️ fs/path 모듈을 사용할 수 없는 환경입니다 (Edge Runtime)');
  }
}

interface DevMockRedisOptions {
  persistPath?: string;
  enableDevTools?: boolean;
  enablePersistence?: boolean;
  maxMemoryMB?: number;
}

export class DevMockRedis {
  private store = new Map<
    string,
    { value: any; expiry?: number; type?: string }
  >();
  private pubSubChannels = new Map<string, Set<(message: string) => void>>();
  private transactions: Array<() => Promise<any>> = [];
  private options: DevMockRedisOptions;
  private stats = {
    commands: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0,
  };

  constructor(options: DevMockRedisOptions = {}) {
    this.options = {
      persistPath: '.redis-mock-data',
      enableDevTools: true,
      enablePersistence: true,
      maxMemoryMB: 100,
      ...options,
    };

    // 개발 환경에서만 영속성 로드
    if (this.options.enablePersistence && typeof window === 'undefined') {
      this.loadFromDisk();
    }

    // 주기적 메모리 정리
    setInterval(() => this.evictExpired(), 60000);
  }

  // 기본 Redis 명령어
  async get(key: string): Promise<string | null> {
    this.stats.commands++;
    const item = this.store.get(key);

    if (!item || (item.expiry && Date.now() > item.expiry)) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return String(item.value);
  }

  async set(
    key: string,
    value: any,
    options?: { ex?: number; px?: number }
  ): Promise<'OK'> {
    this.stats.commands++;

    let expiry: number | undefined;
    if (options?.ex) expiry = Date.now() + options.ex * 1000;
    if (options?.px) expiry = Date.now() + options.px;

    this.store.set(key, { value: String(value), expiry, type: 'string' });
    this.updateMemoryUsage();

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    this.stats.commands++;
    let deleted = 0;

    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
    }

    if (deleted > 0 && this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return deleted;
  }

  async exists(...keys: string[]): Promise<number> {
    this.stats.commands++;
    let count = 0;

    for (const key of keys) {
      const item = this.store.get(key);
      if (item && (!item.expiry || Date.now() < item.expiry)) {
        count++;
      }
    }

    return count;
  }

  async incr(key: string): Promise<number> {
    this.stats.commands++;
    const current = await this.get(key);
    const value = (parseInt(current || '0') || 0) + 1;
    await this.set(key, value);
    return value;
  }

  async decr(key: string): Promise<number> {
    this.stats.commands++;
    const current = await this.get(key);
    const value = (parseInt(current || '0') || 0) - 1;
    await this.set(key, value);
    return value;
  }

  // Hash 명령어
  async hset(key: string, field: string, value: any): Promise<number> {
    this.stats.commands++;
    const hash = this.store.get(key);

    if (!hash || hash.type !== 'hash') {
      this.store.set(key, { value: { [field]: value }, type: 'hash' });
      return 1;
    }

    const isNew = !(field in hash.value);
    hash.value[field] = value;

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    this.stats.commands++;
    const hash = this.store.get(key);

    if (!hash || hash.type !== 'hash') {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return hash.value[field] || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.stats.commands++;
    const hash = this.store.get(key);

    if (!hash || hash.type !== 'hash') {
      return {};
    }

    return { ...hash.value };
  }

  // List 명령어
  async lpush(key: string, ...values: string[]): Promise<number> {
    this.stats.commands++;
    const list = this.store.get(key);

    if (!list || list.type !== 'list') {
      this.store.set(key, { value: [...values], type: 'list' });
      return values.length;
    }

    list.value.unshift(...values);

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return list.value.length;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    this.stats.commands++;
    const list = this.store.get(key);

    if (!list || list.type !== 'list') {
      this.store.set(key, { value: [...values], type: 'list' });
      return values.length;
    }

    list.value.push(...values);

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return list.value.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    this.stats.commands++;
    const list = this.store.get(key);

    if (!list || list.type !== 'list') {
      return [];
    }

    // Redis의 음수 인덱스 처리
    const len = list.value.length;
    if (start < 0) start = len + start;
    if (stop < 0) stop = len + stop;

    return list.value.slice(start, stop + 1);
  }

  // Set 명령어
  async sadd(key: string, ...members: string[]): Promise<number> {
    this.stats.commands++;
    const set = this.store.get(key);

    if (!set || set.type !== 'set') {
      this.store.set(key, { value: new Set(members), type: 'set' });
      return members.length;
    }

    let added = 0;
    for (const member of members) {
      if (!set.value.has(member)) {
        set.value.add(member);
        added++;
      }
    }

    if (added > 0 && this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    this.stats.commands++;
    const set = this.store.get(key);

    if (!set || set.type !== 'set') {
      return 0;
    }

    let removed = 0;
    for (const member of members) {
      if (set.value.delete(member)) {
        removed++;
      }
    }

    if (removed > 0 && this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    this.stats.commands++;
    const set = this.store.get(key);

    if (!set || set.type !== 'set') {
      return [];
    }

    return Array.from(set.value);
  }

  // Pub/Sub 명령어
  async publish(channel: string, message: string): Promise<number> {
    this.stats.commands++;
    const subscribers = this.pubSubChannels.get(channel);

    if (!subscribers) return 0;

    subscribers.forEach(callback => {
      setTimeout(() => callback(message), 0);
    });

    return subscribers.size;
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    if (!this.pubSubChannels.has(channel)) {
      this.pubSubChannels.set(channel, new Set());
    }

    this.pubSubChannels.get(channel)!.add(callback);
  }

  unsubscribe(channel: string, callback?: (message: string) => void): void {
    const subscribers = this.pubSubChannels.get(channel);
    if (!subscribers) return;

    if (callback) {
      subscribers.delete(callback);
    } else {
      this.pubSubChannels.delete(channel);
    }
  }

  // Transaction 명령어
  multi(): this {
    this.transactions = [];
    return this;
  }

  async exec(): Promise<any[]> {
    const results = await Promise.all(this.transactions.map(cmd => cmd()));
    this.transactions = [];
    return results;
  }

  // 유틸리티 명령어
  async ping(): Promise<'PONG'> {
    this.stats.commands++;
    return 'PONG';
  }

  async flushall(): Promise<'OK'> {
    this.stats.commands++;
    this.store.clear();
    this.pubSubChannels.clear();

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }

    return 'OK';
  }

  async keys(pattern: string): Promise<string[]> {
    this.stats.commands++;
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));

    return Array.from(this.store.keys()).filter(key => {
      const item = this.store.get(key);
      return regex.test(key) && (!item?.expiry || Date.now() < item.expiry);
    });
  }

  async ttl(key: string): Promise<number> {
    this.stats.commands++;
    const item = this.store.get(key);

    if (!item) return -2; // 키가 존재하지 않음
    if (!item.expiry) return -1; // 만료 시간이 설정되지 않음

    const ttl = Math.floor((item.expiry - Date.now()) / 1000);
    return ttl < 0 ? -2 : ttl;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.stats.commands++;
    const item = this.store.get(key);

    if (!item) return 0;

    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  // 개발자 도구
  getStats(): Record<string, any> {
    return {
      ...this.stats,
      storeSize: this.store.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      commandsPerSecond: this.stats.commands / (process.uptime() || 1),
      memoryUsageMB: this.stats.memoryUsage / 1024 / 1024,
    };
  }

  async dump(): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const [key, item] of this.store.entries()) {
      if (!item.expiry || Date.now() < item.expiry) {
        data[key] = {
          value: item.value,
          type: item.type || 'string',
          ttl: item.expiry ? Math.floor((item.expiry - Date.now()) / 1000) : -1,
        };
      }
    }

    return data;
  }

  async restore(data: Record<string, any>): Promise<void> {
    this.store.clear();

    for (const [key, item] of Object.entries(data)) {
      const expiry = item.ttl > 0 ? Date.now() + item.ttl * 1000 : undefined;
      this.store.set(key, {
        value: item.value,
        type: item.type,
        expiry,
      });
    }

    if (this.options.enablePersistence) {
      await this.saveToDisk();
    }
  }

  // 내부 헬퍼 메서드
  private evictExpired(): void {
    let evicted = 0;

    for (const [key, item] of this.store.entries()) {
      if (item.expiry && Date.now() > item.expiry) {
        this.store.delete(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      this.stats.evictions += evicted;
      console.log(`🧹 Dev Mock Redis: ${evicted}개 만료 키 정리`);
    }
  }

  private updateMemoryUsage(): void {
    // 간단한 메모리 사용량 추정
    this.stats.memoryUsage = JSON.stringify(
      Array.from(this.store.entries())
    ).length;

    // 메모리 제한 체크
    const maxMemory = (this.options.maxMemoryMB || 100) * 1024 * 1024;
    if (this.stats.memoryUsage > maxMemory) {
      console.warn(
        `⚠️ Dev Mock Redis: 메모리 제한 초과 (${Math.round(this.stats.memoryUsage / 1024 / 1024)}MB)`
      );
      // TODO: LRU 정책으로 오래된 키 제거
    }
  }

  private async saveToDisk(): Promise<void> {
    if (
      typeof window !== 'undefined' ||
      !this.options.enablePersistence ||
      !fs ||
      !path
    ) {
      return;
    }

    try {
      const data = await this.dump();
      const filePath = path.join(process.cwd(), this.options.persistPath!);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Dev Mock Redis 저장 실패:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    if (
      typeof window !== 'undefined' ||
      !this.options.enablePersistence ||
      !fs ||
      !path
    ) {
      return;
    }

    try {
      const filePath = path.join(process.cwd(), this.options.persistPath!);
      const data = await fs.readFile(filePath, 'utf-8');
      await this.restore(JSON.parse(data));
      console.log(`📂 Dev Mock Redis: ${this.store.size}개 키 로드됨`);
    } catch (error) {
      // 파일이 없는 경우는 정상
      if ((error as any).code !== 'ENOENT') {
        console.error('❌ Dev Mock Redis 로드 실패:', error);
      }
    }
  }
}

// 싱글톤 인스턴스
let devMockRedisInstance: DevMockRedis | null = null;

export function getDevMockRedis(): DevMockRedis {
  if (!devMockRedisInstance) {
    devMockRedisInstance = new DevMockRedis({
      enableDevTools: process.env.NODE_ENV === 'development',
      enablePersistence: process.env.NODE_ENV === 'development',
      maxMemoryMB: 100,
    });
  }

  return devMockRedisInstance;
}
