#!/usr/bin/env node

/**
 * Import 경로 자동 업데이트 스크립트 - auth 폴더 전용
 * @/lib/auth.ts → @/lib/auth/auth
 * @/lib/api-auth → @/lib/auth/api-auth
 * etc.
 */

const fs = require('fs');
const path = require('path');

// 업데이트할 import 매핑 (auth 파일들)
const importMappings = [
  { from: '@/lib/api-auth', to: '@/lib/auth/api-auth' },
  { from: '@/lib/auth-cache', to: '@/lib/auth/auth-cache' },
  { from: '@/lib/auth-state-manager', to: '@/lib/auth/auth-state-manager' },
  { from: '@/lib/auth', to: '@/lib/auth/auth' }, // ⚠️ 순서 중요: auth.ts는 마지막에
  { from: '@/lib/direct-github-auth', to: '@/lib/auth/direct-github-auth' },
  {
    from: '@/lib/supabase-auth-fallback',
    to: '@/lib/auth/supabase-auth-fallback',
  },
  { from: '@/lib/supabase-auth', to: '@/lib/auth/supabase-auth' },
];

// 스캔할 디렉토리
const directoriesToScan = [
  'src/app',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/services',
  'src/stores',
  'src/utils',
  'src/modules',
  'tests',
];

// TypeScript/JavaScript 파일 필터
function isTsFile(file) {
  return /\.(ts|tsx|js|jsx)$/.test(file) && !file.includes('node_modules');
}

// 디렉토리 재귀 스캔
function scanDirectory(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== 'coverage') {
        files.push(...scanDirectory(fullPath));
      }
    } else if (stat.isFile() && isTsFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Import 경로 업데이트
function updateImports(filePath, content) {
  let updated = content;
  let hasChanges = false;

  for (const mapping of importMappings) {
    // from '@/lib/auth' 또는 from "@/lib/auth" 패턴 매칭
    const singleQuotePattern = new RegExp(
      `from\\s+['"]${mapping.from.replace(/\//g, '\\/')}['"]`,
      'g'
    );
    const doubleQuotePattern = new RegExp(
      `from\\s+"${mapping.from.replace(/\//g, '\\/')}"`,
      'g'
    );

    if (singleQuotePattern.test(updated) || doubleQuotePattern.test(updated)) {
      updated = updated.replace(singleQuotePattern, `from '${mapping.to}'`);
      updated = updated.replace(doubleQuotePattern, `from "${mapping.to}"`);
      hasChanges = true;
    }
  }

  return { updated, hasChanges };
}

// 메인 실행
function main() {
  console.log('🔄 Auth import 경로 업데이트 시작...\n');

  let totalFiles = 0;
  let updatedFiles = 0;

  for (const dir of directoriesToScan) {
    const files = scanDirectory(dir);

    for (const file of files) {
      totalFiles++;

      const content = fs.readFileSync(file, 'utf-8');
      const { updated, hasChanges } = updateImports(file, content);

      if (hasChanges) {
        fs.writeFileSync(file, updated, 'utf-8');
        console.log(`✅ ${file}`);
        updatedFiles++;
      }
    }
  }

  console.log(`\n📊 완료: ${updatedFiles}/${totalFiles} 파일 업데이트됨`);

  if (updatedFiles === 0) {
    console.log('ℹ️  업데이트할 import가 없습니다.');
  }
}

main();
