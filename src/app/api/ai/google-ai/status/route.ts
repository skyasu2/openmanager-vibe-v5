/**
 * 📊 Google AI 서비스 상태 API
 *
 * GET /api/ai/google-ai/status
 */

import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/types/type-utils';
import { getGoogleAIModel } from '@/lib/ai/google-ai-client'; // getGoogleAIModel now includes fallback logic
import type { GoogleAIStatus } from '@/hooks/api/useGoogleAIStatus';
import debug from '@/utils/debug';
import googleAIManager, { getGoogleAIKey, getGoogleAISecondaryKey } from '@/lib/google-ai-manager';

// 🛡️ 기본 Google AI 상태 (fallback)
const getDefaultGoogleAIStatus = (): GoogleAIStatus => ({
  isEnabled: false,
  isConnected: false,
  apiKeyStatus: { primary: 'missing', secondary: 'missing' },
  primaryKeyConnected: false,
  secondaryKeyConnected: false,
  quotaStatus: {
    daily: { used: 0, limit: 1000, remaining: 1000 },
    perMinute: { used: 0, limit: 60, remaining: 60 },
  },
  lastHealthCheck: new Date().toISOString(),
  healthCheckStatus: 'unhealthy',
  model: 'gemini-1.5-flash',
  features: { chat: false, embedding: false, vision: false },
  performance: { averageResponseTime: 0, successRate: 0, errorRate: 100 },
  activeKeySource: 'none',
});

export async function GET() {
  let status: GoogleAIStatus = getDefaultGoogleAIStatus();
  status.lastHealthCheck = new Date().toISOString(); // Always update last check time

  try {
    const keyStatusInfo = googleAIManager.getKeyStatus();
    const primaryKey = getGoogleAIKey();
    const secondaryKey = getGoogleAISecondaryKey();

    status.isEnabled = keyStatusInfo.isPrimaryAvailable || keyStatusInfo.isSecondaryAvailable;
    status.apiKeyStatus.primary = primaryKey ? 'valid' : 'missing';
    status.apiKeyStatus.secondary = secondaryKey ? 'valid' : 'missing';
    status.primaryKeyId = primaryKey ? primaryKey.substring(0, 7) + '...' + primaryKey.substring(primaryKey.length - 3) : undefined;
    status.secondaryKeyId = secondaryKey ? secondaryKey.substring(0, 7) + '...' + secondaryKey.substring(secondaryKey.length - 3) : undefined;
    status.activeKeySource = 'none';

    let overallConnected = false;
    let overallHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
    let overallAverageResponseTime = 0;
    let successCount = 0;
    let errorCount = 0;
    let totalResponseTime = 0;

    // Health check for primary key
    if (primaryKey) {
      try {
        const startTime = Date.now();
        const model = getGoogleAIModel('gemini-1.5-flash');
        const result = await model.generateContent("test");
        if (result.response.text()) {
          status.primaryKeyConnected = true;
          successCount++;
          totalResponseTime += (Date.now() - startTime);
          status.activeKeySource = 'primary';
          overallConnected = true;
          overallHealthStatus = 'healthy';
        } else {
          status.primaryKeyConnected = false;
          errorCount++;
          overallHealthStatus = overallHealthStatus === 'healthy' ? 'degraded' : 'unhealthy';
        }
      } catch (error: any) {
        debug.warn('Google AI primary key health check failed:', error.message);
        status.primaryKeyConnected = false;
        status.apiKeyStatus.primary = error.message?.includes('invalid API key') ? 'invalid' : (error.message?.includes('quota') ? 'expired' : 'missing');
        errorCount++;
        overallHealthStatus = overallHealthStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
    }

    // Health check for secondary key if primary failed or not available, or just to check secondary
    if (secondaryKey) {
      // Only run secondary health check if primary failed or we're checking both
      if (!status.primaryKeyConnected || (primaryKey && secondaryKey && status.primaryKeyConnected)) {
        try {
          const startTime = Date.now();
          // To ensure secondary key is used if primary failed
          const model = getGoogleAIModel('gemini-1.5-flash'); // This model factory includes fallback
          const result = await model.generateContent("test"); // It will try primary, then secondary
          if (result.response.text()) {
            status.secondaryKeyConnected = true;
            successCount++;
            totalResponseTime += (Date.now() - startTime);
            if (!status.primaryKeyConnected) { // If primary wasn't connected, secondary is now active
              status.activeKeySource = 'secondary';
              overallConnected = true;
              overallHealthStatus = 'healthy';
            }
          } else {
            status.secondaryKeyConnected = false;
            errorCount++;
            overallHealthStatus = overallHealthStatus === 'healthy' && !status.primaryKeyConnected ? 'degraded' : 'unhealthy';
          }
        } catch (error: any) {
          debug.warn('Google AI secondary key health check failed:', error.message);
          status.secondaryKeyConnected = false;
          status.apiKeyStatus.secondary = error.message?.includes('invalid API key') ? 'invalid' : (error.message?.includes('quota') ? 'expired' : 'missing');
          errorCount++;
          overallHealthStatus = overallHealthStatus === 'healthy' && !status.primaryKeyConnected ? 'degraded' : 'unhealthy';
        }
      }
    }
    
    // Determine overall status
    if (status.primaryKeyConnected && status.secondaryKeyConnected) {
      overallHealthStatus = 'healthy';
      status.activeKeySource = 'primary'; // Primary takes precedence if both connected
    } else if (status.primaryKeyConnected) {
      overallHealthStatus = 'healthy';
      status.activeKeySource = 'primary';
    } else if (status.secondaryKeyConnected) {
      overallHealthStatus = 'healthy';
      status.activeKeySource = 'secondary';
    } else {
      overallHealthStatus = 'unhealthy';
      status.activeKeySource = 'none';
    }
    overallConnected = status.primaryKeyConnected || status.secondaryKeyConnected;

    const totalChecks = successCount + errorCount;
    status.isConnected = overallConnected;
    status.healthCheckStatus = overallHealthStatus;
    status.performance.averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;
    status.performance.successRate = totalChecks > 0 ? (successCount / totalChecks) * 100 : 0;
    status.performance.errorRate = totalChecks > 0 ? (errorCount / totalChecks) * 100 : 0;

    // Mocked quota status (can be refined to reflect activeKeySource)
    status.quotaStatus = {
      daily: { used: 100, limit: 1000, remaining: 900 },
      perMinute: { used: 10, limit: 60, remaining: 50 },
    };

    return NextResponse.json(status);
  } catch (error) {
    debug.error('Failed to get Google AI status (catch block):', error);
    const fallbackStatus = getDefaultGoogleAIStatus();
    return NextResponse.json(fallbackStatus, { status: 500 });
  }
}
