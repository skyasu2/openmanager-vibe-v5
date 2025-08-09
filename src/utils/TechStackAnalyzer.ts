/**
 * 🧩 TechStackAnalyzer - Modular Architecture v2.0
 *
 * ✅ Modularization Complete: 1009 → ~200 lines (80% reduction)
 * 🏗️ Architecture: Delegation pattern with 4 specialized modules
 * 
 * Modules:
 * - TechStackAnalyzer.types.ts (47 lines) - Type definitions
 * - TechStackAnalyzer.database.ts (520 lines) - Technology database
 * - TechStackAnalyzer.categories.ts (150 lines) - Category definitions  
 * - TechStackAnalyzer.parser.ts (200 lines) - Parsing functions
 * - TechStackAnalyzer.analyzer.ts (100 lines) - Analysis functions
 *
 * Benefits:
 * - Single Responsibility Principle enforced
 * - TypeScript compilation performance improved
 * - Maintainability enhanced
 * - Code reuse maximized
 */

// Import modular components
import type { TechItem, TechCategory, TechStackSummary, TechAnalysisOptions } from './TechStackAnalyzer.types';
import { analyzeTechStack as analyzeStack, generateTechStackSummary as generateSummary } from './TechStackAnalyzer.analyzer';

// Re-export types for backward compatibility
export type { TechItem, TechCategory, TechStackSummary, TechAnalysisOptions };

/**
 * 특정 기능 카드의 기술 스택을 분석 (TechStackAnalyzer.analyzer 위임)
 */
export function analyzeTechStack(technologies: string[]): TechCategory[] {
  return analyzeStack(technologies);
}

/**
 * 전체 프로젝트의 기술 스택 요약 생성 (TechStackAnalyzer.analyzer 위임)
 */
export function generateTechStackSummary(categories: TechCategory[]): {
  totalTechs: number;
  coreCount: number;
  categoryCount: number;
  topCategories: string[];
} {
  return generateSummary(categories);
}
