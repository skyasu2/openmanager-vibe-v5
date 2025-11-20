/**
 * 📊 Google AI 서비스 상태 API
 *
 * GET /api/ai/google-ai/status
 */

import { NextResponse } from 'next/server';
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
  model: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash',
  features: { chat: false, embedding: false, vision: false },
  performance: { averageResponseTime: 0, successRate: 0, errorRate: 100 },
  activeKeySource: 'none',
});

export async function GET() {
  const status: GoogleAIStatus = getDefaultGoogleAIStatus();
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

    let successCount = 0;
    let errorCount = 0;
    let totalResponseTime = 0;

    // Health check for primary key
    if (primaryKey) {
      try {
        const startTime = Date.now();
        const model = getGoogleAIModel(process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash');
        const result = await model.generateContent("test");
        if (result.response.text()) {
          status.primaryKeyConnected = true;
          successCount++;
          totalResponseTime += (Date.now() - startTime);
        } else {
          status.primaryKeyConnected = false;
          errorCount++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        debug.warn('Google AI primary key health check failed:', errorMessage);
        status.primaryKeyConnected = false;
        status.apiKeyStatus.primary = errorMessage.includes('invalid API key') ? 'invalid' : (errorMessage.includes('quota') ? 'expired' : 'missing');
        errorCount++;
      }
    }

    // Health check for secondary key
    if (secondaryKey) {
      // Only run secondary health check if primary failed or we're checking both
      if (!status.primaryKeyConnected) { // If primary wasn't connected, try secondary
        try {
          const startTime = Date.now();
          const model = getGoogleAIModel(process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash'); // This model factory includes fallback
          const result = await model.generateContent("test"); // It will try primary, then secondary
          if (result.response.text()) {
            status.secondaryKeyConnected = true;
            successCount++;
            totalResponseTime += (Date.now() - startTime);
          } else {
            status.secondaryKeyConnected = false;
            errorCount++;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          debug.warn('Google AI secondary key health check failed:', errorMessage);
          status.secondaryKeyConnected = false;
          status.apiKeyStatus.secondary = errorMessage.includes('invalid API key') ? 'invalid' : (errorMessage.includes('quota') ? 'expired' : 'missing');
          errorCount++;
        }
      }
    }
    
    // Determine overall status
    status.isConnected = status.primaryKeyConnected || status.secondaryKeyConnected;
    status.healthCheckStatus = status.isConnected ? 'healthy' : 'unhealthy';
    if (status.isConnected) { // Set active key source if not already set (e.g., if primary connected)
      status.activeKeySource = status.primaryKeyConnected ? 'primary' : 'secondary';
    } else {
      status.activeKeySource = 'none';
    }

    // Performance metrics calculation
    const totalChecks = successCount + errorCount;
    status.performance.averageResponseTime = successCount > 0 ? totalResponseTime / successCount : 0; // Only average successful response times
    status.performance.successRate = totalChecks > 0 ? (successCount / totalChecks) * 100 : 0;
    status.performance.errorRate = totalChecks > 0 ? (errorCount / totalChecks) * 100 : 0;

    // Mocked quota status (can be refined to reflect activeKeySource)
    // For now, if at least one key is connected, use generic valid quota. Otherwise, use 0.
    if (status.isConnected) {
        status.quotaStatus = {
            daily: { used: 100, limit: 1000, remaining: 900 },
            perMinute: { used: 10, limit: 60, remaining: 50 },
        };
    } else {
         status.quotaStatus = {
            daily: { used: 0, limit: 1000, remaining: 1000 },
            perMinute: { used: 0, limit: 60, remaining: 60 },
        };
    }

    return NextResponse.json(status);
  } catch (error) {
    debug.error('Failed to get Google AI status (catch block):', error);
    const fallbackStatus = getDefaultGoogleAIStatus();
    return NextResponse.json(fallbackStatus, { status: 500 });
  }
}
