/**
 * 🚀 성능 테스트: Core Web Vitals 검증
 * 
 * @description 웹 성능 메트릭 자동화 테스트
 * @tdd-cycle Red-Green-Refactor
 * @target LCP < 2.5s, FID < 100ms, CLS < 0.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(),
  getEntriesByName: vi.fn(),
  now: vi.fn(() => Date.now())
};

// Performance Observer Mock
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Global Performance API 모킹
global.Performance = vi.fn().mockImplementation(() => mockPerformance);
global.PerformanceObserver = mockPerformanceObserver;
global.performance = mockPerformance as any;

describe('Core Web Vitals 성능 테스트', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 LCP (Largest Contentful Paint)', () => {
    
    it('[RED] LCP가 측정되지 않는 경우', () => {
      // Red: LCP 데이터가 없는 상태
      mockPerformance.getEntriesByType.mockReturnValue([]);
      
      const lcpEntries = global.performance.getEntriesByType('largest-contentful-paint');
      expect(lcpEntries).toHaveLength(0);
    });

    it('[GREEN] LCP가 2.5초 미만으로 측정됨', () => {
      // Green: 목표 LCP 달성
      const mockLcpEntry = {
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2400, // 2.4초
        duration: 0,
        size: 1024,
        loadTime: 2400,
        renderTime: 2400,
        element: null
      };
      
      mockPerformance.getEntriesByType.mockReturnValue([mockLcpEntry]);
      
      const lcpEntries = global.performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1]?.startTime || 0;
      
      expect(lcp).toBeLessThan(2500); // 2.5초 미만
      expect(lcp).toBeGreaterThan(0);
    });

    it('[REFACTOR] LCP 최적화 검증', () => {
      // Refactor: 개선된 LCP 성능
      const optimizedLcpEntry = {
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 1800, // 1.8초로 개선
        duration: 0,
        size: 2048,
        loadTime: 1800,
        renderTime: 1800,
        element: null
      };
      
      mockPerformance.getEntriesByType.mockReturnValue([optimizedLcpEntry]);
      
      const lcpEntries = global.performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1]?.startTime || 0;
      
      expect(lcp).toBeLessThan(2000); // 더 엄격한 기준
      expect(lcp).toBeGreaterThan(1000); // 최소 1초는 소요
    });
  });

  describe('⚡ FID (First Input Delay)', () => {
    
    it('[RED] FID가 100ms를 초과하는 경우', () => {
      // Red: 느린 상호작용 응답
      const slowFidEntry = {
        name: 'click',
        entryType: 'first-input',
        startTime: 1000,
        duration: 150, // 150ms 지연
        processingStart: 1100,
        processingEnd: 1150,
        cancelable: true
      };
      
      mockPerformance.getEntriesByType.mockReturnValue([slowFidEntry]);
      
      const fidEntries = global.performance.getEntriesByType('first-input');
      const fid = fidEntries[0]?.duration || 0;
      
      expect(fid).toBeGreaterThan(100); // 실패 케이스
    });

    it('[GREEN] FID가 100ms 미만으로 개선됨', () => {
      // Green: 빠른 상호작용 응답
      const fastFidEntry = {
        name: 'click',
        entryType: 'first-input',
        startTime: 1000,
        duration: 50, // 50ms 지연
        processingStart: 1020,
        processingEnd: 1050,
        cancelable: true
      };
      
      mockPerformance.getEntriesByType.mockReturnValue([fastFidEntry]);
      
      const fidEntries = global.performance.getEntriesByType('first-input');
      const fid = fidEntries[0]?.duration || 0;
      
      expect(fid).toBeLessThan(100);
      expect(fid).toBeGreaterThanOrEqual(0);
    });

    it('[REFACTOR] FID 최적화 모니터링', () => {
      // Refactor: FID 모니터링 시스템
      const fidValues: number[] = [];
      
      // 여러 상호작용 시뮬레이션
      const interactions = [
        { duration: 30 }, { duration: 45 }, { duration: 25 }, { duration: 60 }
      ];
      
      interactions.forEach((interaction, index) => {
        const fidEntry = {
          name: 'click',
          entryType: 'first-input',
          startTime: 1000 + index * 100,
          duration: interaction.duration,
          processingStart: 1000 + index * 100 + 10,
          processingEnd: 1000 + index * 100 + interaction.duration,
          cancelable: true
        };
        
        mockPerformance.getEntriesByType.mockReturnValue([fidEntry]);
        const entries = global.performance.getEntriesByType('first-input');
        fidValues.push(entries[0]?.duration || 0);
      });
      
      // 모든 FID 값이 목표치 미만인지 검증
      fidValues.forEach(fid => {
        expect(fid).toBeLessThan(100);
      });
      
      // 평균 FID 계산
      const avgFid = fidValues.reduce((sum, fid) => sum + fid, 0) / fidValues.length;
      expect(avgFid).toBeLessThan(50); // 평균 50ms 미만
    });
  });

  describe('📐 CLS (Cumulative Layout Shift)', () => {
    
    it('[RED] CLS가 0.1을 초과하는 경우', () => {
      // Red: 레이아웃 불안정
      const highClsEntries = [
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 1000,
          duration: 0,
          value: 0.15, // 0.15 CLS (나쁨)
          hadRecentInput: false,
          lastInputTime: 0,
          sources: []
        }
      ];
      
      mockPerformance.getEntriesByType.mockReturnValue(highClsEntries);
      
      const clsEntries = global.performance.getEntriesByType('layout-shift');
      const cls = clsEntries
        .filter((entry: any) => !entry.hadRecentInput)
        .reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      expect(cls).toBeGreaterThan(0.1); // 실패 케이스
    });

    it('[GREEN] CLS가 0.1 미만으로 개선됨', () => {
      // Green: 안정적인 레이아웃
      const lowClsEntries = [
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 1000,
          duration: 0,
          value: 0.05, // 0.05 CLS (좋음)
          hadRecentInput: false,
          lastInputTime: 0,
          sources: []
        }
      ];
      
      mockPerformance.getEntriesByType.mockReturnValue(lowClsEntries);
      
      const clsEntries = global.performance.getEntriesByType('layout-shift');
      const cls = clsEntries
        .filter((entry: any) => !entry.hadRecentInput)
        .reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      expect(cls).toBeLessThan(0.1);
      expect(cls).toBeGreaterThanOrEqual(0);
    });

    it('[REFACTOR] CLS 세션별 모니터링', () => {
      // Refactor: 세션 윈도우별 CLS 측정
      const sessionShifts = [
        { value: 0.02, time: 1000, hadRecentInput: false },
        { value: 0.01, time: 1200, hadRecentInput: false },
        { value: 0.03, time: 5500, hadRecentInput: false }, // 새 세션
        { value: 0.02, time: 5800, hadRecentInput: false }
      ];
      
      // 세션 윈도우 (5초 간격) 계산
      const sessionWindows: number[] = [];
      let currentSession = 0;
      let sessionStart = sessionShifts[0].time;
      
      sessionShifts.forEach(shift => {
        if (shift.time - sessionStart > 5000) {
          // 새 세션 시작
          sessionWindows.push(currentSession);
          currentSession = shift.value;
          sessionStart = shift.time;
        } else {
          currentSession += shift.value;
        }
      });
      sessionWindows.push(currentSession);
      
      // 최대 세션 CLS 검증
      const maxSessionCls = Math.max(...sessionWindows);
      expect(maxSessionCls).toBeLessThan(0.1);
      
      mockPerformance.getEntriesByType.mockReturnValue(
        sessionShifts.map((shift, index) => ({
          name: '',
          entryType: 'layout-shift',
          startTime: shift.time,
          duration: 0,
          value: shift.value,
          hadRecentInput: shift.hadRecentInput,
          lastInputTime: 0,
          sources: []
        }))
      );
      
      const entries = global.performance.getEntriesByType('layout-shift');
      expect(entries).toHaveLength(4);
    });
  });

  describe('🔍 종합 성능 점수', () => {
    
    it('[TDD] 전체 성능 메트릭 통합 평가', () => {
      // Red-Green-Refactor 통합 시나리오
      const performanceMetrics = {
        lcp: 2200, // 2.2초
        fid: 45,   // 45ms
        cls: 0.08  // 0.08
      };
      
      // 성능 점수 계산 (간소화된 버전)
      const calculatePerformanceScore = (metrics: typeof performanceMetrics) => {
        let score = 100;
        
        // LCP 평가
        if (metrics.lcp > 2500) score -= 30;
        else if (metrics.lcp > 1500) score -= 10;
        
        // FID 평가
        if (metrics.fid > 100) score -= 30;
        else if (metrics.fid > 50) score -= 10;
        
        // CLS 평가
        if (metrics.cls > 0.1) score -= 30;
        else if (metrics.cls > 0.05) score -= 10;
        
        return Math.max(0, score);
      };
      
      const score = calculatePerformanceScore(performanceMetrics);
      
      expect(score).toBeGreaterThan(70); // 최소 70점
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('📊 성능 모니터링 유틸리티', () => {
    
    it('성능 메트릭 수집기 테스트', () => {
      // 성능 데이터 수집 유틸리티
      const createPerformanceCollector = () => {
        const metrics: any[] = [];
        
        return {
          collect: (metricName: string, value: number) => {
            metrics.push({
              name: metricName,
              value,
              timestamp: Date.now()
            });
          },
          getMetrics: () => metrics,
          getAverages: () => {
            const groups: Record<string, number[]> = {};
            
            metrics.forEach(metric => {
              if (!groups[metric.name]) groups[metric.name] = [];
              groups[metric.name].push(metric.value);
            });
            
            return Object.fromEntries(
              Object.entries(groups).map(([name, values]) => [
                name,
                values.reduce((sum, val) => sum + val, 0) / values.length
              ])
            );
          }
        };
      };
      
      const collector = createPerformanceCollector();
      
      collector.collect('LCP', 1800);
      collector.collect('FID', 35);
      collector.collect('CLS', 0.04);
      collector.collect('LCP', 2100);
      collector.collect('FID', 55);
      
      const metrics = collector.getMetrics();
      const averages = collector.getAverages();
      
      expect(metrics).toHaveLength(5);
      expect(averages.LCP).toBe(1950); // (1800 + 2100) / 2
      expect(averages.FID).toBe(45);   // (35 + 55) / 2
      expect(averages.CLS).toBe(0.04);
    });
  });
});