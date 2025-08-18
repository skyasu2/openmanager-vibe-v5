/**
 * 🧠 Intelligent Monitoring API Tests
 * TDD for Phase 3: 지능형 모니터링 백엔드
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

// Mock historical data
const mockHistoricalData = [
  {
    timestamp: '2024-01-01T00:00:00Z',
    cpu: 45,
    memory: 50,
    disk: 30,
    network: 25,
  },
  {
    timestamp: '2024-01-01T01:00:00Z',
    cpu: 48,
    memory: 52,
    disk: 31,
    network: 28,
  },
  {
    timestamp: '2024-01-01T02:00:00Z',
    cpu: 52,
    memory: 55,
    disk: 32,
    network: 30,
  },
  {
    timestamp: '2024-01-01T03:00:00Z',
    cpu: 58,
    memory: 60,
    disk: 33,
    network: 35,
  },
  {
    timestamp: '2024-01-01T04:00:00Z',
    cpu: 65,
    memory: 68,
    disk: 35,
    network: 40,
  },
  {
    timestamp: '2024-01-01T05:00:00Z',
    cpu: 72,
    memory: 75,
    disk: 37,
    network: 45,
  },
  {
    timestamp: '2024-01-01T06:00:00Z',
    cpu: 80,
    memory: 82,
    disk: 40,
    network: 50,
  },
  {
    timestamp: '2024-01-01T07:00:00Z',
    cpu: 85,
    memory: 88,
    disk: 42,
    network: 55,
  },
];

// Mock current metrics
const mockCurrentMetrics = {
  server_id: 'server-01',
  server_name: 'Web Server 01',
  cpu: 78,
  memory: 80,
  disk: 41,
  network: 52,
  timestamp: '2024-01-01T08:00:00Z',
};

describe('Intelligent Monitoring API', () => {
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

  describe('Predictive Alerts', () => {
    it('should predict future resource exhaustion', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: mockHistoricalData,
            current_metrics: mockCurrentMetrics,
            horizon_hours: 4,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.predictions).toBeDefined();
      expect(data.predictions).toHaveProperty('cpu');
      expect(data.predictions).toHaveProperty('memory');
      expect(data.predictions.cpu.will_exceed_threshold).toBe(true);
      expect(data.predictions.cpu.time_to_threshold).toBeLessThan(4);
    });

    it('should generate preemptive alerts for predicted issues', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: mockHistoricalData,
            current_metrics: mockCurrentMetrics,
            horizon_hours: 2,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.alerts).toBeDefined();
      expect(data.alerts.length).toBeGreaterThan(0);
      expect(data.alerts[0]).toHaveProperty('type', 'predictive');
      expect(data.alerts[0]).toHaveProperty('severity');
      expect(data.alerts[0]).toHaveProperty('message');
      expect(data.alerts[0]).toHaveProperty('time_until_critical');
    });

    it('should calculate prediction confidence based on data quality', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: mockHistoricalData.slice(0, 3), // Less data
            current_metrics: mockCurrentMetrics,
            horizon_hours: 8, // Longer prediction
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.predictions.confidence).toBeLessThan(0.7); // Lower confidence
      expect(data.predictions.data_quality).toBe('limited');
    });
  });

  describe('Anomaly Forecasting', () => {
    it('should forecast anomaly probability', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'forecast_anomalies',
            server_id: 'server-01',
            historical_data: mockHistoricalData,
            pattern_window: 24,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.forecast).toBeDefined();
      expect(data.forecast).toHaveProperty('next_hour_probability');
      expect(data.forecast).toHaveProperty('next_day_probability');
      expect(data.forecast).toHaveProperty('risk_factors');
      expect(data.forecast.next_hour_probability).toBeGreaterThanOrEqual(0);
      expect(data.forecast.next_hour_probability).toBeLessThanOrEqual(1);
    });

    it('should identify recurring anomaly patterns', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_patterns',
            server_id: 'server-01',
            time_range: '7d',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.patterns).toBeDefined();
      expect(data.patterns).toBeInstanceOf(Array);
      if (data.patterns.length > 0) {
        expect(data.patterns[0]).toHaveProperty('pattern_type');
        expect(data.patterns[0]).toHaveProperty('frequency');
        expect(data.patterns[0]).toHaveProperty('next_occurrence');
        expect(data.patterns[0]).toHaveProperty('confidence');
      }
    });

    it('should predict seasonal patterns', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'seasonal_analysis',
            server_id: 'server-01',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.seasonal_patterns).toBeDefined();
      expect(data.seasonal_patterns).toHaveProperty('daily_peak_hours');
      expect(data.seasonal_patterns).toHaveProperty('weekly_peak_days');
      expect(data.seasonal_patterns).toHaveProperty('monthly_trends');
    });
  });

  describe('Adaptive Thresholds', () => {
    it('should calculate dynamic thresholds based on historical data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'calculate_thresholds',
            server_id: 'server-01',
            metric_type: 'cpu',
            learning_period: '7d',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.thresholds).toBeDefined();
      expect(data.thresholds).toHaveProperty('warning');
      expect(data.thresholds).toHaveProperty('critical');
      expect(data.thresholds.warning).toBeGreaterThan(0);
      expect(data.thresholds.critical).toBeGreaterThan(data.thresholds.warning);
      expect(data.thresholds).toHaveProperty('confidence_interval');
    });

    it('should adapt thresholds to workload patterns', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'adapt_thresholds',
            server_id: 'server-01',
            context: 'business_hours',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.adapted_thresholds).toBeDefined();
      expect(data.adapted_thresholds.business_hours).toBeDefined();
      expect(data.adapted_thresholds.off_hours).toBeDefined();
      expect(data.adapted_thresholds.business_hours.cpu).toBeGreaterThan(
        data.adapted_thresholds.off_hours.cpu
      );
    });

    it('should provide threshold adjustment recommendations', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'threshold_recommendations',
            server_id: 'server-01',
            false_positive_rate: 0.15,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(data.recommendations).toBeInstanceOf(Array);
      expect(data.recommendations[0]).toHaveProperty('metric');
      expect(data.recommendations[0]).toHaveProperty('current_threshold');
      expect(data.recommendations[0]).toHaveProperty('recommended_threshold');
      expect(data.recommendations[0]).toHaveProperty('reason');
    });
  });

  describe('Learning-based Pattern Recognition', () => {
    it('should learn from historical incidents', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'learn_patterns',
            incident_history: [
              {
                timestamp: '2024-01-01T10:00:00Z',
                type: 'cpu_spike',
                resolved: true,
              },
              {
                timestamp: '2024-01-02T10:00:00Z',
                type: 'cpu_spike',
                resolved: true,
              },
              {
                timestamp: '2024-01-03T10:00:00Z',
                type: 'cpu_spike',
                resolved: true,
              },
            ],
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.learned_patterns).toBeDefined();
      expect(data.learned_patterns).toHaveProperty('recurring_issues');
      expect(data.learned_patterns.recurring_issues).toBeInstanceOf(Array);
      expect(data.learned_patterns).toHaveProperty('resolution_patterns');
    });

    it('should improve prediction accuracy over time', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'evaluate_learning',
            server_id: 'server-01',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.learning_metrics).toBeDefined();
      expect(data.learning_metrics).toHaveProperty('accuracy');
      expect(data.learning_metrics).toHaveProperty('precision');
      expect(data.learning_metrics).toHaveProperty('recall');
      expect(data.learning_metrics).toHaveProperty('improvement_trend');
    });

    it('should identify complex multi-metric patterns', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'multi_metric_analysis',
            server_id: 'server-01',
            metrics: ['cpu', 'memory', 'network'],
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.correlations).toBeDefined();
      expect(data.correlations).toHaveProperty('cpu_memory');
      expect(data.correlations).toHaveProperty('cpu_network');
      expect(data.compound_patterns).toBeDefined();
    });
  });

  describe('Auto-scaling Recommendations', () => {
    it('should recommend scaling actions based on predictions', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'scaling_recommendations',
            server_id: 'server-01',
            current_metrics: mockCurrentMetrics,
            predicted_load: { cpu: 95, memory: 92 },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scaling_recommendations).toBeDefined();
      expect(data.scaling_recommendations).toBeInstanceOf(Array);
      expect(data.scaling_recommendations[0]).toHaveProperty('action');
      expect(data.scaling_recommendations[0]).toHaveProperty('resource');
      expect(data.scaling_recommendations[0]).toHaveProperty('amount');
      expect(data.scaling_recommendations[0]).toHaveProperty('urgency');
      expect(data.scaling_recommendations[0]).toHaveProperty('cost_impact');
    });

    it('should provide cost-optimized scaling suggestions', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'cost_optimized_scaling',
            server_id: 'server-01',
            budget_constraint: 100,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.optimized_plan).toBeDefined();
      expect(data.optimized_plan).toHaveProperty('total_cost');
      expect(data.optimized_plan.total_cost).toBeLessThanOrEqual(100);
      expect(data.optimized_plan).toHaveProperty('actions');
      expect(data.optimized_plan).toHaveProperty('expected_performance');
    });

    it('should schedule scaling actions for optimal timing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'schedule_scaling',
            server_id: 'server-01',
            predicted_patterns: {
              peak_start: '09:00',
              peak_end: '17:00',
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.scaling_schedule).toBeDefined();
      expect(data.scaling_schedule).toBeInstanceOf(Array);
      expect(data.scaling_schedule[0]).toHaveProperty('time');
      expect(data.scaling_schedule[0]).toHaveProperty('action');
      expect(data.scaling_schedule[0]).toHaveProperty('preemptive');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete predictions within 200ms', async () => {
      const startTime = Date.now();

      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: mockHistoricalData.slice(-5),
            current_metrics: mockCurrentMetrics,
            horizon_hours: 1,
          }),
        }
      );

      await POST(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should handle large datasets efficiently', async () => {
      const largeHistoricalData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        cpu: 50 + Math.random() * 40,
        memory: 40 + Math.random() * 50,
        disk: 30 + Math.random() * 30,
        network: 20 + Math.random() * 60,
      }));

      const startTime = Date.now();

      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'analyze_patterns',
            server_id: 'server-01',
            historical_data: largeHistoricalData,
          }),
        }
      );

      await POST(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient data gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: [], // No data
            current_metrics: mockCurrentMetrics,
            horizon_hours: 4,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient data');
    });

    it('should validate prediction horizon limits', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'predict',
            server_id: 'server-01',
            historical_data: mockHistoricalData,
            current_metrics: mockCurrentMetrics,
            horizon_hours: 168, // 7 days - too long
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('horizon');
    });
  });

  describe('GET Endpoint - Status and Capabilities', () => {
    it('should return monitoring system status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/intelligent-monitoring',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.capabilities).toBeDefined();
      expect(data.capabilities).toHaveProperty('predictive_alerts');
      expect(data.capabilities).toHaveProperty('anomaly_forecasting');
      expect(data.capabilities).toHaveProperty('adaptive_thresholds');
      expect(data.capabilities).toHaveProperty('pattern_learning');
      expect(data.capabilities).toHaveProperty('auto_scaling');
    });
  });
});
