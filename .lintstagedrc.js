module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    // ESLint 설정에서 무시하는 파일들을 필터링
    const filteredFiles = files.filter((file) => {
      // scripts 폴더 제외
      if (file.includes('/scripts/') || file.startsWith('scripts/')) {
        return false;
      }
      // test 파일 제외
      if (file.includes('.test.') || file.includes('.spec.')) {
        return false;
      }
      // config 파일 제외
      if (file.includes('.config.')) {
        return false;
      }
      return true;
    });

    // 필터링된 파일이 없으면 빈 배열 반환
    if (filteredFiles.length === 0) {
      return [];
    }

    // 필터링된 파일들에 대해서만 ESLint와 Prettier 실행 (초고속 설정)
    return [
      `eslint --config .eslintrc.ultrafast.json --no-eslintrc --cache --cache-location .next/cache/eslint/ --fix --max-warnings 15 ${filteredFiles.join(' ')}`,
      `prettier --write ${filteredFiles.join(' ')}`,
    ];
  },
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{css,scss}': ['prettier --write'],
};
