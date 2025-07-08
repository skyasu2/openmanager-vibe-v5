#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

console.log('🔍 스토리북 파일 검증 시작...');

// 스토리 파일들 찾기
const storyFiles = glob.sync('src/**/*.stories.@(js|jsx|ts|tsx)');
let errors = [];

storyFiles.forEach(storyFile => {
  const content = fs.readFileSync(storyFile, 'utf8');

  // import 문에서 컴포넌트 경로 추출
  const importMatches = content.match(
    /import\s+.*\s+from\s+['"](.\/[^'"]+)['"]/g
  );

  if (importMatches) {
    importMatches.forEach(importStatement => {
      const pathMatch = importStatement.match(/from\s+['"](.\/[^'"]+)['"]/);
      if (pathMatch) {
        const relativePath = pathMatch[1];
        const dir = path.dirname(storyFile);
        const componentPath = path.resolve(dir, relativePath);

        // 확장자 추가 시도
        const possiblePaths = [
          componentPath,
          componentPath + '.ts',
          componentPath + '.tsx',
          componentPath + '.js',
          componentPath + '.jsx',
        ];

        const exists = possiblePaths.some(p => fs.existsSync(p));

        if (!exists) {
          errors.push({
            story: storyFile,
            missing: relativePath,
            line: importStatement,
          });
        }
      }
    });
  }
});

if (errors.length > 0) {
  console.error('❌ 다음 스토리 파일들에서 누락된 컴포넌트가 발견되었습니다:');
  errors.forEach(error => {
    console.error(`  📁 ${error.story}`);
    console.error(`  ❌ 누락: ${error.missing}`);
    console.error(`  📄 ${error.line}`);
    console.error('');
  });
  process.exit(1);
} else {
  console.log('✅ 모든 스토리 파일의 의존성이 정상입니다.');
}
