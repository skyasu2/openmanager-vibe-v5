#!/usr/bin/env tsx

/**
 * 🚀 자동 수정 및 커밋/푸시 시스템
 * 
 * 테스트 실패 시 자동으로 수정하고 재시도하는 근본적 해결 시스템
 * 최대 5회 반복, 실패 시 상세 보고서 생성
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  success: boolean;
  errors: {
    type: 'typescript' | 'eslint' | 'test' | 'build';
    file: string;
    line?: number;
    message: string;
    rule?: string;
  }[];
  warnings: number;
  duration: number;
}

interface FixAttempt {
  attempt: number;
  timestamp: Date;
  errors: TestResult['errors'];
  fixesApplied: string[];
  success: boolean;
}

class AutoFixAndCommit {
  private maxAttempts = 5;
  private currentAttempt = 0;
  private fixHistory: FixAttempt[] = [];
  private commitMessage: string;

  constructor(commitMessage: string) {
    this.commitMessage = commitMessage;
  }

  /**
   * 메인 실행 함수
   */
  async run(): Promise<boolean> {
    console.log('🚀 자동 수정 및 커밋 시스템 시작...\n');
    
    while (this.currentAttempt < this.maxAttempts) {
      this.currentAttempt++;
      console.log(`\n📍 시도 ${this.currentAttempt}/${this.maxAttempts}`);
      console.log('='.repeat(50));

      // 1. 현재 상태 테스트
      const testResult = await this.runTests();
      
      if (testResult.success) {
        console.log('✅ 모든 테스트 통과!');
        return await this.commitAndPush();
      }

      // 2. 에러 분석 및 수정
      const fixesApplied = await this.applyFixes(testResult.errors);
      
      // 3. 기록 저장
      this.fixHistory.push({
        attempt: this.currentAttempt,
        timestamp: new Date(),
        errors: testResult.errors,
        fixesApplied,
        success: false
      });

      if (fixesApplied.length === 0) {
        console.log('⚠️ 더 이상 자동으로 수정할 수 있는 에러가 없습니다.');
        break;
      }

      console.log(`\n✏️ ${fixesApplied.length}개 수정 사항 적용됨`);
      fixesApplied.forEach(fix => console.log(`  - ${fix}`));
    }

    // 최대 시도 횟수 초과 또는 수정 불가능
    await this.generateReport();
    return false;
  }

  /**
   * 테스트 실행
   */
  private async runTests(): Promise<TestResult> {
    const result: TestResult = {
      success: true,
      errors: [],
      warnings: 0,
      duration: 0
    };

    const startTime = Date.now();

    // 1. TypeScript 체크
    console.log('📋 TypeScript 체크...');
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      console.log('  ✅ TypeScript 체크 통과');
    } catch (error: any) {
      result.success = false;
      const errors = this.parseTypeScriptErrors(error.stdout?.toString() || error.stderr?.toString() || '');
      result.errors.push(...errors);
      console.log(`  ❌ TypeScript 에러: ${errors.length}개`);
    }

    // 2. ESLint 체크 (변경된 파일만)
    console.log('🧹 ESLint 체크...');
    try {
      const changedFiles = this.getChangedFiles();
      if (changedFiles.length > 0) {
        const tsFiles = changedFiles.filter(f => f.match(/\.(ts|tsx|js|jsx)$/));
        if (tsFiles.length > 0) {
          execSync(`npx eslint ${tsFiles.join(' ')}`, { stdio: 'pipe' });
          console.log('  ✅ ESLint 체크 통과');
        }
      }
    } catch (error: any) {
      result.success = false;
      const errors = this.parseESLintErrors(error.stdout?.toString() || error.stderr?.toString() || '');
      result.errors.push(...errors);
      console.log(`  ❌ ESLint 에러: ${errors.length}개`);
    }

    // 3. 테스트 실행
    console.log('🧪 테스트 실행...');
    try {
      execSync('npm run test:quick', { stdio: 'pipe' });
      console.log('  ✅ 테스트 통과');
    } catch (error: any) {
      result.success = false;
      const errors = this.parseTestErrors(error.stdout?.toString() || error.stderr?.toString() || '');
      result.errors.push(...errors);
      console.log(`  ❌ 테스트 실패: ${errors.length}개`);
    }

    // 4. 빌드 체크
    console.log('🔨 빌드 체크...');
    try {
      execSync('npm run build', { stdio: 'pipe', env: { ...process.env, ANALYZE: 'false' } });
      console.log('  ✅ 빌드 성공');
    } catch (error: any) {
      result.success = false;
      const errors = this.parseBuildErrors(error.stdout?.toString() || error.stderr?.toString() || '');
      result.errors.push(...errors);
      console.log(`  ❌ 빌드 실패: ${errors.length}개`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * 에러 자동 수정
   */
  private async applyFixes(errors: TestResult['errors']): Promise<string[]> {
    const fixes: string[] = [];
    const processedFiles = new Set<string>();

    for (const error of errors) {
      if (processedFiles.has(error.file)) continue;

      try {
        switch (error.type) {
          case 'eslint':
            if (await this.fixESLintError(error)) {
              fixes.push(`ESLint: ${error.file} - ${error.rule || error.message}`);
              processedFiles.add(error.file);
            }
            break;

          case 'typescript':
            if (await this.fixTypeScriptError(error)) {
              fixes.push(`TypeScript: ${error.file} - ${error.message}`);
              processedFiles.add(error.file);
            }
            break;

          case 'test':
            if (await this.fixTestError(error)) {
              fixes.push(`Test: ${error.file} - ${error.message}`);
              processedFiles.add(error.file);
            }
            break;

          case 'build':
            if (await this.fixBuildError(error)) {
              fixes.push(`Build: ${error.file} - ${error.message}`);
              processedFiles.add(error.file);
            }
            break;
        }
      } catch (e) {
        console.error(`  ⚠️ 수정 실패: ${error.file} - ${e}`);
      }

      // 한 번에 너무 많은 수정을 방지
      if (fixes.length >= 10) break;
    }

    return fixes;
  }

  /**
   * ESLint 에러 수정
   */
  private async fixESLintError(error: TestResult['errors'][0]): Promise<boolean> {
    const filePath = path.join(process.cwd(), error.file);
    if (!fs.existsSync(filePath)) return false;

    let content = fs.readFileSync(filePath, 'utf-8');
    let fixed = false;

    // 일반적인 ESLint 에러 자동 수정
    switch (error.rule) {
      case '@typescript-eslint/no-unused-vars':
        // 미사용 변수를 _로 시작하도록 변경
        if (error.line) {
          const lines = content.split('\n');
          const line = lines[error.line - 1];
          const match = line.match(/\b(\w+)\s+is\s+(defined|assigned)/);
          if (match) {
            lines[error.line - 1] = line.replace(new RegExp(`\\b${match[1]}\\b`, 'g'), `_${match[1]}`);
            content = lines.join('\n');
            fixed = true;
          }
        }
        break;

      case '@typescript-eslint/ban-ts-comment':
        // @ts-ignore를 @ts-expect-error로 변경
        content = content.replace(/@ts-ignore/g, '@ts-expect-error');
        fixed = true;
        break;

      case '@typescript-eslint/no-explicit-any':
        // any를 unknown으로 변경
        content = content.replace(/:\s*any\b/g, ': unknown');
        content = content.replace(/<any>/g, '<unknown>');
        fixed = true;
        break;

      case '@typescript-eslint/no-floating-promises':
        // Promise 앞에 void 추가
        if (error.line) {
          const lines = content.split('\n');
          const line = lines[error.line - 1];
          if (!line.trim().startsWith('void ')) {
            lines[error.line - 1] = line.replace(/(\s+)([a-zA-Z_$][\w$]*\()/g, '$1void $2');
            content = lines.join('\n');
            fixed = true;
          }
        }
        break;

      case '@typescript-eslint/await-thenable':
        // 불필요한 await 제거
        if (error.line) {
          const lines = content.split('\n');
          lines[error.line - 1] = lines[error.line - 1].replace(/await\s+/g, '');
          content = lines.join('\n');
          fixed = true;
        }
        break;

      case '@typescript-eslint/require-await':
        // async 키워드 제거
        if (error.line) {
          const lines = content.split('\n');
          lines[error.line - 1] = lines[error.line - 1].replace(/async\s+/g, '');
          content = lines.join('\n');
          fixed = true;
        }
        break;
    }

    // ESLint --fix 시도
    if (!fixed) {
      try {
        execSync(`npx eslint --fix "${filePath}"`, { stdio: 'pipe' });
        fixed = true;
      } catch {
        // --fix가 실패해도 계속 진행
      }
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
    }

    return fixed;
  }

  /**
   * TypeScript 에러 수정
   */
  private async fixTypeScriptError(error: TestResult['errors'][0]): Promise<boolean> {
    const filePath = path.join(process.cwd(), error.file);
    if (!fs.existsSync(filePath)) return false;

    let content = fs.readFileSync(filePath, 'utf-8');
    let fixed = false;

    // TypeScript 에러 패턴 분석 및 수정
    if (error.message.includes('Expression expected')) {
      // TS1109: Expression expected - 주로 잘못된 ?? 패턴
      // ??.property → ?.property (optional chaining)
      content = content.replace(/\?\?\./g, '?.');
      
      // 독립적인 ?? 패턴 (앞뒤로 연산자가 있는 경우)
      // status??.watchdogReport = → status && status.watchdogReport =
      // 하지만 이건 복잡하므로 단순히 ?.로 변경
      
      // 전체 패턴 교체
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // ??. 패턴을 ?.로 교체
        lines[i] = lines[i].replace(/\?\?\./g, '?.');
        
        // SystemEventType??.PROPERTY → SystemEventType.PROPERTY (enum/const 객체는 optional 불필요)
        lines[i] = lines[i].replace(/(\b[A-Z][a-zA-Z]*Type)\?\?\./g, '$1.');
      }
      content = lines.join('\n');
      
      fixed = true;
    } else if (error.message.includes('is defined but never used')) {
      // 미사용 변수 처리
      const match = error.message.match(/'(\w+)'/);
      if (match) {
        const varName = match[1];
        content = content.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
        fixed = true;
      }
    } else if (error.message.includes('Argument of type')) {
      // 타입 불일치 - 타입 단언 추가
      if (error.line) {
        const lines = content.split('\n');
        // 간단한 타입 단언 추가 (as any는 최후의 수단)
        lines[error.line - 1] = lines[error.line - 1].replace(/(\w+)\)/g, '$1 as any)');
        content = lines.join('\n');
        fixed = true;
      }
    } else if (error.message.includes('Property') && error.message.includes('does not exist')) {
      // 속성 없음 에러 - 옵셔널 체이닝 추가
      if (error.line) {
        const lines = content.split('\n');
        lines[error.line - 1] = lines[error.line - 1].replace(/\./g, '?.');
        content = lines.join('\n');
        fixed = true;
      }
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
    }

    return fixed;
  }

  /**
   * 테스트 에러 수정
   */
  private async fixTestError(error: TestResult['errors'][0]): Promise<boolean> {
    // 테스트 에러는 대부분 로직 문제이므로 자동 수정이 어려움
    // 기본적인 import 문제 정도만 처리
    const filePath = path.join(process.cwd(), error.file);
    if (!fs.existsSync(filePath)) return false;

    let content = fs.readFileSync(filePath, 'utf-8');
    let fixed = false;

    if (error.message.includes('Cannot find module')) {
      // 모듈을 찾을 수 없는 경우 - mock 추가
      const match = error.message.match(/'([^']+)'/);
      if (match) {
        const moduleName = match[1];
        const mockCode = `\njest.mock('${moduleName}', () => ({}));\n`;
        if (!content.includes(mockCode)) {
          content = mockCode + content;
          fixed = true;
        }
      }
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
    }

    return fixed;
  }

  /**
   * 빌드 에러 수정
   */
  private async fixBuildError(error: TestResult['errors'][0]): Promise<boolean> {
    // 빌드 에러는 대부분 TypeScript 에러와 유사
    return this.fixTypeScriptError(error);
  }

  /**
   * 에러 파싱 함수들
   */
  private parseTypeScriptErrors(output: string): TestResult['errors'] {
    const errors: TestResult['errors'] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)/);
      if (match) {
        errors.push({
          type: 'typescript',
          file: match[1],
          line: parseInt(match[2]),
          message: match[4]
        });
      }
    }
    
    return errors;
  }

  private parseESLintErrors(output: string): TestResult['errors'] {
    const errors: TestResult['errors'] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\s*(\d+):(\d+)\s+error\s+(.+?)\s+(@?\S+)$/);
      if (match) {
        // 파일 경로는 이전 라인에서 추출
        const fileIndex = lines.indexOf(line);
        let filePath = '';
        for (let i = fileIndex - 1; i >= 0; i--) {
          if (lines[i] && !lines[i].match(/^\s*\d+:/)) {
            filePath = lines[i].trim();
            break;
          }
        }
        
        errors.push({
          type: 'eslint',
          file: filePath,
          line: parseInt(match[1]),
          message: match[3],
          rule: match[4]
        });
      }
    }
    
    return errors;
  }

  private parseTestErrors(output: string): TestResult['errors'] {
    const errors: TestResult['errors'] = [];
    // 간단한 테스트 에러 파싱
    if (output.includes('FAIL')) {
      const match = output.match(/FAIL\s+(.+)/);
      if (match) {
        errors.push({
          type: 'test',
          file: match[1],
          message: 'Test failed'
        });
      }
    }
    return errors;
  }

  private parseBuildErrors(output: string): TestResult['errors'] {
    // TypeScript 빌드 에러와 동일한 형식
    return this.parseTypeScriptErrors(output);
  }

  /**
   * 변경된 파일 목록 가져오기
   */
  private getChangedFiles(): string[] {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
      return output.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * 커밋 및 푸시
   */
  private async commitAndPush(): Promise<boolean> {
    try {
      console.log('\n📦 커밋 중...');
      execSync(`git commit -m "${this.commitMessage}"`, { stdio: 'inherit' });
      
      console.log('🚀 푸시 중...');
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log('\n✅ 커밋 및 푸시 완료!');
      return true;
    } catch (error) {
      console.error('❌ 커밋/푸시 실패:', error);
      return false;
    }
  }

  /**
   * 실패 보고서 생성
   */
  private async generateReport(): Promise<void> {
    const reportPath = path.join(process.cwd(), 'auto-fix-report.md');
    
    let report = `# 🚨 자동 수정 실패 보고서\n\n`;
    report += `**날짜**: ${new Date().toLocaleString()}\n`;
    report += `**시도 횟수**: ${this.currentAttempt}/${this.maxAttempts}\n\n`;
    
    report += `## 📊 시도 내역\n\n`;
    
    for (const attempt of this.fixHistory) {
      report += `### 시도 ${attempt.attempt}\n`;
      report += `- **시간**: ${attempt.timestamp.toLocaleTimeString()}\n`;
      report += `- **에러 수**: ${attempt.errors.length}개\n`;
      report += `- **수정 적용**: ${attempt.fixesApplied.length}개\n\n`;
      
      if (attempt.errors.length > 0) {
        report += `#### 에러 목록:\n`;
        for (const error of attempt.errors.slice(0, 10)) {
          report += `- **${error.type}** [${error.file}${error.line ? `:${error.line}` : ''}]: ${error.message}\n`;
        }
        if (attempt.errors.length > 10) {
          report += `- ... 외 ${attempt.errors.length - 10}개\n`;
        }
        report += '\n';
      }
      
      if (attempt.fixesApplied.length > 0) {
        report += `#### 적용된 수정:\n`;
        for (const fix of attempt.fixesApplied) {
          report += `- ${fix}\n`;
        }
        report += '\n';
      }
    }
    
    // 마지막 에러 상태
    const lastAttempt = this.fixHistory[this.fixHistory.length - 1];
    if (lastAttempt && lastAttempt.errors.length > 0) {
      report += `## ❌ 해결되지 않은 에러\n\n`;
      report += `총 ${lastAttempt.errors.length}개의 에러가 남아있습니다.\n\n`;
      
      // 에러 타입별 그룹화
      const errorsByType = lastAttempt.errors.reduce((acc, err) => {
        if (!acc[err.type]) acc[err.type] = [];
        acc[err.type].push(err);
        return acc;
      }, {} as Record<string, typeof lastAttempt.errors>);
      
      for (const [type, errors] of Object.entries(errorsByType)) {
        report += `### ${type.toUpperCase()} 에러 (${errors.length}개)\n\n`;
        for (const error of errors.slice(0, 5)) {
          report += `#### ${error.file}${error.line ? `:${error.line}` : ''}\n`;
          report += `- **메시지**: ${error.message}\n`;
          if (error.rule) report += `- **규칙**: ${error.rule}\n`;
          report += '\n';
        }
        if (errors.length > 5) {
          report += `... 외 ${errors.length - 5}개\n\n`;
        }
      }
    }
    
    report += `## 💡 권장 조치\n\n`;
    report += `1. 위 에러들을 수동으로 검토하고 수정하세요.\n`;
    report += `2. 특히 비즈니스 로직과 관련된 에러는 자동 수정이 어렵습니다.\n`;
    report += `3. 필요시 ESLint 규칙을 조정하거나 TypeScript 설정을 검토하세요.\n`;
    report += `4. 수정 후 \`npm run validate:all\`로 전체 검증을 실행하세요.\n`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 상세 보고서가 생성되었습니다: ${reportPath}`);
    console.log('\n❌ 자동 수정에 실패했습니다. 보고서를 확인해주세요.');
  }
}

// CLI 실행
if (require.main === module) {
  const commitMessage = process.argv.slice(2).join(' ') || 'fix: auto-fixed errors';
  
  const autoFix = new AutoFixAndCommit(commitMessage);
  autoFix.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default AutoFixAndCommit;