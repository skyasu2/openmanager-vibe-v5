#!/usr/bin/env node
/**
 * 🔍 React Hooks 의존성 배열 검증 도구
 * 
 * React Error #310 재발 방지를 위한 자동화된 검증 스크립트
 * useMemo/useCallback의 의존성 배열 누락을 감지합니다.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CRITICAL_VARIABLES = [
  'isAuthenticated',
  'isGitHubUser', 
  'authLoading',
  'statusLoading',
  'isSystemStarting',
  'multiUserStatus'
];

const HOOK_PATTERNS = [
  /useMemo\s*\(\s*\(\)\s*=>\s*{[\s\S]*?}\s*,\s*\[([\s\S]*?)\]/g,
  /useCallback\s*\(\s*[\s\S]*?\s*,\s*\[([\s\S]*?)\]/g
];

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const issues = [];
    
    // useMemo와 useCallback 패턴 검사
    HOOK_PATTERNS.forEach((pattern, index) => {
      const hookName = index === 0 ? 'useMemo' : 'useCallback';
      let match;
      
      while ((match = pattern.exec(content)) !== null) {
        const hookBody = content.slice(
          content.lastIndexOf(hookName, match.index),
          match.index + match[0].length
        );
        
        const dependencies = match[1].split(',').map(dep => dep.trim()).filter(Boolean);
        
        // 중요 변수들이 본문에서 사용되는지 확인
        CRITICAL_VARIABLES.forEach(variable => {
          if (hookBody.includes(variable) && !dependencies.some(dep => dep.includes(variable))) {
            issues.push({
              file: filePath,
              hook: hookName,
              missing: variable,
              line: content.slice(0, match.index).split('\n').length
            });
          }
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir, issues = []) {
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath, issues);
      } else if (extname(file) === '.tsx' || extname(file) === '.ts') {
        issues.push(...scanFile(fullPath));
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return issues;
}

function main() {
  console.log('🔍 React Hooks 의존성 배열 검증 시작...\n');
  
  const issues = scanDirectory('./src');
  
  if (issues.length === 0) {
    console.log('✅ 모든 hooks의 의존성 배열이 올바릅니다!');
    process.exit(0);
  }
  
  console.log(`🚨 ${issues.length}개의 의존성 누락 발견:\n`);
  
  issues.forEach(issue => {
    console.log(`❌ ${issue.file}:${issue.line}`);
    console.log(`   ${issue.hook}에서 '${issue.missing}' 의존성 누락`);
    console.log('');
  });
  
  console.log('💡 수정 방법:');
  console.log('   의존성 배열에 누락된 변수들을 추가하세요.');
  console.log('   예: [isAuthenticated, isGitHubUser, ...]');
  
  process.exit(1);
}

main();