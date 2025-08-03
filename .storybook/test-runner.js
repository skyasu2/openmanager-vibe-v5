const { getStoryContext } = require('@storybook/test-runner');
const path = require('path');
const fs = require('fs');

// 스크린샷 저장 디렉토리
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

// 디렉토리가 없으면 생성
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

module.exports = {
  // 각 스토리 실행 전
  async preVisit(page, context) {
    // 애니메이션 비활성화 (일관된 스크린샷을 위해)
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // 시스템 다크모드 설정 무시
    await page.emulateMedia({ colorScheme: 'light' });
  },

  // 각 스토리 실행 후
  async postVisit(page, context) {
    // 환경변수로 스크린샷 캡처 제어
    if (process.env.SKIP_SCREENSHOTS === 'true') {
      return;
    }

    const storyContext = await getStoryContext(page, context);
    
    // 스토리 ID를 파일명으로 사용 (안전한 파일명으로 변환)
    const fileName = storyContext.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    
    // 반응형 테스트를 위한 뷰포트 설정
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    // 기본 뷰포트만 테스트하려면
    if (process.env.VIEWPORT === 'desktop') {
      await captureScreenshot(page, fileName, 'desktop');
      return;
    }

    // 모든 뷰포트에서 스크린샷 캡처
    for (const viewport of viewports) {
      if (process.env.VIEWPORT && process.env.VIEWPORT !== viewport.name) {
        continue;
      }

      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      // 뷰포트 변경 후 안정화 대기
      await page.waitForTimeout(100);
      
      await captureScreenshot(page, fileName, viewport.name);
    }
  },
};

// 스크린샷 캡처 헬퍼 함수
async function captureScreenshot(page, fileName, viewportName) {
  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `${fileName}-${viewportName}.png`
  );

  try {
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // 뷰포트만 캡처 (성능 향상)
      animations: 'disabled',
    });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`❌ Failed to capture screenshot: ${error.message}`);
  }
}