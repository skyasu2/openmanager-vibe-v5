/**
 * 🧠 Dynamic TensorFlow Loader
 * ---------------------------------------------------
 * • 서버(로컬/Render) : @tensorflow/tfjs-node (native C++ addon)
 * • Vercel/Serverless  : @tensorflow/tfjs-node (WASM backend auto)
 *   - Vercel 파일 시스템 제약으로 native addon 불가 → WASM fallback
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
    // 개발/빌드 환경에서 TensorFlow 패키지가 없을 수 있음
    // Module resolution 에러를 graceful하게 처리
    let tf;

    // Vercel 환경 감지 (process.env.VERCEL === '1')
    if (process.env.VERCEL) {
      try {
        // 서버리스에서 native addon 로드 시도 ➜ 실패할 수 있으므로 WASM 백엔드 사용
        tf = await import('@tensorflow/tfjs-node');
        if (tf.setBackend) {
          await tf.setBackend('cpu');
        }
        console.log('✅ TensorFlow (tfjs-node-wasm) 로드 완료 - CPU backend');
        return tf;
      } catch (moduleError) {
        // 모듈 로드 실패 시 null 반환
        console.warn('⚠️ TensorFlow 모듈 로드 실패 (Vercel) - 기능 비활성');
        return null;
      }
    }

    try {
      // 일반 Node 환경 – native addon 선호
      tf = await import('@tensorflow/tfjs-node');
      console.log('✅ TensorFlow (tfjs-node native) 로드 완료');
      return tf;
    } catch (moduleError) {
      // 모듈이 설치되지 않은 경우도 graceful 처리
      console.warn('⚠️ TensorFlow 모듈 로드 실패 (개발 환경) - 기능 비활성');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ TensorFlow 로드 실패 – 기능 비활성', error);
    return null; // 호출 측에서 Null 체크 후 graceful skip
  }
}
