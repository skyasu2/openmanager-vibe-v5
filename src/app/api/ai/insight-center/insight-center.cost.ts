/**
 * 🎯 AI Insight Center - Cost Analysis Module
 *
 * Infrastructure cost analysis and optimization:
 * - Cost breakdown and analysis
 * - Resource utilization optimization
 * - Cloud migration cost-benefit analysis
 * - Cost optimization opportunities
 */

import type {
  CloudMigrationAnalysis,
  CostAnalysis,
  InfrastructureInfo,
  ResourceOptimization,
  UtilizationMetric,
} from './insight-center.types';

/**
 * Analyze infrastructure costs
 */
export function analyzeCosts(infrastructure: InfrastructureInfo): CostAnalysis {
  const costBreakdown = {
    servers: infrastructure.servers * 200, // $200 per server
    storage: infrastructure.storage_gb * 0.1, // $0.10 per GB
    bandwidth: infrastructure.bandwidth_gb * 0.05, // $0.05 per GB
  };

  const actualCost = infrastructure.monthly_cost;

  const optimizationOpportunities = [];
  let potentialSavings = 0;

  if (infrastructure.servers > 3) {
    optimizationOpportunities.push({
      area: 'Server consolidation',
      action: 'Use containerization to reduce server count',
      savings: infrastructure.servers > 5 ? 400 : 200,
    });
    potentialSavings += infrastructure.servers > 5 ? 400 : 200;
  }

  if (infrastructure.storage_gb > 300) {
    optimizationOpportunities.push({
      area: 'Storage optimization',
      action: 'Archive old data and compress logs',
      savings: infrastructure.storage_gb * 0.02,
    });
    potentialSavings += infrastructure.storage_gb * 0.02;
  }

  if (infrastructure.bandwidth_gb > 500) {
    optimizationOpportunities.push({
      area: 'CDN implementation',
      action: 'Use CDN to reduce origin bandwidth',
      savings: infrastructure.bandwidth_gb * 0.02,
    });
    potentialSavings += infrastructure.bandwidth_gb * 0.02;
  }

  return {
    cost_breakdown: costBreakdown,
    optimization_opportunities: optimizationOpportunities,
    potential_savings: Math.round(potentialSavings),
    savings_percentage: Math.round((potentialSavings / actualCost) * 100),
  };
}

/**
 * Suggest resource optimization
 */
export function optimizeResources(
  utilization: UtilizationMetric[]
): ResourceOptimization[] {
  return utilization.map((server) => {
    const optimizations = {
      resource: server.id,
      current_size: 'Standard',
      recommended_size: 'Standard',
      monthly_savings: 0,
    };

    if (server.cpu_avg < 30 && server.memory_avg < 40) {
      optimizations.recommended_size = 'Small';
      optimizations.monthly_savings = 50;
    } else if (server.cpu_avg > 80 || server.memory_avg > 85) {
      optimizations.recommended_size = 'Large';
      optimizations.monthly_savings = -100; // Additional cost
    }

    return optimizations;
  });
}

/**
 * Analyze cloud migration
 */
export function analyzeCloudMigration(
  currentInfra: string
): CloudMigrationAnalysis {
  const isOnPremise = currentInfra === 'on-premise';

  return {
    migration_cost: isOnPremise ? 15000 : 5000,
    monthly_savings: isOnPremise ? 800 : 200,
    payback_period: isOnPremise ? '18 months' : '25 months',
    risks: [
      'Data migration complexity',
      'Temporary performance degradation',
      'Learning curve for team',
      'Vendor lock-in',
    ],
    benefits: [
      'Elastic scalability',
      'Reduced maintenance overhead',
      'Global availability',
      'Managed services',
    ],
  };
}
