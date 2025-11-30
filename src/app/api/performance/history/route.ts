/**
 * Performance History API Endpoint
 * Provides historical performance metrics data
 */

import { type NextRequest, NextResponse } from 'next/server';
import { PerformanceService } from '@/modules/performance-monitor/services/PerformanceService';

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const format = searchParams.get('format') || 'json';

    const performanceService = PerformanceService.getInstance();

    if (format === 'export') {
      const exportFormat = searchParams.get('exportFormat') || 'json';
      const exportData = performanceService.exportMetrics(
        exportFormat as 'json' | 'csv'
      );

      const contentType =
        exportFormat === 'csv' ? 'text/csv' : 'application/json';
      const filename = `performance-metrics-${new Date().toISOString().split('T')[0]}.${exportFormat}`;

      return new NextResponse(exportData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const history = performanceService.getMetricsHistory(limit);
    const alerts = performanceService.getAllAlerts();
    const systemHealth = performanceService.calculateSystemHealth();

    return NextResponse.json(
      {
        history,
        alerts,
        systemHealth,
        totalEntries: history.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
