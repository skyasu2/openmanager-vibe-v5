/**
 * 🚨 자동 장애 보고서 API 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock setup
vi.mock('@/lib/cache-helper', () => ({
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: any) => handler, // 인증 미들웨어를 바이패스
  checkAPIAuth: vi.fn(() => null), // 인증 성공으로 Mock
}));

vi.mock('@/lib/supabase/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'report-123', title: 'Test Report' }, 
            error: null 
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [{ id: 'report-123', title: 'Test Report' }], 
            error: null 
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/utils/unified-ai-engine-router', () => ({
  UnifiedAIEngineRouter: {
    getInstance: vi.fn(() => ({
      processRequest: vi.fn(() => Promise.resolve({
        success: true,
        data: {
          root_cause_analysis: {
            primary_cause: 'High CPU usage due to memory leak',
            contributing_factors: ['Inefficient query', 'Poor caching'],
            confidence: 0.85,
          },
          recommendations: [
            { action: 'Restart affected services', priority: 'high', expected_impact: 'High performance improvement' }
          ],
        },
      })),
    })),
  },
}));

// 🎭 Test Mocks
console.log('🎭 Google AI Mock 활성화됨 (테스트 환경)');
console.log('🎭 MCP Context Loader Mock 활성화됨 (테스트 환경)');
console.log('🎭 Supabase RAG Engine Mock 활성화됨 (테스트 환경)');
console.log('🎭 외부 API Mock 활성화됨 (테스트 환경)');
console.log('🎭 Supabase Mock 활성화됨 (테스트 환경)');

describe('Automatic Incident Report API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Anomaly Detection', () => {
    it('should detect critical anomalies (>90% usage)', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: [
            {
              server_id: 'srv-001',
              server_name: 'web-server-01',
              cpu: 95,
              memory: 88,
              disk: 75,
              network: 45,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.anomalies).toBeDefined();
      expect(data.anomalies.some((a: any) => a.severity === 'critical')).toBe(true);
    });

    it('should detect warning anomalies (80-90% usage)', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: [
            {
              server_id: 'srv-002',
              server_name: 'db-server-01',
              cpu: 85,
              memory: 82,
              disk: 60,
              network: 30,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.anomalies).toBeDefined();
      expect(data.anomalies.some((a: any) => a.severity === 'warning')).toBe(true);
    });

    it('should classify anomaly patterns', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: [
            {
              server_id: 'srv-003',
              server_name: 'api-server-01',
              cpu: 92,
              memory: 94,
              disk: 88,
              network: 78,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.anomalies).toBeDefined();
      expect(data.anomalies.length).toBeGreaterThan(0);
      
      const critical_anomalies = data.anomalies.filter((a: any) => a.severity === 'critical');
      expect(critical_anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive incident report', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-001',
              server_name: 'web-server-01',
              cpu: 95,
              memory: 90,
              disk: 75,
              network: 45,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report).toHaveProperty('id');
      expect(data.report).toHaveProperty('title');
      expect(data.report).toHaveProperty('severity');
      expect(data.report).toHaveProperty('affected_servers');
      expect(data.report).toHaveProperty('root_cause_analysis');
      expect(data.report).toHaveProperty('recommendations');
    });

    it('should include AI-powered root cause analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-001',
              server_name: 'web-server-01',
              cpu: 96,
              memory: 93,
              disk: 80,
              network: 50,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(data.report.root_cause_analysis).toBeDefined();
      expect(data.report.root_cause_analysis).toHaveProperty('primary_cause');
      expect(data.report.root_cause_analysis).toHaveProperty('contributing_factors');
      expect(data.report.root_cause_analysis).toHaveProperty('confidence');
      expect(data.report.root_cause_analysis.confidence).toBeGreaterThan(0);
      expect(data.report.root_cause_analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide actionable recommendations', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-001',
              server_name: 'web-server-01',
              cpu: 97,
              memory: 91,
              disk: 82,
              network: 55,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(data.report.recommendations).toBeDefined();
      expect(Array.isArray(data.report.recommendations)).toBe(true);
      expect(data.report.recommendations.length).toBeGreaterThan(0);
      
      const firstRec = data.report.recommendations[0];
      expect(firstRec).toHaveProperty('action');
      expect(firstRec).toHaveProperty('priority');
      expect(firstRec).toHaveProperty('expected_impact');
    });
  });

  describe('Report Storage and Retrieval', () => {
    it('should store incident reports in database', async () => {
      const { supabase } = await import('@/lib/supabase/supabase-client');

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-001',
              server_name: 'web-server-01',
              cpu: 94,
              memory: 89,
              disk: 77,
              network: 48,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('incident_reports');
    });

    it('should retrieve recent incident reports', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.reports[0]).toHaveProperty('id');
      expect(data.reports[0]).toHaveProperty('title');
    });

    it('should cache frequently accessed reports', async () => {
      const { getCachedData, setCachedData } = await import('@/lib/cache-helper');
      
      // getCachedData는 동기 함수이므로 mockReturnValue 사용
      (getCachedData as vi.MockedFunction<typeof getCachedData>).mockReturnValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report?id=report-123', {
        method: 'GET',
      });

      await GET(request);

      // 실제 호출 인자 확인: 단일 파라미터만 전달됨
      expect(getCachedData).toHaveBeenCalledWith('incident:report-123');
    });
  });

  describe('Alert Notifications', () => {
    it('should trigger alerts for critical incidents', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          notify: true,
          metrics: [
            {
              server_id: 'srv-critical',
              server_name: 'critical-server-01',
              cpu: 98,
              memory: 96,
              disk: 92,
              network: 85,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.report.severity).toBe('critical');
      
      // Alert notification should be triggered for critical incidents
      expect(data).toHaveProperty('notifications');
      expect(data.notifications).toHaveProperty('sent');
      expect(data.notifications.sent).toBe(true);
    });

    it('should not send duplicate alerts within cooldown period', async () => {
      // First alert
      const request1 = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          notify: true,
          metrics: [
            {
              server_id: 'srv-cooldown',
              server_name: 'cooldown-server-01',
              cpu: 99,
              memory: 97,
              disk: 90,
              network: 88,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.notifications.sent).toBe(true);

      // Second alert (should be suppressed due to cooldown)
      const request2 = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          notify: true,
          metrics: [
            {
              server_id: 'srv-cooldown',
              server_name: 'cooldown-server-01',
              cpu: 99,
              memory: 98,
              disk: 91,
              network: 89,
              timestamp: new Date(Date.now() + 1000).toISOString(), // 1초 후
            }
          ]
        }),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.notifications.sent).toBe(false); // Cooldown active
      expect(data2.notifications.reason).toBe('cooldown_period');
    });
  });

  describe('Pattern Analysis', () => {
    it('should identify recurring incident patterns', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          timeRange: '7d'
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.analysis).toHaveProperty('patterns');
      expect(Array.isArray(data.analysis.patterns)).toBe(true);
    });

    it('should predict next likely incident', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'predict',
          timeRange: '24h'
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.predictions).toBeDefined();
      expect(data.predictions).toHaveProperty('next_likely_incident');
      expect(data.predictions.next_likely_incident).toHaveProperty('probability');
      expect(data.predictions.next_likely_incident).toHaveProperty('estimated_time');
    });
  });

  describe('Performance Requirements', () => {
    it('should detect anomalies within 100ms', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: [
            {
              server_id: 'srv-perf',
              server_name: 'perf-server-01',
              cpu: 93,
              memory: 87,
              disk: 81,
              network: 58,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(100); // Less than 100ms
    });

    it('should generate reports within 500ms', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-report-perf',
              server_name: 'report-perf-server-01',
              cpu: 95,
              memory: 91,
              disk: 83,
              network: 72,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(data.report).toBeDefined();
      expect(processingTime).toBeLessThan(500); // Less than 500ms
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metrics gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'detect',
          metrics: [
            {
              // Missing required fields
              cpu: 'invalid',
              memory: null,
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('Invalid metrics data');
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('@/lib/supabase/supabase-client');
      
      // Mock database error
      (supabase.from as vi.Mock).mockReturnValueOnce({
        insert: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Database connection failed' }
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/ai/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          metrics: [
            {
              server_id: 'srv-db-error',
              server_name: 'db-error-server-01',
              cpu: 92,
              memory: 88,
              disk: 75,
              network: 60,
              timestamp: new Date().toISOString(),
            }
          ]
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('Database connection failed');
    });
  });
});