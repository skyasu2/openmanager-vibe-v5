#!/usr/bin/env node
/**
 * 🧪 TDD 테스트 메타데이터 관리 시스템
 * 
 * 테스트의 수명 주기를 추적하고 자동으로 정리합니다.
 * 
 * 기능:
 * - Skip된 테스트 추적
 * - 30일 이상 된 실패/Skip 테스트 경고
 * - TDD RED/GREEN 상태 추적
 * - 중복 테스트 감지
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface TestMetadata {
  file: string;
  testName: string;
  status: 'skip' | 'fail' | 'pass' | 'tdd-red';
  skipReason?: string;
  skipDate?: string;
  lastUpdated: string;
  lineNumber: number;
}

interface TestReport {
  totalTests: number;
  skippedTests: TestMetadata[];
  oldSkippedTests: TestMetadata[];
  duplicateTests: Map<string, TestMetadata[]>;
  recommendations: string[];
}

class TestMetadataManager {
  private readonly thirtyDaysAgo = new Date();
  
  constructor() {
    this.thirtyDaysAgo.setDate(this.thirtyDaysAgo.getDate() - 30);
  }

  async analyzeTests(): Promise<TestReport> {
    console.log('🔍 테스트 파일 검색 중...');
    const testFiles = await this.findTestFiles();
    console.log(`📁 발견된 테스트 파일: ${testFiles.length}개`);
    
    const allTests: TestMetadata[] = [];
    
    // 병렬 처리로 성능 개선
    const batchSize = 10;
    for (let i = 0; i < testFiles.length; i += batchSize) {
      const batch = testFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this.parseTestFile(file));
      const batchResults = await Promise.all(batchPromises);
      
      for (const tests of batchResults) {
        allTests.push(...tests);
      }
      
      console.log(`📊 진행률: ${Math.min(i + batchSize, testFiles.length)}/${testFiles.length}`);
    }

    return this.generateReport(allTests);
  }

  private async findTestFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'tests/**/*.spec.{ts,tsx}'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matched = await glob(pattern, { ignore: 'node_modules/**' });
      files.push(...matched);
    }

    return files;
  }

  private async parseTestFile(filePath: string): Promise<TestMetadata[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const tests: TestMetadata[] = [];

    lines.forEach((line, index) => {
      // Skip된 테스트 찾기
      const skipMatch = line.match(/it\.skip\(['"`](.*?)['"`]|describe\.skip\(['"`](.*?)['"`]/);
      if (skipMatch) {
        const testName = skipMatch[1] || skipMatch[2];
        const metadata = this.extractMetadata(lines, index);
        
        tests.push({
          file: filePath,
          testName,
          status: 'skip',
          skipReason: metadata.reason,
          skipDate: metadata.date,
          lastUpdated: metadata.date || new Date().toISOString(),
          lineNumber: index + 1
        });
      }

      // TDD RED 태그 찾기
      if (line.includes('@tdd-red')) {
        const testMatch = lines[index + 1]?.match(/it\(['"`](.*?)['"`]/);
        if (testMatch) {
          tests.push({
            file: filePath,
            testName: testMatch[1],
            status: 'tdd-red',
            lastUpdated: new Date().toISOString(),
            lineNumber: index + 2
          });
        }
      }
    });

    return tests;
  }

  private extractMetadata(lines: string[], testLineIndex: number): { reason?: string; date?: string } {
    const metadata: { reason?: string; date?: string } = {};
    
    // 테스트 위의 주석에서 메타데이터 추출
    for (let i = Math.max(0, testLineIndex - 5); i < testLineIndex; i++) {
      const line = lines[i];
      
      const reasonMatch = line.match(/@skip-reason:\s*(.+)/);
      if (reasonMatch) {
        metadata.reason = reasonMatch[1].trim();
      }
      
      const dateMatch = line.match(/@skip-date:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        metadata.date = dateMatch[1];
      }
    }
    
    return metadata;
  }

  private generateReport(tests: TestMetadata[]): TestReport {
    const skippedTests = tests.filter(t => t.status === 'skip');
    const oldSkippedTests = skippedTests.filter(t => {
      if (!t.skipDate) return false;
      const skipDate = new Date(t.skipDate);
      return skipDate < this.thirtyDaysAgo;
    });

    const duplicateTests = this.findDuplicates(tests);
    const recommendations = this.generateRecommendations(tests, oldSkippedTests, duplicateTests);

    return {
      totalTests: tests.length,
      skippedTests,
      oldSkippedTests,
      duplicateTests,
      recommendations
    };
  }

  private findDuplicates(tests: TestMetadata[]): Map<string, TestMetadata[]> {
    const testsByName = new Map<string, TestMetadata[]>();
    
    tests.forEach(test => {
      const key = test.testName.toLowerCase();
      if (!testsByName.has(key)) {
        testsByName.set(key, []);
      }
      testsByName.get(key)!.push(test);
    });

    // 중복만 필터링
    const duplicates = new Map<string, TestMetadata[]>();
    testsByName.forEach((tests, name) => {
      if (tests.length > 1) {
        duplicates.set(name, tests);
      }
    });

    return duplicates;
  }

  private generateRecommendations(
    tests: TestMetadata[],
    oldSkippedTests: TestMetadata[],
    duplicates: Map<string, TestMetadata[]>
  ): string[] {
    const recommendations: string[] = [];

    if (oldSkippedTests.length > 0) {
      recommendations.push(
        `⚠️  ${oldSkippedTests.length}개의 skip된 테스트가 30일 이상 경과했습니다. 삭제나 구현을 검토하세요.`
      );
    }

    if (duplicates.size > 0) {
      recommendations.push(
        `⚠️  ${duplicates.size}개의 중복된 테스트 이름이 발견되었습니다. 통합을 검토하세요.`
      );
    }

    const tddRedTests = tests.filter(t => t.status === 'tdd-red');
    if (tddRedTests.length > 0) {
      recommendations.push(
        `🔴 ${tddRedTests.length}개의 TDD RED 테스트가 있습니다. GREEN으로 전환하세요.`
      );
    }

    const noMetadataSkips = tests.filter(t => t.status === 'skip' && !t.skipReason);
    if (noMetadataSkips.length > 0) {
      recommendations.push(
        `📝 ${noMetadataSkips.length}개의 skip된 테스트에 이유가 없습니다. @skip-reason을 추가하세요.`
      );
    }

    return recommendations;
  }

  async generateMarkdownReport(report: TestReport): Promise<string> {
    const lines: string[] = [
      '# 🧪 테스트 메타데이터 리포트',
      `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
      '',
      '## 📊 요약',
      `- 전체 추적된 테스트: ${report.totalTests}개`,
      `- Skip된 테스트: ${report.skippedTests.length}개`,
      `- 30일 이상 Skip: ${report.oldSkippedTests.length}개`,
      `- 중복 테스트: ${report.duplicateTests.size}개`,
      ''
    ];

    if (report.recommendations.length > 0) {
      lines.push('## 🎯 권장사항', '');
      report.recommendations.forEach(rec => lines.push(rec));
      lines.push('');
    }

    if (report.oldSkippedTests.length > 0) {
      lines.push('## ⏰ 30일 이상 경과한 Skip 테스트', '');
      report.oldSkippedTests.forEach(test => {
        lines.push(`### ${test.testName}`);
        lines.push(`- 파일: ${test.file}:${test.lineNumber}`);
        lines.push(`- Skip 날짜: ${test.skipDate}`);
        if (test.skipReason) {
          lines.push(`- 이유: ${test.skipReason}`);
        }
        lines.push('');
      });
    }

    if (report.duplicateTests.size > 0) {
      lines.push('## 🔁 중복 테스트', '');
      report.duplicateTests.forEach((tests, name) => {
        lines.push(`### "${name}"`);
        tests.forEach(test => {
          lines.push(`- ${test.file}:${test.lineNumber}`);
        });
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

// CLI 실행
async function main() {
  const manager = new TestMetadataManager();
  
  console.log('🔍 테스트 메타데이터 분석 중...');
  
  try {
    const report = await manager.analyzeTests();
    const markdown = await manager.generateMarkdownReport(report);
    
    // 리포트 저장
    const reportPath = path.join(process.cwd(), 'test-metadata-report.md');
    await fs.writeFile(reportPath, markdown);
    
    console.log(`✅ 리포트 생성 완료: ${reportPath}`);
    console.log('');
    
    // 콘솔에 요약 출력
    console.log('📊 요약:');
    console.log(`- Skip된 테스트: ${report.skippedTests.length}개`);
    console.log(`- 30일 이상 Skip: ${report.oldSkippedTests.length}개`);
    console.log(`- 중복 테스트: ${report.duplicateTests.size}개`);
    
    if (report.recommendations.length > 0) {
      console.log('\n🎯 권장사항:');
      report.recommendations.forEach(rec => console.log(rec));
    }
    
    // 30일 이상된 테스트가 있으면 경고와 함께 종료
    if (report.oldSkippedTests.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 직접 실행시에만 main 함수 호출
if (require.main === module) {
  main();
}

export { TestMetadataManager };
export type { TestMetadata, TestReport };
