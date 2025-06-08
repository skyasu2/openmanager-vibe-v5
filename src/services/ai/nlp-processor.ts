// 임시 nlp-processor (삭제된 파일의 간단한 대체)
export class NLPProcessor {
  async initialize() {
    console.log('NLP Processor initialized');
  }
  
  async processQuery(query: string) {
    return {
      intent: 'general',
      confidence: 0.8,
      tokens: query.split(' ')
    };
  }
  
  async processFailurePredictionQuery(query: string) {
    return {
      intent: 'failure_prediction',
      confidence: 0.9,
      tokens: query.split(' ')
    };
  }
  
  getProcessorInfo() {
    return {
      status: 'active',
      version: '1.0.0'
    };
  }
}

export const nlpProcessor = new NLPProcessor(); 