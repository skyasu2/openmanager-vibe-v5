/**
 * Tech Stacks 데이터 테스트
 * - 데이터 구조 검증
 * - 필수 필드 확인
 * - deprecated 용어 체크
 * - 카테고리별 항목 검증
 */

import { describe, expect, it } from 'vitest';
import type { TechItem } from '@/types/feature-card.types';
import { TECH_STACKS_DATA, type VibeCodeData } from '../tech-stacks.data';

// 유틸리티: VibeCodeData인지 확인
function isVibeCodeData(data: TechItem[] | VibeCodeData): data is VibeCodeData {
  return 'current' in data && 'history' in data;
}

// 유틸리티: 모든 TechItem 추출
function getAllTechItems(): TechItem[] {
  const items: TechItem[] = [];

  Object.values(TECH_STACKS_DATA).forEach((data) => {
    if (isVibeCodeData(data)) {
      items.push(...data.current);
      items.push(...data.history.stage1);
      items.push(...data.history.stage2);
      items.push(...data.history.stage3);
    } else {
      items.push(...data);
    }
  });

  return items;
}

describe('Tech Stacks Data', () => {
  describe('구조 검증', () => {
    it('예상되는 카드 키가 존재해야 함', () => {
      const expectedKeys = [
        'ai-assistant-pro',
        'cloud-platform',
        'tech-stack',
        'vibe-coding',
      ];
      const actualKeys = Object.keys(TECH_STACKS_DATA);

      expectedKeys.forEach((key) => {
        expect(actualKeys).toContain(key);
      });
    });

    it('vibe-coding은 VibeCodeData 구조를 가져야 함', () => {
      const vibeData = TECH_STACKS_DATA['vibe-coding'];
      expect(isVibeCodeData(vibeData)).toBe(true);

      if (isVibeCodeData(vibeData)) {
        expect(vibeData.current).toBeInstanceOf(Array);
        expect(vibeData.history).toBeDefined();
        expect(vibeData.history.stage1).toBeInstanceOf(Array);
        expect(vibeData.history.stage2).toBeInstanceOf(Array);
        expect(vibeData.history.stage3).toBeInstanceOf(Array);
      }
    });

    it('다른 카드들은 TechItem[] 구조를 가져야 함', () => {
      const nonVibeKeys = ['ai-assistant-pro', 'cloud-platform', 'tech-stack'];

      nonVibeKeys.forEach((key) => {
        const data = TECH_STACKS_DATA[key];
        expect(Array.isArray(data)).toBe(true);
        expect(isVibeCodeData(data)).toBe(false);
      });
    });
  });

  describe('TechItem 필수 필드 검증', () => {
    const allItems = getAllTechItems();

    it('모든 TechItem은 필수 필드를 가져야 함', () => {
      allItems.forEach((item) => {
        expect(item.name).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.importance).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.implementation).toBeDefined();
        expect(item.status).toBeDefined();
        expect(item.icon).toBeDefined();
        expect(item.tags).toBeInstanceOf(Array);
      });
    });

    it('category는 유효한 값이어야 함', () => {
      const validCategories = [
        'framework',
        'language',
        'database',
        'ai',
        'opensource',
        'custom',
        'deployment',
        'ui',
        'utility',
      ];

      allItems.forEach((item) => {
        expect(validCategories).toContain(item.category);
      });
    });

    it('importance는 유효한 값이어야 함', () => {
      const validImportance = ['critical', 'high', 'medium', 'low'];

      allItems.forEach((item) => {
        expect(validImportance).toContain(item.importance);
      });
    });

    it('status는 유효한 값이어야 함', () => {
      const validStatus = ['active', 'ready', 'planned', 'history'];

      allItems.forEach((item) => {
        expect(validStatus).toContain(item.status);
      });
    });
  });

  describe('콘텐츠 정합성', () => {
    it('deprecated 용어가 포함되지 않아야 함', () => {
      const json = JSON.stringify(TECH_STACKS_DATA);
      const deprecatedTerms = ['LangGraph', 'LangChain', 'StateGraph'];

      deprecatedTerms.forEach((term) => {
        expect(json).not.toContain(term);
      });
    });

    it('AI SDK 관련 용어가 올바르게 사용되어야 함', () => {
      const aiAssistantData = TECH_STACKS_DATA[
        'ai-assistant-pro'
      ] as TechItem[];

      // AI SDK 항목이 존재해야 함
      const aiSdkItem = aiAssistantData.find(
        (item) =>
          item.name.includes('AI SDK') || item.name.includes('Vercel AI SDK')
      );
      expect(aiSdkItem).toBeDefined();
    });

    it('각 카드는 최소 3개 이상의 TechItem을 가져야 함', () => {
      Object.entries(TECH_STACKS_DATA).forEach(([key, data]) => {
        if (isVibeCodeData(data)) {
          expect(data.current.length).toBeGreaterThanOrEqual(1);
        } else {
          expect(data.length).toBeGreaterThanOrEqual(3);
        }
      });
    });
  });

  describe('AI Assistant Pro 카드 검증', () => {
    const aiData = TECH_STACKS_DATA['ai-assistant-pro'] as TechItem[];

    it('critical importance 항목이 존재해야 함', () => {
      const criticalItems = aiData.filter(
        (item) => item.importance === 'critical'
      );
      expect(criticalItems.length).toBeGreaterThan(0);
    });

    it('주요 AI 서비스가 포함되어야 함', () => {
      const names = aiData.map((item) => item.name);
      const expectedServices = ['Groq', 'Cerebras', 'Mistral'];

      expectedServices.forEach((service) => {
        const found = names.some((name) => name.includes(service));
        expect(found).toBe(true);
      });
    });

    it('모든 항목은 tags를 가져야 함', () => {
      aiData.forEach((item) => {
        expect(item.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cloud Platform 카드 검증', () => {
    const cloudData = TECH_STACKS_DATA['cloud-platform'] as TechItem[];

    it('주요 클라우드 서비스가 포함되어야 함', () => {
      const names = cloudData.map((item) => item.name);
      // 실제 데이터: Vercel Platform, Supabase PostgreSQL, GCP Cloud Run, Docker, GitHub Actions
      const expectedServices = ['Vercel', 'Supabase', 'Cloud Run', 'Docker'];

      expectedServices.forEach((service) => {
        const found = names.some((name) => name.includes(service));
        expect(found).toBe(true);
      });
    });

    it('CI/CD 도구가 포함되어야 함', () => {
      const names = cloudData.map((item) => item.name);
      const found = names.some((name) => name.includes('GitHub Actions'));
      expect(found).toBe(true);
    });
  });

  describe('Tech Stack 카드 검증', () => {
    const techData = TECH_STACKS_DATA['tech-stack'] as TechItem[];

    it('주요 프레임워크가 포함되어야 함', () => {
      const names = techData.map((item) => item.name);
      const expectedFrameworks = ['Next.js', 'React', 'TypeScript'];

      expectedFrameworks.forEach((framework) => {
        const found = names.some((name) => name.includes(framework));
        expect(found).toBe(true);
      });
    });
  });

  describe('Vibe Coding 카드 검증', () => {
    const vibeData = TECH_STACKS_DATA['vibe-coding'] as VibeCodeData;

    it('current 항목에 Claude Code가 포함되어야 함', () => {
      const names = vibeData.current.map((item) => item.name);
      const found = names.some((name) => name.includes('Claude'));
      expect(found).toBe(true);
    });

    it('history stage1은 수동 개발 도구를 포함해야 함', () => {
      expect(vibeData.history.stage1.length).toBeGreaterThan(0);
    });

    it('history stage2는 IDE 자동화 도구를 포함해야 함', () => {
      expect(vibeData.history.stage2.length).toBeGreaterThan(0);
    });

    it('history stage3은 WSL/CLI 도구를 포함해야 함', () => {
      expect(vibeData.history.stage3.length).toBeGreaterThan(0);
    });
  });
});
