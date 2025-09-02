#!/usr/bin/env node
/**
 * 🔐 하드코딩된 시크릿 검사 스크립트
 * GitHub Actions Security Check용 보안 검사 도구
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 하드코딩된 시크릿 검사 시작...');

// 검사할 패턴 정의
const secretPatterns = [
  // GitHub 토큰
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
  { pattern: /ghs_[a-zA-Z0-9]{36}/, name: 'GitHub App Token' },
  { pattern: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/, name: 'GitHub Personal Access Token (new format)' },
  
  // OpenAI API 키
  { pattern: /sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}/, name: 'OpenAI API Key' },
  { pattern: /sk-[a-zA-Z0-9]{48}/, name: 'OpenAI API Key (general)' },
  
  // Google API 키
  { pattern: /AIza[a-zA-Z0-9-_]{35}/, name: 'Google API Key' },
  
  // AWS 키
  { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key ID' },
  { pattern: /[0-9a-zA-Z/+]{40}/, name: 'AWS Secret Access Key (potential)' },
  
  // Supabase 키
  { pattern: /sb-[a-zA-Z0-9]{40}-[a-zA-Z0-9]{20}/, name: 'Supabase Key' },
  
  // 기본적인 패스워드/토큰 패턴
  { pattern: /password\s*[:=]\s*['""][^'"]{8,}['"]/, name: 'Hardcoded Password' },
  { pattern: /token\s*[:=]\s*['""][^'"]{10,}['"]/, name: 'Hardcoded Token' },
  { pattern: /api[_-]?key\s*[:=]\s*['""][^'"]{10,}['"]/, name: 'Hardcoded API Key' }
];

// 제외할 패턴 (예시 값들)
const excludePatterns = [
  'your-api-key-here',
  'example-token',
  'placeholder',
  'dummy-key',
  'test-key',
  'sk-your-openai-api-key',
  'your_supabase_key',
  'your-github-token'
];

// 검사할 파일 확장자
const targetExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.env.example'];

// 제외할 디렉토리 (성능 최적화)
const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'docs', 'reports', '.claude', 'public'];

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  let findings = [];
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        findings = findings.concat(scanDirectory(fullPath));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (targetExtensions.includes(ext)) {
        findings = findings.concat(scanFile(fullPath));
      }
    }
  }
  
  return findings;
}

function scanFile(filePath) {
  let findings = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNumber) => {
      secretPatterns.forEach(({ pattern, name }) => {
        const matches = line.match(pattern);
        if (matches) {
          // 제외 패턴 확인
          const isExcluded = excludePatterns.some(exclude => 
            line.toLowerCase().includes(exclude.toLowerCase())
          );
          
          if (!isExcluded) {
            findings.push({
              file: filePath,
              line: lineNumber + 1,
              type: name,
              content: line.trim(),
              match: matches[0]
            });
          }
        }
      });
    });
  } catch (error) {
    console.warn(`⚠️ 파일 읽기 실패: ${filePath} - ${error.message}`);
  }
  
  return findings;
}

// 메인 실행
try {
  const findings = scanDirectory(process.cwd());
  
  if (findings.length === 0) {
    console.log('✅ 하드코딩된 시크릿을 발견하지 못했습니다.');
    process.exit(0);
  } else {
    console.log(`❌ ${findings.length}개의 잠재적 시크릿을 발견했습니다:`);
    console.log('');
    
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.type}`);
      console.log(`   파일: ${finding.file}:${finding.line}`);
      console.log(`   내용: ${finding.content}`);
      console.log('');
    });
    
    console.log('⚠️ 발견된 항목들을 검토하고 실제 시크릿이 있다면 즉시 제거하세요!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 시크릿 검사 중 오류 발생:', error.message);
  process.exit(1);
}