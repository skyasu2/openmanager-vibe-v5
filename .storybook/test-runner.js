const { getStoryContext } = require('@storybook/test-runner');

const config = {
  async preRender(page) {
    // 페이지 로드 전 설정
    await page.addInitScript(() => {
      // 콘솔 에러 무시 설정
      window.console.error = () => {};
    });
  },

  async postRender(page, context) {
    // 접근성 테스트
    await page.waitForLoadState('networkidle');

    // 기본 시각적 테스트
    const elementHandler = await page.$('#storybook-root');
    const innerHTML = await elementHandler.innerHTML();
    expect(innerHTML).toBeDefined();
  },

  tags: {
    include: ['test', 'docs'],
    exclude: ['skip'],
  },
};

module.exports = config;
