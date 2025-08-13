#!/usr/bin/env node

/**
 * 중국어 문자 검사 스크립트
 * 프로젝트 내 모든 파일에서 중국어 문자를 검출하고 차단합니다.
 * 
 * 사용법:
 * - node scripts/check-chinese-characters.js
 * - npm run check:chinese
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 중국어 문자 감지 정규식
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}]/gu;

// 특정 파일은 중국어 정책 설명을 위해 예외 허용
const ALLOWED_FILES = [
  '.claude/agents/qwen-cli-collaborator.md'  // 중국어 금지 정책 설명을 위한 예시
];

// 검사 제외 파일/폴더
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'google-cloud-sdk',      // Google Cloud SDK 제외
  'google-cloud-cli',      // GCP CLI 제외
  '__pycache__',           // Python 캐시 제외
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '*.so',                  // 바이너리 파일 제외
  '*.gz',                  // 압축 파일 제외
  '*.tar',                 // 압축 파일 제외
  '*.zip',                 // 압축 파일 제외
  '*.egg',                 // Python egg 파일 제외
  '*.cdr',                 // CorelDRAW 파일 제외
  '*.pyc',                 // Python 컴파일 파일 제외
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

// 파일이 제외 대상인지 확인
function shouldExclude(filePath) {
  // 허용된 파일인지 확인
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (ALLOWED_FILES.some(allowed => normalizedPath.endsWith(allowed))) {
    return true;
  }
  
  // 제외 패턴 확인
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const ext = pattern.replace('*', '');
      return filePath.endsWith(ext);
    }
    return filePath.includes(pattern);
  });
}

// 디렉토리 재귀 탐색
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (shouldExclude(filePath)) continue;
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, results);
    } else if (stat.isFile()) {
      checkFile(filePath, results);
    }
  }
  
  return results;
}

// 파일 내 중국어 검사
function checkFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(CHINESE_REGEX);
    
    if (matches && matches.length > 0) {
      const lines = content.split('\n');
      const violations = [];
      
      lines.forEach((line, index) => {
        const lineMatches = line.match(CHINESE_REGEX);
        if (lineMatches) {
          violations.push({
            line: index + 1,
            content: line.trim(),
            characters: lineMatches
          });
        }
      });
      
      results.push({
        file: filePath,
        count: matches.length,
        violations
      });
    }
  } catch (error) {
    // 바이너리 파일이거나 읽을 수 없는 파일은 무시
  }
}

// 메인 실행 함수
function main() {
  console.log('🔍 중국어 문자 검사 시작...\n');
  
  const projectRoot = process.cwd();
  const results = scanDirectory(projectRoot);
  
  if (results.length === 0) {
    console.log('✅ 중국어 문자가 발견되지 않았습니다. 프로젝트가 깨끗합니다!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${results.length}개 파일에서 중국어 문자가 발견되었습니다!\n`);
    
    let totalCharacters = 0;
    
    results.forEach(result => {
      console.log(`📄 ${result.file}`);
      console.log(`   발견된 중국어 문자: ${result.count}개`);
      
      // 처음 3개 위반 사항만 표시
      const displayCount = Math.min(result.violations.length, 3);
      for (let i = 0; i < displayCount; i++) {
        const violation = result.violations[i];
        console.log(`   줄 ${violation.line}: ${violation.characters.join(', ')}`);
        
        // 내용이 너무 길면 자르기
        const content = violation.content.length > 60 
          ? violation.content.substring(0, 60) + '...' 
          : violation.content;
        console.log(`   내용: ${content}`);
      }
      
      if (result.violations.length > 3) {
        console.log(`   ... 그 외 ${result.violations.length - 3}개 더 있음`);
      }
      
      console.log('');
      totalCharacters += result.count;
    });
    
    console.log(`\n⛔ 총 ${totalCharacters}개의 중국어 문자가 발견되었습니다.`);
    console.log('📝 해결 방법:');
    console.log('   1. 모든 중국어 주석을 영어 또는 한국어로 변환');
    console.log('   2. 중국어 변수명을 영어로 변경');
    console.log('   3. 중국어 문자열을 영어/한국어로 교체');
    console.log('\n💡 Qwen CLI 사용 시 자동으로 중국어가 차단됩니다.');
    
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { CHINESE_REGEX, checkFile, scanDirectory };