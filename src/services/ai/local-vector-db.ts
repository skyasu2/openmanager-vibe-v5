// 임시 local-vector-db (삭제된 파일의 간단한 대체)
export class LocalVectorDB {
  async initialize() {
    console.log('Local Vector DB initialized');
  }
  
  async store(id: string, vector: number[]) {
    return { success: true, id };
  }
  
  async search(query: number[], limit = 10) {
    return {
      results: [],
      count: 0
    };
  }
  
  async getStatus() {
    return {
      status: 'active',
      count: 0
    };
  }
}

export const localVectorDB = new LocalVectorDB(); 