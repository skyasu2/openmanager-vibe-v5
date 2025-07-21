/**
 * Vitest 호환 래퍼 - Node.js에서 vitest 테스트 실행
 */

// 전역 테스트 함수들
global.describe = (name, fn) => {
  console.log(`\n📦 ${name}`);
  try {
    fn();
  } catch (err) {
    console.error(`❌ Suite failed: ${name}`, err.message);
    process.exit(1);
  }
};

global.it = global.test = (name, fn) => {
  try {
    // 동기 또는 비동기 함수 처리
    const result = fn();
    if (result && typeof result.then === 'function') {
      result
        .then(() => console.log(`  ✅ ${name}`))
        .catch(err => {
          console.error(`  ❌ ${name}`, err.message);
          process.exit(1);
        });
    } else {
      console.log(`  ✅ ${name}`);
    }
  } catch (err) {
    console.error(`  ❌ ${name}`, err.message);
    process.exit(1);
  }
};

// beforeEach, afterEach 등 라이프사이클 훅
global.beforeEach = fn => {
  // 간단한 구현을 위해 무시
};

global.afterEach = fn => {
  // 간단한 구현을 위해 무시
};

global.beforeAll = fn => {
  try {
    fn();
  } catch (err) {
    console.error('❌ beforeAll failed:', err.message);
    process.exit(1);
  }
};

global.afterAll = fn => {
  // 테스트 종료 시 실행
  process.on('exit', () => {
    try {
      fn();
    } catch (err) {
      console.error('❌ afterAll failed:', err.message);
    }
  });
};

// expect 구현 (간단한 버전)
global.expect = actual => {
  return {
    toBe: expected => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual: expected => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`
        );
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected ${actual} to be undefined`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected ${actual} to be defined`);
      }
    },
    toContain: item => {
      if (typeof actual === 'string') {
        if (!actual.includes(item)) {
          throw new Error(`Expected "${actual}" to contain "${item}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new Error(`Expected array to contain ${item}`);
        }
      } else {
        throw new Error('toContain can only be used with strings or arrays');
      }
    },
    toHaveLength: length => {
      if (actual.length !== length) {
        throw new Error(`Expected length ${actual.length} to be ${length}`);
      }
    },
    toThrow: () => {
      if (typeof actual !== 'function') {
        throw new Error('toThrow can only be used with functions');
      }
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw');
      }
    },
    not: {
      toBe: expected => {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      },
      toEqual: expected => {
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
          throw new Error(
            `Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`
          );
        }
      },
      toBeTruthy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} not to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} not to be falsy`);
        }
      },
    },
  };
};

// vi mock 객체
global.vi = {
  fn: implementation => {
    const mockFn = implementation || (() => {});
    mockFn.mockReturnValue = value => {
      return () => value;
    };
    mockFn.mockResolvedValue = value => {
      return () => Promise.resolve(value);
    };
    return mockFn;
  },
  mock: () => ({}),
  clearAllMocks: () => {},
  restoreAllMocks: () => {},
  stubEnv: (key, value) => {
    process.env[key] = value;
  },
  unstubAllEnvs: () => {
    // 환경변수 복원 로직
  },
};

// 모듈 export
module.exports = {
  describe: global.describe,
  it: global.it,
  test: global.test,
  expect: global.expect,
  beforeEach: global.beforeEach,
  afterEach: global.afterEach,
  beforeAll: global.beforeAll,
  afterAll: global.afterAll,
  vi: global.vi,
};
