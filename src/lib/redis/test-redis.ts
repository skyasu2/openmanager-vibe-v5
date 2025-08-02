/**
 * Test용 Redis 모듈
 * 테스트 환경에서만 사용되는 간단한 Redis 모듈
 */

// 메모리 기반 캐시 스토어
const memoryStore = new Map<string, { value: string; expireAt: number }>();

const testRedis = {
  get: async (key: string) => {
    const item = memoryStore.get(key);
    if (item) {
      if (Date.now() < item.expireAt) {
        return item.value;
      } else {
        memoryStore.delete(key);
      }
    }
    return null;
  },
  
  setex: async (key: string, ttl: number, value: string) => {
    memoryStore.set(key, {
      value,
      expireAt: Date.now() + (ttl * 1000)
    });
    return 'OK';
  },
  
  del: async (key: string) => {
    memoryStore.delete(key);
    return 1;
  },
  
  incr: async (key: string) => {
    return 1;
  },
  
  expire: async (key: string, ttl: number) => {
    return 1;
  },
  
  // 테스트용 헬퍼 메서드
  clear: () => {
    memoryStore.clear();
  }
};

export default process.env.NODE_ENV === 'test' ? testRedis : null;