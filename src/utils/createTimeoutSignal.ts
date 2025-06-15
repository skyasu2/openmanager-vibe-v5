export const createTimeoutSignal = (ms: number): AbortSignal | undefined => {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    // Node 18+ 환경
    // @ts-expect-error - Node 18 전용 API로 타입 선언에 없을 수 있음
    return AbortSignal.timeout(ms);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
  // 환경에서 AbortController를 지원하지 않는 경우
  return undefined;
}; 