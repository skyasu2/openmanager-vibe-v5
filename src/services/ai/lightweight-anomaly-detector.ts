// 임시 lightweight-anomaly-detector (삭제된 파일의 간단한 대체)
export class LightweightAnomalyDetector {
  async initialize() {
    console.log('Lightweight Anomaly Detector initialized');
  }

  async detectAnomalies(data: any[], features?: string[], options?: any) {
    // 간단한 anomaly 데이터 생성 (실제 구현을 위한 더미)
    const anomalies = data.slice(0, 2).map((item, index) => ({
      timestamp: Date.now() - index * 1000,
      type: 'threshold_breach',
      severity: 'medium' as const,
      score: 0.8,
      feature: features?.[0] || 'cpu',
      value: Math.random() * 100,
      zScore: 2.5,
      description: '임계값 초과 감지',
    }));

    return {
      anomalies,
      score: 0.1,
      overallScore: 0.1,
      confidence: 0.8,
      processingTime: 50,
      recommendations: [
        '시스템 리소스 모니터링을 강화하세요.',
        '임계값 설정을 재검토해보세요.',
      ],
    };
  }

  async getStatus() {
    return {
      status: 'active',
      detections: 0,
    };
  }
}

export const lightweightAnomalyDetector = new LightweightAnomalyDetector();

export function createLightweightAnomalyDetector(config?: {
  threshold?: number;
  windowSize?: number;
  sensitivity?: number;
  methods?: string[];
}) {
  return new LightweightAnomalyDetector();
}
