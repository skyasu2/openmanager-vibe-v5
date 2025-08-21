#!/usr/bin/env node
/**
 * 📝 AI Review Reporter v2.0
 * 
 * AI 검토 결과를 마크다운 보고서로 생성
 * Claude Code 베스트 프랙티스 적용
 * - 구조화된 JSON 출력
 * - 시각적 차트 및 통계
 * - PR 코멘트 자동 생성
 * 
 * @author Claude Code + Multi-AI 협업
 * @created 2025-08-20
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// === 설정 상수 ===
const CONFIG = {
  PROJECT_ROOT: '/mnt/d/cursor/openmanager-vibe-v5',
  REPORTS_DIR: 'reports/ai-reviews',
  
  // 보고서 템플릿
  TEMPLATES: {
    REVIEW_REPORT: 'review-report.md',
    PR_COMMENT: 'pr-comment.md',
    DAILY_SUMMARY: 'daily-summary.md'
  },
  
  // 이모지 매핑
  EMOJIS: {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    security: '🔒',
    performance: '⚡',
    quality: '💎',
    test: '🧪',
    docs: '📚',
    ai: '🤖',
    clock: '⏱️',
    chart: '📊',
    folder: '📁',
    code: '💻'
  },
  
  // 점수별 등급
  GRADES: {
    10: { label: 'S', color: '#00ff00', emoji: '🏆' },
    9: { label: 'A+', color: '#22ff22', emoji: '🌟' },
    8: { label: 'A', color: '#44ff44', emoji: '⭐' },
    7: { label: 'B+', color: '#ffff00', emoji: '👍' },
    6: { label: 'B', color: '#ffcc00', emoji: '👌' },
    5: { label: 'C', color: '#ff9900', emoji: '🤔' },
    4: { label: 'D', color: '#ff6600', emoji: '😟' },
    3: { label: 'E', color: '#ff3300', emoji: '😰' },
    2: { label: 'F', color: '#ff0000', emoji: '🚨' },
    1: { label: 'F-', color: '#cc0000', emoji: '💀' }
  }
};

export class AIReviewReporter {
  constructor() {
    this.reportsDir = path.join(CONFIG.PROJECT_ROOT, CONFIG.REPORTS_DIR);
    this.statistics = {
      totalReviews: 0,
      avgScore: 0,
      aiUsage: {},
      commonIssues: new Map()
    };
    
    this.init();
  }

  async init() {
    // 보고서 디렉토리 생성
    await fs.mkdir(this.reportsDir, { recursive: true });
    
    // 통계 로드
    await this.loadStatistics();
  }

  // === 통계 로드 ===
  async loadStatistics() {
    const statsPath = path.join(this.reportsDir, 'statistics.json');
    try {
      const data = await fs.readFile(statsPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Map을 제외한 나머지 속성 복사
      this.statistics.totalReviews = parsed.totalReviews || 0;
      this.statistics.avgScore = parsed.avgScore || 0;
      this.statistics.aiUsage = parsed.aiUsage || {};
      
      // commonIssues를 Map으로 유지
      if (parsed.commonIssues) {
        this.statistics.commonIssues = new Map(Object.entries(parsed.commonIssues));
      }
    } catch {
      // 통계 파일 없음 - 기본값 사용
    }
  }

  // === 통계 저장 ===
  async saveStatistics() {
    const statsPath = path.join(this.reportsDir, 'statistics.json');
    
    // Map을 객체로 변환하여 저장
    const statsToSave = {
      ...this.statistics,
      commonIssues: Object.fromEntries(this.statistics.commonIssues)
    };
    
    await fs.writeFile(
      statsPath,
      JSON.stringify(statsToSave, null, 2)
    );
  }

  // === 검토 보고서 생성 ===
  async generateReport(data) {
    const {
      reviewId,
      analysis,
      reviews,
      integration,
      decision,
      duration
    } = data;
    
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const time = timestamp.split('T')[1].split('.')[0];
    
    // 보고서 파일명
    const filename = `${date}_${time.replace(/:/g, '-')}_${reviewId}.md`;
    const filepath = path.join(this.reportsDir, filename);
    
    // 보고서 내용 생성
    const content = this.createReportContent({
      reviewId,
      timestamp,
      analysis,
      reviews,
      integration,
      decision,
      duration
    });
    
    // 파일 저장
    await fs.writeFile(filepath, content);
    
    // 통계 업데이트
    this.updateStatistics(reviews, integration);
    await this.saveStatistics();
    
    console.log(`📄 보고서 생성: ${filepath}`);
    return filepath;
  }

  // === 보고서 내용 생성 ===
  createReportContent(data) {
    const {
      reviewId,
      timestamp,
      analysis,
      reviews,
      integration,
      decision,
      duration
    } = data;
    
    const grade = this.getGrade(parseFloat(integration.avgScore));
    const durationSec = (duration / 1000).toFixed(1);
    
    let content = `# ${CONFIG.EMOJIS.ai} AI 협력 검토 보고서

## ${CONFIG.EMOJIS.chart} 요약

- **검토 ID**: \`${reviewId}\`
- **일시**: ${timestamp}
- **소요시간**: ${CONFIG.EMOJIS.clock} ${durationSec}초
- **평균 점수**: ${grade.emoji} **${integration.avgScore}/10** (${grade.label}등급)
- **결정**: ${this.getDecisionEmoji(decision.type)} **${this.getDecisionLabel(decision.type)}**
- **합의 수준**: ${this.getConsensusEmoji(integration.consensusLevel)} ${integration.consensusLevel}

## ${CONFIG.EMOJIS.folder} 작업 분석

| 항목 | 값 | 설명 |
|------|-----|------|
| **크기** | ${analysis.size} | ${analysis.totalLines}줄 변경 |
| **중요도** | ${analysis.importance} | ${this.getImportanceDescription(analysis.importance)} |
| **복잡도** | ${analysis.complexity} | Cyclomatic Complexity 기준 |
| **파일 수** | ${analysis.files} | ${analysis.criticalFiles.length}개 중요 파일 포함 |
| **검토 레벨** | Level ${analysis.reviewLevel} | ${analysis.recommendedAI.length}개 AI 활용 |

`;

    // 파일 목록
    if (analysis.modifiedFiles && analysis.modifiedFiles.length > 0) {
      content += `### 📝 변경된 파일

| 파일 | 줄 수 | 중요도 | 테스트 |
|------|-------|--------|--------|
`;
      for (const file of analysis.modifiedFiles) {
        content += `| \`${file.path}\` | ${file.lines} | ${file.importance.toFixed(1)} | ${file.hasTests ? '✅' : '❌'} |\n`;
      }
      content += '\n';
    }

    // AI 검토 결과
    content += `## ${CONFIG.EMOJIS.ai} AI 검토 결과

`;
    
    for (const review of reviews) {
      const reviewGrade = this.getGrade(review.score);
      content += `### ${CONFIG.EMOJIS.ai} ${review.ai.toUpperCase()} (${reviewGrade.emoji} ${review.score}/10)

#### 장점
`;
      for (const strength of review.strengths || []) {
        content += `- ✅ ${strength}\n`;
      }
      
      content += `
#### 개선사항
`;
      for (const improvement of review.improvements || []) {
        content += `- 📝 ${improvement}\n`;
      }
      
      if (review.security && review.security.length > 0) {
        content += `
#### ${CONFIG.EMOJIS.security} 보안 이슈
`;
        for (const issue of review.security) {
          content += `- 🚨 ${issue}\n`;
        }
      }
      
      content += '\n---\n\n';
    }

    // 통합 결과
    content += `## ${CONFIG.EMOJIS.chart} 통합 분석

### 점수 분포

\`\`\`
`;
    content += this.createScoreChart(reviews);
    content += `
\`\`\`

### 주요 개선사항 (우선순위)

`;
    
    for (let i = 0; i < Math.min(10, integration.improvements.length); i++) {
      const priority = i < 3 ? '🔴' : i < 6 ? '🟡' : '🟢';
      content += `${i + 1}. ${priority} ${integration.improvements[i]}\n`;
    }

    // 의사결정
    content += `
## 🎯 최종 결정

### ${this.getDecisionEmoji(decision.type)} ${this.getDecisionLabel(decision.type)}

- **이유**: ${decision.actions[0] || integration.reason}
- **적용 여부**: ${decision.apply ? '✅ 자동 적용' : '📝 수동 검토 필요'}
`;

    if (decision.actions.length > 1) {
      content += `
### 조치사항
`;
      for (const action of decision.actions.slice(1)) {
        content += `- ${action}\n`;
      }
    }

    // 통계
    content += `
## 📊 프로젝트 통계

- **총 검토 횟수**: ${this.statistics.totalReviews + 1}회
- **평균 점수**: ${this.statistics.avgScore.toFixed(1)}/10
- **AI 사용 현황**: 
  - Gemini: ${this.statistics.aiUsage.gemini || 0}회
  - Codex: ${this.statistics.aiUsage.codex || 0}회
  - Qwen: ${this.statistics.aiUsage.qwen || 0}회

---

*Generated by AI Review Reporter v2.0 with Claude Code*
`;

    return content;
  }

  // === PR 코멘트 생성 ===
  async generatePRComment(result) {
    const { integration, decision } = result;
    const grade = this.getGrade(parseFloat(integration.avgScore));
    
    let comment = `## ${CONFIG.EMOJIS.ai} AI 검토 결과

${grade.emoji} **평균 점수: ${integration.avgScore}/10** (${grade.label}등급)

### 📊 검토 요약
- **검토 AI**: ${integration.reviews.length}개 (`;
    
    const aiNames = integration.reviews.map(r => r.ai).join(', ');
    comment += `${aiNames})
- **합의 수준**: ${integration.consensusLevel}
- **결정**: ${this.getDecisionEmoji(decision.type)} ${this.getDecisionLabel(decision.type)}

`;

    // 보안 이슈
    if (integration.security && integration.security.length > 0) {
      comment += `### 🚨 보안 이슈 발견
`;
      for (const issue of integration.security) {
        comment += `- ${issue}\n`;
      }
      comment += '\n';
    }

    // 주요 개선사항
    if (integration.improvements && integration.improvements.length > 0) {
      comment += `### 📝 주요 개선사항
`;
      for (let i = 0; i < Math.min(5, integration.improvements.length); i++) {
        comment += `${i + 1}. ${integration.improvements[i]}\n`;
      }
      comment += '\n';
    }

    // 결론
    comment += `### 🎯 권장사항
`;
    
    if (decision.type === 'accept') {
      comment += `✅ **머지 가능** - 코드 품질이 우수합니다.`;
    } else if (decision.type === 'partial') {
      comment += `⚠️ **개선 후 머지** - 위 개선사항을 적용한 후 머지하시기 바랍니다.`;
    } else if (decision.type === 'reject') {
      comment += `❌ **재작업 필요** - 중요한 이슈가 발견되어 수정이 필요합니다.`;
    } else {
      comment += `📝 **수동 검토 필요** - AI 간 의견 차이가 있어 인간 검토가 필요합니다.`;
    }
    
    comment += `

---
*AI Review by Claude Code + Gemini + Codex + Qwen*`;
    
    return comment;
  }

  // === 일일 요약 보고서 ===
  async generateDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    const summaryPath = path.join(this.reportsDir, `daily_${today}.md`);
    
    // 오늘의 검토 파일들 찾기
    const files = await fs.readdir(this.reportsDir);
    const todayReviews = files.filter(f => 
      f.startsWith(today) && f.endsWith('.md') && !f.includes('daily')
    );
    
    let content = `# 📊 일일 AI 검토 요약

**날짜**: ${today}
**총 검토**: ${todayReviews.length}건

## 📈 통계

- **평균 점수**: ${this.statistics.avgScore.toFixed(1)}/10
- **최다 사용 AI**: ${this.getMostUsedAI()}
- **주요 이슈 유형**: ${this.getTopIssues()}

## 🔍 검토 목록

| 시간 | 검토 ID | 파일 수 | 점수 | 결정 |
|------|---------|---------|------|------|
`;
    
    for (const file of todayReviews) {
      // 파일에서 정보 추출 (간단한 파싱)
      const time = file.split('_')[1].replace(/-/g, ':');
      const reviewId = file.split('_')[2].replace('.md', '');
      content += `| ${time} | ${reviewId} | - | - | - |\n`;
    }
    
    content += `

## 💡 인사이트

`;
    
    // 통계 기반 인사이트
    const insights = this.generateInsights();
    for (const insight of insights) {
      content += `- ${insight}\n`;
    }
    
    content += `

---
*Daily Summary by AI Review Reporter v2.0*`;
    
    await fs.writeFile(summaryPath, content);
    return summaryPath;
  }

  // === 점수 차트 생성 ===
  createScoreChart(reviews) {
    const maxScore = 10;
    const barLength = 20;
    let chart = '';
    
    for (const review of reviews) {
      const score = review.score;
      const filled = Math.round((score / maxScore) * barLength);
      const empty = barLength - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      
      chart += `${review.ai.padEnd(8)} [${bar}] ${score.toFixed(1)}/10\n`;
    }
    
    return chart;
  }

  // === 등급 가져오기 ===
  getGrade(score) {
    const floorScore = Math.floor(score);
    return CONFIG.GRADES[floorScore] || CONFIG.GRADES[1];
  }

  // === 결정 이모지 ===
  getDecisionEmoji(type) {
    const emojis = {
      accept: '✅',
      partial: '⚠️',
      reject: '❌',
      manual: '📝'
    };
    return emojis[type] || '❓';
  }

  // === 결정 레이블 ===
  getDecisionLabel(type) {
    const labels = {
      accept: '수용',
      partial: '부분 수용',
      reject: '거절',
      manual: '수동 검토'
    };
    return labels[type] || '알 수 없음';
  }

  // === 합의 수준 이모지 ===
  getConsensusEmoji(level) {
    const emojis = {
      high: '🟢',
      medium: '🟡',
      low: '🟠',
      very_low: '🔴',
      'N/A': '⚫'
    };
    return emojis[level] || '⚪';
  }

  // === 중요도 설명 ===
  getImportanceDescription(importance) {
    const descriptions = {
      critical: '핵심 시스템 파일',
      high: '중요 비즈니스 로직',
      normal: '일반 기능 코드',
      low: '보조 기능 또는 문서'
    };
    return descriptions[importance] || importance;
  }

  // === 통계 업데이트 ===
  updateStatistics(reviews, integration) {
    this.statistics.totalReviews++;
    
    // 평균 점수 업데이트
    const currentTotal = this.statistics.avgScore * (this.statistics.totalReviews - 1);
    const newAvg = (currentTotal + parseFloat(integration.avgScore)) / this.statistics.totalReviews;
    this.statistics.avgScore = parseFloat(newAvg.toFixed(1));
    
    // AI 사용 횟수 업데이트
    for (const review of reviews) {
      this.statistics.aiUsage[review.ai] = (this.statistics.aiUsage[review.ai] || 0) + 1;
    }
    
    // 주요 이슈 업데이트
    for (const improvement of integration.improvements || []) {
      // 간단한 키워드 추출 - improvement가 문자열이 아닐 수 있음
      const improvementStr = String(improvement);
      const keywords = improvementStr.toLowerCase().split(' ').filter(w => w.length > 4);
      for (const keyword of keywords.slice(0, 3)) {
        this.statistics.commonIssues.set(
          keyword,
          (this.statistics.commonIssues.get(keyword) || 0) + 1
        );
      }
    }
  }

  // === 가장 많이 사용된 AI ===
  getMostUsedAI() {
    let maxUsage = 0;
    let mostUsed = 'N/A';
    
    for (const [ai, count] of Object.entries(this.statistics.aiUsage)) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsed = ai;
      }
    }
    
    return `${mostUsed} (${maxUsage}회)`;
  }

  // === 주요 이슈 유형 ===
  getTopIssues() {
    const sorted = Array.from(this.statistics.commonIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (sorted.length === 0) return 'N/A';
    
    return sorted.map(([keyword, count]) => 
      `${keyword}(${count})`
    ).join(', ');
  }

  // === 인사이트 생성 ===
  generateInsights() {
    const insights = [];
    
    // 점수 추세
    if (this.statistics.avgScore >= 8) {
      insights.push('💎 코드 품질이 매우 우수한 수준을 유지하고 있습니다');
    } else if (this.statistics.avgScore >= 7) {
      insights.push('👍 코드 품질이 양호한 수준입니다');
    } else if (this.statistics.avgScore >= 6) {
      insights.push('📈 코드 품질 개선이 필요한 부분이 있습니다');
    } else {
      insights.push('⚠️ 코드 품질에 주의가 필요합니다');
    }
    
    // AI 활용도
    const totalAIUsage = Object.values(this.statistics.aiUsage)
      .reduce((sum, count) => sum + count, 0);
    
    if (totalAIUsage > 100) {
      insights.push('🤖 AI 검토 시스템이 매우 활발히 사용되고 있습니다');
    } else if (totalAIUsage > 50) {
      insights.push('📊 AI 검토가 정기적으로 수행되고 있습니다');
    } else {
      insights.push('💡 AI 검토를 더 자주 활용하면 품질 향상에 도움이 됩니다');
    }
    
    // 주요 이슈
    if (this.statistics.commonIssues.size > 0) {
      const topIssue = Array.from(this.statistics.commonIssues.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topIssue) {
        insights.push(`🔍 '${topIssue[0]}' 관련 이슈가 자주 발견됩니다 (${topIssue[1]}회)`);
      }
    }
    
    return insights;
  }

  // === 보고서 목록 가져오기 ===
  async listReports(options = {}) {
    const { 
      startDate = null, 
      endDate = null, 
      limit = 10 
    } = options;
    
    const files = await fs.readdir(this.reportsDir);
    let reports = files.filter(f => f.endsWith('.md') && !f.includes('daily'));
    
    // 날짜 필터링
    if (startDate) {
      reports = reports.filter(f => f >= startDate);
    }
    if (endDate) {
      reports = reports.filter(f => f <= endDate);
    }
    
    // 정렬 및 제한
    reports.sort((a, b) => b.localeCompare(a));
    reports = reports.slice(0, limit);
    
    return reports.map(filename => ({
      filename,
      path: path.join(this.reportsDir, filename),
      date: filename.split('_')[0],
      time: filename.split('_')[1].replace(/-/g, ':'),
      reviewId: filename.split('_')[2].replace('.md', '')
    }));
  }
}

// === CLI 인터페이스 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new AIReviewReporter();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📝 AI Review Reporter v2.0

사용법:
  node ai-review-reporter.mjs <command> [options]

명령어:
  list              보고서 목록 보기
  daily             일일 요약 생성
  stats             통계 보기

예시:
  node ai-review-reporter.mjs list --limit 20
  node ai-review-reporter.mjs daily
  node ai-review-reporter.mjs stats
    `);
    process.exit(0);
  }
  
  const command = args[0];
  
  (async () => {
    try {
      switch (command) {
        case 'list': {
          const limit = args.includes('--limit') ? 
            parseInt(args[args.indexOf('--limit') + 1]) : 10;
          
          const reports = await reporter.listReports({ limit });
          console.log('\n📄 최근 보고서:');
          for (const report of reports) {
            console.log(`  ${report.date} ${report.time} - ${report.reviewId}`);
          }
          break;
        }
        
        case 'daily': {
          const summaryPath = await reporter.generateDailySummary();
          console.log(`✅ 일일 요약 생성: ${summaryPath}`);
          break;
        }
        
        case 'stats': {
          console.log('\n📊 통계:');
          console.log(JSON.stringify(reporter.statistics, null, 2));
          break;
        }
        
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

export default AIReviewReporter;