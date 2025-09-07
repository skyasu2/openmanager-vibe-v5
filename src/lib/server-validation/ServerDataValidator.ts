/**
 * 🔍 Server Data Validation Utilities
 * 
 * servers/all/route.ts에서 추출된 검증 로직
 */

import type { ServerMetric as RawServerData, BatchServerInfo } from '@/types/server-metrics';

export class ServerDataValidator {
  static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
  
  static isValidServerData(data: any): data is RawServerData {
    return (
      data &&
      typeof data === 'object' &&
      this.isValidNumber(data.cpu) &&
      this.isValidNumber(data.memory) &&
      this.isValidNumber(data.disk) &&
      this.isValidNumber(data.network) &&
      ['online', 'warning', 'critical'].includes(data.status) &&
      typeof data.type === 'string'
    );
  }
  
  static sanitizeMetricValue(value: any, fallback: number = 50): number {
    if (this.isValidNumber(value)) {
      return Math.max(0, Math.min(100, value));
    }
    console.warn(`Invalid metric value: ${value}, using fallback: ${fallback}`);
    return fallback;
  }
  
  static validateBatchServerInfo(info: any): Partial<BatchServerInfo> | null {
    if (!info || typeof info !== 'object') {
      return null;
    }
    
    if (typeof info.id !== 'string' || typeof info.type !== 'string') {
      return null;
    }
    
    const baseMetrics = info.baseMetrics;
    if (!baseMetrics || typeof baseMetrics !== 'object') {
      return null;
    }
    
    return {
      id: info.id,
      type: info.type,
      baseMetrics: {
        cpu: this.sanitizeMetricValue(baseMetrics.cpu),
        memory: this.sanitizeMetricValue(baseMetrics.memory),
        disk: this.sanitizeMetricValue(baseMetrics.disk),
        network: {
          in: this.sanitizeMetricValue(baseMetrics.network?.in),
          out: this.sanitizeMetricValue(baseMetrics.network?.out)
        },
        responseTime: this.sanitizeMetricValue(baseMetrics.responseTime),
        activeConnections: this.sanitizeMetricValue(baseMetrics.activeConnections)
      }
    };
  }
}