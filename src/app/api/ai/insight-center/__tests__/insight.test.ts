/**
 * 🎯 AI Insight Center API Tests
 * TDD for Phase 4: AI 인사이트 센터
 *
 * 주요 기능:
 * - 코드 품질 인사이트
 * - 성능 병목 분석
 * - 시스템 아키텍처 개선 제안
 * - 비용 최적화 분석
 * - 보안 취약점 분석
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

vi.mock('@/lib/supabase/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

vi.mock('@/lib/cache-helper', () => ({
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
}));

// Mock data
const mockSystemMetrics = {
  servers: [
    { id: 'server-01', cpu_avg: 75, memory_avg: 82, response_time: 250 },
    { id: 'server-02', cpu_avg: 45, memory_avg: 55, response_time: 120 },
    { id: 'server-03', cpu_avg: 90, memory_avg: 88, response_time: 450 },
  ],
  database: {
    query_performance: { slow_queries: 15, avg_execution_time: 350 },
    connection_pool: { active: 45, idle: 5, max: 50 },
  },
  network: {
    latency: { avg: 25, p95: 85, p99: 150 },
    throughput: { in: 150, out: 200 }, // Mbps
  },
};

const mockCodeMetrics = {
  complexity: {
    high_complexity_files: 12,
    average_complexity: 8.5,
    max_complexity: 25,
  },
  coverage: {
    lines: 72,
    branches: 65,
    functions: 78,
  },
  debt: {
    total_hours: 120,
    critical_issues: 5,
    high_issues: 18,
  },
};

describe('AI Insight Center API', () => {
  let POST: (req: NextRequest) => Promise<Response>;
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Dynamically import after mocks are set
    const module = await import('../route');
    POST = module.POST;
    GET = module.GET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Code Quality Insights', () => {
    it('should analyze code quality metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_code_quality',
            metrics: mockCodeMetrics,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.insights).toBeDefined();
      expect(data.insights).toHaveProperty('summary');
      expect(data.insights).toHaveProperty('recommendations');
      expect(data.insights).toHaveProperty('priority_actions');
      expect(data.insights.summary).toHaveProperty('overall_health');
      expect(data.insights.summary.overall_health).toBeGreaterThanOrEqual(0);
      expect(data.insights.summary.overall_health).toBeLessThanOrEqual(100);
    });

    it('should identify technical debt hotspots', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'technical_debt_analysis',
            metrics: mockCodeMetrics,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.insights).toHaveProperty('debt_hotspots');
      expect(data.insights.debt_hotspots).toBeInstanceOf(Array);
      if (data.insights.debt_hotspots.length > 0) {
        expect(data.insights.debt_hotspots[0]).toHaveProperty('area');
        expect(data.insights.debt_hotspots[0]).toHaveProperty('impact');
        expect(data.insights.debt_hotspots[0]).toHaveProperty('effort');
        expect(data.insights.debt_hotspots[0]).toHaveProperty('roi');
      }
    });

    it('should suggest refactoring opportunities', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'refactoring_suggestions',
            complexity_threshold: 10,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.suggestions).toBeDefined();
      expect(data.suggestions).toBeInstanceOf(Array);
      expect(data.suggestions[0]).toHaveProperty('type');
      expect(data.suggestions[0]).toHaveProperty('description');
      expect(data.suggestions[0]).toHaveProperty('expected_benefit');
    });
  });

  describe('Performance Bottleneck Analysis', () => {
    it('should identify system bottlenecks', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_bottlenecks',
            system_metrics: mockSystemMetrics,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bottlenecks).toBeDefined();
      expect(data.bottlenecks).toBeInstanceOf(Array);
      expect(data.bottlenecks[0]).toHaveProperty('component');
      expect(data.bottlenecks[0]).toHaveProperty('severity');
      expect(data.bottlenecks[0]).toHaveProperty('impact');
      expect(data.bottlenecks[0]).toHaveProperty('resolution');
    });

    it('should analyze database performance', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'database_performance',
            db_metrics: mockSystemMetrics.database,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis).toBeDefined();
      expect(data.analysis).toHaveProperty('slow_query_analysis');
      expect(data.analysis).toHaveProperty('connection_pool_health');
      expect(data.analysis).toHaveProperty('optimization_suggestions');
    });

    it('should provide network optimization insights', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'network_optimization',
            network_metrics: mockSystemMetrics.network,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.optimizations).toBeDefined();
      expect(data.optimizations).toHaveProperty('latency_reduction');
      expect(data.optimizations).toHaveProperty('throughput_improvement');
      expect(data.optimizations).toHaveProperty('cdn_recommendations');
    });
  });

  describe('Architecture Improvements', () => {
    it('should suggest architecture improvements', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'architecture_review',
            current_architecture: {
              microservices: false,
              load_balancing: 'basic',
              caching_strategy: 'minimal',
              database_replication: false,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.improvements).toBeDefined();
      expect(data.improvements).toBeInstanceOf(Array);
      expect(data.improvements[0]).toHaveProperty('area');
      expect(data.improvements[0]).toHaveProperty('current_state');
      expect(data.improvements[0]).toHaveProperty('recommended_state');
      expect(data.improvements[0]).toHaveProperty('benefits');
      expect(data.improvements[0]).toHaveProperty('implementation_complexity');
    });

    it('should evaluate scalability readiness', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'scalability_assessment',
            expected_growth: '3x',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.assessment).toBeDefined();
      expect(data.assessment).toHaveProperty('readiness_score');
      expect(data.assessment).toHaveProperty('bottlenecks');
      expect(data.assessment).toHaveProperty('required_changes');
      expect(data.assessment.readiness_score).toBeGreaterThanOrEqual(0);
      expect(data.assessment.readiness_score).toBeLessThanOrEqual(100);
    });

    it('should recommend technology stack updates', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'tech_stack_review',
            current_stack: ['Node.js', 'PostgreSQL', 'React'],
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(data.recommendations).toHaveProperty('updates');
      expect(data.recommendations).toHaveProperty('additions');
      expect(data.recommendations).toHaveProperty('replacements');
    });
  });

  describe('Cost Optimization', () => {
    it('should analyze infrastructure costs', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'cost_analysis',
            infrastructure: {
              servers: 5,
              storage_gb: 500,
              bandwidth_gb: 1000,
              monthly_cost: 1500,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis).toHaveProperty('cost_breakdown');
      expect(data.analysis).toHaveProperty('optimization_opportunities');
      expect(data.analysis).toHaveProperty('potential_savings');
      expect(data.analysis.potential_savings).toBeGreaterThanOrEqual(0);
    });

    it('should suggest resource right-sizing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'resource_optimization',
            utilization: mockSystemMetrics.servers,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.optimizations).toBeDefined();
      expect(data.optimizations).toBeInstanceOf(Array);
      expect(data.optimizations[0]).toHaveProperty('resource');
      expect(data.optimizations[0]).toHaveProperty('current_size');
      expect(data.optimizations[0]).toHaveProperty('recommended_size');
      expect(data.optimizations[0]).toHaveProperty('monthly_savings');
    });

    it('should provide cloud migration cost-benefit analysis', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'cloud_migration_analysis',
            current_infrastructure: 'on-premise',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis).toBeDefined();
      expect(data.analysis).toHaveProperty('migration_cost');
      expect(data.analysis).toHaveProperty('monthly_savings');
      expect(data.analysis).toHaveProperty('payback_period');
      expect(data.analysis).toHaveProperty('risks');
    });
  });

  describe('Security Analysis', () => {
    it('should identify security vulnerabilities', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'security_audit',
            scan_results: {
              critical: 2,
              high: 5,
              medium: 12,
              low: 25,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.audit).toBeDefined();
      expect(data.audit).toHaveProperty('risk_score');
      expect(data.audit).toHaveProperty('priority_fixes');
      expect(data.audit).toHaveProperty('compliance_gaps');
      expect(data.audit.priority_fixes).toBeInstanceOf(Array);
    });

    it('should provide security hardening recommendations', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'security_hardening',
            current_measures: ['basic_auth', 'https'],
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(data.recommendations).toBeInstanceOf(Array);
      expect(data.recommendations[0]).toHaveProperty('measure');
      expect(data.recommendations[0]).toHaveProperty('priority');
      expect(data.recommendations[0]).toHaveProperty('implementation_guide');
    });
  });

  describe('Comprehensive Insights', () => {
    it('should generate executive summary', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'executive_summary',
            period: '30d',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(data.summary).toHaveProperty('key_metrics');
      expect(data.summary).toHaveProperty('achievements');
      expect(data.summary).toHaveProperty('concerns');
      expect(data.summary).toHaveProperty('recommendations');
      expect(data.summary).toHaveProperty('roi_analysis');
    });

    it('should provide actionable roadmap', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'improvement_roadmap',
            timeline: '6_months',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.roadmap).toBeDefined();
      expect(data.roadmap).toHaveProperty('phases');
      expect(data.roadmap.phases).toBeInstanceOf(Array);
      expect(data.roadmap.phases[0]).toHaveProperty('month');
      expect(data.roadmap.phases[0]).toHaveProperty('focus_areas');
      expect(data.roadmap.phases[0]).toHaveProperty('deliverables');
      expect(data.roadmap.phases[0]).toHaveProperty('expected_outcomes');
    });
  });

  describe('Performance Requirements', () => {
    it('should generate insights within 300ms', async () => {
      const startTime = Date.now();

      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_code_quality',
            metrics: mockCodeMetrics,
          }),
        }
      );

      await POST(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('GET Endpoint - Status and Capabilities', () => {
    it('should return insight center status and capabilities', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/insight-center',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.capabilities).toBeDefined();
      expect(data.capabilities).toHaveProperty('code_quality_analysis');
      expect(data.capabilities).toHaveProperty('performance_analysis');
      expect(data.capabilities).toHaveProperty('architecture_review');
      expect(data.capabilities).toHaveProperty('cost_optimization');
      expect(data.capabilities).toHaveProperty('security_audit');
    });
  });
});
