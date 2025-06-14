/**
 * 🧹 E2E 테스트 전역 정리
 * 
 * @description
 * - 테스트 완료 후 정리 작업
 * - 임시 파일 정리
 * - 로그 정리
 */
async function globalTeardown() {
    console.log('🧹 E2E 테스트 정리 작업 시작...');

    try {
        // 테스트 결과 정리
        console.log('📊 테스트 결과 정리 중...');

        // 임시 파일 정리 (필요시)
        // await fs.remove('./test-temp');

        // 메모리 정리
        if (global.gc) {
            global.gc();
        }

        console.log('✅ E2E 테스트 정리 완료');
    } catch (error) {
        console.error('❌ 정리 작업 중 오류:', error);
    }
}

export default globalTeardown; 