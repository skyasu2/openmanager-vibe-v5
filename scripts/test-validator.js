#!/usr/bin/env node

/**
 * 테스트 품질 검증 스크립트
 * 실제 문제를 검사하는 의미있는 테스트인지 확인
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 테스트 품질 검증 시작...\n');

// 문제가 있는 테스트 패턴들
const problematicPatterns = [
  {
    name: '테스트 내부에 로직 정의',
    pattern: /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]+}/,
    message: '실제 소스 코드를 import하여 테스트해야 합니다',
  },
  {
    name: '과도한 모킹',
    pattern: /vi\.mock\([^)]+\)/g,
    threshold: 3,
    message: '모킹이 너무 많습니다. 실제 구현을 테스트하세요',
  },
  {
    name: '의미없는 테스트',
    pattern: /expect\(true\)\.toBe\(true\)|expect\(\d+\)\.toBe\(\d+\)/,
    message: '실제 비즈니스 로직을 검증하는 테스트를 작성하세요',
  },
  {
    name: 'import 없는 테스트',
    pattern: /^(?!.*import.*from\s+['"]@\/|\.\.\/src).*$/s,
    message: '소스 코드를 import하지 않는 테스트입니다',
  },
];

// 테스트 파일 분석
function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 파일명 추출
  const fileName = path.relative(projectRoot, filePath);
  
  // 패턴 검사
  for (const check of problematicPatterns) {
    const matches = content.match(check.pattern);
    
    if (matches) {
      if (check.threshold) {
        if (matches.length > check.threshold) {
          issues.push({
            type: check.name,
            count: matches.length,
            message: check.message,
          });
        }
      } else if (matches.length > 0) {
        issues.push({
          type: check.name,
          count: matches.length,
          message: check.message,
        });
      }
    }
  }
  
  // 실제 import 검사
  const hasSourceImports = /import.*from\s+['"]@\/|\.\.\/src/.test(content);
  if (!hasSourceImports && !fileName.includes('integration')) {
    issues.push({
      type: 'No source imports',
      message: '소스 코드를 import하지 않습니다',
    });
  }
  
  return { fileName, issues };
}

// 모든 테스트 파일 검사
function validateAllTests() {
  const testFiles = [];
  
  // 테스트 파일 찾기
  function findTestFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findTestFiles(fullPath);
      } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  const testsDir = path.join(projectRoot, 'tests');
  if (fs.existsSync(testsDir)) {
    findTestFiles(testsDir);
  }
  
  // 각 파일 분석
  const results = testFiles.map(analyzeTestFile);
  
  // 결과 출력
  let totalIssues = 0;
  const problematicFiles = results.filter(r => r.issues.length > 0);
  
  if (problematicFiles.length > 0) {
    console.log('❌ 문제가 있는 테스트 파일들:\n');
    
    for (const result of problematicFiles) {
      console.log(`📄 ${result.fileName}`);
      for (const issue of result.issues) {
        console.log(`  ⚠️  ${issue.type}: ${issue.message}`);
        totalIssues++;
      }
      console.log('');
    }
  }
  
  // 요약
  console.log('📊 테스트 품질 요약:');
  console.log(`  - 전체 테스트 파일: ${testFiles.length}`);
  console.log(`  - 문제있는 파일: ${problematicFiles.length}`);
  console.log(`  - 발견된 문제: ${totalIssues}`);
  
  // 좋은 테스트 예시
  const goodTests = results.filter(r => r.issues.length === 0);
  if (goodTests.length > 0) {
    console.log(`\n✅ 좋은 테스트 파일: ${goodTests.length}개`);
    console.log('  예시:');
    goodTests.slice(0, 3).forEach(test => {
      console.log(`  - ${test.fileName}`);
    });
  }
  
  return problematicFiles.length === 0;
}

// 실행
try {
  const isValid = validateAllTests();
  
  if (!isValid) {
    console.log('\n💡 개선 제안:');
    console.log('1. 테스트 내부에 로직을 정의하지 말고 실제 소스를 import하세요');
    console.log('2. 필요한 부분만 모킹하고 나머지는 실제 구현을 사용하세요');
    console.log('3. 실제 사용 시나리오를 테스트하세요');
    console.log('4. docs/effective-testing-guide.md 참고하세요');
    process.exit(1);
  } else {
    console.log('\n✅ 모든 테스트가 품질 기준을 통과했습니다!');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ 검증 중 오류:', error.message);
  process.exit(1);
}