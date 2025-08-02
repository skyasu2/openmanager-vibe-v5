/**
 * 🧪 DevMockGoogleAI 테스트
 * 
 * Mock Google AI의 기능을 검증:
 * - 프롬프트 기반 동적 응답 생성
 * - 서버 모니터링 도메인 특화 응답
 * - 토큰 사용량 시뮬레이션
 * - 통계 수집
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DevMockGoogleAI, MockGoogleGenerativeAI } from '@/lib/ai/dev-mock-google-ai';

describe('DevMockGoogleAI', () => {
  let mockAI: DevMockGoogleAI;

  beforeEach(() => {
    mockAI = new DevMockGoogleAI({
      enableLogging: false,
      responseDelay: 0, // 테스트에서는 지연 없음
    });
  });

  describe('기본 응답 생성', () => {
    it('서버 상태 질의에 적절한 응답 반환', async () => {
      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '현재 서버 상태는 어떤가요?' }] }],
      });

      const response = result.response.text();
      expect(response).toBeTruthy();
      expect(response).toContain('서버');
      expect(result.response.usageMetadata).toBeDefined();
      expect(result.response.usageMetadata?.totalTokenCount).toBeGreaterThan(0);
    });

    it('성능 관련 질의에 적절한 응답 반환', async () => {
      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'CPU 성능이 어떻습니까?' }] }],
      });

      const response = result.response.text();
      expect(response).toContain('CPU');
      expect(response.toLowerCase()).toMatch(/성능|사용률|평균/);
    });

    it('이상 징후 질의에 적절한 응답 반환', async () => {
      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '최근에 어떤 문제가 있었나요?' }] }],
      });

      const response = result.response.text();
      expect(response).toBeTruthy();
      expect(response.toLowerCase()).toMatch(/감지|모니터링|확인/);
    });
  });

  describe('토큰 사용량 시뮬레이션', () => {
    it('프롬프트와 응답 길이에 따른 토큰 계산', async () => {
      const shortPrompt = '상태?';
      const longPrompt = '현재 모든 서버의 상세한 성능 지표와 최근 24시간 동안의 트렌드를 분석해주세요.';

      const shortResult = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: shortPrompt }] }],
      });

      const longResult = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: longPrompt }] }],
      });

      const shortTokens = shortResult.response.usageMetadata?.promptTokenCount || 0;
      const longTokens = longResult.response.usageMetadata?.promptTokenCount || 0;

      expect(longTokens).toBeGreaterThan(shortTokens);
    });
  });

  describe('시나리오 추가 기능', () => {
    it('커스텀 시나리오 추가 및 응답 확인', async () => {
      mockAI.addScenario(
        'customTest',
        ['테스트', 'custom'],
        ['이것은 커스텀 테스트 응답입니다.'],
        0.95
      );

      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '테스트 시나리오' }] }],
      });

      expect(result.response.text()).toContain('커스텀 테스트 응답');
    });
  });

  describe('통계 수집', () => {
    it('요청 수와 토큰 사용량 추적', async () => {
      // 초기 상태
      const initialStats = mockAI.getStats();
      expect(initialStats.totalRequests).toBe(0);

      // 여러 요청 수행
      await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '첫 번째 질문' }] }],
      });
      await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '두 번째 질문' }] }],
      });

      const stats = mockAI.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalTokensUsed).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    it('모델별 사용량 추적', async () => {
      await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '질문' }] }],
      });

      const stats = mockAI.getStats();
      expect(stats.modelUsage).toContainEqual(['gemini-pro', 1]);
    });
  });

  describe('MockGoogleGenerativeAI 호환성', () => {
    it('Google Generative AI 인터페이스와 호환', async () => {
      const mockClient = new MockGoogleGenerativeAI('dummy-key');
      const model = mockClient.getGenerativeModel({ model: 'gemini-pro' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: '서버 상태 확인' }] }],
      });

      expect(result.response.text()).toBeTruthy();
    });
  });

  describe('서버별 특화 응답', () => {
    it('특정 서버 언급 시 해당 서버 정보 포함', async () => {
      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'web-prd-01 서버의 상태는?' }] }],
      });

      const response = result.response.text();
      expect(response).toContain('web-prd-01');
    });
  });

  describe('일반 응답 처리', () => {
    it('패턴에 매칭되지 않는 질의에 일반 응답 반환', async () => {
      const result = await mockAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: '안녕하세요' }] }],
      });

      const response = result.response.text();
      expect(response).toBeTruthy();
      expect(response).toMatch(/분석|시스템|상태/);
    });
  });
});