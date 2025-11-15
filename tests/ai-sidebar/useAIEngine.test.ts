import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAIEngine } from '../../src/domains/ai-sidebar/hooks/useAIEngine';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('useAIEngine', () => {
  beforeEach(() => {
    // localStorage mock 초기화
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with default engine', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.currentEngine).toBe('UNIFIED');
    expect(result.current.isEngineAvailable('UNIFIED')).toBe(true);
  });

  it('changes engine correctly', () => {
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      result.current.setEngine('GOOGLE_AI');
    });

    expect(result.current.currentEngine).toBe('GOOGLE_AI');
  });

  it('persists engine selection in localStorage', () => {
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      result.current.setEngine('LOCAL');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('selected-ai-engine', 'LOCAL');
  });

  it('restores engine from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('GOOGLE_AI');
    
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.currentEngine).toBe('GOOGLE_AI');
  });

  it('validates engine availability', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.isEngineAvailable('UNIFIED')).toBe(true);
    expect(result.current.isEngineAvailable('LOCAL')).toBe(true);
    expect(result.current.isEngineAvailable('GOOGLE_AI')).toBe(true);
    expect(result.current.isEngineAvailable('INVALID_ENGINE' as any)).toBe(false);
  });

  it('returns correct engine display names', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineDisplayName('UNIFIED')).toBe('통합 AI 엔진');
    expect(result.current.getEngineDisplayName('LOCAL')).toBe('로컬 RAG');
    expect(result.current.getEngineDisplayName('GOOGLE_AI')).toBe('Google AI');
  });

  it('returns correct engine descriptions', () => {
    const { result } = renderHook(() => useAIEngine());

    const unifiedDesc = result.current.getEngineDescription('UNIFIED');
    expect(unifiedDesc).toContain('Provider 패턴 통합');

    const googleDesc = result.current.getEngineDescription('GOOGLE_AI');
    expect(googleDesc).toContain('Google AI 모드');

    const localDesc = result.current.getEngineDescription('LOCAL');
    expect(localDesc).toContain('Supabase RAG 엔진');
  });

  it('handles invalid engine gracefully', () => {
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      // @ts-ignore - 테스트를 위한 invalid engine
      result.current.setEngine('INVALID');
    });

    // Invalid engine이면 기본값으로 되돌아감
    expect(result.current.currentEngine).toBe('UNIFIED');
  });

  it('provides correct API endpoints for engines', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineEndpoint('UNIFIED')).toBe('/api/ai/query');
    expect(result.current.getEngineEndpoint('LOCAL')).toBe('/api/ai/query');
    expect(result.current.getEngineEndpoint('GOOGLE_AI')).toBe('/api/ai/google-ai/generate');
  });
});