export const createTimeoutSignal = (ms: number): AbortSignal | undefined => {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    // Node 18+ 환경
    return (
      AbortSignal as typeof AbortSignal & {
        timeout: (ms: number) => AbortSignal;
      }
    ).timeout(ms);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
  // 환경에서 AbortController를 지원하지 않는 경우
  return undefined;
};
