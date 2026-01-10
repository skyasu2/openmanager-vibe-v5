/**
 * Performance Metrics API Endpoint
 * Provides real-time performance metrics for monitoring
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { PerformanceService } from '@/services/performance/PerformanceService';

export function GET(_request: NextRequest) {
  try {
    const performanceService = PerformanceService.getInstance();
    const currentMetrics = performanceService.getCurrentMetrics();

    if (!currentMetrics) {
      return NextResponse.json(
        { error: 'No metrics available' },
        { status: 404 }
      );
    }

    return NextResponse.json(currentMetrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId } = body;

    const performanceService = PerformanceService.getInstance();

    switch (action) {
      case 'resolve-alert': {
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        const resolved = performanceService.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json(
            { error: 'Alert not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error processing performance action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
