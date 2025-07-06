import { chromium, FullConfig } from '@playwright/test';

/**
 * 🔧 E2E 테스트 전역 설정
 * 
 * @description
 * - 서버 준비 상태 확인
 * - 환경 초기화
 * - 헬스체크 실행
 */
async function globalSetup(config: FullConfig) {
    console.log('🚀 E2E 테스트 환경 설정 시작...');

    const baseURL = 'http://localhost:3002';

    if (!baseURL) {
        throw new Error('baseURL이 설정되지 않았습니다.');
    }

    // 브라우저 인스턴스 생성 (헬스체크용)
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log(`🔍 서버 헬스체크: ${baseURL}`);

        // 서버 준비 상태 확인 (최대 3분 대기)
        let retries = 18; // 18 * 10초 = 3분
        let serverReady = false;

        while (retries > 0 && !serverReady) {
            try {
                // 헬스체크 엔드포인트 확인
                const response = await page.goto(`${baseURL}/api/health`, {
                    waitUntil: 'networkidle',
                    timeout: 10000,
                });

                if (response && response.status() === 200) {
                    serverReady = true;
                    console.log('✅ 서버 준비 완료');
                    break;
                }
            } catch (error) {
                console.log(`⏳ 서버 준비 대기... (${retries}회 남음)`);
                await page.waitForTimeout(10000); // 10초 대기
                retries--;
            }
        }

        if (!serverReady) {
            throw new Error('서버가 준비되지 않았습니다. 수동으로 서버를 시작해주세요.');
        }

        // 추가 시스템 확인
        try {
            console.log('🔍 AI 시스템 상태 확인...');
            const aiResponse = await page.goto(`${baseURL}/api/ai/unified/status`, {
                timeout: 15000,
            });

            if (aiResponse && aiResponse.status() === 200) {
                console.log('✅ AI 시스템 준비 완료');
            } else {
                console.log('⚠️ AI 시스템 상태 불안정 (테스트 계속 진행)');
            }
        } catch (error) {
            console.log('⚠️ AI 시스템 체크 실패 (테스트 계속 진행)');
        }

        // 데이터 생성기 확인
        try {
            console.log('🔍 데이터 생성기 상태 확인...');
            const dataResponse = await page.goto(`${baseURL}/api/dashboard`, {
                timeout: 15000,
            });

            if (dataResponse && dataResponse.status() === 200) {
                console.log('✅ 데이터 생성기 준비 완료');
            } else {
                console.log('⚠️ 데이터 생성기 상태 불안정 (테스트 계속 진행)');
            }
        } catch (error) {
            console.log('⚠️ 데이터 생성기 체크 실패 (테스트 계속 진행)');
        }

        // 기본 대시보드 페이지 로드 테스트
        console.log('🔍 대시보드 페이지 사전 로드...');
        try {
            await page.goto(`${baseURL}/dashboard`, {
                waitUntil: 'networkidle',
                timeout: 30000,
            });
            console.log('✅ 대시보드 사전 로드 완료');
        } catch (error) {
            console.log('⚠️ 대시보드 사전 로드 실패 (테스트 계속 진행)');
        }

        console.log('🎉 E2E 테스트 환경 설정 완료');

    } finally {
        await browser.close();
    }
}

export default globalSetup; 