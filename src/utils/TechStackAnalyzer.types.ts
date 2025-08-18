/**
 * 🧩 TechStackAnalyzer Types
 *
 * Type definitions for tech stack analysis:
 * - TechItem: Individual technology item structure
 * - TechCategory: Category grouping for technologies
 * - Analysis result interfaces
 */

export interface TechItem {
  name: string;
  category: string;
  description: string;
  usage: string;
  importance: 'critical' | 'high' | 'medium' | 'low' | 'showcase';
  version?: string;
  role?: string;
  isCore?: boolean;
  usageCount?: number;
  categories?: string[];
}

export interface TechCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  items: TechItem[];
}

export interface TechStackSummary {
  totalTechnologies: number;
  categoriesCount: number;
  coreTechnologies: TechItem[];
  emergingTechnologies: TechItem[];
  categories: TechCategory[];
  complexityScore: number;
  modernityScore: number;
}

export interface TechAnalysisOptions {
  includeVersions?: boolean;
  groupSimilar?: boolean;
  sortByImportance?: boolean;
  filterMinImportance?: 'low' | 'medium' | 'high' | 'critical';
}
