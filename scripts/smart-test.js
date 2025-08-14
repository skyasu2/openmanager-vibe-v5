#!/usr/bin/env node

/**
 * 🧪 스마트 테스트 실행기
 * Git diff를 기반으로 변경된 파일과 관련된 테스트만 실행
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * 변경된 파일 목록 가져오기
 */
function getChangedFiles() {
  try {
    // 스테이지된 파일 + 변경된 파일
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    // 브랜치 기준 변경 파일 (옵션)
    const branchArg = process.argv.find(arg => arg.startsWith('--branch='));
    let branchFiles = [];
    
    if (branchArg || process.argv.includes('--branch')) {
      const branch = branchArg ? branchArg.split('=')[1] : 'main';
      branchFiles = execSync(`git diff ${branch}...HEAD --name-only`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(Boolean);
    }
    
    // 중복 제거
    const allFiles = [...new Set([...staged, ...unstaged, ...branchFiles])];
    
    // TypeScript/JavaScript 파일만 필터링
    return allFiles.filter(file => 
      /\.(ts|tsx|js|jsx)$/.test(file) && 
      !file.includes('node_modules') &&
      !file.includes('.config.')
    );
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Git 변경사항을 찾을 수 없습니다.${colors.reset}`);
    return [];
  }
}

/**
 * 파일에 대응하는 테스트 파일 찾기
 */
function findTestFiles(sourceFiles) {
  const testFiles = new Set();
  
  for (const file of sourceFiles) {
    const dir = path.dirname(file);
    const basename = path.basename(file, path.extname(file));
    const ext = path.extname(file);
    
    // 가능한 테스트 파일 패턴들
    const patterns = [
      // 같은 디렉토리
      path.join(dir, `${basename}.test${ext}`),
      path.join(dir, `${basename}.spec${ext}`),
      // __tests__ 디렉토리
      path.join(dir, '__tests__', `${basename}.test${ext}`),
      path.join(dir, '__tests__', `${basename}.spec${ext}`),
      // tests 디렉토리
      path.join('tests', dir, `${basename}.test${ext}`),
      path.join('tests', dir, `${basename}.spec${ext}`),
    ];
    
    // 이미 테스트 파일인 경우
    if (file.includes('.test.') || file.includes('.spec.')) {
      if (fs.existsSync(file)) {
        testFiles.add(file);
      }
      continue;
    }
    
    // 대응하는 테스트 파일 찾기
    for (const pattern of patterns) {
      if (fs.existsSync(pattern)) {
        testFiles.add(pattern);
      }
    }
    
    // 통합 테스트나 관련 테스트 찾기 (파일명 기반)
    try {
      const searchPattern = basename.toLowerCase();
      const allTests = execSync(
        `find . -name "*.test.*" -o -name "*.spec.*" | grep -i ${searchPattern} | head -5`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim().split('\n').filter(Boolean);
      
      allTests.forEach(test => testFiles.add(test.replace(/^\.\//, '')));
    } catch {
      // 검색 실패 시 무시
    }
  }
  
  return Array.from(testFiles);
}

/**
 * 테스트 실행
 */
function runTests(testFiles) {
  if (testFiles.length === 0) {
    console.log(`${colors.yellow}ℹ️  실행할 테스트가 없습니다.${colors.reset}`);
    console.log(`${colors.gray}   test:quick을 대신 실행합니다...${colors.reset}\n`);
    
    // 빠른 테스트 실행
    try {
      execSync('npm run test:quick', { stdio: 'inherit' });
      return true;
    } catch {
      return false;
    }
  }
  
  console.log(`${colors.blue}🧪 ${testFiles.length}개 테스트 파일 실행${colors.reset}`);
  testFiles.forEach(file => {
    console.log(`${colors.gray}   - ${file}${colors.reset}`);
  });
  console.log();
  
  // Vitest로 특정 파일들만 테스트
  const testCommand = `npx vitest run ${testFiles.join(' ')}`;
  
  try {
    execSync(testCommand, { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 메인 실행
 */
function main() {
  console.log(`${colors.blue}🎯 스마트 테스트 시스템 시작${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // 1. 변경된 파일 찾기
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length > 0) {
    console.log(`${colors.green}📝 변경된 파일: ${changedFiles.length}개${colors.reset}`);
    changedFiles.forEach(file => {
      console.log(`${colors.gray}   - ${file}${colors.reset}`);
    });
    console.log();
  }
  
  // 2. 테스트 파일 찾기
  const testFiles = findTestFiles(changedFiles);
  
  // 3. 테스트 실행
  const success = runTests(testFiles);
  
  // 4. 결과 출력
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  if (success) {
    console.log(`\n${colors.green}✅ 테스트 성공! (${duration}초)${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ 테스트 실패! (${duration}초)${colors.reset}`);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = {
  getChangedFiles,
  findTestFiles,
  runTests,
};