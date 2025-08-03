#!/usr/bin/env tsx

/**
 * 🤝 서브 에이전트 협업 코디네이터
 * 
 * 테스트 시스템과 서브 에이전트들 간의 협업을 조율합니다.
 * Memory MCP를 통해 비동기 정보 공유를 구현합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { TestMetadataManager } from './test-metadata-manager';
import { TDDCleanupManager } from './tdd-cleanup';

interface AgentTask {
  agent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context: any;
  recommendation: string;
}

interface CoordinationReport {
  timestamp: string;
  testStatus: {
    total: number;
    passing: number;
    failing: number;
    flaky: number;
    slow: number;
  };
  recommendations: AgentTask[];
  memoryKeys: string[];
}

class SubAgentCoordinator {
  private metadataManager: TestMetadataManager;
  private memoryBasePath = '.claude/agent-memory';

  constructor() {
    this.metadataManager = new TestMetadataManager();
    this.ensureMemoryDirectory();
  }

  /**
   * Memory 디렉토리 생성
   */
  private ensureMemoryDirectory() {
    if (!fs.existsSync(this.memoryBasePath)) {
      fs.mkdirSync(this.memoryBasePath, { recursive: true });
    }
  }

  /**
   * 테스트 시스템 전체 분석
   */
  public async analyzeTestSystem(): Promise<CoordinationReport> {
    console.log('🔍 테스트 시스템 전체 분석 시작...\n');

    const report: CoordinationReport = {
      timestamp: new Date().toISOString(),
      testStatus: {
        total: 0,
        passing: 0,
        failing: 0,
        flaky: 0,
        slow: 0,
      },
      recommendations: [],
      memoryKeys: [],
    };

    // 1. 테스트 메타데이터 분석
    const allTests = this.metadataManager.getTestsByPriority();
    report.testStatus.total = allTests.length;

    // 통계 계산
    allTests.forEach(test => {
      const successRate = test.totalRuns > 0 
        ? test.successCount / test.totalRuns 
        : 0;

      if (successRate >= 0.95) {
        report.testStatus.passing++;
      } else {
        report.testStatus.failing++;
      }

      if (test.flakiness > 0.1) {
        report.testStatus.flaky++;
      }

      if (test.averageRunTime > 1000) {
        report.testStatus.slow++;
      }
    });

    // 2. 에이전트 추천 생성
    this.generateRecommendations(report, allTests);

    // 3. Memory에 저장
    await this.saveToMemory(report);

    // 4. 리포트 출력
    this.printReport(report);

    return report;
  }

  /**
   * 상황별 에이전트 추천
   */
  private generateRecommendations(report: CoordinationReport, tests: any[]) {
    // 1. 실패하는 테스트가 많은 경우
    if (report.testStatus.failing > 5) {
      report.recommendations.push({
        agent: 'debugger-specialist',
        priority: 'critical',
        context: {
          failingTests: report.testStatus.failing,
          message: '많은 테스트가 실패하고 있습니다. 근본 원인 분석이 필요합니다.',
        },
        recommendation: 'debugger-specialist로 실패 원인을 체계적으로 분석하세요.',
      });
    }

    // 2. 불안정한 테스트가 있는 경우
    const flakyTests = tests.filter(t => t.flakiness > 0.1);
    if (flakyTests.length > 0) {
      report.recommendations.push({
        agent: 'test-automation-specialist',
        priority: 'high',
        context: {
          flakyTests: flakyTests.map(t => ({
            file: t.filePath,
            flakiness: t.flakiness,
          })),
        },
        recommendation: 'test-automation-specialist로 불안정한 테스트를 안정화하세요.',
      });
    }

    // 3. 느린 테스트 최적화
    const slowTests = tests.filter(t => t.averageRunTime > 2000);
    if (slowTests.length > 0) {
      report.recommendations.push({
        agent: 'ux-performance-optimizer',
        priority: 'medium',
        context: {
          slowTests: slowTests.map(t => ({
            file: t.filePath,
            avgTime: t.averageRunTime,
          })),
        },
        recommendation: '테스트 성능 최적화가 필요합니다.',
      });
    }

    // 4. TDD RED 테스트 확인
    const redTests = tests.filter(t => t.tddStatus === 'red');
    if (redTests.length > 0) {
      report.recommendations.push({
        agent: 'test-first-developer',
        priority: 'high',
        context: {
          redTests: redTests.length,
          files: redTests.map(t => t.filePath),
        },
        recommendation: 'test-first-developer로 RED 테스트를 GREEN으로 전환하세요.',
      });
    }

    // 5. 전체적인 코드 품질 검토
    if (tests.length > 50 && report.testStatus.passing / tests.length < 0.8) {
      report.recommendations.push({
        agent: 'code-review-specialist',
        priority: 'medium',
        context: {
          testCoverage: (report.testStatus.passing / tests.length * 100).toFixed(1) + '%',
        },
        recommendation: 'code-review-specialist로 전체 코드 품질을 검토하세요.',
      });
    }
  }

  /**
   * Memory MCP에 저장 (시뮬레이션)
   */
  private async saveToMemory(report: CoordinationReport): Promise<void> {
    // 1. 전체 리포트 저장
    const reportKey = `test-coordination-${Date.now()}`;
    const reportPath = path.join(this.memoryBasePath, `${reportKey}.json`);
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    report.memoryKeys.push(reportKey);

    // 2. 각 추천사항을 개별 메모리로 저장
    for (const rec of report.recommendations) {
      const recKey = `recommendation-${rec.agent}-${Date.now()}`;
      const recPath = path.join(this.memoryBasePath, `${recKey}.json`);
      
      const memoryData = {
        timestamp: report.timestamp,
        agent: rec.agent,
        priority: rec.priority,
        context: rec.context,
        recommendation: rec.recommendation,
        status: 'pending',
      };

      await fs.promises.writeFile(recPath, JSON.stringify(memoryData, null, 2));
      report.memoryKeys.push(recKey);
    }

    console.log(`\n📝 ${report.memoryKeys.length}개의 메모리 키가 생성되었습니다.`);
  }

  /**
   * 리포트 출력
   */
  private printReport(report: CoordinationReport) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 서브 에이전트 협업 리포트');
    console.log('='.repeat(60));

    console.log('\n🧪 테스트 상태:');
    console.log(`  • 전체: ${report.testStatus.total}개`);
    console.log(`  • 통과: ${report.testStatus.passing}개`);
    console.log(`  • 실패: ${report.testStatus.failing}개`);
    console.log(`  • 불안정: ${report.testStatus.flaky}개`);
    console.log(`  • 느림: ${report.testStatus.slow}개`);

    if (report.recommendations.length > 0) {
      console.log('\n🤖 추천 서브 에이전트:');
      
      // 우선순위별로 정렬
      const sorted = [...report.recommendations].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      sorted.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.agent} (${rec.priority})`);
        console.log(`   ${rec.recommendation}`);
      });
    }

    console.log('\n💡 사용 방법:');
    console.log('   1. 추천된 에이전트를 Task 도구로 호출');
    console.log('   2. Memory MCP에서 상세 컨텍스트 조회');
    console.log('   3. 작업 완료 후 상태 업데이트');
  }

  /**
   * 특정 에이전트의 작업 완료 처리
   */
  public async completeAgentTask(agent: string, success: boolean, notes?: string) {
    const memoryFiles = await fs.promises.readdir(this.memoryBasePath);
    
    for (const file of memoryFiles) {
      if (file.includes(`recommendation-${agent}`)) {
        const filePath = path.join(this.memoryBasePath, file);
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        
        data.status = success ? 'completed' : 'failed';
        data.completedAt = new Date().toISOString();
        if (notes) data.notes = notes;

        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ ${agent} 작업 상태 업데이트 완료`);
        break;
      }
    }
  }

  /**
   * 실시간 모니터링 모드
   */
  public async startMonitoring(intervalMinutes: number = 5) {
    console.log(`🔄 실시간 모니터링 시작 (${intervalMinutes}분 간격)\n`);

    const monitor = async () => {
      const report = await this.analyzeTestSystem();
      
      // Critical 우선순위가 있으면 즉시 알림
      const critical = report.recommendations.filter(r => r.priority === 'critical');
      if (critical.length > 0) {
        console.log('\n🚨 CRITICAL: 즉시 조치가 필요한 항목이 있습니다!');
        critical.forEach(c => {
          console.log(`   - ${c.agent}: ${c.recommendation}`);
        });
      }
    };

    // 초기 실행
    await monitor();

    // 주기적 실행
    setInterval(monitor, intervalMinutes * 60 * 1000);

    console.log('\n모니터링이 시작되었습니다. Ctrl+C로 종료하세요.');
  }
}

// CLI 인터페이스
if (require.main === module) {
  const coordinator = new SubAgentCoordinator();
  const args = process.argv.slice(2);

  const main = async () => {
    if (args.includes('--monitor')) {
      const intervalIndex = args.indexOf('--monitor');
      const interval = args[intervalIndex + 1] ? parseInt(args[intervalIndex + 1]) : 5;
      await coordinator.startMonitoring(interval);
    } else if (args.includes('--complete')) {
      const agentIndex = args.indexOf('--complete');
      const agent = args[agentIndex + 1];
      const success = !args.includes('--failed');
      const notesIndex = args.indexOf('--notes');
      const notes = notesIndex > -1 ? args[notesIndex + 1] : undefined;
      
      await coordinator.completeAgentTask(agent, success, notes);
    } else if (args.includes('--help')) {
      console.log(`
서브 에이전트 협업 코디네이터

사용법:
  tsx scripts/sub-agent-coordinator.ts [옵션]

옵션:
  --monitor [분]     실시간 모니터링 모드 (기본: 5분)
  --complete <agent> 에이전트 작업 완료 처리
  --failed           작업 실패로 표시 (--complete와 함께 사용)
  --notes <메모>     작업 완료 메모 추가

예시:
  # 테스트 시스템 분석 및 추천
  tsx scripts/sub-agent-coordinator.ts
  
  # 실시간 모니터링 (10분 간격)
  tsx scripts/sub-agent-coordinator.ts --monitor 10
  
  # 에이전트 작업 완료
  tsx scripts/sub-agent-coordinator.ts --complete test-automation-specialist --notes "불안정한 테스트 3개 수정"
      `);
    } else {
      // 기본: 단일 분석 실행
      await coordinator.analyzeTestSystem();
    }
  };

  main().catch(console.error);
}

export { SubAgentCoordinator };
export type { AgentTask, CoordinationReport };