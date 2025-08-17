#!/usr/bin/env tsx
/**
 * TDD 테스트 정리 스크립트
 * RED → GREEN으로 전환된 테스트의 @tdd-red 태그를 자동 제거
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import { join } from 'path';

interface TddTestInfo {
  file: string;
  line: number;
  testName: string;
  status: 'red' | 'green' | 'passing';
  needsCleanup: boolean;
}

class TddCleanupManager {
  private checkOnly: boolean = false;
  private verbose: boolean = false;
  
  constructor() {
    this.checkOnly = process.argv.includes('--check');
    this.verbose = process.argv.includes('--verbose');
  }

  /**
   * TDD 태그가 있는 테스트 파일들을 찾습니다
   */
  private findTddTestFiles(): string[] {
    const testPatterns = [
      'src/**/*.test.ts',
      'src/**/*.test.tsx', 
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx'
    ];

    const allTestFiles: string[] = [];
    
    for (const pattern of testPatterns) {
      try {
        const files = globSync(pattern);
        allTestFiles.push(...files);
      } catch (error) {
        if (this.verbose) {
          console.log(`⚠️ 패턴 ${pattern}에서 파일을 찾을 수 없습니다`);
        }
      }
    }

    // TDD 태그가 있는 파일만 필터링
    return allTestFiles.filter(file => {
      try {
        const content = readFileSync(file, 'utf8');
        return content.includes('@tdd-red') || content.includes('@tdd-green');
      } catch {
        return false;
      }
    });
  }

  /**
   * 테스트 파일에서 TDD 정보를 추출합니다
   */
  private extractTddInfo(filePath: string): TddTestInfo[] {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const tddTests: TddTestInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // @tdd-red 태그가 있는 라인 찾기
      if (line.includes('@tdd-red')) {
        // 다음 몇 라인에서 테스트 이름 찾기
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const testLine = lines[j];
          const testMatch = testLine.match(/(?:it|test|describe)\s*\(\s*['"](.*?)['"]|(?:it|test|describe)\s*\(\s*`(.*?)`/);
          
          if (testMatch) {
            const testName = testMatch[1] || testMatch[2];
            tddTests.push({
              file: filePath,
              line: i + 1,
              testName,
              status: 'red',
              needsCleanup: false
            });
            break;
          }
        }
      }
    }

    return tddTests;
  }

  /**
   * 테스트 실행하여 현재 상태 확인
   */
  private async checkTestStatus(tests: TddTestInfo[]): Promise<void> {
    for (const test of tests) {
      try {
        // 개별 테스트 실행 (빠른 검증)
        const testCommand = `npm run test:quick -- --reporter=verbose --run "${test.file}"`;
        
        try {
          execSync(testCommand, { 
            stdio: 'pipe',
            timeout: 10000 // 10초 타임아웃
          });
          
          test.status = 'passing';
          test.needsCleanup = true;
          
          if (this.verbose) {
            console.log(`✅ ${test.testName} (${test.file}:${test.line}) - 통과`);
          }
        } catch (error) {
          test.status = 'red';
          test.needsCleanup = false;
          
          if (this.verbose) {
            console.log(`❌ ${test.testName} (${test.file}:${test.line}) - 실패`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ 테스트 상태 확인 실패: ${test.testName}`);
      }
    }
  }

  /**
   * @tdd-red 태그 제거
   */
  private cleanupTddTags(tests: TddTestInfo[]): number {
    let cleanedCount = 0;
    const fileMap = new Map<string, TddTestInfo[]>();

    // 파일별로 그룹화
    tests.filter(t => t.needsCleanup).forEach(test => {
      if (!fileMap.has(test.file)) {
        fileMap.set(test.file, []);
      }
      fileMap.get(test.file)!.push(test);
    });

    // 각 파일 정리
    for (const [filePath, fileTests] of fileMap) {
      try {
        let content = readFileSync(filePath, 'utf8');
        let modified = false;

        for (const test of fileTests) {
          // @tdd-red 태그 제거 (여러 형태 지원)
          const patterns = [
            /\/\/ @tdd-red.*\n/g,
            /\/\* @tdd-red.*\*\/\n?/g,
            /\/\*\s*@tdd-red[^*]*\*\/\s*\n?/g,
            /^\s*\/\/ @tdd-red.*$/gm
          ];

          for (const pattern of patterns) {
            const newContent = content.replace(pattern, '');
            if (newContent !== content) {
              content = newContent;
              modified = true;
            }
          }
        }

        if (modified) {
          writeFileSync(filePath, content, 'utf8');
          cleanedCount += fileTests.length;
          console.log(`🧹 정리완료: ${filePath} (${fileTests.length}개 테스트)`);
        }
      } catch (error) {
        console.error(`❌ 파일 정리 실패: ${filePath}`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * 정리 리포트 생성
   */
  private generateReport(tests: TddTestInfo[], cleanedCount: number): void {
    const reportPath = 'tdd-cleanup-report.md';
    const timestamp = new Date().toISOString();
    
    const report = `# TDD 테스트 정리 리포트

**생성 시간**: ${timestamp}
**실행 모드**: ${this.checkOnly ? 'Check Only' : 'Cleanup'}

## 📊 통계

- **총 TDD 테스트 수**: ${tests.length}
- **통과한 테스트 수**: ${tests.filter(t => t.status === 'passing').length}
- **정리된 테스트 수**: ${cleanedCount}
- **여전히 RED 상태**: ${tests.filter(t => t.status === 'red').length}

## 📋 상세 내역

### ✅ 통과한 테스트 (정리 대상)
${tests.filter(t => t.needsCleanup).map(t => 
  `- **${t.testName}** \`${t.file}:${t.line}\``
).join('\n')}

### ❌ 여전히 실패하는 테스트
${tests.filter(t => t.status === 'red').map(t => 
  `- **${t.testName}** \`${t.file}:${t.line}\``
).join('\n')}

## 💡 권장사항

${cleanedCount > 0 ? '- 정리된 테스트들을 커밋하세요' : ''}
${tests.filter(t => t.status === 'red').length > 0 ? '- 실패하는 테스트들을 수정하세요' : ''}

---
*자동 생성된 리포트*
`;

    writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 리포트 생성: ${reportPath}`);
  }

  /**
   * 메인 실행 로직
   */
  public async run(): Promise<void> {
    console.log('🔧 TDD 정리 시작...');
    
    const tddFiles = this.findTddTestFiles();
    
    if (tddFiles.length === 0) {
      console.log('📝 TDD 태그가 있는 테스트 파일이 없습니다.');
      process.exit(0);
    }

    console.log(`🔍 ${tddFiles.length}개 TDD 테스트 파일 발견`);

    let allTests: TddTestInfo[] = [];
    
    for (const file of tddFiles) {
      const tests = this.extractTddInfo(file);
      allTests.push(...tests);
    }

    if (allTests.length === 0) {
      console.log('📝 @tdd-red 태그가 있는 테스트가 없습니다.');
      process.exit(0);
    }

    console.log(`🧪 ${allTests.length}개 TDD 테스트 확인 중...`);
    
    await this.checkTestStatus(allTests);

    const needsCleanup = allTests.filter(t => t.needsCleanup);
    
    if (this.checkOnly) {
      console.log(`✅ 검사 완료: ${needsCleanup.length}개 테스트가 정리 필요`);
      this.generateReport(allTests, 0);
      process.exit(needsCleanup.length > 0 ? 0 : 1);
    }

    const cleanedCount = this.cleanupTddTags(allTests);
    this.generateReport(allTests, cleanedCount);

    if (cleanedCount > 0) {
      console.log(`🎉 ${cleanedCount}개 테스트 정리 완료!`);
    } else {
      console.log('📝 정리할 테스트가 없습니다.');
    }

    process.exit(0);
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  const manager = new TddCleanupManager();
  manager.run().catch(error => {
    console.error('❌ TDD 정리 실패:', error);
    process.exit(1);
  });
}