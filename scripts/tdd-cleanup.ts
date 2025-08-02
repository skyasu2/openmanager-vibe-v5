#!/usr/bin/env node
/**
 * 🔄 TDD 테스트 자동 정리 시스템
 * 
 * TDD RED 단계에서 생성된 테스트가 GREEN이 되면 자동으로 정리합니다.
 * 
 * 기능:
 * - @tdd-red 태그된 테스트 감지
 * - 테스트 상태 확인 (RED → GREEN 전환)
 * - 자동 태그 제거
 * - 전환 이력 추적
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

interface TDDTest {
  file: string;
  testName: string;
  lineNumber: number;
  createdDate?: string;
  status?: 'red' | 'green';
}

interface CleanupReport {
  scannedTests: number;
  transitionedTests: TDDTest[];
  oldRedTests: TDDTest[];
  errors: string[];
}

class TDDCleanupManager {
  private readonly checkOnly: boolean;
  
  constructor(checkOnly = false) {
    this.checkOnly = checkOnly;
  }

  async runCleanup(): Promise<CleanupReport> {
    const report: CleanupReport = {
      scannedTests: 0,
      transitionedTests: [],
      oldRedTests: [],
      errors: []
    };

    try {
      // 1. @tdd-red 태그된 테스트 찾기
      console.log('🔍 Scanning for @tdd-red tests...');
      const tddTests = await this.detectTDDRedTests();
      report.scannedTests = tddTests.length;
      
      if (tddTests.length === 0) {
        console.log('✅ No @tdd-red tests found');
        return report;
      }

      console.log(`📊 Found ${tddTests.length} @tdd-red tests`);

      // 2. 테스트 상태 확인
      console.log('🧪 Checking test status...');
      const { transitioned, stillRed } = await this.checkTestStatus(tddTests);
      report.transitionedTests = transitioned;

      // 3. 오래된 RED 테스트 찾기
      report.oldRedTests = this.findOldRedTests(stillRed);

      // 4. 정리 작업 수행
      if (!this.checkOnly && transitioned.length > 0) {
        console.log('🧹 Cleaning up transitioned tests...');
        await this.cleanupTests(transitioned);
      }

      // 5. 리포트 생성
      await this.generateReport(report);

    } catch (error) {
      report.errors.push(`Error during cleanup: ${error}`);
      console.error('❌ Cleanup failed:', error);
    }

    return report;
  }

  private async detectTDDRedTests(): Promise<TDDTest[]> {
    const testFiles = await glob([
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'tests/**/*.spec.{ts,tsx}'
    ], { ignore: 'node_modules/**' });

    const tddTests: TDDTest[] = [];

    for (const file of testFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.includes('@tdd-red')) {
            // 테스트 이름 찾기 (다음 몇 줄 내에서)
            for (let i = 1; i <= 3; i++) {
              const testLine = lines[index + i];
              if (!testLine) continue;

              const testMatch = testLine.match(/it\s*\(\s*['"`](.*?)['"`]/);
              if (testMatch) {
                // @created-date 찾기
                const dateMatch = lines
                  .slice(Math.max(0, index - 3), index + 3)
                  .find(l => l.includes('@created-date'))
                  ?.match(/@created-date:\s*(\d{4}-\d{2}-\d{2})/);

                tddTests.push({
                  file,
                  testName: testMatch[1],
                  lineNumber: index + 1,
                  createdDate: dateMatch?.[1]
                });
                break;
              }
            }
          }
        });
      } catch (error) {
        console.warn(`⚠️ Failed to read ${file}:`, error);
      }
    }

    return tddTests;
  }

  private async checkTestStatus(tests: TDDTest[]): Promise<{
    transitioned: TDDTest[];
    stillRed: TDDTest[];
  }> {
    const transitioned: TDDTest[] = [];
    const stillRed: TDDTest[] = [];

    for (const test of tests) {
      try {
        // 특정 테스트만 실행
        const command = `npx vitest run "${test.file}" -t "${test.testName}" --reporter=json --no-coverage`;
        const result = execSync(command, { 
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'] // stdout만 캡처
        });

        // JSON 결과 파싱
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const testResult = JSON.parse(jsonMatch[0]);
          const passed = testResult.numPassedTests > 0 && testResult.numFailedTests === 0;
          
          if (passed) {
            transitioned.push({ ...test, status: 'green' });
          } else {
            stillRed.push({ ...test, status: 'red' });
          }
        }
      } catch (error) {
        // 테스트 실패는 정상적인 경우
        stillRed.push({ ...test, status: 'red' });
      }
    }

    return { transitioned, stillRed };
  }

  private findOldRedTests(redTests: TDDTest[]): TDDTest[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return redTests.filter(test => {
      if (!test.createdDate) return false;
      const createdDate = new Date(test.createdDate);
      return createdDate < sevenDaysAgo;
    });
  }

  private async cleanupTests(tests: TDDTest[]): Promise<void> {
    for (const test of tests) {
      try {
        const content = await fs.readFile(test.file, 'utf-8');
        const lines = content.split('\n');
        
        // @tdd-red 태그와 관련 메타데이터 제거
        let inTDDBlock = false;
        const cleanedLines: string[] = [];
        
        lines.forEach((line, index) => {
          // 테스트 근처의 @tdd-red 블록 감지
          if (Math.abs(index - (test.lineNumber - 1)) <= 5) {
            if (line.includes('@tdd-red') || 
                line.includes('@created-date') ||
                (line.trim() === '' && inTDDBlock)) {
              inTDDBlock = true;
              return; // Skip this line
            } else if (line.includes('it(') || line.includes('it.skip(')) {
              inTDDBlock = false;
            }
          }
          
          cleanedLines.push(line);
        });

        // 파일 저장
        await fs.writeFile(test.file, cleanedLines.join('\n'));
        console.log(`✅ Cleaned up: ${test.testName} in ${path.basename(test.file)}`);
        
      } catch (error) {
        console.error(`❌ Failed to cleanup ${test.file}:`, error);
      }
    }
  }

  private async generateReport(report: CleanupReport): Promise<void> {
    const lines: string[] = [
      '# 🔄 TDD 테스트 정리 리포트',
      `생성일: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}`,
      '',
      '## 📊 요약',
      `- 스캔된 @tdd-red 테스트: ${report.scannedTests}개`,
      `- GREEN으로 전환된 테스트: ${report.transitionedTests.length}개`,
      `- 7일 이상된 RED 테스트: ${report.oldRedTests.length}개`,
      ''
    ];

    if (report.transitionedTests.length > 0) {
      lines.push('## ✅ GREEN으로 전환된 테스트', '');
      report.transitionedTests.forEach(test => {
        lines.push(`### ${test.testName}`);
        lines.push(`- 파일: ${test.file}`);
        lines.push(`- 생성일: ${test.createdDate || '알 수 없음'}`);
        lines.push(`- 상태: ${this.checkOnly ? '정리 대기' : '정리 완료'}`);
        lines.push('');
      });
    }

    if (report.oldRedTests.length > 0) {
      lines.push('## ⚠️ 7일 이상된 RED 테스트', '');
      report.oldRedTests.forEach(test => {
        lines.push(`### ${test.testName}`);
        lines.push(`- 파일: ${test.file}`);
        lines.push(`- 생성일: ${test.createdDate}`);
        lines.push(`- 권장사항: 구현 완료 또는 삭제 검토`);
        lines.push('');
      });
    }

    if (report.errors.length > 0) {
      lines.push('## ❌ 오류', '');
      report.errors.forEach(error => {
        lines.push(`- ${error}`);
      });
    }

    // 리포트 저장
    const reportPath = path.join(process.cwd(), 'tdd-cleanup-report.md');
    await fs.writeFile(reportPath, lines.join('\n'));
    
    // 콘솔 출력
    console.log('\n📄 Report Summary:');
    console.log(`- Transitioned to GREEN: ${report.transitionedTests.length}`);
    console.log(`- Old RED tests (>7 days): ${report.oldRedTests.length}`);
    
    if (this.checkOnly) {
      console.log('\n💡 Run without --check flag to perform cleanup');
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  
  if (checkOnly) {
    console.log('🔍 Running in check-only mode (no files will be modified)');
  }

  const manager = new TDDCleanupManager(checkOnly);
  const report = await manager.runCleanup();

  // Exit code 설정
  if (report.oldRedTests.length > 0) {
    console.warn(`\n⚠️ ${report.oldRedTests.length} tests have been RED for more than 7 days!`);
    process.exit(1);
  }

  if (checkOnly && report.transitionedTests.length > 0) {
    console.log(`\n💡 ${report.transitionedTests.length} tests can be cleaned up`);
    process.exit(0);
  }
}

// 직접 실행시에만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { TDDCleanupManager };
export type { TDDTest, CleanupReport };