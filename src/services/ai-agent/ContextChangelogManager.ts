import { ImprovementHistory } from '@/types/ai-learning';

/**
 * 컨텍스트 변경 이력 관리 및 Changelog 생성 서비스
 */
export class ContextChangelogManager {
  private static instance: ContextChangelogManager;
  private improvementHistory: Map<string, ImprovementHistory> = new Map();

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): ContextChangelogManager {
    if (!ContextChangelogManager.instance) {
      ContextChangelogManager.instance = new ContextChangelogManager();
    }
    return ContextChangelogManager.instance;
  }

  /**
   * 개선 제안 반영 이력 기록
   */
  async recordImprovement(
    adminId: string,
    sessionId: string,
    approvedSuggestions: Array<{
      type: 'pattern' | 'intent' | 'response' | 'context';
      description: string;
      beforeValue?: string;
      afterValue: string;
      estimatedImpact: number;
    }>
  ): Promise<ImprovementHistory> {
    try {
      console.log(
        `📝 [ContextChangelogManager] 개선 이력 기록 시작: ${sessionId}`
      );

      const version = this.generateVersion();
      const changelogEntry = this.generateChangelogEntry(
        approvedSuggestions,
        version
      );

      const history: ImprovementHistory = {
        id: this.generateHistoryId(),
        timestamp: new Date().toISOString(),
        adminId,
        sessionId,
        approvedSuggestions,
        changelogEntry,
        version,
        status: 'pending',
      };

      this.improvementHistory.set(history.id, history);

      // Changelog 파일 업데이트
      await this.updateChangelogFile(history);

      // 상태를 적용됨으로 변경
      history.status = 'applied';
      this.improvementHistory.set(history.id, history);

      console.log(
        `✅ [ContextChangelogManager] 개선 이력 기록 완료: ${history.id}`
      );
      return history;
    } catch (error) {
      console.error('❌ [ContextChangelogManager] 개선 이력 기록 실패:', error);
      throw error;
    }
  }

  /**
   * 개선 이력 조회
   */
  getImprovementHistory(filters?: {
    adminId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: ImprovementHistory['status'];
  }): ImprovementHistory[] {
    let history = Array.from(this.improvementHistory.values());

    if (filters) {
      if (filters.adminId) {
        history = history.filter(h => h.adminId === filters.adminId);
      }
      if (filters.startDate) {
        history = history.filter(
          h => new Date(h.timestamp) >= filters.startDate!
        );
      }
      if (filters.endDate) {
        history = history.filter(
          h => new Date(h.timestamp) <= filters.endDate!
        );
      }
      if (filters.status) {
        history = history.filter(h => h.status === filters.status);
      }
    }

    return history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Changelog 마크다운 생성
   */
  generateFullChangelog(): string {
    const history = this.getImprovementHistory({ status: 'applied' });

    let changelog = `# 🧠 AI 에이전트 컨텍스트 변경 이력\n\n`;
    changelog += `> 이 파일은 AI 에이전트의 컨텍스트 개선 사항을 자동으로 기록합니다.\n\n`;
    changelog += `**마지막 업데이트**: ${new Date().toLocaleString('ko-KR')}\n\n`;

    // 버전별로 그룹핑
    const versionGroups = this.groupByVersion(history);

    for (const [version, entries] of versionGroups) {
      changelog += `## 📋 버전 ${version}\n\n`;

      for (const entry of entries) {
        changelog += entry.changelogEntry + '\n\n';
      }
    }

    // 통계 정보 추가
    changelog += this.generateStatistics(history);

    return changelog;
  }

  /**
   * 최근 변경사항 요약
   */
  getRecentChanges(days: number = 7): {
    totalChanges: number;
    byType: Record<string, number>;
    totalImpact: number;
    recentEntries: ImprovementHistory[];
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentEntries = this.getImprovementHistory({
      startDate: cutoffDate,
      status: 'applied',
    });

    const byType: Record<string, number> = {};
    let totalImpact = 0;

    recentEntries.forEach(entry => {
      entry.approvedSuggestions.forEach(suggestion => {
        byType[suggestion.type] = (byType[suggestion.type] || 0) + 1;
        totalImpact += suggestion.estimatedImpact;
      });
    });

    return {
      totalChanges: recentEntries.length,
      byType,
      totalImpact,
      recentEntries,
    };
  }

  /**
   * 개선 효과 분석
   */
  analyzeImprovementEffects(): {
    totalImprovements: number;
    averageImpact: number;
    mostCommonType: string;
    improvementTrend: Array<{
      month: string;
      count: number;
      impact: number;
    }>;
  } {
    const history = this.getImprovementHistory({ status: 'applied' });

    let totalImpact = 0;
    let totalSuggestions = 0;
    const typeCount: Record<string, number> = {};
    const monthlyData: Record<string, { count: number; impact: number }> = {};

    history.forEach(entry => {
      const month = new Date(entry.timestamp).toISOString().substring(0, 7);

      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, impact: 0 };
      }

      entry.approvedSuggestions.forEach(suggestion => {
        totalImpact += suggestion.estimatedImpact;
        totalSuggestions++;
        typeCount[suggestion.type] = (typeCount[suggestion.type] || 0) + 1;
        monthlyData[month].count++;
        monthlyData[month].impact += suggestion.estimatedImpact;
      });
    });

    const mostCommonType =
      Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    const improvementTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalImprovements: history.length,
      averageImpact: totalSuggestions > 0 ? totalImpact / totalSuggestions : 0,
      mostCommonType,
      improvementTrend,
    };
  }

  // Private 헬퍼 메서드들
  private generateVersion(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day}.${hour}${minute}`;
  }

  private generateChangelogEntry(
    suggestions: ImprovementHistory['approvedSuggestions'],
    version: string
  ): string {
    const timestamp = new Date().toLocaleString('ko-KR');

    let entry = `### 🔄 ${timestamp} (v${version})\n\n`;

    // 타입별로 그룹핑
    const byType = this.groupSuggestionsByType(suggestions);

    for (const [type, items] of Object.entries(byType)) {
      const typeIcon = this.getTypeIcon(type);
      entry += `#### ${typeIcon} ${this.getTypeLabel(type)}\n\n`;

      items.forEach((item, index) => {
        entry += `${index + 1}. **${item.description}**\n`;
        if (item.beforeValue) {
          entry += `   - 이전: \`${item.beforeValue}\`\n`;
        }
        entry += `   - 변경: \`${item.afterValue}\`\n`;
        entry += `   - 예상 효과: ${item.estimatedImpact}%\n\n`;
      });
    }

    return entry;
  }

  private groupSuggestionsByType(
    suggestions: ImprovementHistory['approvedSuggestions']
  ) {
    const grouped: Record<string, typeof suggestions> = {};

    suggestions.forEach(suggestion => {
      if (!grouped[suggestion.type]) {
        grouped[suggestion.type] = [];
      }
      grouped[suggestion.type].push(suggestion);
    });

    return grouped;
  }

  private getTypeIcon(type: string): string {
    const icons = {
      pattern: '🔍',
      intent: '🎯',
      response: '💬',
      context: '📋',
    };
    return icons[type as keyof typeof icons] || '📝';
  }

  private getTypeLabel(type: string): string {
    const labels = {
      pattern: '패턴 매칭 개선',
      intent: '인텐트 분류 개선',
      response: '응답 템플릿 개선',
      context: '컨텍스트 구조 개선',
    };
    return labels[type as keyof typeof labels] || '기타 개선';
  }

  private async updateChangelogFile(
    history: ImprovementHistory
  ): Promise<void> {
    try {
      // 실제 파일 시스템 작업은 브라우저 환경에서 제한적
      // 여기서는 로컬 스토리지에 저장하고, 서버 환경에서는 실제 파일 작성
      if (typeof window !== 'undefined') {
        const existingChangelog =
          localStorage.getItem('ai-context-changelog') || '';
        const newEntry = history.changelogEntry;
        const updatedChangelog = this.insertChangelogEntry(
          existingChangelog,
          newEntry
        );
        localStorage.setItem('ai-context-changelog', updatedChangelog);
      }

      console.log(`📄 [ContextChangelogManager] Changelog 업데이트 완료`);
    } catch (error) {
      console.error(
        '❌ [ContextChangelogManager] Changelog 파일 업데이트 실패:',
        error
      );
      throw error;
    }
  }

  private insertChangelogEntry(
    existingChangelog: string,
    newEntry: string
  ): string {
    if (!existingChangelog) {
      return `# 🧠 AI 에이전트 컨텍스트 변경 이력\n\n${newEntry}`;
    }

    // 첫 번째 ## 섹션 앞에 새 엔트리 삽입
    const lines = existingChangelog.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## '));

    if (insertIndex === -1) {
      return existingChangelog + '\n\n' + newEntry;
    }

    lines.splice(insertIndex, 0, newEntry, '');
    return lines.join('\n');
  }

  private groupByVersion(
    history: ImprovementHistory[]
  ): Map<string, ImprovementHistory[]> {
    const groups = new Map<string, ImprovementHistory[]>();

    history.forEach(entry => {
      const version = entry.version;
      if (!groups.has(version)) {
        groups.set(version, []);
      }
      groups.get(version)!.push(entry);
    });

    // 버전 순으로 정렬 (최신 버전 먼저)
    return new Map(
      [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
    );
  }

  private generateStatistics(history: ImprovementHistory[]): string {
    const stats = this.analyzeImprovementEffects();

    let statsSection = `## 📊 개선 통계\n\n`;
    statsSection += `- **총 개선 횟수**: ${stats.totalImprovements}회\n`;
    statsSection += `- **평균 예상 효과**: ${stats.averageImpact.toFixed(1)}%\n`;
    statsSection += `- **가장 많은 개선 유형**: ${this.getTypeLabel(stats.mostCommonType)}\n\n`;

    if (stats.improvementTrend.length > 0) {
      statsSection += `### 📈 월별 개선 추이\n\n`;
      stats.improvementTrend.forEach(trend => {
        statsSection += `- **${trend.month}**: ${trend.count}회 (총 효과: ${trend.impact}%)\n`;
      });
    }

    return statsSection;
  }

  private generateHistoryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}
