// 임시 fastapi-stub (삭제된 파일의 간단한 대체)
export class FastAPIStub {
  async initialize() {
    console.log('FastAPI Stub initialized');
  }
  
  async getStatus() {
    return {
      status: 'active',
      version: '1.0.0'
    };
  }
  
  async processRequest(data: any) {
    return {
      success: true,
      result: data
    };
  }
}

export const fastAPIStub = new FastAPIStub(); 