#!/usr/bin/env node

/**
 * 간단한 테스트 러너 - WSL 환경에서 vitest 대체용
 * Node.js로 직접 테스트 파일을 실행
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 테스트 파일 찾기
function findTestFiles(dir, pattern = /\.test\.(ts|tsx)$/) {
  const files = [];
  
  function walk(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${currentDir}:`, err.message);
    }
  }
  
  walk(dir);
  return files;
}

// 단일 테스트 파일 실행
function runSingleTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running: ${path.relative(process.cwd(), testFile)}`);
    
    // tsx를 사용하여 TypeScript 파일 직접 실행
    const child = spawn('npx', ['tsx', testFile], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Passed: ${path.basename(testFile)}`);
        resolve({ file: testFile, passed: true });
      } else {
        console.log(`❌ Failed: ${path.basename(testFile)}`);
        resolve({ file: testFile, passed: false });
      }
    });
    
    child.on('error', (err) => {
      console.error(`❌ Error running ${testFile}:`, err.message);
      resolve({ file: testFile, passed: false, error: err.message });
    });
  });
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  let targetPath = args[0] || 'tests/unit';
  
  // 절대 경로로 변환
  if (!path.isAbsolute(targetPath)) {
    targetPath = path.join(process.cwd(), targetPath);
  }
  
  console.log('🚀 Simple Test Runner for WSL');
  console.log(`📁 Target: ${targetPath}`);
  console.log('');
  
  // 단일 파일인지 디렉토리인지 확인
  const stat = fs.statSync(targetPath);
  let testFiles = [];
  
  if (stat.isFile()) {
    testFiles = [targetPath];
  } else {
    testFiles = findTestFiles(targetPath);
  }
  
  if (testFiles.length === 0) {
    console.log('❌ No test files found');
    process.exit(1);
  }
  
  console.log(`📝 Found ${testFiles.length} test file(s)`);
  
  // 결과 수집
  const results = [];
  
  // 순차적으로 테스트 실행 (동시 실행 시 리소스 문제 방지)
  for (const file of testFiles) {
    const result = await runSingleTest(file);
    results.push(result);
  }
  
  // 결과 요약
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${path.relative(process.cwd(), r.file)}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// 실행
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});