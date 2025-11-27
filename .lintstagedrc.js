module.exports = {
  '*.{ts,tsx}': [
    'prettier --write',
    // 파일 인자를 무시하고 전체 프로젝트 타입 체크 실행 (tsconfig.json 사용)
    () => 'npm run type-check',
    'eslint --cache --fix --max-warnings=0',
  ],
  '*.{js,jsx}': ['prettier --write', 'eslint --cache --fix'],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
};
