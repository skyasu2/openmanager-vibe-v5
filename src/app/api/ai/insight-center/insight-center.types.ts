/**
 * 🎯 AI Insight Center - Type Definitions
 *
 * Comprehensive type system for AI-powered system analysis:
 * - Code metrics and analysis types
 * - System performance metrics
 * - Infrastructure and architecture types
 * - Security audit and compliance types
 * - Executive reporting types
 */

export interface CodeMetrics {
  complexity: {
    high_complexity_files: number;
    average_complexity: number;
    max_complexity: number;
  };
  coverage: {
    lines: number;
    branches: number;
    functions: number;
  };
  debt: {
    total_hours: number;
    critical_issues: number;
    high_issues: number;
  };
}

export interface SystemMetrics {
  servers: Array<{
    id: string;
    cpu_avg: number;
    memory_avg: number;
    response_time: number;
  }>;
  database: {
    query_performance: {
      slow_queries: number;
      avg_execution_time: number;
    };
    connection_pool: {
      active: number;
      idle: number;
      max: number;
    };
  };
  network: {
    latency: {
      avg: number;
      p95: number;
      p99: number;
    };
    throughput: {
      in: number;
      out: number;
    };
  };
}

export interface Insight {
  area: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
}

export interface DatabaseMetrics {
  query_performance: {
    slow_queries: number;
    avg_execution_time: number;
  };
  connection_pool: {
    active: number;
    idle: number;
    max: number;
  };
}

export interface NetworkMetrics {
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    in: number;
    out: number;
  };
}

export interface ArchitectureInfo {
  components: Array<{
    name: string;
    type: string;
    dependencies: string[];
  }>;
  patterns: string[];
  tech_stack: string[];
  microservices?: boolean;
  caching?: boolean;
  message_queue?: boolean;
  load_balancer?: boolean;
  load_balancing?: boolean; // Alias for load_balancer
  caching_strategy?: string; // Caching strategy details
  database_replication?: boolean; // Database replication status
}

export interface InfrastructureInfo {
  servers: number;
  databases: number;
  storage_gb: number;
  bandwidth_gb: number;
  monthly_cost: number;
}

export interface UtilizationMetric {
  id: string;
  cpu_avg: number;
  memory_avg: number;
  disk_avg?: number;
}

export interface SecurityScanResult {
  critical: number;
  high: number;
  medium: number;
  low: number;
  vulnerabilities: Array<{
    severity: string;
    type: string;
    description: string;
  }>;
  compliance: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  objectives: string[];
  timeline: string;
  dependencies: string[];
}

export interface TechUpdate {
  technology: string;
  current: string;
  recommended: string;
  reason: string;
}

export interface TechAddition {
  technology: string;
  purpose: string;
  benefit: string;
}

export interface TechReplacement {
  current: string;
  recommended: string;
  reason: string;
}

export interface CodeQualityAnalysis {
  summary: {
    overall_health: number;
    complexity_rating: string;
    test_coverage: string;
    technical_debt: string;
  };
  recommendations: Array<{
    area: string;
    action: string;
    impact: string;
    effort: string;
  }>;
  priority_actions: string[];
}

export interface TechnicalDebtAnalysis {
  debt_hotspots: Array<{
    area: string;
    impact: string;
    effort: number;
    roi: number;
  }>;
  total_effort: number;
  priority_order: string[];
}

export interface RefactoringSuggestion {
  type: string;
  description: string;
  expected_benefit: string;
}

export interface Bottleneck {
  component: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  resolution: string;
}

export interface Recommendation {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  expected_impact: string;
  effort?: string;
  category?: string;
}

export interface DatabaseAnalysis {
  slow_query_analysis: {
    count: number;
    avg_time: number;
    recommendation: string;
  };
  connection_pool_health: {
    utilization: number;
    status: string;
    recommendation: string;
  };
  optimization_suggestions: string[];
}

export interface NetworkOptimization {
  latency_reduction: {
    current_p99: number;
    target_p99: number;
    strategies: string[];
  };
  throughput_improvement: {
    current: NetworkMetrics['throughput'];
    recommendations: string[];
  };
  cdn_recommendations: {
    benefit: string;
    providers: string[];
    estimated_cost: string;
  };
}

export interface ArchitectureImprovement {
  area: string;
  current_state: string;
  recommended_state: string;
  benefits: string[];
  implementation_complexity: string;
}

export interface ScalabilityAssessment {
  readiness_score: number;
  bottlenecks: string[];
  required_changes: string[];
  timeline: string;
}

export interface TechStackRecommendations {
  updates: TechUpdate[];
  additions: TechAddition[];
  replacements: TechReplacement[];
}

export interface CostAnalysis {
  cost_breakdown: Record<string, number>;
  optimization_opportunities: Array<{
    area: string;
    action: string;
    savings: number;
  }>;
  potential_savings: number;
  savings_percentage: number;
}

export interface ResourceOptimization {
  resource: string;
  current_size: string;
  recommended_size: string;
  monthly_savings: number;
}

export interface CloudMigrationAnalysis {
  migration_cost: number;
  monthly_savings: number;
  payback_period: string;
  risks: string[];
  benefits: string[];
}

export interface SecurityAudit {
  risk_score: number;
  priority_fixes: Array<{
    severity: string;
    count: number;
    action: string;
    timeline: string;
  }>;
  compliance_gaps: string[];
  overall_rating: string;
}

export interface SecurityRecommendation {
  measure: string;
  priority: string;
  implementation_guide: string;
}

export interface ExecutiveSummary {
  key_metrics: {
    system_health: number;
    performance_score: number;
    security_rating: string;
    cost_efficiency: number;
  };
  achievements: string[];
  concerns: string[];
  recommendations: string[];
  roi_analysis: {
    proposed_investment: number;
    expected_savings: number;
    payback_period: string;
    three_year_roi: string;
  };
}

export interface ImprovementRoadmap {
  phases: Array<{
    month: number;
    focus_areas: string[];
    deliverables: string[];
    expected_outcomes: string[];
  }>;
  total_investment: number;
  expected_roi: string;
  risk_mitigation: string;
}

export type AnalysisAction =
  | 'analyze_code_quality'
  | 'technical_debt_analysis'
  | 'refactoring_suggestions'
  | 'analyze_bottlenecks'
  | 'database_performance'
  | 'network_optimization'
  | 'architecture_review'
  | 'scalability_assessment'
  | 'tech_stack_review'
  | 'cost_analysis'
  | 'resource_optimization'
  | 'cloud_migration_analysis'
  | 'security_audit'
  | 'security_hardening'
  | 'executive_summary'
  | 'improvement_roadmap';
