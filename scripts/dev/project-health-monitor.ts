#!/usr/bin/env tsx
/**
 * 프로젝트 건강도 모니터링 시스템
 * 목표: 프로젝트 중단 원인을 사전에 탐지하고 자동 보고
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface HealthCheckResult {
  category: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
}

interface ProjectHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  checks: HealthCheckResult[];
  timestamp: string;
  lastUpdateBy: 'manual' | 'auto';
}

class ProjectHealthMonitor {
  private results: HealthCheckResult[] = [];

  async runAllChecks(): Promise<ProjectHealth> {
    console.log('🔍 프로젝트 건강도 검사 시작...');

    // 각 카테고리별 검사 실행
    await this.checkTypeScriptHealth();
    await this.checkReactHooksHealth();
    await this.checkArchitectureHealth();
    await this.checkDependencyHealth();
    await this.checkPerformanceHealth();

    const overall = this.calculateOverallHealth();
    const health: ProjectHealth = {
      overall: overall.status,
      score: overall.score,
      checks: this.results,
      timestamp: new Date().toISOString(),
      lastUpdateBy: 'auto'
    };

    // 결과 저장 및 보고
    await this.saveHealthReport(health);
    await this.updateClaudeMemory(health);

    return health;
  }

  private async checkTypeScriptHealth(): Promise<void> {
    console.log('🔍 TypeScript 건강도 검사...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      // TypeScript 컴파일 에러 체크
      execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
      console.log('✅ TypeScript 컴파일: 에러 없음');
    } catch (error) {
      const output = error.toString();
      const errorCount = (output.match(/error TS/g) || []).length;

      issues.push(`TypeScript 컴파일 에러 ${errorCount}개 발견`);
      recommendations.push('npx tsc --noEmit로 상세 확인 후 수정');
      score -= errorCount * 10; // 에러당 10점 감점
    }

    try {
      // any 타입 사용량 체크
      const anyCount = this.countAnyTypes();
      if (anyCount > 50) {
        issues.push(`과도한 any 타입 사용: ${anyCount}개`);
        recommendations.push('any 타입을 구체적 타입으로 교체');
        score -= Math.min(anyCount, 30); // 최대 30점 감점
      }
    } catch (error) {
      console.warn('⚠️ any 타입 검사 실패:', error.message);
    }

    this.results.push({
      category: 'TypeScript',
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations
    });
  }

  private async checkReactHooksHealth(): Promise<void> {
    console.log('🔍 React Hooks 건강도 검사...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      // Hook 의존성 검사
      execSync('npm run lint:hooks', { stdio: 'pipe' });
      console.log('✅ React Hooks: 의존성 문제 없음');
    } catch (error) {
      const output = error.toString();
      const hookErrors = (output.match(/react-hooks\//g) || []).length;

      if (hookErrors > 0) {
        issues.push(`Hook 의존성 문제 ${hookErrors}개 발견`);
        recommendations.push('npm run lint:hooks로 상세 확인 후 수정');
        score -= hookErrors * 15; // Hook 에러는 더 치명적
      }
    }

    // 대형 컴포넌트 검사
    const largeComponents = this.findLargeComponents();
    if (largeComponents.length > 0) {
      issues.push(`대형 컴포넌트 ${largeComponents.length}개: ${largeComponents.join(', ')}`);
      recommendations.push('500줄 이상 컴포넌트를 더 작은 단위로 분리');
      score -= largeComponents.length * 5;
    }

    this.results.push({
      category: 'React Hooks',
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations
    });
  }

  private async checkArchitectureHealth(): Promise<void> {
    console.log('🔍 아키텍처 건강도 검사...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      // 코드베이스 크기 체크
      const totalLines = this.countTotalLines();
      if (totalLines > 300000) {
        issues.push(`코드베이스 크기 과대: ${totalLines.toLocaleString()}줄`);
        recommendations.push('모듈 분리 및 마이크로서비스 패턴 검토');
        score -= 15;
      }

      // 순환 의존성 체크 (madge가 설치된 경우)
      try {
        execSync('npx madge --circular --extensions ts,tsx src/', { stdio: 'pipe' });
        console.log('✅ 순환 의존성: 없음');
      } catch (error) {
        if (error.toString().includes('madge: not found')) {
          console.log('ℹ️ madge 미설치 - 순환 의존성 검사 스킵');
        } else {
          issues.push('순환 의존성 발견');
          recommendations.push('madge 출력을 확인하여 순환 의존성 해결');
          score -= 20;
        }
      }

      // API 핸들러 일관성 체크
      const apiInconsistencies = await this.checkApiConsistency();
      if (apiInconsistencies > 0) {
        issues.push(`API 핸들러 타입 불일치 ${apiInconsistencies}개`);
        recommendations.push('API 핸들러 타입 표준 적용');
        score -= apiInconsistencies * 10;
      }

    } catch (error) {
      console.warn('⚠️ 아키텍처 검사 중 오류:', error.message);
      score -= 10;
    }

    this.results.push({
      category: 'Architecture',
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations
    });
  }

  private async checkDependencyHealth(): Promise<void> {
    console.log('🔍 의존성 건강도 검사...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      // 보안 취약점 체크
      const auditResult = execSync('npm audit --audit-level=moderate --json', { stdio: 'pipe' });
      const audit = JSON.parse(auditResult.toString());

      if (audit.metadata?.vulnerabilities?.total > 0) {
        const { total, high, critical } = audit.metadata.vulnerabilities;
        issues.push(`보안 취약점 ${total}개 (High: ${high}, Critical: ${critical})`);
        recommendations.push('npm audit fix로 취약점 수정');
        score -= critical * 20 + high * 10;
      }
    } catch (error) {
      // npm audit 실패는 종종 발생하므로 warning만 표시
      console.warn('⚠️ npm audit 실패 - 수동 확인 필요');
      score -= 5;
    }

    // 중복 의존성 체크
    try {
      const duplicates = this.findDuplicateDependencies();
      if (duplicates.length > 5) {
        issues.push(`중복 의존성 ${duplicates.length}개`);
        recommendations.push('npm dedupe 실행으로 중복 제거');
        score -= Math.min(duplicates.length, 20);
      }
    } catch (error) {
      console.warn('⚠️ 중복 의존성 검사 실패:', error.message);
    }

    this.results.push({
      category: 'Dependencies',
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations
    });
  }

  private async checkPerformanceHealth(): Promise<void> {
    console.log('🔍 성능 건강도 검사...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 번들 크기 체크 (추정)
    const estimatedBundleSize = this.estimateBundleSize();
    if (estimatedBundleSize > 5000000) { // 5MB 초과
      issues.push(`번들 크기 과대 추정: ${(estimatedBundleSize / 1000000).toFixed(1)}MB`);
      recommendations.push('Bundle Analyzer로 최적화 지점 찾기');
      score -= 15;
    }

    // 미사용 파일 체크
    const unusedFiles = this.findPotentialUnusedFiles();
    if (unusedFiles.length > 10) {
      issues.push(`미사용 가능 파일 ${unusedFiles.length}개`);
      recommendations.push('미사용 파일 정리로 번들 크기 최적화');
      score -= Math.min(unusedFiles.length, 25);
    }

    this.results.push({
      category: 'Performance',
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations
    });
  }

  private calculateOverallHealth(): { status: 'healthy' | 'warning' | 'critical', score: number } {
    const totalScore = this.results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalScore / this.results.length;

    let status: 'healthy' | 'warning' | 'critical';
    if (averageScore >= 80) status = 'healthy';
    else if (averageScore >= 60) status = 'warning';
    else status = 'critical';

    return { status, score: Math.round(averageScore) };
  }

  private async saveHealthReport(health: ProjectHealth): Promise<void> {
    const reportPath = join(process.cwd(), 'reports', `health-${Date.now()}.json`);

    try {
      writeFileSync(reportPath, JSON.stringify(health, null, 2));
      console.log(`📊 건강도 보고서 저장: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ 보고서 저장 실패:', error.message);
    }
  }

  private async updateClaudeMemory(health: ProjectHealth): Promise<void> {
    try {
      const claudePath = join(process.cwd(), 'CLAUDE.md');
      let content = readFileSync(claudePath, 'utf-8');

      // TypeScript 상태 업데이트
      const tsCheck = health.checks.find(c => c.category === 'TypeScript');
      if (tsCheck) {
        const errorCount = tsCheck.issues.length > 0 ?
          tsCheck.issues[0].match(/(\d+)개/)?.[1] || '확인필요' :
          '0';

        content = content.replace(
          /TypeScript 에러: [0-9가-힣\s]*/,
          `TypeScript 에러: ${errorCount}개 ${tsCheck.status === 'healthy' ? '완전 해결' : '발견'}`
        );
      }

      // 전체 프로젝트 상태 업데이트
      const statusEmoji = health.overall === 'healthy' ? '✅' :
                         health.overall === 'warning' ? '⚠️' : '❌';

      // 상태 섹션 찾아서 업데이트
      const healthSection = `
### 🎯 현재 상태 (자동 업데이트)
- **전체 건강도**: ${statusEmoji} ${health.score}/100 (${health.overall})
- **마지막 검사**: ${new Date(health.timestamp).toLocaleString('ko-KR')}
- **주요 이슈**: ${health.checks.filter(c => c.status !== 'healthy').length}개 카테고리

**카테고리별 상태**:
${health.checks.map(check =>
  `- **${check.category}**: ${check.score}/100 (${check.status})`
).join('\n')}

**권장 조치**:
${health.checks
  .filter(check => check.recommendations.length > 0)
  .map(check => check.recommendations.map(rec => `- ${rec}`).join('\n'))
  .join('\n')}
`;

      // 기존 상태 섹션 교체 또는 추가
      if (content.includes('### 🎯 현재 상태')) {
        content = content.replace(
          /### 🎯 현재 상태[\s\S]*?(?=###|\n\n---|\n\n💡|$)/,
          healthSection
        );
      } else {
        // 현재 상태 섹션이 없으면 추가
        content = content.replace(
          '## 🎯 현재 상태',
          '## 🎯 현재 상태\n' + healthSection
        );
      }

      writeFileSync(claudePath, content);
      console.log('✅ CLAUDE.md 자동 업데이트 완료');

    } catch (error) {
      console.warn('⚠️ CLAUDE.md 업데이트 실패:', error.message);
    }
  }

  // Helper 메서드들
  private countAnyTypes(): number {
    try {
      const result = execSync('grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l', {
        stdio: 'pipe'
      });
      return parseInt(result.toString().trim()) || 0;
    } catch {
      return 0;
    }
  }

  private findLargeComponents(): string[] {
    try {
      const result = execSync(
        'find src/components -name "*.tsx" -exec wc -l {} + | awk \'$1 > 500 {print $2}\' | head -10',
        { stdio: 'pipe' }
      );
      return result.toString().trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private countTotalLines(): number {
    try {
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1', {
        stdio: 'pipe'
      });
      return parseInt(result.toString().match(/(\d+)/)?.[1] || '0');
    } catch {
      return 0;
    }
  }

  private async checkApiConsistency(): Promise<number> {
    // API 핸들러의 async/Promise 패턴 일관성 체크
    try {
      const result = execSync(
        'find src/app/api -name "route.ts" -exec grep -L "async function\\|Promise<Response>" {} \\;',
        { stdio: 'pipe' }
      );
      return result.toString().trim().split('\n').filter(Boolean).length;
    } catch {
      return 0;
    }
  }

  private findDuplicateDependencies(): string[] {
    try {
      const result = execSync('npm ls --depth=0 --json', { stdio: 'pipe' });
      const packages = JSON.parse(result.toString());
      // 실제 중복 검사 로직은 복잡하므로 간단한 추정
      return []; // 구현 필요시 확장
    } catch {
      return [];
    }
  }

  private estimateBundleSize(): number {
    try {
      const result = execSync('du -sb src/', { stdio: 'pipe' });
      return parseInt(result.toString().split('\t')[0]) || 0;
    } catch {
      return 0;
    }
  }

  private findPotentialUnusedFiles(): string[] {
    // 간단한 미사용 파일 추정 (실제로는 더 정교한 분석 필요)
    return [];
  }
}

// 스크립트 실행
async function main() {
  const monitor = new ProjectHealthMonitor();

  try {
    const health = await monitor.runAllChecks();

    console.log('\n📊 프로젝트 건강도 검사 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 점수: ${health.score}/100 (${health.overall})`);

    const criticalIssues = health.checks.filter(c => c.status === 'critical');
    if (criticalIssues.length > 0) {
      console.log('\n🚨 긴급 조치 필요:');
      criticalIssues.forEach(issue => {
        console.log(`  - ${issue.category}: ${issue.issues.join(', ')}`);
      });
    }

    process.exit(health.overall === 'critical' ? 1 : 0);

  } catch (error) {
    console.error('❌ 건강도 검사 실패:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ProjectHealthMonitor };