// 임시 enhanced-data-generator (삭제된 파일의 간단한 대체)
export class EnhancedDataGenerator {
  async initialize() {
    console.log('Enhanced Data Generator initialized');
  }
  
  async generateData() {
    return {
      servers: [],
      metrics: {},
      timestamp: Date.now()
    };
  }
  
  async getStatus() {
    return {
      status: 'active',
      generated: 0
    };
  }
}

export const enhancedDataGenerator = new EnhancedDataGenerator(); 