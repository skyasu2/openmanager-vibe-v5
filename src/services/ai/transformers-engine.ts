// 임시 transformers-engine (삭제된 파일의 간단한 대체)
export class TransformersEngine {
  async initialize() {
    console.log('Transformers Engine initialized');
  }
  
  async processText(text: string) {
    return {
      embeddings: [0.1, 0.2, 0.3],
      tokens: text.split(' ')
    };
  }
  
  async getModelInfo() {
    return {
      model: 'transformers-stub',
      version: '1.0.0'
    };
  }
}

export const transformersEngine = new TransformersEngine(); 