/**
 * 🚫 DEPRECATED: TensorFlow.js 동적 로더 (비활성화됨)
 *
 * TensorFlow.js 지원이 제거되었습니다.
 * 이 파일은 호환성을 위해 유지되지만 실제로는 작동하지 않습니다.
 * 대신 lightweight-ml-engine을 사용하세요.
 */

export async function loadTf() {
  console.warn(
    '⚠️ TensorFlow.js는 더 이상 지원되지 않습니다. lightweight-ml-engine을 사용하세요.'
  );
  return null;
}

const loadTfUtils = {
  loadTf,
};

export default loadTfUtils;

/**
 * TensorFlow 사용 가능 여부 체크
 */
export function isTensorFlowAvailable(): boolean {
  return !process.env.VERCEL; // Vercel이 아닌 환경에서만 사용 가능
}

/**
 * TensorFlow 상태 정보 반환
 */
export function getTensorFlowStatus() {
  if (process.env.VERCEL) {
    return {
      available: false,
      reason: 'serverless_environment',
      message: 'TensorFlow는 Vercel 서버리스 환경에서 지원되지 않습니다',
    };
  }

  return {
    available: true,
    reason: 'supported_environment',
    message: 'TensorFlow 동적 로드 지원 환경',
  };
}
