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

    // 성능 최적화: 파일 수 제한 (한 번에 최대 15개)
    const limitedFiles = filteredFiles.slice(0, 15);
    
    if (limitedFiles.length < filteredFiles.length) {
      console.log(`⚠️  파일 수가 많아 ${limitedFiles.length}개만 검사합니다. 나머지는 다음 커밋에서 처리됩니다.`);
    }

    // 순차 실행 및 성능 최적화된 옵션
    return [
      `eslint --cache --cache-location .next/cache/eslint/ --fix --max-warnings 200 ${limitedFiles.join(' ')} || true`,
      `prettier --write --cache --cache-location .next/cache/prettier/ ${limitedFiles.join(' ')}`,
    ];
  },
  '*.{json,md,yml,yaml}': ['prettier --write --cache --cache-location .next/cache/prettier/'],
  '*.{css,scss}': ['prettier --write --cache --cache-location .next/cache/prettier/'],
};
