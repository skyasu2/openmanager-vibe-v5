#!/usr/bin/env node

/**
 * 🛡️ Error Message 일괄 안전화 스크립트
 * 
 * 모든 .ts, .tsx 파일에서 위험한 error.message 패턴을 찾아
 * 안전한 safeErrorMessage() 호출로 교체합니다.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 교체할 패턴들
const PATTERNS = [
  // error.message 패턴
  {
    pattern: /(\w+)\.message(?!\s*\|\|)/g,
    replacement: (match, errorVar) => `safeErrorMessage(${errorVar})`
  },
  
  // error instanceof Error ? error.message : fallback 패턴
  {
    pattern: /(\w+)\s+instanceof\s+Error\s*\?\s*\1\.message\s*:\s*([^,;}\)]+)/g,
    replacement: (match, errorVar, fallback) => `safeErrorMessage(${errorVar}, ${fallback})`
  },
  
  // error.message || fallback 패턴  
  {
    pattern: /(\w+)\.message\s*\|\|\s*([^,;}\)]+)/g,
    replacement: (match, errorVar, fallback) => `safeErrorMessage(${errorVar}, ${fallback})`
  }
];

// import 문 추가가 필요한지 확인
function needsImport(content) {
  return !content.includes('safeErrorMessage') && 
         !content.includes('import') &&
         content.includes('.message');
}

// import 문 추가
function addImport(content, filePath) {
  if (needsImport(content)) {
    // 다른 import 문이 있는지 확인
    const importRegex = /import[\s\S]*?from[\s\S]*?['"][^'"]*['"];?\s*\n/g;
    const imports = content.match(importRegex) || [];
    
    if (imports.length > 0) {
      // 마지막 import 문 뒤에 추가
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      const importStatement = `import { safeErrorMessage } from '../lib/error-handler';\n`;
      
      return content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
    } else {
      // import 문이 없으면 파일 최상단에 추가
      return `import { safeErrorMessage } from '../lib/error-handler';\n\n${content}`;
    }
  }
  
  return content;
}

// 파일 처리
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 패턴 교체
    PATTERNS.forEach(({ pattern, replacement }) => {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });
    
    // import 문 추가 (필요한 경우)
    if (modified) {
      content = addImport(content, filePath);
    }
    
    // 파일 저장
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 수정: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 에러 (${filePath}):`, error.message);
    return false;
  }
}

// 메인 실행
async function main() {
  console.log('🛡️ Error Message 안전화 스크립트 시작...\n');
  
  // 처리할 파일 패턴
  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!node_modules/**',
    '!.next/**'
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { ignore: ['node_modules/**', '.next/**'] });
    
    for (const file of files) {
      // 이미 안전한 에러 핸들러 파일은 스킵
      if (file.includes('error-handler.ts')) {
        continue;
      }
      
      totalFiles++;
      
      if (processFile(file)) {
        modifiedFiles++;
      }
    }
  }
  
  console.log('\n🎯 완료 보고서:');
  console.log(`📁 총 파일 수: ${totalFiles}`);
  console.log(`✅ 수정된 파일: ${modifiedFiles}`);
  console.log(`💾 건드리지 않은 파일: ${totalFiles - modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n🚀 다음 단계:');
    console.log('1. npm run lint:fix - 코드 스타일 정리');
    console.log('2. npm run type-check - 타입 에러 확인');
    console.log('3. npm run dev - 개발 서버 실행 및 테스트');
  }
}

main().catch(console.error); 