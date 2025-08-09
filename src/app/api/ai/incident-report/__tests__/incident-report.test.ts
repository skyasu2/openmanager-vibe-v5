/**
 * 🚨 Automatic Incident Report API Tests
 * TDD for Phase 2: Auto Incident Report Backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions for test modules
interface IncidentReportAPI {
  POST: (request: NextRequest) => Promise<NextResponse>;
  GET: (request: NextRequest) => Promise<NextResponse>;
  _testHelpers?: {
    clearAlertCooldowns: () => void;
  };
}

interface Anomaly {
  severity: 'critical' | 'warning' | 'normal';
  server_id: string;
  metric: string;
  value: number;
  threshold: number;
  message?: string;
}

interface SupabaseMock {
  from: ReturnType<typeof vi.fn>;
}

type AnomaliesAPIResponse = {
  success: boolean;
  anomalies: Anomaly[];
  pattern?: string;
};

// Mock dependencies
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: (request: NextRequest) => Promise<NextResponse>) => handler,
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

// Mock server metrics data
const mockServerMetrics = [
  {
    server_id: 'server-01',
    server_name: 'Web Server 01',
    cpu: 95, // Critical
    memory: 88, // Warning
    disk: 45,
    network: 30,
    timestamp: new Date().toISOString(),
  },
  {
    server_id: 'server-02',
    server_name: 'DB Server 01',
    cpu: 45,
    memory: 92, // Critical
    disk: 87, // Warning
    network: 60,
    timestamp: new Date().toISOString(),
  },
  {
    server_id: 'server-03',
    server_name: 'App Server 01',
    cpu: 65,
    memory: 70,
    disk: 50,
    network: 98, // Critical
    timestamp: new Date().toISOString(),
  },
];

describe('Automatic Incident Report API', () => {
  let POST: IncidentReportAPI['POST'];
  let GET: IncidentReportAPI['GET'];
  let _testHelpers: IncidentReportAPI['_testHelpers'];

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Dynamically import after mocks are set
    const module = await import('../route');
    POST = module.POST;
    GET = module.GET;
    _testHelpers = module._testHelpers;
    
    // Clear alert cooldowns for clean test state
    if (_testHelpers) {
      _testHelpers.clearAlertCooldowns();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear alert cooldowns after each test
    if (_testHelpers) {
      _testHelpers.clearAlertCooldowns();
    }
  });

  describe('Anomaly Detection', () => {
    it('should detect critical anomalies (>90% usage)', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Filter for critical anomalies only
      const criticalAnomalies = data.anomalies.filter((a: Anomaly) => a.severity === 'critical');
      expect(criticalAnomalies).toHaveLength(3); // CPU 95%, Memory 92%, Network 98%
      expect(criticalAnomalies[0].severity).toBe('critical');
    });

    it('should detect warning anomalies (80-90% usage)', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const warnings = data.anomalies.filter((a: Anomaly) => a.severity === 'warning');
      expect(warnings).toHaveLength(2); // Memory 88%, Disk 87%
    });

    it('should classify anomaly patterns', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.pattern).toBeDefined();
      expect(['resource_exhaustion', 'cascade_failure', 'network_saturation', 'isolated_spike'])
        .toContain(data.pattern);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive incident report', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.report).toBeDefined();
      expect(data.report).toHaveProperty('id');
      expect(data.report).toHaveProperty('title');
      expect(data.report).toHaveProperty('severity');
      expect(data.report).toHaveProperty('affected_servers');
      expect(data.report).toHaveProperty('root_cause_analysis');
      expect(data.report).toHaveProperty('recommendations');
      expect(data.report).toHaveProperty('timeline');
    });

    it('should include AI-powered root cause analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.report.root_cause_analysis).toBeDefined();
      expect(data.report.root_cause_analysis).toHaveProperty('primary_cause');
      expect(data.report.root_cause_analysis).toHaveProperty('contributing_factors');
      expect(data.report.root_cause_analysis).toHaveProperty('confidence');
    });

    it('should provide actionable recommendations', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.report.recommendations).toBeInstanceOf(Array);
      expect(data.report.recommendations.length).toBeGreaterThan(0);
      
      const recommendation = data.report.recommendations[0];
      expect(recommendation).toHaveProperty('action');
      expect(recommendation).toHaveProperty('priority');
      expect(recommendation).toHaveProperty('expected_impact');
    });
  });

  describe('Report Storage and Retrieval', () => {
    it('should store incident reports in database', async () => {
      const { supabase } = await import('@/lib/supabase/supabase-client');
      const mockInsert = vi.fn(() => Promise.resolve({ data: { id: 'report-123' }, error: null }));
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert: mockInsert });

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      await POST(request);

      expect(supabase.from).toHaveBeenCalledWith('incident_reports');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        severity: expect.any(String),
        affected_servers: expect.any(Array),
      }));
    });

    it('should retrieve recent incident reports', async () => {
      const mockReports = [
        { id: '1', title: 'Critical CPU Alert', severity: 'critical', created_at: new Date() },
        { id: '2', title: 'Memory Warning', severity: 'warning', created_at: new Date() },
      ];

      const { supabase } = await import('@/lib/supabase/supabase-client');
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockReports, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toHaveLength(2);
      expect(data.reports[0]).toHaveProperty('title');
    });

    it('should cache frequently accessed reports', async () => {
      const { getCachedData, setCachedData } = await import('@/lib/cache-helper');
      (getCachedData as vi.MockedFunction<typeof getCachedData>).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report?id=report-123', {
        method: 'GET',
      });

      await GET(request);

      expect(getCachedData).toHaveBeenCalledWith(
        expect.stringContaining('incident:report-123'),
        expect.any(Function),
        expect.any(Number)
      );
    });
  });

  describe('Alert Notifications', () => {
    it('should trigger alerts for critical incidents', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
          notify: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.notifications).toBeDefined();
      expect(data.notifications.sent).toBe(true);
      expect(data.notifications.channels).toContain('webhook');
    });

    it('should not send duplicate alerts within cooldown period', async () => {
      // First alert
      const request1 = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
          notify: true,
        }),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.notifications.sent).toBe(true);

      // Second alert (should be suppressed)
      const request2 = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
          notify: true,
        }),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.notifications.sent).toBe(false);
      expect(data2.notifications.reason).toBe('cooldown_period');
    });
  });

  describe('Pattern Analysis', () => {
    it('should identify recurring incident patterns', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze_patterns',
          timeRange: '24h',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.patterns).toBeDefined();
      expect(data.patterns).toBeInstanceOf(Array);
      
      if (data.patterns.length > 0) {
        const pattern = data.patterns[0];
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('frequency');
        expect(pattern).toHaveProperty('servers_affected');
        expect(pattern).toHaveProperty('prediction');
      }
    });

    it('should predict next likely incident', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'predict',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.prediction).toBeDefined();
      expect(data.prediction).toHaveProperty('type');
      expect(data.prediction).toHaveProperty('probability');
      expect(data.prediction).toHaveProperty('estimated_time');
      expect(data.prediction).toHaveProperty('preventive_actions');
    });
  });

  describe('Performance Requirements', () => {
    it('should detect anomalies within 100ms', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: mockServerMetrics,
        }),
      });

      await POST(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(100);
    });

    it('should generate reports within 500ms', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      await POST(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metrics gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('metrics');
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('@/lib/supabase/supabase-client');
      (supabase.from as vi.MockedFunction<typeof supabase.from>).mockReturnValue({
        insert: vi.fn(() => Promise.reject(new Error('DB Error'))),
      });

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: mockServerMetrics,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return report even if DB save fails
      expect(response.status).toBe(200);
      expect(data.report).toBeDefined();
      expect(data.warning).toContain('save');
    });
  });
});