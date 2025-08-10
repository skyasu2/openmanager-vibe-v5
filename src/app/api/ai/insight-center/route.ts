/**
 * 🎯 AI 인사이트 센터 API - Modular Architecture
 * 
 * Phase 4: AI Insight Center
 * - 코드 품질 인사이트
 * - 성능 병목 분석
 * - 시스템 아키텍처 개선 제안
 * - 비용 최적화 분석
 * - 보안 취약점 분석
 * 
 * Modularization: 1076 → ~200 lines (81% reduction)
 * Modules: 8 specialized modules for improved maintainability
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import debug from '@/utils/debug';

// Import all modular components
import { 
  calculateCodeHealth,
  analyzeCodeQuality,
  analyzeTechnicalDebt,
  generateRefactoringSuggestions,
} from './insight-center.code-quality';

import {
  identifyBottlenecks,
  analyzeDatabasePerformance,
  generateNetworkOptimizations,
} from './insight-center.performance';

import {
  reviewArchitecture,
  assessScalability,
} from './insight-center.architecture';

import {
  reviewTechStack,
} from './insight-center.technology';

import {
  analyzeCosts,
  optimizeResources,
  analyzeCloudMigration,
} from './insight-center.cost';

import {
  performSecurityAudit,
  generateSecurityRecommendations,
} from './insight-center.security';

import {
  generateExecutiveSummary,
  createRoadmap,
} from './insight-center.executive';

export const runtime = 'nodejs';

/**
 * GET handler - Service status and capabilities
 */
async function getHandler(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ai-insight-center',
      capabilities: {
        code_quality_analysis: true,
        performance_analysis: true,
        architecture_review: true,
        cost_optimization: true,
        security_audit: true,
      },
      features: {
        technical_debt_tracking: true,
        bottleneck_detection: true,
        scalability_assessment: true,
        cloud_migration_planning: true,
        executive_reporting: true,
      },
      metrics: {
        analysis_types: 16,
        recommendation_categories: 5,
        insight_depth: 'comprehensive',
        response_time_target: '< 300ms',
      },
    });
  } catch (error) {
    debug.error('Get status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Analysis actions using modular functions
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const startTime = Date.now();

    switch (action) {
      // Code Quality Analysis
      case 'analyze_code_quality': {
        const { metrics } = body;
        const insights = analyzeCodeQuality(metrics);
        
        return NextResponse.json({
          success: true,
          insights,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'technical_debt_analysis': {
        const { metrics } = body;
        const insights = analyzeTechnicalDebt(metrics);
        
        return NextResponse.json({
          success: true,
          insights,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'refactoring_suggestions': {
        const { metrics } = body;
        const suggestions = generateRefactoringSuggestions(metrics);
        
        return NextResponse.json({
          success: true,
          suggestions,
          timestamp: new Date().toISOString(),
        });
      }

      case 'code_health_check': {
        const { metrics } = body;
        const health = calculateCodeHealth(metrics);
        
        return NextResponse.json({
          success: true,
          health,
          timestamp: new Date().toISOString(),
        });
      }

      // Performance Analysis
      case 'analyze_bottlenecks': {
        const { system_metrics } = body;
        const bottlenecks = identifyBottlenecks(system_metrics);
        
        return NextResponse.json({
          success: true,
          bottlenecks,
          timestamp: new Date().toISOString(),
        });
      }

      case 'database_performance': {
        const { db_metrics } = body;
        const analysis = analyzeDatabasePerformance(db_metrics);
        
        return NextResponse.json({
          success: true,
          analysis,
          timestamp: new Date().toISOString(),
        });
      }

      case 'network_optimization': {
        const { network_metrics } = body;
        const optimizations = generateNetworkOptimizations(network_metrics);
        
        return NextResponse.json({
          success: true,
          optimizations,
          timestamp: new Date().toISOString(),
        });
      }

      // Architecture Review
      case 'architecture_review': {
        const { current_architecture } = body;
        const improvements = reviewArchitecture(current_architecture);
        
        return NextResponse.json({
          success: true,
          improvements,
          timestamp: new Date().toISOString(),
        });
      }

      case 'scalability_assessment': {
        const { expected_growth } = body;
        const assessment = assessScalability(expected_growth);
        
        return NextResponse.json({
          success: true,
          assessment,
          timestamp: new Date().toISOString(),
        });
      }

      // Technology Stack
      case 'tech_stack_review': {
        const { current_stack } = body;
        const recommendations = reviewTechStack(current_stack);
        
        return NextResponse.json({
          success: true,
          recommendations,
          timestamp: new Date().toISOString(),
        });
      }

      // Cost Analysis
      case 'cost_analysis': {
        const { infrastructure } = body;
        const analysis = analyzeCosts(infrastructure);
        
        return NextResponse.json({
          success: true,
          analysis,
          timestamp: new Date().toISOString(),
        });
      }

      case 'resource_optimization': {
        const { utilization } = body;
        const optimizations = optimizeResources(utilization);
        
        return NextResponse.json({
          success: true,
          optimizations,
          timestamp: new Date().toISOString(),
        });
      }

      case 'cloud_migration_analysis': {
        const { current_infrastructure } = body;
        const analysis = analyzeCloudMigration(current_infrastructure);
        
        return NextResponse.json({
          success: true,
          analysis,
          timestamp: new Date().toISOString(),
        });
      }

      // Security Analysis
      case 'security_audit': {
        const { scan_results } = body;
        const audit = performSecurityAudit(scan_results);
        
        return NextResponse.json({
          success: true,
          audit,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'security_hardening': {
        const { current_measures } = body;
        const recommendations = generateSecurityRecommendations(current_measures);
        
        return NextResponse.json({
          success: true,
          recommendations,
          timestamp: new Date().toISOString(),
        });
      }

      // Executive Reporting
      case 'executive_summary': {
        const summary = generateExecutiveSummary();
        
        return NextResponse.json({
          success: true,
          summary,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'improvement_roadmap': {
        const { timeline } = body;
        const roadmap = createRoadmap(timeline);
        
        return NextResponse.json({
          success: true,
          roadmap,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('Insight center error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export with authentication
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);