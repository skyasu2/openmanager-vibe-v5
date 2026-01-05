/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ChatMessage,
  useAIEngine,
} from '../../src/domains/ai-sidebar/hooks/useAIEngine';

/**
 * useAIEngine Hook 테스트 (v4.0)
 *
 * v4.0 변경사항:
 * - AI 모드 선택 UI 제거, UNIFIED 모드로 통합
 * - 모든 엔진 선택은 무시되고 UNIFIED로 자동 전환
 * - localStorage 레거시 모드는 자동 마이그레이션
 */

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useAIEngine (v4.0 - UNIFIED 전용)', () => {
  beforeEach(() => {
    // localStorage mock 초기화
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('항상 UNIFIED 엔진으로 초기화된다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.currentEngine).toBe('UNIFIED');
    expect(result.current.selectedEngine).toBe('UNIFIED');
  });

  it('UNIFIED 엔진만 사용 가능하다고 판단한다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.isEngineAvailable('UNIFIED')).toBe(true);
    expect(result.current.isEngineAvailable('GOOGLE_AI')).toBe(false);
    expect(result.current.isEngineAvailable('LOCAL')).toBe(false);
    expect(result.current.isEngineAvailable('AUTO')).toBe(false);
  });

  it('레거시 엔진 선택 시 경고를 출력한다', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      result.current.setEngine('GOOGLE_AI');
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('GOOGLE_AI')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('더 이상 지원되지 않습니다')
    );

    consoleWarnSpy.mockRestore();
  });

  it('레거시 localStorage 값을 UNIFIED로 자동 마이그레이션한다', () => {
    const consoleInfoSpy = vi
      .spyOn(console, 'info')
      .mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue('GOOGLE_AI');

    renderHook(() => useAIEngine());

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('자동 마이그레이션')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'selected-ai-engine',
      'UNIFIED'
    );

    consoleInfoSpy.mockRestore();
  });

  it('이미 UNIFIED로 저장된 경우 마이그레이션하지 않는다', () => {
    const consoleInfoSpy = vi
      .spyOn(console, 'info')
      .mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue('UNIFIED');

    renderHook(() => useAIEngine());

    expect(consoleInfoSpy).not.toHaveBeenCalled();
    consoleInfoSpy.mockRestore();
  });

  it('UNIFIED 엔진의 표시 이름을 반환한다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineDisplayName()).toBe('AI Supervisor');
    expect(result.current.getEngineDisplayName('UNIFIED')).toBe(
      'AI Supervisor'
    );
    expect(result.current.getEngineDisplayName('GOOGLE_AI')).toBe(
      'AI Supervisor'
    );
  });

  it('UNIFIED 엔진의 설명을 반환한다', () => {
    const { result } = renderHook(() => useAIEngine());

    const description = result.current.getEngineDescription();
    expect(description).toContain('Supabase RAG');
    expect(description).toContain('ML');
    expect(description).toContain('Cloud Run AI');
    expect(description).toContain('자동 라우팅');
  });

  it('항상 /api/ai/supervisor 엔드포인트를 반환한다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineEndpoint()).toBe('/api/ai/supervisor');
    expect(result.current.getEngineEndpoint('UNIFIED')).toBe(
      '/api/ai/supervisor'
    );
    expect(result.current.getEngineEndpoint('GOOGLE_AI')).toBe(
      '/api/ai/supervisor'
    );
    expect(result.current.getEngineEndpoint('LOCAL')).toBe(
      '/api/ai/supervisor'
    );
  });

  it('엔진 정보 표시는 항상 false다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.showEngineInfo).toBe(false);
  });

  it('엔진 변경 중 상태는 항상 false다', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.isChangingEngine).toBe(false);
  });

  it('toggleEngineInfo 호출 시 아무 일도 일어나지 않는다 (하위 호환성)', () => {
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      result.current.toggleEngineInfo();
    });

    expect(result.current.showEngineInfo).toBe(false);
  });

  it('handleModeChange 호출 시 UNIFIED 고정 메시지를 반환한다', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { result } = renderHook(() => useAIEngine());

    let message: ChatMessage | null = null;
    await act(async () => {
      message = await result.current.handleModeChange('GOOGLE_AI');
    });

    expect(message).not.toBeNull();
    expect(message?.content).toContain('UNIFIED');
    expect(message?.content).toContain('자동 라우팅');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('handleModeChange에 UNIFIED를 전달해도 경고가 발생하지 않는다', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { result } = renderHook(() => useAIEngine());

    await act(async () => {
      await result.current.handleModeChange('UNIFIED');
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});
