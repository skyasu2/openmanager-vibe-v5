import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAIEngine } from '@/domains/ai-sidebar/hooks/useAIEngine';

describe('useAIEngine', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear();
  });

  it('initializes with default engine', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.currentEngine).toBe('LOCAL');
    expect(result.current.isEngineAvailable('LOCAL')).toBe(true);
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

    expect(localStorage.getItem('selected-ai-engine')).toBe('LOCAL');
  });

  it('restores engine from localStorage', () => {
    localStorage.setItem('selected-ai-engine', 'GOOGLE_AI');
    
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.currentEngine).toBe('GOOGLE_AI');
  });

  it('validates engine availability', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.isEngineAvailable('LOCAL')).toBe(true);
    expect(result.current.isEngineAvailable('GOOGLE_AI')).toBe(true);
    expect(result.current.isEngineAvailable('LOCAL')).toBe(true);
    expect(result.current.isEngineAvailable('INVALID_ENGINE' as any)).toBe(false);
  });

  it('returns correct engine display names', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineDisplayName('LOCAL')).toBe('통합 AI 엔진');
    expect(result.current.getEngineDisplayName('GOOGLE_AI')).toBe('Google AI Only');
    expect(result.current.getEngineDisplayName('LOCAL')).toBe('로컬 MCP');
  });

  it('returns correct engine descriptions', () => {
    const { result } = renderHook(() => useAIEngine());

    const unifiedDesc = result.current.getEngineDescription('LOCAL');
    expect(unifiedDesc).toContain('모든 AI 엔진 통합');

    const googleDesc = result.current.getEngineDescription('GOOGLE_AI');
    expect(googleDesc).toContain('Google AI만 사용');

    const localDesc = result.current.getEngineDescription('LOCAL');
    expect(localDesc).toContain('로컬 MCP 서버');
  });

  it('handles invalid engine gracefully', () => {
    const { result } = renderHook(() => useAIEngine());

    act(() => {
      // @ts-ignore - 테스트를 위한 invalid engine
      result.current.setEngine('INVALID');
    });

    // Invalid engine이면 기본값으로 되돌아감
    expect(result.current.currentEngine).toBe('LOCAL');
  });

  it('provides correct API endpoints for engines', () => {
    const { result } = renderHook(() => useAIEngine());

    expect(result.current.getEngineEndpoint('LOCAL')).toBe('/api/ai/edge-v2');
    expect(result.current.getEngineEndpoint('GOOGLE_AI')).toBe('/api/ai/google-ai/generate');
    expect(result.current.getEngineEndpoint('LOCAL')).toBe('/api/mcp/query');
  });
});