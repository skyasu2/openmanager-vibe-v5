/**
 * 🧪 ML 강화된 IncidentReportService 테스트
 *
 * MLDataManager와 GCPFunctionsService 통합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { incidentReportService } from '@/services/ai/IncidentReportService';
import { mlDataManager } from '@/services/ml/MLDataManager';
import type { ServerStateComparison } from '@/services/ai/IncidentReportService';

describe('IncidentReportService - ML 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateIncidentReport', () => {
    it('ML 캐싱이 적용되어야 함', async () => {
      // MLDataManager 캐싱 모킹
      vi.spyOn(mlDataManager, 'getCachedData').mockResolvedValue(null);
      vi.spyOn(mlDataManager, 'cacheIncidentReport').mockResolvedValue(
        undefined
      );

      const comparison: ServerStateComparison = {
        current: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 95,
            memory_usage: 80,
            disk_usage: 70,
            response_time: 500,
            status: 'critical',
            uptime: 99.5,
            timestamp: new Date().toISOString(),
          },
        ],
        previous: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 50,
            memory_usage: 60,
            disk_usage: 65,
            response_time: 100,
            status: 'healthy',
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        changes: [],
      };

      const report =
        await incidentReportService.generateIncidentReport(comparison);

      expect(report).toBeDefined();
      expect(report.severity).toBe('critical');
      expect(report.affectedServers).toContain('Server-01');

      // 캐싱 호출 확인
      expect(mlDataManager.cacheIncidentReport).toHaveBeenCalledWith(
        report.id,
        report
      );
    });

    it('학습된 패턴을 근본 원인 분석에 활용해야 함', async () => {
      const comparison: ServerStateComparison = {
        current: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 90,
            memory_usage: 95,
            disk_usage: 70,
            response_time: 2000,
            status: 'critical',
            uptime: 99.5,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'server-2',
            server_id: 'Server-02',
            hostname: 'Server-02',
            cpu_usage: 88,
            memory_usage: 92,
            disk_usage: 68,
            response_time: 1800,
            status: 'critical',
            uptime: 99.3,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'server-3',
            server_id: 'Server-03',
            hostname: 'Server-03',
            cpu_usage: 92,
            memory_usage: 89,
            disk_usage: 72,
            response_time: 2200,
            status: 'critical',
            uptime: 99.1,
            timestamp: new Date().toISOString(),
          },
        ],
        previous: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 40,
            memory_usage: 50,
            disk_usage: 65,
            response_time: 100,
            status: 'healthy',
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'server-2',
            server_id: 'Server-02',
            hostname: 'Server-02',
            cpu_usage: 35,
            memory_usage: 45,
            disk_usage: 60,
            response_time: 90,
            status: 'healthy',
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'server-3',
            server_id: 'Server-03',
            hostname: 'Server-03',
            cpu_usage: 38,
            memory_usage: 48,
            disk_usage: 63,
            response_time: 95,
            status: 'healthy',
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        changes: [],
      };

      const report =
        await incidentReportService.generateIncidentReport(comparison);

      // 패턴 기반 분석 확인
      expect(report.rootCause).toContain('메모리 사용량 지속 증가');
      expect(report.rootCause).toContain('다중 서버 동시 CPU 급증');
    });

    it('해결 방안에 학습된 솔루션이 포함되어야 함', async () => {
      const comparison: ServerStateComparison = {
        current: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 95,
            memory_usage: 90,
            disk_usage: 70,
            response_time: 5500,
            status: 'critical',
            uptime: 99.5,
            timestamp: new Date().toISOString(),
          },
        ],
        previous: [
          {
            id: 'server-1',
            server_id: 'Server-01',
            hostname: 'Server-01',
            cpu_usage: 40,
            memory_usage: 50,
            disk_usage: 65,
            response_time: 100,
            status: 'healthy',
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        changes: [],
      };

      const report =
        await incidentReportService.generateIncidentReport(comparison);

      // 기본 해결책 확인
      expect(report.resolution).toContain('CPU 사용률이 높은 프로세스 확인');
      expect(report.resolution).toContain('메모리 누수 확인');
      expect(report.resolution).toContain('네트워크 연결 상태 확인');
    });
  });

  describe('getAllReports', () => {
    it('캐시된 보고서를 반환해야 함', async () => {
      const cachedReports = [
        {
          id: 'INC-1',
          title: '테스트 보고서',
          severity: 'warning' as const,
          timestamp: new Date().toISOString(),
          // ... 기타 필드
        },
      ];

      vi.spyOn(mlDataManager, 'getCachedData').mockResolvedValue(cachedReports);
      vi.spyOn(mlDataManager, 'setCachedData').mockResolvedValue(undefined);

      const reports = await incidentReportService.getAllReports();

      expect(mlDataManager.getCachedData).toHaveBeenCalledWith(
        'incident:reports:all'
      );
      expect(reports).toEqual(cachedReports);
    });
  });

  describe('연쇄 장애 감지', () => {
    it('여러 서버의 연쇄적 장애를 감지해야 함', async () => {
      const comparison: ServerStateComparison = {
        current: [
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `server-${i + 1}`,
            server_id: `Server-${String(i + 1).padStart(2, '0')}`,
            hostname: `Server-${String(i + 1).padStart(2, '0')}`,
            cpu_usage: 90 + i,
            memory_usage: 85 + i,
            disk_usage: 70,
            response_time: 3000 + i * 500,
            status: 'critical' as const,
            uptime: 99.5 - i * 0.1,
            timestamp: new Date().toISOString(),
          })),
        ],
        previous: [
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `server-${i + 1}`,
            server_id: `Server-${String(i + 1).padStart(2, '0')}`,
            hostname: `Server-${String(i + 1).padStart(2, '0')}`,
            cpu_usage: 40,
            memory_usage: 50,
            disk_usage: 65,
            response_time: 100,
            status: 'healthy' as const,
            uptime: 99.9,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          })),
        ],
        changes: [],
      };

      const report =
        await incidentReportService.generateIncidentReport(comparison);

      expect(report.severity).toBe('critical');
      expect(report.rootCause).toContain('연쇄 장애 패턴 감지');
      expect(report.affectedServers.length).toBe(5);
    });
  });
});
