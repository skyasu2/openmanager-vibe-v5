#!/usr/bin/env tsx

/**
 * 📊 AI Usage Dashboard v1.0 - 사용량 모니터링 및 리포팅 시스템
 * 
 * 주요 기능:
 * - 실시간 사용량 추적
 * - 모델별 통계 및 비용 분석
 * - 시각적 대시보드
 * - 사용 패턴 분석
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 타입 정의
interface UsageEntry {
  timestamp: string;
  model: string;
  command: string;
  success: boolean;
  fallback?: boolean;
  errorType?: string;
  duration?: number;
  tokensUsed?: number;
}

interface DailyStats {
  date: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  modelUsage: Record<string, ModelStats>;
  peakHour: number;
  averageResponseTime: number;
  errorBreakdown: Record<string, number>;
}

interface ModelStats {
  requests: number;
  successful: number;
  failed: number;
  fallbacks: number;
  averageResponseTime: number;
  estimatedCost: number;
  limitUtilization: number; // 일일 한도 대비 사용률 (%)
}

interface UsageTrend {
  period: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  percentageChange: number;
}

interface CostEstimate {
  model: string;
  requests: number;
  estimatedCost: number;
  costPerRequest: number;
}

// 모델별 가격 정보 (추정치)
const MODEL_COSTS = {
  'pro': { perRequest: 0.01, dailyLimit: 50 },
  'flash': { perRequest: 0.001, dailyLimit: 1500 }
};

/**
 * AI 사용량 대시보드 클래스
 */
export class AIUsageDashboard {
  private logDir: string;
  private cacheDir: string;
  private debug: boolean;

  constructor(options: {
    logDir?: string;
    cacheDir?: string;
    debug?: boolean;
  } = {}) {
    this.logDir = options.logDir || join(__dirname, '..', '.logs', 'gemini');
    this.cacheDir = options.cacheDir || join(__dirname, '..', '.cache', 'dashboard');
    this.debug = options.debug || false;
    
    this.ensureDirectories();
  }

  /**
   * 필요한 디렉토리 생성
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      if (this.debug) {
        console.error('[Dashboard] 디렉토리 생성 실패:', error);
      }
    }
  }

  /**
   * 특정 날짜의 사용량 로그 읽기
   */
  private async readDailyLog(date: Date): Promise<UsageEntry[]> {
    const dateStr = date.toISOString().split('T')[0];
    const logFile = join(this.logDir, `usage_${dateStr}.json`);
    
    try {
      const content = await fs.readFile(logFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * 일별 통계 계산
   */
  async getDailyStats(date?: Date): Promise<DailyStats> {
    const targetDate = date || new Date();
    const logs = await this.readDailyLog(targetDate);
    
    const stats: DailyStats = {
      date: targetDate.toISOString().split('T')[0],
      totalRequests: logs.length,
      successfulRequests: 0,
      failedRequests: 0,
      modelUsage: {},
      peakHour: 0,
      averageResponseTime: 0,
      errorBreakdown: {}
    };

    // 시간별 사용량 추적
    const hourlyUsage: Record<number, number> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const log of logs) {
      // 성공/실패 카운트
      if (log.success) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
      }

      // 모델별 통계
      if (!stats.modelUsage[log.model]) {
        stats.modelUsage[log.model] = {
          requests: 0,
          successful: 0,
          failed: 0,
          fallbacks: 0,
          averageResponseTime: 0,
          estimatedCost: 0,
          limitUtilization: 0
        };
      }

      const modelStat = stats.modelUsage[log.model];
      modelStat.requests++;
      
      if (log.success) {
        modelStat.successful++;
      } else {
        modelStat.failed++;
      }

      if (log.fallback) {
        modelStat.fallbacks++;
      }

      // 응답 시간 계산
      if (log.duration) {
        totalResponseTime += log.duration;
        responseTimeCount++;
      }

      // 시간별 사용량
      const hour = new Date(log.timestamp).getHours();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;

      // 에러 타입 집계
      if (log.errorType) {
        stats.errorBreakdown[log.errorType] = (stats.errorBreakdown[log.errorType] || 0) + 1;
      }
    }

    // 평균 응답 시간
    stats.averageResponseTime = responseTimeCount > 0 
      ? Math.round(totalResponseTime / responseTimeCount)
      : 0;

    // 피크 시간 찾기
    let maxUsage = 0;
    for (const [hour, usage] of Object.entries(hourlyUsage)) {
      if (usage > maxUsage) {
        maxUsage = usage;
        stats.peakHour = parseInt(hour);
      }
    }

    // 모델별 비용 및 한도 계산
    for (const [model, modelStat] of Object.entries(stats.modelUsage)) {
      const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
      if (modelCost) {
        modelStat.estimatedCost = modelStat.requests * modelCost.perRequest;
        modelStat.limitUtilization = (modelStat.requests / modelCost.dailyLimit) * 100;
      }
    }

    return stats;
  }

  /**
   * 주간 트렌드 분석
   */
  async getWeeklyTrend(): Promise<UsageTrend> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let totalThisWeek = 0;
    let totalLastWeek = 0;

    // 이번 주 사용량
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const stats = await this.getDailyStats(date);
      totalThisWeek += stats.totalRequests;
    }

    // 지난 주 사용량
    for (let i = 7; i < 14; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const stats = await this.getDailyStats(date);
      totalLastWeek += stats.totalRequests;
    }

    const percentageChange = totalLastWeek > 0
      ? ((totalThisWeek - totalLastWeek) / totalLastWeek) * 100
      : 0;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (percentageChange > 10) {
      trend = 'increasing';
    } else if (percentageChange < -10) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      period: 'weekly',
      trend,
      percentageChange: Math.round(percentageChange)
    };
  }

  /**
   * 비용 예측
   */
  async getCostForecast(days: number = 30): Promise<CostEstimate[]> {
    const estimates: CostEstimate[] = [];
    let totalDays = 0;
    const modelTotals: Record<string, number> = {};

    // 최근 데이터 기반 예측
    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const stats = await this.getDailyStats(date);
      
      if (stats.totalRequests > 0) {
        totalDays++;
        for (const [model, modelStat] of Object.entries(stats.modelUsage)) {
          modelTotals[model] = (modelTotals[model] || 0) + modelStat.requests;
        }
      }
    }

    // 일일 평균 계산 및 예측
    for (const [model, total] of Object.entries(modelTotals)) {
      const dailyAverage = total / totalDays;
      const projectedRequests = Math.round(dailyAverage * days);
      const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
      
      if (modelCost) {
        estimates.push({
          model,
          requests: projectedRequests,
          estimatedCost: projectedRequests * modelCost.perRequest,
          costPerRequest: modelCost.perRequest
        });
      }
    }

    return estimates;
  }

  /**
   * 텍스트 기반 대시보드 렌더링
   */
  async renderDashboard(): Promise<string> {
    const today = new Date();
    const stats = await this.getDailyStats(today);
    const trend = await this.getWeeklyTrend();
    const forecast = await this.getCostForecast();

    const dashboard = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🎯 AI USAGE DASHBOARD                                 ║
║                        ${stats.date} (KST)                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 일일 사용량 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 요청: ${stats.totalRequests} | 성공: ${stats.successfulRequests} (${this.getPercentage(stats.successfulRequests, stats.totalRequests)}%) | 실패: ${stats.failedRequests} (${this.getPercentage(stats.failedRequests, stats.totalRequests)}%)
평균 응답 시간: ${stats.averageResponseTime}ms | 피크 시간: ${stats.peakHour}시

📈 모델별 상세 현황
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.renderModelStats(stats.modelUsage)}

💰 비용 분석 (30일 예측)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.renderCostForecast(forecast)}

📈 주간 트렌드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
상태: ${this.getTrendEmoji(trend.trend)} ${this.getTrendText(trend.trend)}
변화율: ${trend.percentageChange > 0 ? '+' : ''}${trend.percentageChange}%

${stats.failedRequests > 0 ? this.renderErrorBreakdown(stats.errorBreakdown) : ''}

💡 추천사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.generateRecommendations(stats)}
`;

    return dashboard;
  }

  /**
   * 모델 통계 렌더링
   */
  private renderModelStats(modelUsage: Record<string, ModelStats>): string {
    const lines: string[] = [];
    
    for (const [model, stats] of Object.entries(modelUsage)) {
      const successRate = this.getPercentage(stats.successful, stats.requests);
      const limitBar = this.renderProgressBar(stats.limitUtilization);
      
      lines.push(`${model.toUpperCase()} 모델:`);
      lines.push(`  요청: ${stats.requests} | 성공률: ${successRate}% | Fallback: ${stats.fallbacks}`);
      lines.push(`  일일 한도: ${limitBar} ${Math.round(stats.limitUtilization)}%`);
      lines.push(`  예상 비용: $${stats.estimatedCost.toFixed(3)}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * 비용 예측 렌더링
   */
  private renderCostForecast(forecast: CostEstimate[]): string {
    const lines: string[] = [];
    let totalCost = 0;
    
    for (const estimate of forecast) {
      lines.push(`${estimate.model.toUpperCase()}: ${estimate.requests}회 × $${estimate.costPerRequest} = $${estimate.estimatedCost.toFixed(2)}`);
      totalCost += estimate.estimatedCost;
    }
    
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`총 예상 비용: $${totalCost.toFixed(2)}`);
    
    return lines.join('\n');
  }

  /**
   * 에러 분석 렌더링
   */
  private renderErrorBreakdown(errors: Record<string, number>): string {
    const lines = ['🚨 에러 분석', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'];
    
    for (const [type, count] of Object.entries(errors)) {
      lines.push(`${type}: ${count}회`);
    }
    
    lines.push('');
    return lines.join('\n');
  }

  /**
   * 프로그레스 바 생성
   */
  private renderProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  /**
   * 퍼센트 계산
   */
  private getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * 트렌드 이모지
   */
  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '📊';
    }
  }

  /**
   * 트렌드 텍스트
   */
  private getTrendText(trend: string): string {
    switch (trend) {
      case 'increasing': return '증가 추세';
      case 'decreasing': return '감소 추세';
      default: return '안정적';
    }
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(stats: DailyStats): string {
    const recommendations: string[] = [];

    // Pro 모델 한도 체크
    const proStats = stats.modelUsage['pro'];
    if (proStats && proStats.limitUtilization > 80) {
      recommendations.push('• Pro 모델 사용량이 80%를 초과했습니다. Flash 모델 사용을 고려하세요.');
    }

    // 실패율 체크
    const failureRate = this.getPercentage(stats.failedRequests, stats.totalRequests);
    if (failureRate > 20) {
      recommendations.push('• 실패율이 높습니다. 에러 로그를 확인하고 재시도 로직을 개선하세요.');
    }

    // 피크 시간 체크
    if (stats.peakHour >= 9 && stats.peakHour <= 18) {
      recommendations.push(`• 피크 시간(${stats.peakHour}시)이 업무 시간입니다. 배치 작업은 야간에 수행하세요.`);
    }

    // 응답 시간 체크
    if (stats.averageResponseTime > 5000) {
      recommendations.push('• 평균 응답 시간이 5초를 초과합니다. 캐싱 전략을 검토하세요.');
    }

    return recommendations.length > 0 
      ? recommendations.join('\n')
      : '• 모든 지표가 정상 범위 내에 있습니다.';
  }

  /**
   * CSV 내보내기
   */
  async exportToCSV(startDate: Date, endDate: Date, outputPath: string): Promise<void> {
    const headers = ['Date', 'Model', 'Total Requests', 'Successful', 'Failed', 'Fallbacks', 'Avg Response Time (ms)', 'Estimated Cost ($)'];
    const rows: string[] = [headers.join(',')];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const stats = await this.getDailyStats(currentDate);
      
      for (const [model, modelStats] of Object.entries(stats.modelUsage)) {
        rows.push([
          stats.date,
          model,
          modelStats.requests,
          modelStats.successful,
          modelStats.failed,
          modelStats.fallbacks,
          Math.round(modelStats.averageResponseTime),
          modelStats.estimatedCost.toFixed(3)
        ].join(','));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await fs.writeFile(outputPath, rows.join('\n'));
  }

  /**
   * 실시간 모니터링 (터미널에서 업데이트)
   */
  async startLiveMonitoring(intervalMs: number = 5000): Promise<void> {
    console.clear();
    
    const update = async () => {
      console.clear();
      const dashboard = await this.renderDashboard();
      console.log(dashboard);
      console.log('\n⏱️  다음 업데이트까지:', intervalMs / 1000, '초');
      console.log('Ctrl+C를 눌러 종료');
    };

    // 초기 렌더링
    await update();

    // 주기적 업데이트
    const interval = setInterval(update, intervalMs);

    // 종료 처리
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n\n👋 모니터링을 종료합니다.');
      process.exit(0);
    });
  }
}

// CLI 인터페이스
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new AIUsageDashboard({ debug: true });
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function runCLI() {
    try {
      switch (command) {
        case 'show':
          const dashboardView = await dashboard.renderDashboard();
          console.log(dashboardView);
          break;

        case 'live':
          const interval = args[0] ? parseInt(args[0]) * 1000 : 5000;
          await dashboard.startLiveMonitoring(interval);
          break;

        case 'export':
          const days = parseInt(args[0]) || 7;
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
          const outputPath = args[1] || `ai_usage_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;
          
          await dashboard.exportToCSV(startDate, endDate, outputPath);
          console.log(`✅ CSV 파일로 내보내기 완료: ${outputPath}`);
          break;

        case 'trend':
          const trend = await dashboard.getWeeklyTrend();
          console.log(`\n📈 주간 트렌드 분석`);
          console.log(`상태: ${trend.trend}`);
          console.log(`변화율: ${trend.percentageChange > 0 ? '+' : ''}${trend.percentageChange}%`);
          break;

        case 'cost':
          const days2 = parseInt(args[0]) || 30;
          const forecast = await dashboard.getCostForecast(days2);
          console.log(`\n💰 ${days2}일 비용 예측`);
          
          let totalCost = 0;
          for (const estimate of forecast) {
            console.log(`${estimate.model}: $${estimate.estimatedCost.toFixed(2)} (${estimate.requests}회)`);
            totalCost += estimate.estimatedCost;
          }
          console.log(`총 예상 비용: $${totalCost.toFixed(2)}`);
          break;

        default:
          console.log(`
📊 AI Usage Dashboard v1.0

기본 명령어:
  tsx tools/ai-usage-dashboard.ts show       대시보드 표시
  tsx tools/ai-usage-dashboard.ts live [초]  실시간 모니터링
  tsx tools/ai-usage-dashboard.ts export [일수] [파일명]  CSV 내보내기
  tsx tools/ai-usage-dashboard.ts trend      주간 트렌드 분석
  tsx tools/ai-usage-dashboard.ts cost [일수]  비용 예측

예시:
  tsx tools/ai-usage-dashboard.ts show
  tsx tools/ai-usage-dashboard.ts live 10    # 10초마다 업데이트
  tsx tools/ai-usage-dashboard.ts export 30  # 30일간 데이터 내보내기
  tsx tools/ai-usage-dashboard.ts cost 90    # 90일 비용 예측
          `);
      }
    } catch (error) {
      console.error('❌ 오류:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  runCLI();
}

export default AIUsageDashboard;