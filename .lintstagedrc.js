const path = require('path');

// 환경 변수로 모드 제어
const LINT_MODE = process.env.LINT_MODE || 'auto';
const MAX_FILES_THRESHOLD = 8; // 8개 이상이면 스킵
const MAX_FILES_FAST = 5; // 빠른 모드에서 최대 파일 수

console.log(`🔧 Lint-staged 모드: ${LINT_MODE}`);

module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    // 파일 필터링
    const filteredFiles = files.filter((file) => {
      // 제외 패턴들
      const excludePatterns = [
        '/scripts/', 'scripts/',
        '/docs/', 'docs/',
        '/local-dev/', 'local-dev/',
        '.test.', '.spec.',
        '.config.', '.stories.',
        'node_modules/',
      ];
      
      return !excludePatterns.some(pattern => file.includes(pattern));
    });

    if (filteredFiles.length === 0) {
      console.log('📝 검사할 TypeScript 파일이 없습니다.');
      return [];
    }

    // 스마트 스킵 로직
    if (LINT_MODE === 'auto') {
      if (filteredFiles.length > MAX_FILES_THRESHOLD) {
        console.log(`🚀 스마트 스킵: ${filteredFiles.length}개 파일 (${MAX_FILES_THRESHOLD}개 초과)`);
        console.log('💡 빠른 포맷팅만 실행합니다. CI에서 전체 검증이 실행됩니다.');
        
        // Prettier만 실행 (빠른 포맷팅)
        const limitedFiles = filteredFiles.slice(0, MAX_FILES_FAST);
        return [`prettier --write --cache --cache-location /tmp/lint-cache/prettier/ ${limitedFiles.join(' ')}`];
      }
    }

    // 모드별 실행
    const fileList = filteredFiles.slice(0, MAX_FILES_FAST);
    
    switch (LINT_MODE) {
      case 'off':
        console.log('⏭️  린트 검사 완전 스킵');
        return [];
        
      case 'prettier-only':
        console.log(`🎨 Prettier만 실행: ${fileList.length}개 파일`);
        return [`prettier --write --cache --cache-location /tmp/lint-cache/prettier/ ${fileList.join(' ')}`];
        
      case 'fast':
        console.log(`⚡ 빠른 모드: ${fileList.length}개 파일`);
        return [
          `eslint --config .eslintrc.fast.json --cache --fix --max-warnings 500 ${fileList.join(' ')} || true`,
          `prettier --write --cache --cache-location /tmp/lint-cache/prettier/ ${fileList.join(' ')}`,
        ];
        
      case 'strict':
        console.log(`🔒 엄격 모드: ${fileList.length}개 파일`);
        return [
          `eslint --cache --fix --max-warnings 50 ${fileList.join(' ')}`,
          `prettier --write --cache --cache-location /tmp/lint-cache/prettier/ ${fileList.join(' ')}`,
        ];
        
      default: // 'auto'
        console.log(`🔧 기본 모드: ${fileList.length}개 파일`);
        return [
          `eslint --config .eslintrc.fast.json --cache --fix --max-warnings 200 ${fileList.join(' ')} || true`,
          `prettier --write --cache --cache-location /tmp/lint-cache/prettier/ ${fileList.join(' ')}`,
        ];
    }
  },
  
  '*.{json,md,yml,yaml}': (files) => {
    if (files.length > 10) {
      console.log(`📄 문서 파일 ${files.length}개 - 스킵`);
      return [];
    }
    return ['prettier --write --cache --cache-location /tmp/lint-cache/prettier/'];
  },
  
  '*.{css,scss}': ['prettier --write --cache --cache-location /tmp/lint-cache/prettier/'],
};
