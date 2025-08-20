#!/usr/bin/env node

/**
 * 🔧 자동 TypeScript 타입 수정 스크립트 v2.0
 * 
 * 기능:
 * - TypeScript 컴파일러 오류 자동 분석
 * - 일반적인 타입 오류 자동 수정
 * - 안전한 수정만 적용 (데이터 손실 방지)
 * - 수정 불가능한 오류는 상세 가이드 제공
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  DRY_RUN: process.argv.includes('--dry-run'),
  VERIFY_ONLY: process.argv.includes('--verify'),
  MAX_FILES_TO_FIX: 20,
  BACKUP_SUFFIX: '.auto-fix-backup',
};

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  fix: (msg) => console.log(`${colors.cyan}🔧 ${msg}${colors.reset}`),
};

class AutoTypeFix {
  constructor() {
    this.errors = [];
    this.fixedFiles = new Set();
    this.appliedFixes = [];
  }

  // 메인 실행 함수
  async run() {
    try {
      log.info('자동 TypeScript 타입 수정 시작');
      
      if (CONFIG.VERIFY_ONLY) {
        return await this.verifyOnly();
      }
      
      // 1. TypeScript 오류 수집
      await this.collectTypeScriptErrors();
      
      if (this.errors.length === 0) {
        log.success('TypeScript 오류가 없습니다!');
        return;
      }
      
      log.info(`${this.errors.length}개의 TypeScript 오류 발견`);
      
      // 2. 자동 수정 시도
      await this.attemptAutoFixes();
      
      // 3. 결과 보고
      this.reportResults();
      
    } catch (error) {
      log.error(`자동 수정 중 오류: ${error.message}`);
      process.exit(1);
    }
  }

  // 검증 전용 모드
  async verifyOnly() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      log.success('TypeScript 타입 검사 통과!');
      return true;
    } catch (error) {
      log.error('TypeScript 타입 오류가 있습니다.');
      const errorOutput = error.stderr ? error.stderr.toString() : error.stdout.toString();
      console.log(errorOutput.slice(0, 2000)); // 처음 2000자만 출력
      return false;
    }
  }

  // TypeScript 오류 수집
  async collectTypeScriptErrors() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      // 오류가 없으면 여기서 종료
      return;
    } catch (error) {
      const errorOutput = error.stderr ? error.stderr.toString() : error.stdout.toString();
      this.parseTypeScriptErrors(errorOutput);
    }
  }

  // TypeScript 오류 파싱
  parseTypeScriptErrors(errorOutput) {
    const lines = errorOutput.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 오류 패턴 매칭: "path/file.ts(line,col): error TS####: message"
      const errorMatch = line.match(/^(.+\.tsx?)\((\d+),(\d+)\):\s*error\s+TS(\d+):\s*(.+)$/);
      
      if (errorMatch) {
        const [, filePath, lineNum, colNum, errorCode, message] = errorMatch;
        
        this.errors.push({
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(colNum),
          code: errorCode,
          message: message,
          fullLine: line
        });
      }
    }
    
    log.info(`파싱된 오류 수: ${this.errors.length}`);
  }

  // 자동 수정 시도
  async attemptAutoFixes() {
    const fixStrategies = [
      () => this.fixMissingImports(),
      () => this.fixUnusedVariables(),
      () => this.fixImplicitAnyTypes(),
      () => this.fixMissingReturnTypes(),
      () => this.fixNullabilityIssues(),
    ];
    
    for (const strategy of fixStrategies) {
      await strategy();
    }
  }

  // 1. 누락된 임포트 수정
  async fixMissingImports() {
    log.fix('누락된 임포트 자동 수정 시도...');
    
    const importErrors = this.errors.filter(error => 
      error.message.includes("Cannot find name") ||
      error.message.includes("is not defined") ||
      error.code === '2304'
    );
    
    for (const error of importErrors) {
      if (this.fixedFiles.size >= CONFIG.MAX_FILES_TO_FIX) break;
      
      const fix = this.generateImportFix(error);
      if (fix) {
        await this.applyFix(error.file, fix);
      }
    }
  }

  // 2. 사용하지 않는 변수 수정
  async fixUnusedVariables() {
    log.fix('사용하지 않는 변수 수정 시도...');
    
    const unusedErrors = this.errors.filter(error => 
      error.message.includes("is declared but never used") ||
      error.code === '6133'
    );
    
    for (const error of unusedErrors) {
      if (this.fixedFiles.size >= CONFIG.MAX_FILES_TO_FIX) break;
      
      const fix = this.generateUnusedVariableFix(error);
      if (fix) {
        await this.applyFix(error.file, fix);
      }
    }
  }

  // 3. 암시적 any 타입 수정
  async fixImplicitAnyTypes() {
    log.fix('암시적 any 타입 수정 시도...');
    
    const anyErrors = this.errors.filter(error => 
      error.message.includes("implicitly has an 'any' type") ||
      error.code === '7006' || error.code === '7031'
    );
    
    for (const error of anyErrors) {
      if (this.fixedFiles.size >= CONFIG.MAX_FILES_TO_FIX) break;
      
      const fix = this.generateAnyTypeFix(error);
      if (fix) {
        await this.applyFix(error.file, fix);
      }
    }
  }

  // 4. 누락된 반환 타입 수정
  async fixMissingReturnTypes() {
    log.fix('누락된 반환 타입 수정 시도...');
    
    const returnTypeErrors = this.errors.filter(error => 
      error.message.includes("Function lack return type annotation") ||
      error.message.includes("Missing return type")
    );
    
    for (const error of returnTypeErrors) {
      if (this.fixedFiles.size >= CONFIG.MAX_FILES_TO_FIX) break;
      
      const fix = this.generateReturnTypeFix(error);
      if (fix) {
        await this.applyFix(error.file, fix);
      }
    }
  }

  // 5. null/undefined 관련 이슈 수정
  async fixNullabilityIssues() {
    log.fix('Nullability 이슈 수정 시도...');
    
    const nullErrors = this.errors.filter(error => 
      error.message.includes("Object is possibly 'null'") ||
      error.message.includes("Object is possibly 'undefined'") ||
      error.code === '2531' || error.code === '2532'
    );
    
    for (const error of nullErrors) {
      if (this.fixedFiles.size >= CONFIG.MAX_FILES_TO_FIX) break;
      
      const fix = this.generateNullabilityFix(error);
      if (fix) {
        await this.applyFix(error.file, fix);
      }
    }
  }

  // 임포트 수정 생성
  generateImportFix(error) {
    const missingName = error.message.match(/Cannot find name '([^']+)'/);
    if (!missingName) return null;
    
    const name = missingName[1];
    
    // 공통 임포트 매핑
    const commonImports = {
      'React': "import React from 'react';",
      'useState': "import { useState } from 'react';",
      'useEffect': "import { useEffect } from 'react';",
      'useCallback': "import { useCallback } from 'react';",
      'useMemo': "import { useMemo } from 'react';",
      'motion': "import { motion } from 'framer-motion';",
      'NextRequest': "import { NextRequest } from 'next/server';",
      'NextResponse': "import { NextResponse } from 'next/server';",
    };
    
    if (commonImports[name]) {
      return {
        type: 'add_import',
        line: 1,
        content: commonImports[name],
        description: `Add missing import for '${name}'`
      };
    }
    
    return null;
  }

  // 사용하지 않는 변수 수정 생성
  generateUnusedVariableFix(error) {
    const variableName = error.message.match(/'([^']+)' is declared but never used/);
    if (!variableName) return null;
    
    const name = variableName[1];
    
    // 언더스코어 접두사 추가
    return {
      type: 'rename_variable',
      line: error.line,
      find: `\\b${name}\\b`,
      replace: `_${name}`,
      description: `Mark '${name}' as intentionally unused`
    };
  }

  // any 타입 수정 생성
  generateAnyTypeFix(error) {
    // 매개변수의 any 타입 추가
    if (error.message.includes("Parameter") && error.message.includes("implicitly has an 'any' type")) {
      const paramMatch = error.message.match(/Parameter '([^']+)'/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        return {
          type: 'add_parameter_type',
          line: error.line,
          parameter: paramName,
          type: 'any',
          description: `Add explicit 'any' type to parameter '${paramName}'`
        };
      }
    }
    
    return null;
  }

  // 반환 타입 수정 생성
  generateReturnTypeFix(error) {
    // 기본적으로 void 타입 추가 (함수가 아무것도 반환하지 않는 경우)
    return {
      type: 'add_return_type',
      line: error.line,
      returnType: 'void',
      description: 'Add explicit void return type'
    };
  }

  // Nullability 수정 생성
  generateNullabilityFix(error) {
    // 옵셔널 체이닝 또는 null 체크 추가
    return {
      type: 'add_null_check',
      line: error.line,
      description: 'Add null/undefined check or optional chaining'
    };
  }

  // 수정 적용
  async applyFix(filePath, fix) {
    if (!fs.existsSync(filePath)) {
      log.warning(`파일을 찾을 수 없습니다: ${filePath}`);
      return false;
    }
    
    try {
      // 백업 생성
      const backupPath = filePath + CONFIG.BACKUP_SUFFIX;
      if (!CONFIG.DRY_RUN && !fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let modified = false;
      
      switch (fix.type) {
        case 'add_import':
          // 파일 상단에 임포트 추가
          if (!content.includes(fix.content)) {
            lines.unshift(fix.content);
            modified = true;
          }
          break;
          
        case 'rename_variable':
          // 변수명 변경
          const lineIndex = fix.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const originalLine = lines[lineIndex];
            const newLine = originalLine.replace(new RegExp(fix.find, 'g'), fix.replace);
            if (newLine !== originalLine) {
              lines[lineIndex] = newLine;
              modified = true;
            }
          }
          break;
          
        case 'add_parameter_type':
          // 매개변수에 타입 추가
          const paramLineIndex = fix.line - 1;
          if (paramLineIndex >= 0 && paramLineIndex < lines.length) {
            const line = lines[paramLineIndex];
            const updated = line.replace(
              new RegExp(`\\b${fix.parameter}\\b(?!:)`), 
              `${fix.parameter}: ${fix.type}`
            );
            if (updated !== line) {
              lines[paramLineIndex] = updated;
              modified = true;
            }
          }
          break;
      }
      
      if (modified) {
        if (!CONFIG.DRY_RUN) {
          fs.writeFileSync(filePath, lines.join('\n'));
        }
        
        this.fixedFiles.add(filePath);
        this.appliedFixes.push({
          file: filePath,
          description: fix.description,
          line: fix.line
        });
        
        log.success(`${CONFIG.DRY_RUN ? '[DRY RUN] ' : ''}수정 적용: ${fix.description}`);
        return true;
      }
      
    } catch (error) {
      log.error(`파일 수정 실패 ${filePath}: ${error.message}`);
      return false;
    }
    
    return false;
  }

  // 결과 보고
  reportResults() {
    console.log(`
${colors.cyan}📊 자동 타입 수정 결과${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

📁 수정된 파일: ${this.fixedFiles.size}개
🔧 적용된 수정: ${this.appliedFixes.length}개
🔍 전체 오류: ${this.errors.length}개

${this.appliedFixes.length > 0 ? '✅ 적용된 수정사항:' : ''}
${this.appliedFixes.map(fix => 
  `   • ${path.basename(fix.file)}:${fix.line} - ${fix.description}`
).join('\n')}

${this.fixedFiles.size > 0 ? `
💡 다음 단계:
1. 수정된 내용을 검토하세요
2. npm run type-check로 타입 검사를 다시 실행하세요
3. 문제가 있다면 백업 파일(.auto-fix-backup)에서 복원하세요
` : `
⚠️  자동 수정할 수 있는 오류가 없습니다.
수동으로 다음 오류들을 확인해주세요:

${this.errors.slice(0, 5).map(error => 
  `   • ${path.basename(error.file)}:${error.line} - ${error.message}`
).join('\n')}${this.errors.length > 5 ? `\n   ... ${this.errors.length - 5}개 더` : ''}
`}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
    `);
  }
}

// 스크립트 실행
if (require.main === module) {
  const autoFix = new AutoTypeFix();
  autoFix.run().catch(error => {
    console.error('자동 타입 수정 오류:', error);
    process.exit(1);
  });
}

module.exports = AutoTypeFix;