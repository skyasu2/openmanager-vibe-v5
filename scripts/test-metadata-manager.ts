#!/usr/bin/env tsx

/**
 * 📊 테스트 메타데이터 관리 시스템
 * 테스트 실행 시간, 성공률, 실패 빈도 등을 추적
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestMetadata {
  filePath: string;
  lastRun?: Date;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  averageRunTime: number; // milliseconds
  lastRunTime?: number;
  flakiness: number; // 0-1, 높을수록 불안정
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  tddStatus?: 'red' | 'green' | 'refactored';
  createdAt: Date;
  updatedAt: Date;
}

interface TestRunResult {
  filePath: string;
  success: boolean;
  runTime: number;
  error?: string;
}

class TestMetadataManager {
  private metadataPath: string;
  private metadata: Map<string, TestMetadata> = new Map();

  constructor(metadataPath: string = '.claude/test-metadata.json') {
    this.metadataPath = metadataPath;
    this.loadMetadata();
  }

  /**
   * 메타데이터 로드
   */
  private loadMetadata() {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const data = JSON.parse(fs.readFileSync(this.metadataPath, 'utf-8'));
        Object.entries(data).forEach(([key, value]) => {
          this.metadata.set(key, value as TestMetadata);
        });
      }
    } catch (error) {
      console.error('메타데이터 로드 실패:', error);
    }
  }

  /**
   * 메타데이터 저장
   */
  private saveMetadata() {
    try {
      const dir = path.dirname(this.metadataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.metadata);
      fs.writeFileSync(this.metadataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('메타데이터 저장 실패:', error);
    }
  }

  /**
   * 테스트 실행 결과 기록
   */
  public recordTestRun(result: TestRunResult) {
    let metadata = this.metadata.get(result.filePath);

    if (!metadata) {
      // 새 테스트 파일
      metadata = {
        filePath: result.filePath,
        totalRuns: 0,
        successCount: 0,
        failureCount: 0,
        averageRunTime: 0,
        flakiness: 0,
        priority: 'medium',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 통계 업데이트
    metadata.totalRuns++;
    metadata.lastRun = new Date();
    metadata.lastRunTime = result.runTime;
    metadata.updatedAt = new Date();

    if (result.success) {
      metadata.successCount++;
    } else {
      metadata.failureCount++;
    }

    // 평균 실행 시간 계산
    metadata.averageRunTime = 
      (metadata.averageRunTime * (metadata.totalRuns - 1) + result.runTime) / 
      metadata.totalRuns;

    // Flakiness 계산 (최근 10회 실행 기준)
    this.calculateFlakiness(metadata);

    // 우선순위 자동 조정
    this.adjustPriority(metadata);

    this.metadata.set(result.filePath, metadata);
    this.saveMetadata();
  }

  /**
   * Flakiness 계산
   */
  private calculateFlakiness(metadata: TestMetadata) {
    if (metadata.totalRuns < 3) {
      metadata.flakiness = 0;
      return;
    }

    // 실패율 기반 계산
    const failureRate = metadata.failureCount / metadata.totalRuns;
    
    // 성공과 실패가 번갈아 나타나는 정도
    const alternationFactor = 
      Math.min(metadata.successCount, metadata.failureCount) / 
      (metadata.totalRuns / 2);

    metadata.flakiness = (failureRate + alternationFactor) / 2;
  }

  /**
   * 우선순위 자동 조정
   */
  private adjustPriority(metadata: TestMetadata) {
    // Critical: 자주 실패하거나 매우 불안정한 테스트
    if (metadata.flakiness > 0.3 || metadata.failureCount > 5) {
      metadata.priority = 'critical';
    }
    // High: 느리거나 가끔 실패하는 테스트
    else if (metadata.averageRunTime > 1000 || metadata.flakiness > 0.1) {
      metadata.priority = 'high';
    }
    // Low: 매우 빠르고 안정적인 테스트
    else if (metadata.averageRunTime < 100 && metadata.flakiness < 0.05) {
      metadata.priority = 'low';
    }
    // Medium: 기본값
    else {
      metadata.priority = 'medium';
    }
  }

  /**
   * TDD 상태 업데이트
   */
  public updateTDDStatus(filePath: string, status: 'red' | 'green' | 'refactored') {
    const metadata = this.metadata.get(filePath);
    if (metadata) {
      metadata.tddStatus = status;
      metadata.updatedAt = new Date();
      this.metadata.set(filePath, metadata);
      this.saveMetadata();
    }
  }

  /**
   * 우선순위별 테스트 가져오기
   */
  public getTestsByPriority(priority?: 'critical' | 'high' | 'medium' | 'low'): TestMetadata[] {
    const tests = Array.from(this.metadata.values());
    
    if (priority) {
      return tests.filter(test => test.priority === priority);
    }

    // 우선순위 순으로 정렬
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return tests.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * 느린 테스트 찾기
   */
  public getSlowTests(threshold: number = 1000): TestMetadata[] {
    return Array.from(this.metadata.values())
      .filter(test => test.averageRunTime > threshold)
      .sort((a, b) => b.averageRunTime - a.averageRunTime);
  }

  /**
   * 불안정한 테스트 찾기
   */
  public getFlakyTests(threshold: number = 0.1): TestMetadata[] {
    return Array.from(this.metadata.values())
      .filter(test => test.flakiness > threshold)
      .sort((a, b) => b.flakiness - a.flakiness);
  }

  /**
   * 테스트 통계 리포트
   */
  public generateReport(): string {
    const tests = Array.from(this.metadata.values());
    
    if (tests.length === 0) {
      return '📊 테스트 메타데이터가 없습니다.';
    }

    const totalTests = tests.length;
    const totalRuns = tests.reduce((sum, test) => sum + test.totalRuns, 0);
    const avgRunTime = tests.reduce((sum, test) => sum + test.averageRunTime, 0) / totalTests;
    
    const byPriority = {
      critical: tests.filter(t => t.priority === 'critical').length,
      high: tests.filter(t => t.priority === 'high').length,
      medium: tests.filter(t => t.priority === 'medium').length,
      low: tests.filter(t => t.priority === 'low').length,
    };

    const slowTests = this.getSlowTests();
    const flakyTests = this.getFlakyTests();

    let report = `📊 테스트 메타데이터 리포트
${'='.repeat(60)}

📈 전체 통계:
  • 총 테스트 파일: ${totalTests}개
  • 총 실행 횟수: ${totalRuns}회
  • 평균 실행 시간: ${avgRunTime.toFixed(0)}ms

🎯 우선순위별 분포:
  • Critical: ${byPriority.critical}개
  • High: ${byPriority.high}개
  • Medium: ${byPriority.medium}개
  • Low: ${byPriority.low}개

🐌 느린 테스트 Top 5:
`;

    slowTests.slice(0, 5).forEach((test, i) => {
      report += `  ${i + 1}. ${path.basename(test.filePath)} - ${test.averageRunTime.toFixed(0)}ms\n`;
    });

    report += `\n⚠️  불안정한 테스트 Top 5:\n`;
    
    flakyTests.slice(0, 5).forEach((test, i) => {
      report += `  ${i + 1}. ${path.basename(test.filePath)} - Flakiness: ${(test.flakiness * 100).toFixed(1)}%\n`;
    });

    return report;
  }

  /**
   * 테스트 실행 순서 최적화
   */
  public optimizeTestOrder(testFiles: string[]): string[] {
    const metadataMap = new Map<string, TestMetadata>();
    
    testFiles.forEach(file => {
      const metadata = this.metadata.get(file);
      if (metadata) {
        metadataMap.set(file, metadata);
      }
    });

    // 우선순위와 실행 시간을 고려한 정렬
    return testFiles.sort((a, b) => {
      const metaA = metadataMap.get(a);
      const metaB = metadataMap.get(b);

      if (!metaA && !metaB) return 0;
      if (!metaA) return 1;
      if (!metaB) return -1;

      // 1. 우선순위가 높은 것 먼저
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[metaA.priority] - priorityOrder[metaB.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 2. 빠른 것 먼저 (fail fast)
      return metaA.averageRunTime - metaB.averageRunTime;
    });
  }

  /**
   * TDD RED 테스트 찾기
   */
  public getTDDRedTests(): TestMetadata[] {
    return Array.from(this.metadata.values())
      .filter(test => test.tddStatus === 'red');
  }
}

// CLI 인터페이스
if (require.main === module) {
  const manager = new TestMetadataManager();
  const args = process.argv.slice(2);

  if (args.includes('--report')) {
    console.log(manager.generateReport());
  } else if (args.includes('--slow')) {
    const threshold = parseInt(args[args.indexOf('--slow') + 1] || '1000');
    const slowTests = manager.getSlowTests(threshold);
    console.log(`🐌 ${threshold}ms 이상 걸리는 테스트 (${slowTests.length}개):`);
    slowTests.forEach(test => {
      console.log(`  - ${test.filePath}: ${test.averageRunTime.toFixed(0)}ms`);
    });
  } else if (args.includes('--flaky')) {
    const flakyTests = manager.getFlakyTests();
    console.log(`⚠️  불안정한 테스트 (${flakyTests.length}개):`);
    flakyTests.forEach(test => {
      console.log(`  - ${test.filePath}: ${(test.flakiness * 100).toFixed(1)}%`);
    });
  } else if (args.includes('--tdd-red')) {
    const redTests = manager.getTDDRedTests();
    console.log(`🔴 TDD RED 상태 테스트 (${redTests.length}개):`);
    redTests.forEach(test => {
      console.log(`  - ${test.filePath}`);
    });
  } else {
    console.log(`
테스트 메타데이터 관리자

사용법:
  tsx scripts/test-metadata-manager.ts [옵션]

옵션:
  --report      전체 통계 리포트 표시
  --slow [ms]   느린 테스트 표시 (기본: 1000ms)
  --flaky       불안정한 테스트 표시
  --tdd-red     TDD RED 상태 테스트 표시
    `);
  }
}

export { TestMetadataManager };
export type { TestMetadata, TestRunResult };