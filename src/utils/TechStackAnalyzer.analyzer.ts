/**
 * 🧩 TechStackAnalyzer Analyzer
 *
 * Core analysis functions:
 * - Technology stack analysis and categorization
 * - Summary generation for tech stack overview
 * - Category sorting and importance ranking
 */

import { CATEGORIES } from './TechStackAnalyzer.categories';
import { TECH_DATABASE } from './TechStackAnalyzer.database';
import {
  mergeDuplicateTechs,
  normalizeTechName,
  parseTechString,
} from './TechStackAnalyzer.parser';
import type { TechCategory, TechItem } from './TechStackAnalyzer.types';

/**
 * 특정 기능 카드의 기술 스택을 분석 (중복 제거 적용)
 */
export function analyzeTechStack(technologies: string[]): TechCategory[] {
  const techItems: TechItem[] = [];

  // 각 기술 문자열을 파싱하고 분석
  technologies.forEach((techString) => {
    const parsedTechs = parseTechString(techString);

    parsedTechs.forEach((tech) => {
      const normalizedTech = normalizeTechName(tech);
      const techInfo = TECH_DATABASE[normalizedTech];

      if (techInfo) {
        const techItem: TechItem = {
          ...techInfo,
          usage: `${techString.slice(0, 50)}${techString.length > 50 ? '...' : ''}`,
        };

        techItems.push(techItem);
      } else {
        // 디버깅: 인식되지 않은 기술 로그
        console.log(`미인식 기술: ${tech} -> ${normalizedTech}`, techString);
      }
    });
  });

  // 중복 제거 및 병합
  const mergedTechs = mergeDuplicateTechs(techItems);

  // 카테고리별로 분류
  const categoryMap = new Map<string, TechItem[]>();

  mergedTechs.forEach((techItem) => {
    // 메인 카테고리 사용
    const mainCategory = techItem.category;

    if (!categoryMap.has(mainCategory)) {
      categoryMap.set(mainCategory, []);
    }
    categoryMap.get(mainCategory)?.push(techItem);
  });

  // 카테고리별로 정리하고 정렬
  const categories: TechCategory[] = [];

  categoryMap.forEach((items, categoryId) => {
    const categoryInfo = CATEGORIES[categoryId];
    if (categoryInfo) {
      // 중요도 순으로 정렬
      const sortedItems = items.sort((a, b) => {
        const importanceOrder: Record<TechItem['importance'], number> = {
          critical: 5,
          high: 4,
          showcase: 3,
          medium: 2,
          low: 1,
        };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });

      categories.push({
        ...categoryInfo,
        items: sortedItems,
      });
    }
  });

  // 카테고리를 중요도와 코어 기술 기준으로 정렬
  return categories.sort((a, b) => {
    const aHasCore = a.items.some((item) => item.isCore);
    const bHasCore = b.items.some((item) => item.isCore);

    if (aHasCore && !bHasCore) return -1;
    if (!aHasCore && bHasCore) return 1;

    const aHighImportance = a.items.filter(
      (item) => item.importance === 'high'
    ).length;
    const bHighImportance = b.items.filter(
      (item) => item.importance === 'high'
    ).length;

    return bHighImportance - aHighImportance;
  });
}

/**
 * 전체 프로젝트의 기술 스택 요약 생성
 */
export function generateTechStackSummary(categories: TechCategory[]): {
  totalTechs: number;
  coreCount: number;
  categoryCount: number;
  topCategories: string[];
} {
  const totalTechs = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const coreCount = categories.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.isCore).length,
    0
  );

  const topCategories = categories
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3)
    .map((cat) => cat.name);

  return {
    totalTechs,
    coreCount,
    categoryCount: categories.length,
    topCategories,
  };
}
