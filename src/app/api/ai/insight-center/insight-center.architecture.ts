/**
 * 🎯 AI Insight Center - Architecture Analysis Module
 *
 * System architecture analysis and scalability planning:
 * - Architecture pattern review and improvements
 * - Scalability readiness assessment
 * - Infrastructure optimization recommendations
 * - Technology stack modernization
 */

import type {
  ArchitectureInfo,
  ArchitectureImprovement,
  ScalabilityAssessment,
} from './insight-center.types';

/**
 * Review system architecture
 */
export function reviewArchitecture(
  current: ArchitectureInfo
): ArchitectureImprovement[] {
  const improvements = [];

  if (!current.microservices) {
    improvements.push({
      area: 'Architecture Pattern',
      current_state: 'Monolithic',
      recommended_state: 'Microservices',
      benefits: [
        'Better scalability',
        'Independent deployments',
        'Technology flexibility',
      ],
      implementation_complexity: 'high',
    });
  }

  // Use load_balancer field (load_balancing is an alias)
  if (!current.load_balancer || current.load_balancing === false) {
    improvements.push({
      area: 'Load Balancing',
      current_state: 'No load balancing',
      recommended_state: 'Advanced with health checks',
      benefits: ['Better fault tolerance', 'Improved performance'],
      implementation_complexity: 'medium',
    });
  }

  // Check caching_strategy if defined
  if (
    !current.caching ||
    current.caching_strategy === 'minimal' ||
    current.caching_strategy === undefined
  ) {
    improvements.push({
      area: 'Caching',
      current_state: current.caching_strategy || 'No caching',
      recommended_state: 'Multi-layer caching',
      benefits: ['Reduced latency', 'Lower database load', 'Cost savings'],
      implementation_complexity: 'medium',
    });
  }

  // Check database_replication if defined
  if (
    current.database_replication === false ||
    current.database_replication === undefined
  ) {
    improvements.push({
      area: 'Database',
      current_state: 'Single instance',
      recommended_state: 'Primary-replica setup',
      benefits: ['High availability', 'Read scaling', 'Backup redundancy'],
      implementation_complexity: 'medium',
    });
  }

  return improvements;
}

/**
 * Assess scalability readiness
 */
export function assessScalability(
  expectedGrowth: string
): ScalabilityAssessment {
  const growthMultiplier = parseFloat(expectedGrowth.replace('x', ''));

  const readinessFactors = {
    horizontal_scaling: 80,
    caching: 60,
    database_scaling: 50,
    cdn_usage: 40,
    monitoring: 70,
  };

  const readinessScore =
    Object.values(readinessFactors).reduce((sum, v) => sum + v, 0) /
    Object.keys(readinessFactors).length;

  const bottlenecks = [];
  const requiredChanges = [];

  if (readinessFactors.database_scaling < 60) {
    bottlenecks.push('Database scaling capabilities');
    requiredChanges.push('Implement database sharding or read replicas');
  }

  if (readinessFactors.caching < 70) {
    bottlenecks.push('Caching infrastructure');
    requiredChanges.push('Implement distributed caching');
  }

  if (growthMultiplier > 2 && readinessFactors.horizontal_scaling < 80) {
    bottlenecks.push('Horizontal scaling readiness');
    requiredChanges.push(
      'Containerize applications and implement orchestration'
    );
  }

  return {
    readiness_score: Math.round(readinessScore),
    bottlenecks,
    required_changes: requiredChanges,
    timeline: growthMultiplier > 2 ? '3-6 months' : '1-3 months',
  };
}
