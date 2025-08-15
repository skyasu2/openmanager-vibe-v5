#!/usr/bin/env node
/**
 * 🛡️ 테스트 커버리지 가디언
 * 
 * @description 80%+ 커버리지 유지를 위한 자동화 도구
 * @tdd-principle Red-Green-Refactor 사이클 지원
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestCoverageGuardian {
  constructor() {
    this.targetCoverage = 80;
    this.criticalCoverage = 70;
    this.coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    this.reportFile = path.join(process.cwd(), 'test-results', 'coverage-report.md');
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
  }

  /**
   * 🎯 TDD Red-Green-Refactor 사이클 검증
   */
  validateTDDCycle() {
    console.log(`${this.colors.blue}🧪 TDD 사이클 검증 시작...${this.colors.reset}`);
    
    try {
      // Red: 실패하는 테스트 실행
      console.log(`${this.colors.red}🔴 RED 단계: 실패 테스트 확인${this.colors.reset}`);
      const redResult = this.runTestsWithFailures();
      
      // Green: 모든 테스트 통과
      console.log(`${this.colors.green}🟢 GREEN 단계: 테스트 통과 확인${this.colors.reset}`);
      const greenResult = this.runAllTests();
      
      // Refactor: 코드 품질 검증
      console.log(`${this.colors.blue}♻️ REFACTOR 단계: 코드 품질 검증${this.colors.reset}`);
      const refactorResult = this.validateCodeQuality();
      
      return {
        red: redResult,
        green: greenResult,
        refactor: refactorResult,
        success: greenResult.success && refactorResult.success
      };
    } catch (error) {
      console.error(`${this.colors.red}❌ TDD 사이클 검증 실패:${this.colors.reset}`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔴 RED 단계: @tdd-red 태그가 있는 테스트 확인
   */
  runTestsWithFailures() {
    try {
      // @tdd-red 태그가 있는 테스트 파일 찾기
      const redTests = this.findTDDTests('red');
      
      if (redTests.length === 0) {
        console.log(`${this.colors.yellow}⚠️ RED 단계 테스트가 없습니다.${this.colors.reset}`);
        return { success: true, message: 'No red tests found' };
      }

      console.log(`${this.colors.red}🔍 RED 테스트 발견: ${redTests.length}개${this.colors.reset}`);
      
      return {
        success: true,
        redTests: redTests.length,
        message: `${redTests.length}개의 RED 테스트가 TDD 사이클을 시작했습니다.`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🟢 GREEN 단계: 모든 테스트 통과 검증
   */
  runAllTests() {
    try {
      console.log(`${this.colors.green}🚀 전체 테스트 실행 중...${this.colors.reset}`);
      
      // 테스트 실행
      const testCommand = 'npm run test -- --coverage --reporter=json --outputFile=test-results/test-output.json';
      execSync(testCommand, { stdio: 'inherit' });
      
      // 커버리지 분석
      const coverage = this.analyzeCoverage();
      
      return {
        success: true,
        coverage: coverage,
        message: `모든 테스트가 통과했습니다. 커버리지: ${coverage.total}%`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        message: '테스트 실행 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * ♻️ REFACTOR 단계: 코드 품질 검증
   */
  validateCodeQuality() {
    try {
      console.log(`${this.colors.blue}🔍 코드 품질 검증 중...${this.colors.reset}`);
      
      const qualityChecks = {
        typescript: this.checkTypeScript(),
        eslint: this.checkESLint(),
        complexity: this.checkComplexity(),
        duplicates: this.checkDuplicates()
      };
      
      const allPassed = Object.values(qualityChecks).every(check => check.success);
      
      return {
        success: allPassed,
        checks: qualityChecks,
        message: allPassed ? '코드 품질 검증 통과' : '코드 품질 개선 필요'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 TDD 태그 기반 테스트 파일 찾기
   */
  findTDDTests(phase) {
    const testDir = path.join(process.cwd(), 'tests');
    const srcTestDir = path.join(process.cwd(), 'src');
    
    const findTestFiles = (dir) => {
      const files = [];
      
      if (!fs.existsSync(dir)) return files;
      
      const traverse = (currentDir) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        entries.forEach(entry => {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.name.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
            files.push(fullPath);
          }
        });
      };
      
      traverse(dir);
      return files;
    };
    
    const testFiles = [...findTestFiles(testDir), ...findTestFiles(srcTestDir)];
    
    // 파일 내용에서 @tdd-{phase} 태그 검색
    return testFiles.filter(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes(`@tdd-${phase}`);
      } catch {
        return false;
      }
    });
  }

  /**
   * 📊 커버리지 분석
   */
  analyzeCoverage() {
    if (!fs.existsSync(this.coverageFile)) {
      throw new Error('커버리지 파일을 찾을 수 없습니다.');
    }
    
    const coverageData = JSON.parse(fs.readFileSync(this.coverageFile, 'utf8'));
    
    const coverage = {
      lines: coverageData.total.lines.pct,
      functions: coverageData.total.functions.pct,
      branches: coverageData.total.branches.pct,
      statements: coverageData.total.statements.pct,
      total: Math.round((
        coverageData.total.lines.pct +
        coverageData.total.functions.pct +
        coverageData.total.branches.pct +
        coverageData.total.statements.pct
      ) / 4)
    };
    
    return coverage;
  }

  /**
   * 🎯 커버리지 임계값 검증
   */
  validateCoverageThresholds(coverage) {
    const results = {
      lines: this.checkThreshold(coverage.lines, 'Lines'),
      functions: this.checkThreshold(coverage.functions, 'Functions'),
      branches: this.checkThreshold(coverage.branches, 'Branches'),
      statements: this.checkThreshold(coverage.statements, 'Statements'),
      total: this.checkThreshold(coverage.total, 'Total')
    };
    
    const allPassed = Object.values(results).every(result => result.passed);
    
    return {
      success: allPassed,
      results,
      coverage,
      message: allPassed ? 
        `✅ 모든 커버리지 목표 달성 (${coverage.total}%)` :
        `❌ 커버리지 목표 미달성 (${coverage.total}% < ${this.targetCoverage}%)`
    };
  }

  /**
   * 🎯 임계값 검사
   */
  checkThreshold(actual, name) {
    const status = actual >= this.targetCoverage ? 'excellent' :
                  actual >= this.criticalCoverage ? 'warning' : 'critical';
    
    return {
      name,
      actual,
      target: this.targetCoverage,
      critical: this.criticalCoverage,
      passed: actual >= this.targetCoverage,
      status,
      message: `${name}: ${actual}% (목표: ${this.targetCoverage}%)`
    };
  }

  /**
   * 📝 TypeScript 타입 검사
   */
  checkTypeScript() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      return { success: true, message: 'TypeScript 타입 검사 통과' };
    } catch (error) {
      return { success: false, message: 'TypeScript 타입 오류 발견', error: error.message };
    }
  }

  /**
   * 🔍 ESLint 검사
   */
  checkESLint() {
    try {
      execSync('npm run lint:quick', { stdio: 'pipe' });
      return { success: true, message: 'ESLint 검사 통과' };
    } catch (error) {
      return { success: false, message: 'ESLint 오류 발견', error: error.message };
    }
  }

  /**
   * 🔄 복잡도 검사
   */
  checkComplexity() {
    // 간단한 파일 크기 기반 복잡도 검사
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllSourceFiles(srcDir);
      
      const largeFiles = files.filter(file => {
        const stats = fs.statSync(file);
        const lines = fs.readFileSync(file, 'utf8').split('\n').length;
        return lines > 500; // 500줄 초과 파일
      });
      
      if (largeFiles.length > 0) {
        return {
          success: false,
          message: `큰 파일 발견: ${largeFiles.length}개 (500줄 초과)`,
          files: largeFiles.map(f => path.relative(process.cwd(), f))
        };
      }
      
      return { success: true, message: '파일 복잡도 적절' };
    } catch (error) {
      return { success: false, message: '복잡도 검사 실패', error: error.message };
    }
  }

  /**
   * 🔍 코드 중복 검사
   */
  checkDuplicates() {
    // 간단한 중복 검사 (동일한 함수명 검색)
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllSourceFiles(srcDir);
      
      const functions = new Map();
      let duplicates = 0;
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const functionMatches = content.match(/(?:function|const)\s+(\w+)/g);
        
        if (functionMatches) {
          functionMatches.forEach(match => {
            const name = match.split(/\s+/)[1];
            if (functions.has(name)) {
              functions.set(name, functions.get(name) + 1);
              if (functions.get(name) === 2) duplicates++;
            } else {
              functions.set(name, 1);
            }
          });
        }
      });
      
      return {
        success: duplicates < 5,
        message: duplicates === 0 ? '중복 함수 없음' : `중복 함수명 ${duplicates}개 발견`,
        duplicates
      };
    } catch (error) {
      return { success: false, message: '중복 검사 실패', error: error.message };
    }
  }

  /**
   * 📁 모든 소스 파일 가져오기
   */
  getAllSourceFiles(dir) {
    const files = [];
    
    const traverse = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          traverse(fullPath);
        } else if (entry.name.match(/\.(ts|tsx)$/)) {
          files.push(fullPath);
        }
      });
    };
    
    traverse(dir);
    return files;
  }

  /**
   * 📊 리포트 생성
   */
  generateReport(results) {
    const reportDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    
    let report = `# 🛡️ 테스트 커버리지 가디언 리포트\n\n`;
    report += `**생성 시간**: ${timestamp}\n`;
    report += `**커버리지 목표**: ${this.targetCoverage}%\n\n`;
    
    // TDD 사이클 결과
    report += `## 🧪 TDD 사이클 결과\n\n`;
    if (results.success) {
      report += `✅ **전체 TDD 사이클 성공**\n\n`;
    } else {
      report += `❌ **TDD 사이클 실패**\n\n`;
    }
    
    // RED 단계
    if (results.red) {
      report += `### 🔴 RED 단계\n`;
      report += `- 상태: ${results.red.success ? '✅ 성공' : '❌ 실패'}\n`;
      report += `- 메시지: ${results.red.message}\n\n`;
    }
    
    // GREEN 단계
    if (results.green) {
      report += `### 🟢 GREEN 단계\n`;
      report += `- 상태: ${results.green.success ? '✅ 성공' : '❌ 실패'}\n`;
      report += `- 메시지: ${results.green.message}\n`;
      
      if (results.green.coverage) {
        const coverage = results.green.coverage;
        report += `\n#### 📊 커버리지 상세\n`;
        report += `| 항목 | 커버리지 | 목표 | 상태 |\n`;
        report += `|------|----------|------|------|\n`;
        report += `| Lines | ${coverage.lines}% | ${this.targetCoverage}% | ${coverage.lines >= this.targetCoverage ? '✅' : '❌'} |\n`;
        report += `| Functions | ${coverage.functions}% | ${this.targetCoverage}% | ${coverage.functions >= this.targetCoverage ? '✅' : '❌'} |\n`;
        report += `| Branches | ${coverage.branches}% | ${this.targetCoverage}% | ${coverage.branches >= this.targetCoverage ? '✅' : '❌'} |\n`;
        report += `| Statements | ${coverage.statements}% | ${this.targetCoverage}% | ${coverage.statements >= this.targetCoverage ? '✅' : '❌'} |\n`;
        report += `| **Total** | **${coverage.total}%** | **${this.targetCoverage}%** | **${coverage.total >= this.targetCoverage ? '✅' : '❌'}** |\n\n`;
      }
    }
    
    // REFACTOR 단계
    if (results.refactor) {
      report += `### ♻️ REFACTOR 단계\n`;
      report += `- 상태: ${results.refactor.success ? '✅ 성공' : '❌ 실패'}\n`;
      report += `- 메시지: ${results.refactor.message}\n`;
      
      if (results.refactor.checks) {
        report += `\n#### 🔍 코드 품질 검사\n`;
        report += `| 검사 항목 | 상태 | 메시지 |\n`;
        report += `|-----------|------|--------|\n`;
        
        Object.entries(results.refactor.checks).forEach(([name, check]) => {
          report += `| ${name} | ${check.success ? '✅' : '❌'} | ${check.message} |\n`;
        });
        report += `\n`;
      }
    }
    
    // 권장사항
    report += `## 💡 권장사항\n\n`;
    if (results.success) {
      report += `- 🎉 모든 검사를 통과했습니다!\n`;
      report += `- 💪 지속적인 TDD 사이클을 유지하세요.\n`;
      report += `- 📈 커버리지 85%+ 목표로 더 향상시켜보세요.\n`;
    } else {
      report += `- 🔴 실패한 테스트를 먼저 수정하세요.\n`;
      report += `- 📊 커버리지가 부족한 영역을 식별하고 테스트를 추가하세요.\n`;
      report += `- ♻️ 코드 품질 문제를 해결하세요.\n`;
    }
    
    fs.writeFileSync(this.reportFile, report, 'utf8');
    console.log(`${this.colors.green}📋 리포트 생성 완료: ${this.reportFile}${this.colors.reset}`);
    
    return report;
  }

  /**
   * 🚀 메인 실행 함수
   */
  async run() {
    console.log(`${this.colors.bold}${this.colors.blue}🛡️ 테스트 커버리지 가디언 시작${this.colors.reset}`);
    console.log(`${this.colors.blue}목표 커버리지: ${this.targetCoverage}%${this.colors.reset}\n`);
    
    try {
      // TDD 사이클 검증
      const results = this.validateTDDCycle();
      
      // 리포트 생성
      const report = this.generateReport(results);
      
      // 결과 출력
      if (results.success) {
        console.log(`${this.colors.green}${this.colors.bold}🎉 테스트 커버리지 가디언 성공!${this.colors.reset}`);
        process.exit(0);
      } else {
        console.log(`${this.colors.red}${this.colors.bold}❌ 테스트 커버리지 가디언 실패${this.colors.reset}`);
        console.log(`${this.colors.yellow}📋 자세한 내용은 리포트를 확인하세요: ${this.reportFile}${this.colors.reset}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`${this.colors.red}💥 예상치 못한 오류:${this.colors.reset}`, error);
      process.exit(1);
    }
  }
}

// CLI에서 직접 실행된 경우
if (require.main === module) {
  const guardian = new TestCoverageGuardian();
  guardian.run();
}

module.exports = TestCoverageGuardian;