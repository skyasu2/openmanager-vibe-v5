/**
 * 🎯 AI Insight Center - Code Quality Analysis Module
 *
 * Code quality analysis and technical debt management:
 * - Code health scoring and metrics analysis
 * - Technical debt hotspot identification
 * - Refactoring recommendations
 * - Priority action planning
 */

import type {
  CodeMetrics,
  CodeQualityAnalysis,
  TechnicalDebtAnalysis,
  RefactoringSuggestion,
} from './insight-center.types';

/**
 * Calculate overall code health score
 */
export function calculateCodeHealth(metrics: CodeMetrics): number {
  const complexityScore = Math.max(
    0,
    100 - (metrics.complexity.average_complexity - 5) * 10
  );
  const coverageScore =
    (metrics.coverage.lines +
      metrics.coverage.branches +
      metrics.coverage.functions) /
    3;
  const debtScore = Math.max(
    0,
    100 - (metrics.debt.critical_issues * 10 + metrics.debt.high_issues * 3)
  );

  return Math.round(
    complexityScore * 0.4 + coverageScore * 0.4 + debtScore * 0.2
  );
}

/**
 * Analyze code quality
 */
export function analyzeCodeQuality(metrics: CodeMetrics): CodeQualityAnalysis {
  const healthScore = calculateCodeHealth(metrics);

  const recommendations = [];
  const priorityActions = [];

  if (metrics.complexity.max_complexity > 20) {
    recommendations.push({
      area: 'complexity',
      action: 'Refactor high-complexity functions',
      impact: 'Improve maintainability and reduce bugs',
      effort: 'high',
    });
    priorityActions.push('Break down functions with complexity > 20');
  }

  if (metrics.coverage.lines < 80) {
    recommendations.push({
      area: 'testing',
      action: 'Increase test coverage',
      impact: 'Reduce regression risk',
      effort: 'medium',
    });
    priorityActions.push(
      `Add tests to reach 80% coverage (currently ${metrics.coverage.lines}%)`
    );
  }

  if (metrics.debt.critical_issues > 0) {
    priorityActions.push(
      `Fix ${metrics.debt.critical_issues} critical technical debt issues`
    );
  }

  return {
    summary: {
      overall_health: healthScore,
      complexity_rating:
        metrics.complexity.average_complexity < 8
          ? 'good'
          : metrics.complexity.average_complexity < 12
            ? 'moderate'
            : 'poor',
      test_coverage: metrics.coverage.lines >= 80 ? 'adequate' : 'insufficient',
      technical_debt:
        metrics.debt.total_hours < 100 ? 'manageable' : 'significant',
    },
    recommendations,
    priority_actions: priorityActions,
  };
}

/**
 * Analyze technical debt
 */
export function analyzeTechnicalDebt(
  metrics: CodeMetrics
): TechnicalDebtAnalysis {
  const debtHotspots = [];

  if (metrics.complexity.high_complexity_files > 0) {
    debtHotspots.push({
      area: 'Complex Code',
      impact: 'high',
      effort: metrics.complexity.high_complexity_files * 4, // hours
      roi: 2.5, // return on investment
    });
  }

  if (metrics.coverage.lines < 60) {
    debtHotspots.push({
      area: 'Missing Tests',
      impact: 'critical',
      effort: (80 - metrics.coverage.lines) * 2,
      roi: 3.0,
    });
  }

  if (metrics.debt.critical_issues > 0) {
    debtHotspots.push({
      area: 'Critical Issues',
      impact: 'critical',
      effort: metrics.debt.critical_issues * 2,
      roi: 4.0,
    });
  }

  return {
    debt_hotspots: debtHotspots.sort((a, b) => b.roi - a.roi),
    total_effort: debtHotspots.reduce((sum, h) => sum + h.effort, 0),
    priority_order: debtHotspots.map((h) => h.area),
  };
}

/**
 * Generate refactoring suggestions
 */
export function generateRefactoringSuggestions(
  threshold: number
): RefactoringSuggestion[] {
  return [
    {
      type: 'Extract Method',
      description: `Break down methods with complexity > ${threshold}`,
      expected_benefit: 'Improved readability and testability',
    },
    {
      type: 'Introduce Parameter Object',
      description: 'Group related parameters into objects',
      expected_benefit: 'Reduced parameter count and improved API',
    },
    {
      type: 'Replace Conditional with Polymorphism',
      description: 'Use inheritance/composition for complex conditionals',
      expected_benefit: 'More maintainable and extensible code',
    },
  ];
}
