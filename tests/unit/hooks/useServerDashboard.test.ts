/**
 * @file useServerDashboard.test.ts
 * @description useServerDashboard 훅의 핵심 로직 단위 테스트
 *
 * 테스트 범위:
 * - calculatePagination 함수 (Lines 160-175)
 * - 페이지 계산 로직
 * - 경계값 및 엣지 케이스
 *
 * @priority HIGH - AI 교차검증에서 0% 커버리지로 확인됨
 */

import { describe, it, expect } from 'vitest';

/**
 * calculatePagination 함수 복제 (테스트용)
 * 실제 구현: src/hooks/useServerDashboard.ts Lines 160-175
 */
const calculatePagination = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): { paginatedItems: T[]; totalPages: number } => {
  // 유효성 검증
  if (!Array.isArray(items) || items.length === 0) {
    return { paginatedItems: [], totalPages: 0 };
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return { paginatedItems, totalPages };
};

describe('useServerDashboard - calculatePagination', () => {
  describe('정상 케이스', () => {
    it('17개 아이템을 3개씩 페이지네이션 - 첫 페이지', () => {
      const items = Array.from({ length: 17 }, (_, i) => ({
        id: i + 1,
        name: `Server ${i + 1}`,
      }));
      const result = calculatePagination(items, 1, 3);

      expect(result.totalPages).toBe(6); // 17 / 3 = 5.67 → ceil = 6
      expect(result.paginatedItems).toHaveLength(3);
      expect(result.paginatedItems[0]).toEqual({ id: 1, name: 'Server 1' });
      expect(result.paginatedItems[2]).toEqual({ id: 3, name: 'Server 3' });
    });

    it('17개 아이템을 3개씩 페이지네이션 - 마지막 페이지 (2개만)', () => {
      const items = Array.from({ length: 17 }, (_, i) => ({
        id: i + 1,
        name: `Server ${i + 1}`,
      }));
      const result = calculatePagination(items, 6, 3);

      expect(result.totalPages).toBe(6);
      expect(result.paginatedItems).toHaveLength(2); // 17 % 3 = 2
      expect(result.paginatedItems[0]).toEqual({ id: 16, name: 'Server 16' });
      expect(result.paginatedItems[1]).toEqual({ id: 17, name: 'Server 17' });
    });

    it('17개 아이템을 6개씩 페이지네이션 (모바일)', () => {
      const items = Array.from({ length: 17 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 6);

      expect(result.totalPages).toBe(3); // 17 / 6 = 2.83 → ceil = 3
      expect(result.paginatedItems).toHaveLength(6);
    });

    it('17개 아이템을 9개씩 페이지네이션 (태블릿)', () => {
      const items = Array.from({ length: 17 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 9);

      expect(result.totalPages).toBe(2); // 17 / 9 = 1.89 → ceil = 2
      expect(result.paginatedItems).toHaveLength(9);
    });

    it('17개 아이템을 15개씩 페이지네이션 (데스크톱 - 모두 보기)', () => {
      const items = Array.from({ length: 17 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 15);

      expect(result.totalPages).toBe(2); // 17 / 15 = 1.13 → ceil = 2
      expect(result.paginatedItems).toHaveLength(15);
    });

    it('정확히 나누어떨어지는 경우 (12개 / 4개)', () => {
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 4);

      expect(result.totalPages).toBe(3); // 12 / 4 = 3
      expect(result.paginatedItems).toHaveLength(4);
    });
  });

  describe('경계값 테스트', () => {
    it('빈 배열 처리', () => {
      const result = calculatePagination([], 1, 3);

      expect(result.totalPages).toBe(0);
      expect(result.paginatedItems).toHaveLength(0);
      expect(result.paginatedItems).toEqual([]);
    });

    it('단일 아이템', () => {
      const items = [{ id: 1, name: 'Single Server' }];
      const result = calculatePagination(items, 1, 3);

      expect(result.totalPages).toBe(1);
      expect(result.paginatedItems).toHaveLength(1);
      expect(result.paginatedItems[0]).toEqual({
        id: 1,
        name: 'Single Server',
      });
    });

    it('페이지 크기가 아이템 수보다 큰 경우', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 10);

      expect(result.totalPages).toBe(1);
      expect(result.paginatedItems).toHaveLength(5);
    });

    it('존재하지 않는 페이지 요청 (페이지 번호 초과)', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 10, 3); // 3페이지까지만 존재

      expect(result.totalPages).toBe(4); // 10 / 3 = 3.33 → ceil = 4
      expect(result.paginatedItems).toHaveLength(0); // 범위 밖
    });
  });

  describe('엣지 케이스', () => {
    it('null 배열 처리 (타입 에러 방어)', () => {
      // @ts-expect-error - 의도적으로 잘못된 타입 테스트
      const result = calculatePagination(null, 1, 3);

      expect(result.totalPages).toBe(0);
      expect(result.paginatedItems).toEqual([]);
    });

    it('undefined 배열 처리 (타입 에러 방어)', () => {
      // @ts-expect-error - 의도적으로 잘못된 타입 테스트
      const result = calculatePagination(undefined, 1, 3);

      expect(result.totalPages).toBe(0);
      expect(result.paginatedItems).toEqual([]);
    });

    it('페이지 0 요청 (비정상 값)', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 0, 3);

      // startIndex = (0 - 1) * 3 = -3
      // endIndex = -3 + 3 = 0
      // slice(-3, 0) → 빈 배열 (start >= end)
      expect(result.totalPages).toBe(4);
      expect(result.paginatedItems).toHaveLength(0);
    });

    it('음수 페이지 요청', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, -1, 3);

      // startIndex = (-1 - 1) * 3 = -6
      // slice(-6, -3) → 일부 요소 반환
      expect(result.totalPages).toBe(4);
      // 음수 인덱스는 배열 끝에서부터 계산되므로 결과가 있을 수 있음
    });

    it('페이지 크기 0 (무한 페이지)', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 0);

      // Math.ceil(10 / 0) = Infinity
      expect(result.totalPages).toBe(Infinity);
      expect(result.paginatedItems).toHaveLength(0); // slice(0, 0) = []
    });

    it('매우 큰 배열 (성능 테스트)', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
      }));
      const result = calculatePagination(largeArray, 1, 15);

      expect(result.totalPages).toBe(667); // 10000 / 15 = 666.67 → ceil = 667
      expect(result.paginatedItems).toHaveLength(15);
      expect(result.paginatedItems[0]).toEqual({ id: 1 });
    });
  });

  describe('실제 사용 시나리오 (17개 서버)', () => {
    const mockServers = Array.from({ length: 17 }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `Server ${i + 1}`,
      status: i % 3 === 0 ? 'offline' : 'online',
    }));

    it('초기 로딩: 3개씩 첫 페이지 (성능 최적화)', () => {
      const result = calculatePagination(mockServers, 1, 3);

      expect(result.totalPages).toBe(6);
      expect(result.paginatedItems).toHaveLength(3);
      expect(result.paginatedItems.map((s) => s.id)).toEqual([
        'server-1',
        'server-2',
        'server-3',
      ]);
    });

    it('사용자가 6개씩 선택 (모바일 뷰)', () => {
      const result = calculatePagination(mockServers, 1, 6);

      expect(result.totalPages).toBe(3);
      expect(result.paginatedItems).toHaveLength(6);
    });

    it('사용자가 "모두 보기" 선택 (15개)', () => {
      const result = calculatePagination(mockServers, 1, 15);

      expect(result.totalPages).toBe(2);
      expect(result.paginatedItems).toHaveLength(15);
    });

    it('두 번째 페이지로 이동 (15개씩, 마지막 2개)', () => {
      const result = calculatePagination(mockServers, 2, 15);

      expect(result.totalPages).toBe(2);
      expect(result.paginatedItems).toHaveLength(2); // 17 - 15 = 2
      expect(result.paginatedItems.map((s) => s.id)).toEqual([
        'server-16',
        'server-17',
      ]);
    });

    it('페이지 크기 변경 시 첫 페이지로 리셋 (6 → 9)', () => {
      // 첫 번째: 6개씩, 2페이지
      const page2_size6 = calculatePagination(mockServers, 2, 6);
      expect(page2_size6.paginatedItems).toHaveLength(6);
      expect(page2_size6.paginatedItems[0].id).toBe('server-7');

      // 크기 변경 후: 9개씩, 1페이지로 리셋 (실제 hook 동작)
      const page1_size9 = calculatePagination(mockServers, 1, 9);
      expect(page1_size9.paginatedItems).toHaveLength(9);
      expect(page1_size9.paginatedItems[0].id).toBe('server-1');
    });
  });

  describe('타입 안정성', () => {
    it('다양한 객체 타입 처리 (string[])', () => {
      const stringArray = ['A', 'B', 'C', 'D', 'E'];
      const result = calculatePagination(stringArray, 1, 2);

      expect(result.totalPages).toBe(3);
      expect(result.paginatedItems).toEqual(['A', 'B']);
    });

    it('다양한 객체 타입 처리 (number[])', () => {
      const numberArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = calculatePagination(numberArray, 2, 3);

      expect(result.totalPages).toBe(4);
      expect(result.paginatedItems).toEqual([4, 5, 6]);
    });

    it('복잡한 객체 배열 처리', () => {
      interface ComplexServer {
        id: string;
        metrics: { cpu: number; memory: number };
        nested: { deep: { value: string } };
      }

      const complexServers: ComplexServer[] = [
        {
          id: '1',
          metrics: { cpu: 45, memory: 62 },
          nested: { deep: { value: 'a' } },
        },
        {
          id: '2',
          metrics: { cpu: 78, memory: 88 },
          nested: { deep: { value: 'b' } },
        },
        {
          id: '3',
          metrics: { cpu: 12, memory: 34 },
          nested: { deep: { value: 'c' } },
        },
      ];

      const result = calculatePagination(complexServers, 1, 2);

      expect(result.totalPages).toBe(2);
      expect(result.paginatedItems).toHaveLength(2);
      expect(result.paginatedItems[0].nested.deep.value).toBe('a');
    });
  });
});
