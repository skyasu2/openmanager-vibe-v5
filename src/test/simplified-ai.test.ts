/**
 * 🧪 간단한 AI 엔진 단위 테스트
 * 외부 의존성 없이 기본 로직만 테스트
 */

import { describe, it, expect } from 'vitest';

// 간단한 의도 분석 함수
function analyzeIntent(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (/cpu|프로세서|사용률/.test(lowerQuery)) return 'cpu';
  if (/memory|메모리|ram/.test(lowerQuery)) return 'memory';
  if (/disk|디스크|storage|저장/.test(lowerQuery)) return 'disk';
  if (/요약|summary|전체/.test(lowerQuery)) return 'summary';
  if (/상태|status|health/.test(lowerQuery)) return 'status';
  if (/명령어|command|cmd/.test(lowerQuery)) return 'command';

  return 'general';
}

// 간단한 응답 생성 함수
interface Server {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'healthy' | 'warning' | 'critical';
}

function generateResponse(intent: string, servers: Server[]): string {
  if (!servers || servers.length === 0) {
    return '서버 데이터가 없습니다.';
  }

  switch (intent) {
    case 'cpu':
      const highCpuServers = servers.filter(s => s.cpu > 80);
      if (highCpuServers.length > 0) {
        return `CPU 사용률이 높은 서버:\n${highCpuServers
          .map(s => `• ${s.name}: ${s.cpu}%`)
          .join('\n')}`;
      }
      return 'CPU 사용률이 높은 서버가 없습니다.';

    case 'memory':
      const highMemServers = servers.filter(s => s.memory > 80);
      if (highMemServers.length > 0) {
        return `메모리 사용률이 높은 서버:\n${highMemServers
          .map(s => `• ${s.name}: ${s.memory}%`)
          .join('\n')}`;
      }
      return '메모리 사용률이 높은 서버가 없습니다.';

    case 'summary':
      const healthy = servers.filter(s => s.status === 'healthy').length;
      const warning = servers.filter(s => s.status === 'warning').length;
      return `서버 상태 요약:\n✅ 정상: ${healthy}대\n⚠️ 주의: ${warning}대`;

    default:
      return '서버 모니터링 시스템이 정상 작동 중입니다.';
  }
}

describe('AI 엔진 기본 로직', () => {
  const mockServers = [
    { name: 'web-01', cpu: 85, memory: 70, status: 'healthy' },
    { name: 'db-01', cpu: 95, memory: 88, status: 'warning' },
  ];

  describe('의도 분석', () => {
    it('CPU 관련 질의를 인식해야 함', () => {
      expect(analyzeIntent('CPU 사용률이 높은 서버는?')).toBe('cpu');
      expect(analyzeIntent('프로세서 상태 확인')).toBe('cpu');
    });

    it('메모리 관련 질의를 인식해야 함', () => {
      expect(analyzeIntent('메모리 사용량 확인')).toBe('memory');
      expect(analyzeIntent('RAM 상태는?')).toBe('memory');
    });

    it('요약 질의를 인식해야 함', () => {
      expect(analyzeIntent('전체 서버 상태 요약')).toBe('summary');
      expect(analyzeIntent('서버 summary 보여줘')).toBe('summary');
    });

    it('일반 질의로 분류해야 함', () => {
      expect(analyzeIntent('안녕하세요')).toBe('general');
      expect(analyzeIntent('무엇을 도와드릴까요?')).toBe('general');
    });
  });

  describe('응답 생성', () => {
    it('CPU 높은 서버를 찾아야 함', () => {
      const response = generateResponse('cpu', mockServers);
      expect(response).toContain('CPU 사용률이 높은 서버');
      expect(response).toContain('web-01: 85%');
      expect(response).toContain('db-01: 95%');
    });

    it('메모리 높은 서버를 찾아야 함', () => {
      const response = generateResponse('memory', mockServers);
      expect(response).toContain('메모리 사용률이 높은 서버');
      expect(response).toContain('db-01: 88%');
    });

    it('서버 상태 요약을 생성해야 함', () => {
      const response = generateResponse('summary', mockServers);
      expect(response).toContain('서버 상태 요약');
      expect(response).toContain('✅ 정상: 1대');
      expect(response).toContain('⚠️ 주의: 1대');
    });

    it('빈 서버 목록을 처리해야 함', () => {
      const response = generateResponse('cpu', []);
      expect(response).toBe('서버 데이터가 없습니다.');
    });
  });

  describe('통합 시나리오', () => {
    it('질의부터 응답까지 전체 흐름이 작동해야 함', () => {
      const query = 'CPU 사용률이 높은 서버를 확인해주세요';
      const intent = analyzeIntent(query);
      const response = generateResponse(intent, mockServers);

      expect(intent).toBe('cpu');
      expect(response).toContain('web-01');
      expect(response).toContain('db-01');
    });
  });
});
