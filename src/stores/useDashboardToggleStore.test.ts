/**
 * useDashboardToggleStore Unit Tests
 *
 * @description 대시보드 섹션 토글 상태 관리 스토어 테스트
 * @created 2026-01-22
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useDashboardToggleStore } from './useDashboardToggleStore';

describe('useDashboardToggleStore', () => {
  // 각 테스트 전 스토어 상태 초기화
  beforeEach(() => {
    const { result } = renderHook(() => useDashboardToggleStore());
    act(() => {
      result.current.resetToDefaults();
    });
  });

  describe('초기 상태', () => {
    it('모든 섹션이 기본적으로 펼쳐져 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());

      // Then
      expect(result.current.sections.liveSystemAlerts).toBe(true);
      expect(result.current.sections.recentEvents).toBe(true);
      expect(result.current.sections.networkStats).toBe(true);
      expect(result.current.sections.infrastructureOverview).toBe(true);
      expect(result.current.sections.serverDashboard).toBe(true);
      expect(result.current.sections.aiInsights).toBe(true);
      expect(result.current.sections.criticalServers).toBe(true);
      expect(result.current.sections.warningServers).toBe(true);
      expect(result.current.sections.healthyServers).toBe(true);
    });

    it('9개의 섹션이 존재해야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());

      // Then
      expect(Object.keys(result.current.sections)).toHaveLength(9);
    });
  });

  describe('toggleSection', () => {
    it('펼쳐진 섹션을 접을 수 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      expect(result.current.sections.liveSystemAlerts).toBe(true);

      // When
      act(() => {
        result.current.toggleSection('liveSystemAlerts');
      });

      // Then
      expect(result.current.sections.liveSystemAlerts).toBe(false);
    });

    it('접힌 섹션을 펼칠 수 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      act(() => {
        result.current.toggleSection('recentEvents');
      });
      expect(result.current.sections.recentEvents).toBe(false);

      // When
      act(() => {
        result.current.toggleSection('recentEvents');
      });

      // Then
      expect(result.current.sections.recentEvents).toBe(true);
    });

    it('다른 섹션에 영향을 주지 않아야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());

      // When
      act(() => {
        result.current.toggleSection('aiInsights');
      });

      // Then
      expect(result.current.sections.aiInsights).toBe(false);
      expect(result.current.sections.liveSystemAlerts).toBe(true);
      expect(result.current.sections.serverDashboard).toBe(true);
    });
  });

  describe('setSectionState', () => {
    it('섹션 상태를 직접 설정할 수 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());

      // When
      act(() => {
        result.current.setSectionState('networkStats', false);
      });

      // Then
      expect(result.current.sections.networkStats).toBe(false);
    });

    it('같은 상태로 설정해도 문제없이 동작해야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      expect(result.current.sections.criticalServers).toBe(true);

      // When
      act(() => {
        result.current.setSectionState('criticalServers', true);
      });

      // Then
      expect(result.current.sections.criticalServers).toBe(true);
    });
  });

  describe('expandAll', () => {
    it('모든 섹션을 펼칠 수 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      act(() => {
        result.current.collapseAll();
      });

      // When
      act(() => {
        result.current.expandAll();
      });

      // Then
      Object.values(result.current.sections).forEach((isExpanded) => {
        expect(isExpanded).toBe(true);
      });
    });
  });

  describe('collapseAll', () => {
    it('모든 섹션을 접을 수 있어야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());

      // When
      act(() => {
        result.current.collapseAll();
      });

      // Then
      Object.values(result.current.sections).forEach((isExpanded) => {
        expect(isExpanded).toBe(false);
      });
    });
  });

  describe('resetToDefaults', () => {
    it('변경된 상태를 기본값으로 복원해야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      act(() => {
        result.current.collapseAll();
      });

      // When
      act(() => {
        result.current.resetToDefaults();
      });

      // Then
      Object.values(result.current.sections).forEach((isExpanded) => {
        expect(isExpanded).toBe(true);
      });
    });

    it('일부 변경된 상태도 완전히 복원해야 함', () => {
      // Given
      const { result } = renderHook(() => useDashboardToggleStore());
      act(() => {
        result.current.toggleSection('aiInsights');
        result.current.toggleSection('criticalServers');
      });

      // When
      act(() => {
        result.current.resetToDefaults();
      });

      // Then
      expect(result.current.sections.aiInsights).toBe(true);
      expect(result.current.sections.criticalServers).toBe(true);
    });
  });
});
