// 임시 lightweight-anomaly-detector (삭제된 파일의 간단한 대체)
export class LightweightAnomalyDetector {
  async initialize() {
    console.log('Lightweight Anomaly Detector initialized');
  }
  
  async detectAnomalies(data: any[]) {
    return {
      anomalies: [],
      score: 0.1
    };
  }
  
  async getStatus() {
    return {
      status: 'active',
      detections: 0
    };
  }
}

export const lightweightAnomalyDetector = new LightweightAnomalyDetector(); 