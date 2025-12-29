/**
 * Feature Cards 데이터 테스트
 * - 데이터 구조 검증
 * - 필수 필드 확인
 * - deprecated 용어 체크
 */

import { describe, expect, it } from 'vitest';
import { FEATURE_CARDS_DATA } from '../feature-cards.data';

describe('Feature Cards Data', () => {
  describe('구조 검증', () => {
    it('4개의 Feature Card가 존재해야 함', () => {
      expect(FEATURE_CARDS_DATA).toHaveLength(4);
    });

    it('각 카드는 고유한 ID를 가져야 함', () => {
      const ids = FEATURE_CARDS_DATA.map((card) => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('예상되는 카드 ID가 존재해야 함', () => {
      const expectedIds = [
        'ai-assistant-pro',
        'cloud-platform',
        'tech-stack',
        'vibe-coding',
      ];
      const actualIds = FEATURE_CARDS_DATA.map((card) => card.id);
      expectedIds.forEach((id) => {
        expect(actualIds).toContain(id);
      });
    });
  });

  describe('필수 필드 검증', () => {
    it.each(
      FEATURE_CARDS_DATA
    )('$id 카드는 모든 필수 필드를 가져야 함', (card) => {
      // 기본 필드
      expect(card.id).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.description).toBeDefined();
      expect(card.icon).toBeDefined();
      expect(card.gradient).toBeDefined();

      // detailedContent 필드
      expect(card.detailedContent).toBeDefined();
      expect(card.detailedContent.overview).toBeDefined();
      expect(card.detailedContent.features).toBeInstanceOf(Array);
      expect(card.detailedContent.technologies).toBeInstanceOf(Array);

      // boolean 필드
      expect(typeof card.requiresAI).toBe('boolean');
    });

    it('AI Assistant 카드는 subSections를 가져야 함', () => {
      const aiCard = FEATURE_CARDS_DATA.find(
        (card) => card.id === 'ai-assistant-pro'
      );
      expect(aiCard?.subSections).toBeDefined();
      expect(aiCard?.subSections?.length).toBeGreaterThan(0);
    });

    it('AI Assistant 카드는 isAICard가 true여야 함', () => {
      const aiCard = FEATURE_CARDS_DATA.find(
        (card) => card.id === 'ai-assistant-pro'
      );
      expect(aiCard?.isAICard).toBe(true);
    });

    it('Vibe Coding 카드는 isVibeCard와 isSpecial이 true여야 함', () => {
      const vibeCard = FEATURE_CARDS_DATA.find(
        (card) => card.id === 'vibe-coding'
      );
      expect(vibeCard?.isVibeCard).toBe(true);
      expect(vibeCard?.isSpecial).toBe(true);
    });
  });

  describe('콘텐츠 정합성', () => {
    it('deprecated 용어가 포함되지 않아야 함', () => {
      const json = JSON.stringify(FEATURE_CARDS_DATA);
      const deprecatedTerms = ['LangGraph', 'LangChain', 'StateGraph'];

      deprecatedTerms.forEach((term) => {
        expect(json).not.toContain(term);
      });
    });

    it('AI SDK 관련 용어가 올바르게 사용되어야 함', () => {
      const aiCard = FEATURE_CARDS_DATA.find(
        (card) => card.id === 'ai-assistant-pro'
      );
      expect(aiCard?.description).toContain('AI SDK');
      expect(aiCard?.detailedContent.technologies).toContain(
        'Vercel AI SDK (Multi-Agent)'
      );
    });

    it('각 카드의 features는 최소 3개 이상이어야 함', () => {
      FEATURE_CARDS_DATA.forEach((card) => {
        expect(card.detailedContent.features.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('각 카드의 technologies는 최소 3개 이상이어야 함', () => {
      FEATURE_CARDS_DATA.forEach((card) => {
        expect(card.detailedContent.technologies.length).toBeGreaterThanOrEqual(
          3
        );
      });
    });
  });

  describe('gradient 형식 검증', () => {
    it('모든 카드는 유효한 gradient 클래스를 가져야 함', () => {
      FEATURE_CARDS_DATA.forEach((card) => {
        expect(card.gradient).toMatch(/^from-/);
      });
    });
  });
});
