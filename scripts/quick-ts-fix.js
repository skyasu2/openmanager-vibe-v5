#!/usr/bin/env node

/**
 * 🔧 빠른 TypeScript 수정 도구
 * TS1109 (Expression expected) 등 일반적인 TypeScript 에러를 자동 수정
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * TypeScript 에러 파싱
 */
function parseTypeScriptErrors() {
  try {
    const output = execSync('npm run type-check 2>&1', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  } catch (error) {
    // TypeScript 에러가 있어도 계속 진행
    const output = error.stdout || error.stderr || '';
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }
}

/**
 * TS1109 에러 수정 (Expression expected)
 */
function fixTS1109(filePath, errors) {
  if (!fs.existsSync(filePath)) return 0;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = 0;
  
  // ??. 패턴을 ?.로 교체
  const regex1 = /\?\?\./g;
  if (regex1.test(content)) {
    content = content.replace(regex1, '?.');
    fixed++;
  }
  
  // 특정 행에 대한 수정
  const lines = content.split('\n');
  let modified = false;
  
  for (const error of errors) {
    if (error.code === 'TS1109' && error.file === filePath) {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const originalLine = lines[lineIndex];
        let newLine = originalLine;
        
        // ??. → ?.
        newLine = newLine.replace(/\?\?\./g, '?.');
        
        // 대문자로 시작하는 Type 객체의 경우 optional 제거
        newLine = newLine.replace(/([A-Z]\w*Type)\?\?\./g, '$1.');
        
        // 할당문에서 ??. 패턴 처리
        // status??.property = value → status && (status.property = value)
        if (newLine.includes('??.') && newLine.includes('=')) {
          // 복잡한 케이스는 수동 처리 필요
          console.log(`${colors.yellow}⚠️  복잡한 패턴 발견 (수동 확인 필요): ${filePath}:${error.line}${colors.reset}`);
        }
        
        if (originalLine !== newLine) {
          lines[lineIndex] = newLine;
          modified = true;
          fixed++;
        }
      }
    }
  }
  
  if (modified) {
    content = lines.join('\n');
  }
  
  if (fixed > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✅ ${filePath}: ${fixed}개 수정${colors.reset}`);
  }
  
  return fixed;
}

/**
 * 메인 실행
 */
function main() {
  console.log(`${colors.blue}🔧 TypeScript 빠른 수정 도구${colors.reset}\n`);
  
  // 1. TypeScript 에러 수집
  console.log('📋 TypeScript 에러 분석 중...');
  const errors = parseTypeScriptErrors();
  
  // TS1109 에러만 필터링
  const ts1109Errors = errors.filter(e => e.code === 'TS1109');
  
  if (ts1109Errors.length === 0) {
    console.log(`${colors.green}✨ TS1109 에러가 없습니다!${colors.reset}`);
    return;
  }
  
  console.log(`${colors.yellow}발견된 TS1109 에러: ${ts1109Errors.length}개${colors.reset}\n`);
  
  // 2. 파일별로 그룹화
  const fileGroups = {};
  for (const error of ts1109Errors) {
    if (!fileGroups[error.file]) {
      fileGroups[error.file] = [];
    }
    fileGroups[error.file].push(error);
  }
  
  // 3. 각 파일 수정
  let totalFixed = 0;
  for (const [file, fileErrors] of Object.entries(fileGroups)) {
    const fixed = fixTS1109(file, fileErrors);
    totalFixed += fixed;
  }
  
  // 4. 결과 출력
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (totalFixed > 0) {
    console.log(`${colors.green}✅ 총 ${totalFixed}개 수정 완료!${colors.reset}`);
    console.log(`${colors.gray}다시 type-check를 실행하여 확인하세요: npm run type-check${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  자동 수정할 수 있는 패턴을 찾지 못했습니다.${colors.reset}`);
    console.log(`${colors.gray}수동으로 확인이 필요합니다.${colors.reset}`);
  }
  
  // 5. 수정 후 재검증 옵션
  if (process.argv.includes('--verify') && totalFixed > 0) {
    console.log(`\n${colors.blue}🔍 수정 후 재검증 중...${colors.reset}`);
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      console.log(`${colors.green}✅ TypeScript 검사 통과!${colors.reset}`);
    } catch {
      console.log(`${colors.yellow}⚠️  아직 TypeScript 에러가 남아있습니다.${colors.reset}`);
    }
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = {
  parseTypeScriptErrors,
  fixTS1109
};