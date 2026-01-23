/**
 * 🔗 /api/servers/all Integration Test
 *
 * 서버 정렬/검색/페이지네이션 통합 로직 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ 외부 API 호출 없음 (순수 함수 테스트)
 * - ✅ DB 연결 없음
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';

// 🎯 API 라우트에서 추출한 순수 함수들 테스트

// 유효한 정렬 키 목록
const VALID_SORT_KEYS = [
  'name',
  'cpu',
  'memory',
  'disk',
  'network',
  'uptime',
] as const;

type SortableKey = (typeof VALID_SORT_KEYS)[number];

interface Server {
  id: string;
  name: string;
  hostname?: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime?: number;
  location?: string;
}

// 정렬 키 검증 함수
function validateSortBy(value: string | null): SortableKey {
  if (!value || !VALID_SORT_KEYS.includes(value as SortableKey)) {
    return 'name';
  }
  return value as SortableKey;
}

// 서버 정렬 비교 함수 생성
function createServerComparator(
  sortBy: SortableKey,
  sortOrder: 'asc' | 'desc'
): (a: Server, b: Server) => number {
  const dir = sortOrder === 'asc' ? 1 : -1;

  const comparators: Record<SortableKey, (a: Server, b: Server) => number> = {
    cpu: (a, b) => (a.cpu - b.cpu) * dir,
    memory: (a, b) => (a.memory - b.memory) * dir,
    disk: (a, b) => (a.disk - b.disk) * dir,
    network: (a, b) => {
      const aNetwork = typeof a.network === 'number' ? a.network : 0;
      const bNetwork = typeof b.network === 'number' ? b.network : 0;
      return (aNetwork - bNetwork) * dir;
    },
    uptime: (a, b) => {
      const aUptime = typeof a.uptime === 'number' ? a.uptime : 0;
      const bUptime = typeof b.uptime === 'number' ? b.uptime : 0;
      return (aUptime - bUptime) * dir;
    },
    name: (a, b) => (a.name || '').localeCompare(b.name || '') * dir,
  };

  return comparators[sortBy];
}

// 검색 필터 함수
function filterServers(servers: Server[], search: string): Server[] {
  if (!search) return servers;

  const searchLower = search.toLowerCase();
  return servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchLower) ||
      (server.hostname || '').toLowerCase().includes(searchLower) ||
      server.status.toLowerCase().includes(searchLower) ||
      (server.type || '').toLowerCase().includes(searchLower)
  );
}

// 페이지네이션 계산
function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: startIndex + limit < total,
      hasPrev: page > 1,
    },
  };
}

// Mock server data
const mockServers: Server[] = [
  {
    id: 'web-01',
    name: 'Web Server 01',
    hostname: 'web-01.local',
    type: 'web',
    status: 'online',
    cpu: 45,
    memory: 60,
    disk: 30,
    network: 25,
    uptime: 86400,
    location: 'Seoul',
  },
  {
    id: 'api-01',
    name: 'API Server 01',
    hostname: 'api-01.local',
    type: 'api',
    status: 'warning',
    cpu: 75,
    memory: 80,
    disk: 45,
    network: 50,
    uptime: 172800,
    location: 'Seoul',
  },
  {
    id: 'db-01',
    name: 'Database Server 01',
    hostname: 'db-01.local',
    type: 'database',
    status: 'critical',
    cpu: 90,
    memory: 95,
    disk: 85,
    network: 20,
    uptime: 259200,
    location: 'Tokyo',
  },
];

describe('/api/servers/all Integration - Pure Functions', () => {
  describe('validateSortBy - 정렬 키 검증', () => {
    it('유효한 키는 그대로 반환', () => {
      expect(validateSortBy('cpu')).toBe('cpu');
      expect(validateSortBy('memory')).toBe('memory');
      expect(validateSortBy('disk')).toBe('disk');
      expect(validateSortBy('network')).toBe('network');
      expect(validateSortBy('uptime')).toBe('uptime');
      expect(validateSortBy('name')).toBe('name');
    });

    it('유효하지 않은 키는 name 반환', () => {
      expect(validateSortBy('invalid')).toBe('name');
      expect(validateSortBy('hack_attempt')).toBe('name');
      expect(validateSortBy('')).toBe('name');
    });

    it('null은 name 반환', () => {
      expect(validateSortBy(null)).toBe('name');
    });
  });

  describe('createServerComparator - 정렬 비교 함수', () => {
    it('CPU 내림차순 정렬', () => {
      const comparator = createServerComparator('cpu', 'desc');
      const sorted = [...mockServers].sort(comparator);

      // CPU: db-01(90) > api-01(75) > web-01(45)
      expect(sorted[0].id).toBe('db-01');
      expect(sorted[1].id).toBe('api-01');
      expect(sorted[2].id).toBe('web-01');
    });

    it('CPU 오름차순 정렬', () => {
      const comparator = createServerComparator('cpu', 'asc');
      const sorted = [...mockServers].sort(comparator);

      // CPU: web-01(45) < api-01(75) < db-01(90)
      expect(sorted[0].id).toBe('web-01');
      expect(sorted[1].id).toBe('api-01');
      expect(sorted[2].id).toBe('db-01');
    });

    it('Memory 오름차순 정렬', () => {
      const comparator = createServerComparator('memory', 'asc');
      const sorted = [...mockServers].sort(comparator);

      // Memory: web-01(60) < api-01(80) < db-01(95)
      expect(sorted[0].id).toBe('web-01');
      expect(sorted[1].id).toBe('api-01');
      expect(sorted[2].id).toBe('db-01');
    });

    it('Disk 내림차순 정렬', () => {
      const comparator = createServerComparator('disk', 'desc');
      const sorted = [...mockServers].sort(comparator);

      // Disk: db-01(85) > api-01(45) > web-01(30)
      expect(sorted[0].id).toBe('db-01');
      expect(sorted[1].id).toBe('api-01');
      expect(sorted[2].id).toBe('web-01');
    });

    it('Network 내림차순 정렬', () => {
      const comparator = createServerComparator('network', 'desc');
      const sorted = [...mockServers].sort(comparator);

      // Network: api-01(50) > web-01(25) > db-01(20)
      expect(sorted[0].id).toBe('api-01');
      expect(sorted[1].id).toBe('web-01');
      expect(sorted[2].id).toBe('db-01');
    });

    it('Uptime 내림차순 정렬', () => {
      const comparator = createServerComparator('uptime', 'desc');
      const sorted = [...mockServers].sort(comparator);

      // Uptime: db-01(259200) > api-01(172800) > web-01(86400)
      expect(sorted[0].id).toBe('db-01');
      expect(sorted[1].id).toBe('api-01');
      expect(sorted[2].id).toBe('web-01');
    });

    it('Name 오름차순 정렬', () => {
      const comparator = createServerComparator('name', 'asc');
      const sorted = [...mockServers].sort(comparator);

      // Name: API(A) < Database(D) < Web(W)
      expect(sorted[0].name).toBe('API Server 01');
      expect(sorted[1].name).toBe('Database Server 01');
      expect(sorted[2].name).toBe('Web Server 01');
    });
  });

  describe('filterServers - 검색 필터', () => {
    it('이름으로 필터링', () => {
      const filtered = filterServers(mockServers, 'Web');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('web-01');
    });

    it('대소문자 구분 없이 검색', () => {
      const filtered = filterServers(mockServers, 'api');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('api-01');
    });

    it('status로 필터링', () => {
      const filtered = filterServers(mockServers, 'critical');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('db-01');
    });

    it('type으로 필터링', () => {
      const filtered = filterServers(mockServers, 'database');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('db-01');
    });

    it('hostname으로 필터링', () => {
      const filtered = filterServers(mockServers, 'api-01.local');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('api-01');
    });

    it('검색어 없으면 전체 반환', () => {
      const filtered = filterServers(mockServers, '');
      expect(filtered).toHaveLength(3);
    });

    it('매칭 없으면 빈 배열', () => {
      const filtered = filterServers(mockServers, 'nonexistent');
      expect(filtered).toHaveLength(0);
    });

    it('부분 문자열 매칭', () => {
      const filtered = filterServers(mockServers, 'Server');
      expect(filtered).toHaveLength(3); // 모든 서버 이름에 'Server' 포함
    });
  });

  describe('paginate - 페이지네이션', () => {
    it('첫 페이지, limit=2', () => {
      const result = paginate(mockServers, 1, 2);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('두번째 페이지, limit=2', () => {
      const result = paginate(mockServers, 2, 2);

      expect(result.items).toHaveLength(1); // 나머지 1개
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('전체 반환 (limit >= total)', () => {
      const result = paginate(mockServers, 1, 10);

      expect(result.items).toHaveLength(3);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('빈 배열 처리', () => {
      const result = paginate([], 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('페이지 범위 초과 시 빈 배열', () => {
      const result = paginate(mockServers, 10, 2);

      expect(result.items).toHaveLength(0);
      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('통합 시나리오', () => {
    it('검색 + 정렬 + 페이지네이션 조합', () => {
      // Given - 'online' 상태 서버만 CPU 내림차순으로 정렬, 1페이지 2개
      const servers: Server[] = [
        ...mockServers,
        {
          id: 'web-02',
          name: 'Web Server 02',
          hostname: 'web-02.local',
          type: 'web',
          status: 'online',
          cpu: 55,
          memory: 50,
          disk: 20,
          network: 30,
          uptime: 43200,
          location: 'Seoul',
        },
      ];

      // When - 'online'으로 검색 (web-01, web-02 - status가 online인 서버)
      const filtered = filterServers(servers, 'online');
      expect(filtered).toHaveLength(2);

      // CPU 내림차순 정렬
      const comparator = createServerComparator('cpu', 'desc');
      const sorted = [...filtered].sort(comparator);

      // Then - web-02(55) > web-01(45)
      expect(sorted[0].cpu).toBe(55);
      expect(sorted[1].cpu).toBe(45);

      // 페이지네이션
      const result = paginate(sorted, 1, 1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('web-02');
      expect(result.pagination.hasNext).toBe(true);
    });

    it('warning 상태 서버만 조회', () => {
      const filtered = filterServers(mockServers, 'warning');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('warning');
      expect(filtered[0].id).toBe('api-01');
    });

    it('web 타입 서버만 조회 후 메모리순 정렬', () => {
      const servers: Server[] = [
        ...mockServers,
        {
          id: 'web-02',
          name: 'Web Server 02',
          hostname: 'web-02.local',
          type: 'web',
          status: 'online',
          cpu: 40,
          memory: 75,
          disk: 25,
          network: 35,
          location: 'Seoul',
        },
      ];

      const filtered = filterServers(servers, 'web');
      expect(filtered).toHaveLength(2);

      const comparator = createServerComparator('memory', 'asc');
      const sorted = [...filtered].sort(comparator);

      // web-01(60) < web-02(75)
      expect(sorted[0].memory).toBe(60);
      expect(sorted[1].memory).toBe(75);
    });
  });

  describe('데이터 무결성', () => {
    it('정렬 후 원본 배열 변경 없음', () => {
      const original = [...mockServers];
      const comparator = createServerComparator('cpu', 'desc');
      [...mockServers].sort(comparator); // 정렬 수행 (결과 사용하지 않음)

      // 원본 순서 유지
      expect(mockServers[0].id).toBe(original[0].id);
      expect(mockServers[1].id).toBe(original[1].id);
      expect(mockServers[2].id).toBe(original[2].id);
    });

    it('필터링 후 원본 배열 변경 없음', () => {
      const originalLength = mockServers.length;
      filterServers(mockServers, 'web');

      expect(mockServers).toHaveLength(originalLength);
    });

    it('모든 서버에 필수 필드 존재', () => {
      const requiredFields = [
        'id',
        'name',
        'type',
        'status',
        'cpu',
        'memory',
        'disk',
        'network',
      ];

      for (const server of mockServers) {
        for (const field of requiredFields) {
          expect(server).toHaveProperty(field);
        }
      }
    });

    it('메트릭 값이 숫자 타입', () => {
      const metricFields = ['cpu', 'memory', 'disk', 'network'] as const;

      for (const server of mockServers) {
        for (const field of metricFields) {
          expect(typeof server[field]).toBe('number');
        }
      }
    });
  });
});
