import { EngineResult } from './types';

export function combineResponses(results: EngineResult[]): {
  answer: string;
  confidence: number;
  engine: string;
  sources?: any[];
} {
  // 가장 높은 confidence 선택
  const successful = results.filter(r => r.success);
  if (successful.length === 0) {
    return {
      answer: '죄송합니다. 응답을 생성하지 못했습니다.',
      confidence: 0,
      engine: 'none',
    };
  }

  successful.sort((a, b) => b.confidence - a.confidence);
  const top = successful[0];

  return {
    answer: top.answer,
    confidence: top.confidence,
    engine: top.engine,
    sources: top.sources,
  };
} 