/**
 * 🧠 Dynamic TensorFlow Loader
 * ---------------------------------------------------
 * • 서버(로컬/Render) : @tensorflow/tfjs-node (dynamic import)
 * • Vercel/Serverless  : TensorFlow 완전 비활성화
 *   - Vercel 환경에서는 TensorFlow 패키지 자체를 설치하지 않음
 *
 * 사용 예시:
 * ```ts
 * import { loadTf } from '@/utils/loadTf';
 * const tf = await loadTf();
 * if (!tf) return { disabled: true };
 * // ... your model code
 * ```
 */

export async function loadTf() {
  try {
    // Vercel 환경에서는 TensorFlow 완전 비활성화
    if (process.env.VERCEL) {
      console.log('🚫 Vercel 환경: TensorFlow 비활성화 (서버리스 제약)');
      return null;
    }

    // 로컬/Render 환경에서만 TensorFlow 로드 시도
    try {
      console.log('🔍 TensorFlow 패키지 동적 로드 시도...');

      // 동적 import로 TensorFlow 로드 (패키지가 없어도 에러 안남)
      const tf = await import('@tensorflow/tfjs-node');

      if (tf.setBackend) {
        await tf.setBackend('cpu');
      }

      console.log('✅ TensorFlow (tfjs-node) 로드 완료 - CPU backend');
      return tf;
    } catch (importError) {
      console.log('📦 TensorFlow 패키지 없음 - 선택적 기능으로 건너뜀');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ TensorFlow 로드 실패:', error.message);
    return null;
  }
}

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
