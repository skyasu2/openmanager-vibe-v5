import { NextResponse } from 'next/server';
import type { AIInsight } from '@/hooks/api/useAIInsights';
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';
import type { EnhancedServerMetrics } from '@/types/server';
import { mapServerToEnhanced } from '@/utils/serverUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🧠 AI Insights Generator
 *
 * Generates insights based on the same unified server data source used by the dashboard.
 * This ensures consistency between the dashboard metrics and AI insights.
 */
export async function GET() {
  try {
    // 1. Fetch consistent server data
    const dataSource = getUnifiedServerDataSource();
    const rawServers = await dataSource.getServers();
    const servers = rawServers.map(mapServerToEnhanced);

    // 2. Generate insights based on server data
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();

    // Analyze each server
    servers.forEach((server: EnhancedServerMetrics) => {
      // High CPU Warning
      if (server.cpu_usage > 80) {
        insights.push({
          id: `cpu-${server.id}-${Date.now()}`,
          type: 'anomaly',
          title: `High CPU Usage: ${server.name}`,
          description: `${server.name} is experiencing high CPU usage (${server.cpu_usage.toFixed(1)}%). This may impact performance.`,
          confidence: 0.95,
          severity: server.cpu_usage > 90 ? 'high' : 'medium',
          createdAt: now,
        });
      }

      // High Memory Warning
      if (server.memory_usage > 85) {
        insights.push({
          id: `mem-${server.id}-${Date.now()}`,
          type: 'anomaly',
          title: `Memory Pressure: ${server.name}`,
          description: `${server.name} memory usage is critical (${server.memory_usage.toFixed(1)}%). Consider scaling up.`,
          confidence: 0.9,
          severity: 'high',
          createdAt: now,
        });
      }

      // Disk Space Warning
      if (server.disk_usage > 90) {
        insights.push({
          id: `disk-${server.id}-${Date.now()}`,
          type: 'prediction',
          title: `Disk Space Critical: ${server.name}`,
          description: `${server.name} is running out of disk space (${server.disk_usage.toFixed(1)}% used). Cleanup recommended.`,
          confidence: 0.98,
          severity: 'high',
          createdAt: now,
        });
      }

      // Offline Server
      if (server.status === 'offline') {
        insights.push({
          id: `offline-${server.id}-${Date.now()}`,
          type: 'anomaly',
          title: `Server Offline: ${server.name}`,
          description: `${server.name} is currently offline. Check network connectivity and power status.`,
          confidence: 1.0,
          severity: 'high',
          createdAt: now,
        });
      }
    });

    // General Recommendations (if no critical issues)
    if (insights.length === 0) {
      insights.push({
        id: `rec-opt-${Date.now()}`,
        type: 'recommendation',
        title: 'System Optimization',
        description:
          'All servers are running within normal parameters. Consider enabling auto-scaling for cost optimization.',
        confidence: 0.8,
        severity: 'low',
        createdAt: now,
      });
    }

    // Add a predictive insight (Mock for now, but consistent with general status)
    const avgCpu =
      servers.reduce((acc, s) => acc + s.cpu_usage, 0) / (servers.length || 1);
    if (avgCpu > 60) {
      insights.push({
        id: `pred-load-${Date.now()}`,
        type: 'prediction',
        title: 'Load Increasing',
        description:
          'Average CPU load is trending upwards. Expect peak load within 2 hours.',
        confidence: 0.75,
        severity: 'medium',
        createdAt: now,
      });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('❌ Failed to generate AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
