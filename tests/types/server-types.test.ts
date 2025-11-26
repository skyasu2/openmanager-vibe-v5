/**
 * 🧪 타입 레벨 테스트 - Server Types
 *
 * @description ServerInstance 타입의 구조 및 안전성 검증
 * @author Claude Code
 * @created 2025-11-26
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  ServerInstance,
  ServerStatus,
  ServerMetrics,
  ServerHealth,
  ServerSpecs,
} from '@/types/server';

describe('🖥️ Server Types 타입 테스트', () => {
  describe('ServerInstance 타입', () => {
    it('필수 속성을 모두 포함한다', () => {
      expectTypeOf<ServerInstance>().toHaveProperty('id');
      expectTypeOf<ServerInstance>().toHaveProperty('name');
      expectTypeOf<ServerInstance>().toHaveProperty('status');
      expectTypeOf<ServerInstance>().toHaveProperty('cpu');
      expectTypeOf<ServerInstance>().toHaveProperty('memory');
      expectTypeOf<ServerInstance>().toHaveProperty('disk');
      expectTypeOf<ServerInstance>().toHaveProperty('network');
      expectTypeOf<ServerInstance>().toHaveProperty('uptime');
      expectTypeOf<ServerInstance>().toHaveProperty('lastCheck');
      expectTypeOf<ServerInstance>().toHaveProperty('location');
      expectTypeOf<ServerInstance>().toHaveProperty('provider');
    });

    it('메트릭 속성들은 숫자다', () => {
      expectTypeOf<ServerInstance['cpu']>().toBeNumber();
      expectTypeOf<ServerInstance['memory']>().toBeNumber();
      expectTypeOf<ServerInstance['disk']>().toBeNumber();
      expectTypeOf<ServerInstance['network']>().toBeNumber();
    });

    it('uptime은 number 또는 string이다', () => {
      expectTypeOf<ServerInstance['uptime']>().toEqualTypeOf<number | string>();
    });

    it('문자열 속성들', () => {
      expectTypeOf<ServerInstance['id']>().toBeString();
      expectTypeOf<ServerInstance['name']>().toBeString();
      expectTypeOf<ServerInstance['type']>().toBeString();
      expectTypeOf<ServerInstance['environment']>().toBeString();
      expectTypeOf<ServerInstance['region']>().toBeString();
      expectTypeOf<ServerInstance['version']>().toBeString();
    });

    it('배열 속성들', () => {
      expectTypeOf<ServerInstance['tags']>().toEqualTypeOf<string[]>();
    });

    it('alerts는 숫자다', () => {
      expectTypeOf<ServerInstance['alerts']>().toBeNumber();
    });
  });

  describe('ServerInstance Optional 속성', () => {
    it('os는 optional string이다', () => {
      expectTypeOf<ServerInstance['os']>().toEqualTypeOf<string | undefined>();
    });

    it('ip는 optional string이다', () => {
      expectTypeOf<ServerInstance['ip']>().toEqualTypeOf<string | undefined>();
    });

    it('cpuHistory는 optional number 배열이다', () => {
      expectTypeOf<ServerInstance['cpuHistory']>().toEqualTypeOf<
        number[] | undefined
      >();
    });

    it('memoryHistory는 optional number 배열이다', () => {
      expectTypeOf<ServerInstance['memoryHistory']>().toEqualTypeOf<
        number[] | undefined
      >();
    });

    it('responseTime은 optional number이다', () => {
      expectTypeOf<ServerInstance['responseTime']>().toEqualTypeOf<
        number | undefined
      >();
    });

    it('health는 optional ServerHealth이다', () => {
      expectTypeOf<ServerInstance['health']>().toEqualTypeOf<
        ServerHealth | undefined
      >();
    });

    it('specs는 optional ServerSpecs이다', () => {
      expectTypeOf<ServerInstance['specs']>().toEqualTypeOf<
        ServerSpecs | undefined
      >();
    });
  });

  describe('ServerInstance 중첩 객체', () => {
    it('requests 객체 구조가 올바르다', () => {
      expectTypeOf<ServerInstance['requests']>().toMatchTypeOf<
        | {
            total: number;
            success: number;
            errors: number;
            averageTime: number;
          }
        | undefined
      >();
    });

    it('errors 객체 구조가 올바르다', () => {
      expectTypeOf<ServerInstance['errors']>().toMatchTypeOf<
        | {
            count: number;
            recent: string[];
            lastError?: string;
          }
        | undefined
      >();
    });

    it('custom 객체는 동적 속성을 허용한다', () => {
      expectTypeOf<ServerInstance['custom']>().toMatchTypeOf<
        | {
            updateInterval?: number;
            enableMockData?: boolean;
            [key: string]: unknown;
          }
        | undefined
      >();
    });
  });

  describe('ServerStatus 타입', () => {
    it('ServerStatus는 문자열 리터럴 타입이다', () => {
      expectTypeOf<ServerStatus>().toBeString();
    });
  });

  describe('타입 변환 안전성', () => {
    it('ServerInstance는 임의의 객체를 허용하지 않는다', () => {
      // @ts-expect-error - 임의의 객체는 ServerInstance가 아님
      expectTypeOf<ServerInstance>().not.toMatchTypeOf<{ foo: string }>();
    });

    it('필수 속성이 누락되면 타입 오류가 발생한다', () => {
      // @ts-expect-error - id가 누락됨
      expectTypeOf<{ name: string }>().not.toMatchTypeOf<ServerInstance>();
    });
  });

  describe('실전 사용 시나리오', () => {
    it('ServerInstance 배열을 올바르게 처리한다', () => {
      expectTypeOf<ServerInstance[]>().toBeArray();
      expectTypeOf<ServerInstance[]>().toEqualTypeOf<ServerInstance[]>();
    });

    it('ServerInstance를 Partial로 만들 수 있다', () => {
      expectTypeOf<Partial<ServerInstance>>().toMatchTypeOf<{
        id?: string;
        name?: string;
        cpu?: number;
      }>();
    });

    it('ServerInstance에서 특정 키만 선택할 수 있다', () => {
      type ServerSummary = Pick<ServerInstance, 'id' | 'name' | 'status'>;

      expectTypeOf<ServerSummary>().toMatchTypeOf<{
        id: string;
        name: string;
        status: ServerStatus;
      }>();
    });

    it('ServerInstance에서 특정 키를 제외할 수 있다', () => {
      type ServerWithoutHistory = Omit<
        ServerInstance,
        'cpuHistory' | 'memoryHistory'
      >;

      expectTypeOf<ServerWithoutHistory>().not.toHaveProperty('cpuHistory');
      expectTypeOf<ServerWithoutHistory>().not.toHaveProperty('memoryHistory');
      expectTypeOf<ServerWithoutHistory>().toHaveProperty('id');
      expectTypeOf<ServerWithoutHistory>().toHaveProperty('name');
    });
  });
});
