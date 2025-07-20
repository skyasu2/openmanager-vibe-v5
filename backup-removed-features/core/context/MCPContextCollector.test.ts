/**
 * MCPContextCollector TDD 테스트
 * 작성일: 2025-07-01 01:25:00 (KST)
 *
 * TDD Red 단계: 실패하는 테스트 작성
 * - MCP 컨텍스트 수집 기능 정의
 * - 에러 처리 로직 정의
 * - 클라이언트/서버 환경 분기 정의
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MCPContextCollector } from './MCPContextCollector';

// Mock MCP Client
const mockMCPClient = {
  performComplexQuery: vi.fn(),
};

describe('MCPContextCollector TDD Tests', () => {
  let contextCollector: MCPContextCollector;

  beforeEach(() => {
    vi.clearAllMocks();
    contextCollector = new MCPContextCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 Red 단계: 실패하는 테스트들', () => {
    it('should be instantiable', () => {
      expect(contextCollector).toBeDefined();
      expect(contextCollector).toBeInstanceOf(MCPContextCollector);
    });

    it('should have collectContext method', () => {
      expect(typeof contextCollector.collectContext).toBe('function');
    });

    it('should collect MCP context successfully', async () => {
      const mockQuery = 'test monitoring query';
      const mockContext = { sessionId: 'test-session' };
      const mockMCPResult = {
        response: 'MCP test response',
        category: 'monitoring',
        additionalInfo: 'test additional info',
      };

      mockMCPClient.performComplexQuery.mockResolvedValue(mockMCPResult);

      // MCPContextCollector가 mcpClient를 받을 수 있도록 설계
      contextCollector.setMCPClient(mockMCPClient);

      const result = await contextCollector.collectContext(
        mockQuery,
        mockContext
      );

      expect(result).toEqual({
        summary: 'MCP test response',
        category: 'monitoring',
        additionalInfo: 'test additional info',
        timestamp: expect.any(String),
        source: 'mcp-context-helper',
      });
      expect(mockMCPClient.performComplexQuery).toHaveBeenCalledWith(
        mockQuery,
        mockContext
      );
    });

    it('should return null on client-side (browser environment)', async () => {
      // 브라우저 환경 시뮬레이션
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      const result = await contextCollector.collectContext('test query');

      expect(result).toBeNull();
    });

    it('should return null when MCP client is not available', async () => {
      const result = await contextCollector.collectContext('test query');

      expect(result).toBeNull();
    });

    it('should handle MCP client errors gracefully', async () => {
      const mockError = new Error('MCP connection failed');
      mockMCPClient.performComplexQuery.mockRejectedValue(mockError);

      contextCollector.setMCPClient(mockMCPClient);

      const result = await contextCollector.collectContext('test query');

      expect(result).toBeNull();
    });

    it('should handle invalid MCP response format', async () => {
      const invalidResponse = 'invalid string response';
      mockMCPClient.performComplexQuery.mockResolvedValue(invalidResponse);

      contextCollector.setMCPClient(mockMCPClient);

      const result = await contextCollector.collectContext('test query');

      expect(result).toBeNull();
    });

    it('should handle missing response fields gracefully', async () => {
      const partialResponse = {
        summary: 'partial response',
        // category와 additionalInfo 누락
      };
      mockMCPClient.performComplexQuery.mockResolvedValue(partialResponse);

      contextCollector.setMCPClient(mockMCPClient);

      const result = await contextCollector.collectContext('test query');

      expect(result).toEqual({
        summary: 'partial response',
        category: undefined,
        additionalInfo: undefined,
        timestamp: expect.any(String),
        source: 'mcp-context-helper',
      });
    });

    it('should allow multiple instances', () => {
      const instance1 = new MCPContextCollector();
      const instance2 = new MCPContextCollector();

      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(MCPContextCollector);
      expect(instance2).toBeInstanceOf(MCPContextCollector);
    });

    it('should log appropriate messages for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // 클라이언트 환경에서 로그 확인
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      await contextCollector.collectContext('test query');

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ MCP 컨텍스트 수집: 클라이언트 측에서 비활성화'
      );

      // 에러 상황에서 로그 확인
      delete (global as any).window;
      mockMCPClient.performComplexQuery.mockRejectedValue(
        new Error('test error')
      );
      contextCollector.setMCPClient(mockMCPClient);

      await contextCollector.collectContext('test query');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'MCP 컨텍스트 수집 실패:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('🟡 Yellow 단계: 인터페이스 정의', () => {
    it('should define MCPContextResult interface structure', () => {
      // 타입 정의가 올바른지 확인하는 컴파일 타임 테스트
      const expectedResult: MCPContextResult = {
        summary: 'test summary',
        category: 'test category',
        additionalInfo: 'test info',
        timestamp: '2025-07-01T01:25:00.000Z',
        source: 'mcp-context-helper',
      };

      expect(expectedResult).toBeDefined();
    });
  });
});

// 타입 정의 (실제 구현에서 분리될 예정)
export interface MCPContextResult {
  summary: string;
  category?: string;
  additionalInfo?: any;
  timestamp: string;
  source: string;
}

export interface MCPClient {
  performComplexQuery(query: string, context?: any): Promise<any>;
}
