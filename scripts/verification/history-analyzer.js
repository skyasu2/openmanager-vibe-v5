#!/usr/bin/env node

/**
 * AI 교차검증 히스토리 분석 도구
 * 누적된 검증 데이터를 분석하여 트렌드와 성과를 시각화
 */

const fs = require('fs');
const path = require('path');

class HistoryAnalyzer {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'docs', 'verification-history');
  }

  /**
   * 전체 히스토리 분석
   */
  analyzeAll() {
    const dates = this.getAvailableDates();
    const allSessions = this.loadAllSessions(dates);
    
    return {
      overview: this.generateOverview(allSessions),
      aiPerformance: this.analyzeAIPerformance(allSessions),
      trends: this.analyzeTrends(allSessions, dates),
      recommendations: this.generateRecommendations(allSessions)
    };
  }

  /**
   * 사용 가능한 날짜 목록 가져오기
   */
  getAvailableDates() {
    if (!fs.existsSync(this.baseDir)) {
      return [];
    }
    
    return fs.readdirSync(this.baseDir)
      .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
      .sort();
  }

  /**
   * 모든 세션 데이터 로드
   */
  loadAllSessions(dates) {
    const sessions = [];
    
    dates.forEach(date => {
      const dateDir = path.join(this.baseDir, date);
      const files = fs.readdirSync(dateDir)
        .filter(f => f.endsWith('.json') && !f.includes('daily_stats'));
      
      files.forEach(file => {
        try {
          const filePath = path.join(dateDir, file);
          const session = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (session.status === 'completed') {
            sessions.push(session);
          }
        } catch (error) {
          console.warn(`Failed to parse ${file}: ${error.message}`);
        }
      });
    });
    
    return sessions;
  }

  /**
   * 전체 개요 생성
   */
  generateOverview(sessions) {
    if (sessions.length === 0) {
      return { totalSessions: 0, message: 'No completed sessions found' };
    }

    const totalSessions = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + s.finalScore, 0) / totalSessions;
    const averageDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0) / totalSessions / 1000;

    const consensusBreakdown = {};
    sessions.forEach(s => {
      consensusBreakdown[s.consensus] = (consensusBreakdown[s.consensus] || 0) + 1;
    });

    const levelBreakdown = {};
    sessions.forEach(s => {
      levelBreakdown[`Level ${s.level}`] = (levelBreakdown[`Level ${s.level}`] || 0) + 1;
    });

    return {
      totalSessions,
      averageScore: averageScore.toFixed(2),
      averageDuration: Math.round(averageDuration),
      consensusBreakdown,
      levelBreakdown,
      period: {
        start: sessions[0]?.timestamp.split('T')[0],
        end: sessions[sessions.length - 1]?.timestamp.split('T')[0]
      }
    };
  }

  /**
   * AI별 성능 분석
   */
  analyzeAIPerformance(sessions) {
    const aiStats = {};
    
    sessions.forEach(session => {
      session.aiResults.forEach(ai => {
        if (!aiStats[ai.ai]) {
          aiStats[ai.ai] = {
            scores: [],
            durations: [],
            insights: [],
            recommendations: [],
            count: 0,
            roles: new Set()
          };
        }
        
        const stats = aiStats[ai.ai];
        stats.scores.push(ai.score);
        stats.durations.push(ai.duration);
        stats.insights.push(...ai.insights);
        stats.recommendations.push(...ai.recommendations);
        stats.count++;
        stats.roles.add(ai.role);
      });
    });

    // 통계 계산
    Object.keys(aiStats).forEach(ai => {
      const stats = aiStats[ai];
      stats.averageScore = (stats.scores.reduce((a, b) => a + b, 0) / stats.count).toFixed(2);
      stats.averageDuration = Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.count);
      stats.bestScore = Math.max(...stats.scores);
      stats.worstScore = Math.min(...stats.scores);
      stats.consistency = this.calculateConsistency(stats.scores);
      stats.roles = Array.from(stats.roles);
      
      // 가장 빈번한 인사이트/권장사항
      stats.topInsights = this.getTopFrequent(stats.insights, 3);
      stats.topRecommendations = this.getTopFrequent(stats.recommendations, 3);
    });

    return aiStats;
  }

  /**
   * 트렌드 분석
   */
  analyzeTrends(sessions, dates) {
    const trends = {
      scoreOverTime: {},
      sessionsByDate: {},
      consensusOverTime: {},
      aiUsageOverTime: {}
    };

    // 날짜별 데이터 집계
    sessions.forEach(session => {
      const date = session.timestamp.split('T')[0];
      
      // 점수 트렌드
      if (!trends.scoreOverTime[date]) {
        trends.scoreOverTime[date] = [];
      }
      trends.scoreOverTime[date].push(session.finalScore);
      
      // 세션 수 트렌드
      trends.sessionsByDate[date] = (trends.sessionsByDate[date] || 0) + 1;
      
      // 합의 결과 트렌드
      if (!trends.consensusOverTime[date]) {
        trends.consensusOverTime[date] = {};
      }
      trends.consensusOverTime[date][session.consensus] = 
        (trends.consensusOverTime[date][session.consensus] || 0) + 1;
      
      // AI 사용 트렌드
      if (!trends.aiUsageOverTime[date]) {
        trends.aiUsageOverTime[date] = {};
      }
      session.aiResults.forEach(ai => {
        trends.aiUsageOverTime[date][ai.ai] = 
          (trends.aiUsageOverTime[date][ai.ai] || 0) + 1;
      });
    });

    // 평균 점수 계산
    Object.keys(trends.scoreOverTime).forEach(date => {
      const scores = trends.scoreOverTime[date];
      trends.scoreOverTime[date] = {
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
        min: Math.min(...scores),
        max: Math.max(...scores),
        count: scores.length
      };
    });

    return trends;
  }

  /**
   * 개선 권장사항 생성
   */
  generateRecommendations(sessions) {
    const recommendations = [];
    const aiPerf = this.analyzeAIPerformance(sessions);
    const overview = this.generateOverview(sessions);

    // 전체 점수가 낮은 경우
    if (parseFloat(overview.averageScore) < 8.0) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `전체 평균 점수(${overview.averageScore})가 낮습니다. 코드 품질 향상이 필요합니다.`,
        action: 'Level 3 검증을 더 자주 사용하고, AI 권장사항을 적극 반영하세요.'
      });
    }

    // AI별 성능 분석
    Object.entries(aiPerf).forEach(([ai, stats]) => {
      if (parseFloat(stats.averageScore) < 7.5) {
        recommendations.push({
          type: 'ai_performance',
          priority: 'medium',
          message: `${ai.toUpperCase()}의 평균 점수(${stats.averageScore})가 낮습니다.`,
          action: `${ai} 래퍼 설정을 검토하고 프롬프트를 최적화하세요.`
        });
      }
      
      if (stats.consistency < 0.7) {
        recommendations.push({
          type: 'consistency',
          priority: 'medium',
          message: `${ai.toUpperCase()}의 점수 일관성이 낮습니다.`,
          action: '래퍼 환경 설정과 timeout 값을 조정하세요.'
        });
      }
    });

    // 검증 빈도 분석
    if (overview.totalSessions < 10) {
      recommendations.push({
        type: 'usage',
        priority: 'low',
        message: '교차검증 사용 빈도가 낮습니다.',
        action: '중요한 코드 변경 시 적극적으로 교차검증을 활용하세요.'
      });
    }

    return recommendations;
  }

  /**
   * 일관성 점수 계산 (0-1, 1이 가장 일관성 있음)
   */
  calculateConsistency(scores) {
    if (scores.length < 2) return 1;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // 표준편차를 0-1 범위로 정규화 (10점 만점 기준)
    return Math.max(0, 1 - (stdDev / 5));
  }

  /**
   * 가장 빈번한 항목들 반환
   */
  getTopFrequent(items, limit = 3) {
    const frequency = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }

  /**
   * Markdown 리포트 생성
   */
  generateMarkdownReport(analysis) {
    const { overview, aiPerformance, trends, recommendations } = analysis;
    
    return `# 🔍 AI 교차검증 히스토리 분석 리포트

## 📊 전체 개요
- **총 검증 세션**: ${overview.totalSessions}개
- **평균 점수**: ${overview.averageScore}/10
- **평균 소요시간**: ${overview.averageDuration}초
- **분석 기간**: ${overview.period.start} ~ ${overview.period.end}

### 합의 결과 분포
${Object.entries(overview.consensusBreakdown)
  .map(([consensus, count]) => `- **${consensus}**: ${count}회 (${(count/overview.totalSessions*100).toFixed(1)}%)`)
  .join('\n')}

### 검증 레벨 분포
${Object.entries(overview.levelBreakdown)
  .map(([level, count]) => `- **${level}**: ${count}회 (${(count/overview.totalSessions*100).toFixed(1)}%)`)
  .join('\n')}

## 🤖 AI별 성능 분석

${Object.entries(aiPerformance)
  .sort(([,a], [,b]) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
  .map(([ai, stats]) => `### ${ai.toUpperCase()}
- **평균 점수**: ${stats.averageScore}/10 (최고: ${stats.bestScore}, 최저: ${stats.worstScore})
- **일관성**: ${(stats.consistency * 100).toFixed(1)}%
- **평균 응답시간**: ${stats.averageDuration}초
- **총 사용횟수**: ${stats.count}회
- **주요 역할**: ${stats.roles.join(', ')}
- **핵심 인사이트**: ${stats.topInsights.map(i => i.item).join(', ')}
- **주요 권장사항**: ${stats.topRecommendations.map(r => r.item).join(', ')}
`).join('\n')}

## 📈 트렌드 분석

### 날짜별 평균 점수
${Object.entries(trends.scoreOverTime)
  .slice(-7) // 최근 7일
  .map(([date, data]) => `- **${date}**: ${data.average}/10 (${data.count}회 검증)`)
  .join('\n')}

### 최근 AI 사용 패턴
${Object.entries(trends.aiUsageOverTime)
  .slice(-3) // 최근 3일
  .map(([date, usage]) => {
    const usageStr = Object.entries(usage)
      .map(([ai, count]) => `${ai}(${count})`)
      .join(', ');
    return `- **${date}**: ${usageStr}`;
  }).join('\n')}

## 💡 개선 권장사항

${recommendations.length > 0 ? 
  recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .map(rec => `### ${rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚠️' : '💡'} ${rec.type.toUpperCase()}
**문제**: ${rec.message}
**해결방안**: ${rec.action}
`)
    .join('\n') 
  : '현재 시스템이 최적화되어 있습니다. 계속 유지하세요! 🎉'
}

---
*리포트 생성일: ${new Date().toISOString()}*
`;
  }

  /**
   * JSON 리포트 저장
   */
  saveAnalysis(analysis) {
    const outputDir = path.join(this.baseDir, 'analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(outputDir, `analysis_${timestamp}.json`);
    const mdPath = path.join(outputDir, `analysis_${timestamp}.md`);

    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    fs.writeFileSync(mdPath, this.generateMarkdownReport(analysis));

    return { jsonPath, mdPath };
  }
}

// CLI 인터페이스
if (require.main === module) {
  const analyzer = new HistoryAnalyzer();
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      const analysis = analyzer.analyzeAll();
      console.log(JSON.stringify(analysis, null, 2));
      break;

    case 'report':
      const reportAnalysis = analyzer.analyzeAll();
      const paths = analyzer.saveAnalysis(reportAnalysis);
      console.log(`Reports saved to:\n- JSON: ${paths.jsonPath}\n- Markdown: ${paths.mdPath}`);
      break;

    case 'summary':
      const summaryAnalysis = analyzer.analyzeAll();
      console.log(analyzer.generateMarkdownReport(summaryAnalysis));
      break;

    default:
      console.log(`Usage:
  node history-analyzer.js analyze    # JSON 형태 분석 결과 출력
  node history-analyzer.js report     # 분석 결과를 파일로 저장
  node history-analyzer.js summary    # Markdown 요약 출력`);
  }
}

module.exports = HistoryAnalyzer;