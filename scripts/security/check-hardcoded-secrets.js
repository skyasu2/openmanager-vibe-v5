#!/usr/bin/env node

/**
 * 하드코딩된 환경변수 및 시크릿 검사 도구 (최적화 버전)
 * 
 * 이 스크립트는 커밋 전에 하드코딩된 API 키, 토큰, 비밀번호 등을 검사합니다.
 * 변경된 파일만 검사하여 성능을 향상시켰습니다.
 * 
 * @author Claude Code
 * @date 2025-08-17
 * @optimized 2025-08-17
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 최대 검사 파일 수 제한 (성능 최적화)
const MAX_FILES_TO_CHECK = 20;

// 검사할 시크릿 패턴들
const SECRET_PATTERNS = {
  'GitHub Personal Access Token': /ghp_[a-zA-Z0-9]{36}/g,
  'OpenAI API Key': /sk-[a-zA-Z0-9]{48}/g,
  'Google AI API Key': /AIza[a-zA-Z0-9_-]{35}/g,
  'AWS Access Key': /AKIA[0-9A-Z]{16}/g,
  'AWS Session Token': /ASIA[0-9A-Z]{16}/g,
  'Slack Bot Token': /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/g,
  'Slack User Token': /xoxp-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/g,
  'Generic API Key': /['"]\s*[A-Za-z0-9]{32,}\s*['"]/g,
  'JWT Token': /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
};

// 제외할 파일/디렉토리 패턴
const EXCLUDED_PATTERNS = [
  // 환경변수 파일들 (로컬 개발용)
  /\.env\.local$/,
  /\.env\.wsl$/,
  /\.env\.development$/,
  /\.env\.production$/,
  
  // 템플릿 및 예제 파일들 (특별 처리)
  /\.template$/,
  /\.example$/,
  /\.sample$/,
  
  // 빌드 및 캐시 디렉토리
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  
  // 테스트 파일들
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  
  // 이 스크립트 자체
  /check-hardcoded-secrets\.js$/,
  
  // 문서 파일들 (예제 코드 포함 가능)
  /\.md$/,
  /\.txt$/,
  
  // 로그 파일들
  /\.log$/,
];

// 특별 처리: 템플릿 파일에서 실제 시크릿 검사
const TEMPLATE_FILES = [
  '.env.local.template',
  '.env.example',
  '.mcp.json.example',
];

/**
 * 파일이 제외 대상인지 확인
 */
function isExcluded(filePath) {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * 템플릿 파일인지 확인
 */
function isTemplateFile(filePath) {
  return TEMPLATE_FILES.some(template => filePath.endsWith(template));
}

/**
 * 단일 파일에서 시크릿 검사
 */
function checkFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    for (const [secretType, pattern] of Object.entries(SECRET_PATTERNS)) {
      const matches = content.match(pattern);
      if (matches) {
        // 템플릿 파일의 경우 실제 값인지 확인
        if (isTemplateFile(filePath)) {
          const realSecrets = matches.filter(match => !isPlaceholderValue(match));
          if (realSecrets.length > 0) {
            violations.push({
              type: secretType,
              matches: realSecrets,
              line: getLineNumber(content, realSecrets[0]),
            });
          }
        } else {
          violations.push({
            type: secretType,
            matches: matches,
            line: getLineNumber(content, matches[0]),
          });
        }
      }
    }
    
    return violations;
  } catch (error) {
    console.warn(`⚠️  파일 읽기 실패: ${filePath} - ${error.message}`);
    return [];
  }
}

/**
 * 플레이스홀더 값인지 확인
 */
function isPlaceholderValue(value) {
  const placeholderPatterns = [
    /your.*key/i,
    /example/i,
    /placeholder/i,
    /dummy/i,
    /test/i,
    /xxx+/i,
    /\*{3,}/,
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(value));
}

/**
 * 라인 번호 찾기
 */
function getLineNumber(content, searchString) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Git에서 변경된 파일 목록 가져오기
 */
function getChangedFiles() {
  try {
    // Staged 파일들과 Modified 파일들 모두 검사
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    const modified = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    
    const allFiles = new Set();
    
    if (staged) {
      staged.split('\n').forEach(file => allFiles.add(file));
    }
    
    if (modified) {
      modified.split('\n').forEach(file => allFiles.add(file));
    }
    
    return Array.from(allFiles).filter(file => file && fs.existsSync(file));
  } catch (error) {
    console.warn('⚠️  Git 명령 실행 실패, 전체 프로젝트를 검사합니다.');
    return getAllProjectFiles();
  }
}

/**
 * 프로젝트의 모든 파일 가져오기 (백업 방법)
 */
function getAllProjectFiles() {
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!isExcluded(fullPath)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // 권한 없는 디렉토리는 건너뛰기
    }
  }
  
  scanDirectory('.');
  return files;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🔍 하드코딩된 시크릿 검사 시작...');
  
  const allFilesToCheck = getChangedFiles();
  
  if (allFilesToCheck.length === 0) {
    console.log('✅ 검사할 파일이 없습니다.');
    return 0;
  }
  
  // 성능 최적화: 파일 수 제한
  const filesToCheck = allFilesToCheck.slice(0, MAX_FILES_TO_CHECK);
  
  if (filesToCheck.length < allFilesToCheck.length) {
    console.log(`⚠️  파일 수가 많아 ${filesToCheck.length}개만 검사합니다. (전체: ${allFilesToCheck.length}개)`);
  } else {
    console.log(`📁 ${filesToCheck.length}개 파일 검사 중...`);
  }
  
  let totalViolations = 0;
  let checkedFiles = 0;
  
  for (const file of filesToCheck) {
    if (isExcluded(file)) {
      continue;
    }
    
    // 대용량 파일 스킵 (5MB 이상)
    try {
      const stats = fs.statSync(file);
      if (stats.size > 5 * 1024 * 1024) {
        console.log(`⏭️  대용량 파일 스킵: ${file} (${Math.round(stats.size / 1024 / 1024)}MB)`);
        continue;
      }
    } catch (error) {
      continue;
    }
    
    checkedFiles++;
    const violations = checkFileForSecrets(file);
    
    if (violations.length > 0) {
      console.log(`\n❌ ${file}:`);
      
      for (const violation of violations) {
        console.log(`   🚨 ${violation.type} (Line ${violation.line}):`);
        for (const match of violation.matches) {
          const masked = match.substring(0, 8) + '****' + match.substring(match.length - 4);
          console.log(`      ${masked}`);
        }
      }
      
      totalViolations += violations.length;
    }
  }
  
  console.log(`✅ 검사 완료: ${checkedFiles}개 파일 검사됨`);
  
  if (totalViolations > 0) {
    console.log(`\n🚨 총 ${totalViolations}개의 하드코딩된 시크릿이 발견되었습니다!`);
    console.log('\n💡 해결 방법:');
    console.log('   1. 시크릿을 환경변수로 이동');
    console.log('   2. .env.local 파일 사용 (로컬 개발용)');
    console.log('   3. 템플릿 파일의 실제 값을 플레이스홀더로 교체');
    console.log('   4. .gitignore에 민감한 파일 추가');
    console.log('\n⚠️  커밋이 중단되었습니다. 시크릿을 제거한 후 다시 시도하세요.');
    
    return 1;
  }
  
  console.log('✅ 하드코딩된 시크릿이 발견되지 않았습니다.');
  return 0;
}

// 스크립트 실행
if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { checkFileForSecrets, isExcluded, SECRET_PATTERNS };