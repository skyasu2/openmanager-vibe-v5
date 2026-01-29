/**
 * AI SDK v6 호환: toolResult에서 output 추출
 * v6는 'output', 이전 버전은 'result' 사용
 */
export function extractToolResultOutput(toolResult: unknown): unknown {
  const tr = toolResult as Record<string, unknown>;
  return tr.result ?? tr.output;
}
