#!/usr/bin/env node

/**
 * AI 교차검증 자동 로깅 시스템
 * 각 검증 세션마다 AI별 점수와 성과를 기록
 */

const fs = require('fs');
const path = require('path');

class VerificationLogger {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'reports', 'verification-history');
    this.currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.todayDir = path.join(this.baseDir, this.currentDate);
    
    // 오늘 폴더 생성
    this.ensureDirectoryExists(this.todayDir);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 새로운 검증 세션 시작
   * @param {Object} sessionData - 검증 세션 정보
   */
  startSession(sessionData) {
    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      timestamp: new Date().toISOString(),
      trigger: sessionData.trigger || 'manual',
      level: sessionData.level || 1,
      target: sessionData.target || 'unknown',
      description: sessionData.description || '',
      status: 'in_progress',
      aiResults: [],
      startTime: Date.now()
    };

    this.saveSession(session);
    return sessionId;
  }

  /**
   * AI 개별 결과 기록
   * @param {string} sessionId - 세션 ID
   * @param {Object} aiResult - AI 결과 데이터
   */
  logAIResult(sessionId, aiResult) {
    const session = this.loadSession(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return;
    }

    const aiData = {
      ai: aiResult.ai,
      role: aiResult.role || 'unknown',
      score: parseFloat(aiResult.score) || 0,
      weight: parseFloat(aiResult.weight) || 1.0,
      weightedScore: (parseFloat(aiResult.score) || 0) * (parseFloat(aiResult.weight) || 1.0),
      duration: aiResult.duration || 0,
      insights: aiResult.insights || [],
      recommendations: aiResult.recommendations || [],
      timestamp: new Date().toISOString(),
      status: aiResult.status || 'completed'
    };

    session.aiResults.push(aiData);
    this.saveSession(session);
  }

  /**
   * 검증 세션 완료
   * @param {string} sessionId - 세션 ID
   * @param {Object} finalData - 최종 결과 데이터
   */
  completeSession(sessionId, finalData) {
    const session = this.loadSession(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return;
    }

    // 최종 점수 계산
    const totalWeight = session.aiResults.reduce((sum, ai) => sum + ai.weight, 0);
    const weightedSum = session.aiResults.reduce((sum, ai) => sum + ai.weightedScore, 0);
    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;

    session.status = 'completed';
    session.finalScore = parseFloat(finalScore);
    session.consensus = finalData.consensus || this.determinateConsensus(finalScore);
    session.actionsTaken = finalData.actionsTaken || [];
    session.totalDuration = Date.now() - session.startTime;
    session.endTime = new Date().toISOString();

    this.saveSession(session);
    this.generateMarkdownReport(session);
  }

  /**
   * 점수 기반 합의 결정
   */
  determinateConsensus(score) {
    if (score >= 9.0) return '완전승인';
    if (score >= 8.0) return '조건부승인';
    if (score >= 7.0) return '부분승인';
    if (score >= 6.0) return '조건부거절';
    return '거절';
  }

  /**
   * 세션 ID 생성
   */
  generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  /**
   * 세션 데이터 저장
   */
  saveSession(session) {
    const filePath = path.join(this.todayDir, `${session.sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  }

  /**
   * 세션 데이터 로드
   */
  loadSession(sessionId) {
    const filePath = path.join(this.todayDir, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  /**
   * Markdown 리포트 생성
   */
  generateMarkdownReport(session) {
    const report = `# AI 교차검증 리포트

## 📊 검증 개요
- **세션 ID**: ${session.sessionId}
- **시작 시간**: ${session.timestamp}
- **검증 레벨**: Level ${session.level}
- **대상**: ${session.target}
- **설명**: ${session.description}
- **소요 시간**: ${Math.round(session.totalDuration / 1000)}초

## 🤖 AI별 성과

${session.aiResults.map(ai => `### ${ai.ai.toUpperCase()} (${ai.role})
- **점수**: ${ai.score}/10 (가중치: ${ai.weight})
- **가중 점수**: ${ai.weightedScore.toFixed(2)}
- **소요 시간**: ${ai.duration}초
- **핵심 발견**: ${ai.insights.join(', ')}
- **권장사항**: ${ai.recommendations.join(', ')}
`).join('\n')}

## 🎯 최종 결과
- **종합 점수**: ${session.finalScore}/10
- **합의 결과**: ${session.consensus}
- **실행된 조치**: ${session.actionsTaken.join(', ')}

---
*Generated at ${new Date().toISOString()}*
`;

    const reportPath = path.join(this.todayDir, `${session.sessionId}_report.md`);
    fs.writeFileSync(reportPath, report);
  }

  /**
   * 일별 통계 생성
   */
  generateDailyStats() {
    const files = fs.readdirSync(this.todayDir).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => {
      const data = fs.readFileSync(path.join(this.todayDir, f), 'utf8');
      return JSON.parse(data);
    }).filter(s => s.status === 'completed');

    if (sessions.length === 0) return;

    const stats = {
      date: this.currentDate,
      totalSessions: sessions.length,
      averageScore: (sessions.reduce((sum, s) => sum + s.finalScore, 0) / sessions.length).toFixed(2),
      consensusBreakdown: this.getConsensusBreakdown(sessions),
      aiPerformance: this.getAIPerformance(sessions),
      averageDuration: Math.round(sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length / 1000)
    };

    const statsPath = path.join(this.todayDir, 'daily_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  }

  getConsensusBreakdown(sessions) {
    const breakdown = {};
    sessions.forEach(s => {
      breakdown[s.consensus] = (breakdown[s.consensus] || 0) + 1;
    });
    return breakdown;
  }

  getAIPerformance(sessions) {
    const aiStats = {};
    sessions.forEach(session => {
      session.aiResults.forEach(ai => {
        if (!aiStats[ai.ai]) {
          aiStats[ai.ai] = { scores: [], durations: [], count: 0 };
        }
        aiStats[ai.ai].scores.push(ai.score);
        aiStats[ai.ai].durations.push(ai.duration);
        aiStats[ai.ai].count++;
      });
    });

    Object.keys(aiStats).forEach(ai => {
      const stats = aiStats[ai];
      stats.averageScore = (stats.scores.reduce((a, b) => a + b, 0) / stats.count).toFixed(2);
      stats.averageDuration = Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.count);
    });

    return aiStats;
  }
}

// CLI 인터페이스
if (require.main === module) {
  const logger = new VerificationLogger();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      const sessionData = {
        trigger: process.argv[3] || 'manual',
        level: parseInt(process.argv[4]) || 1,
        target: process.argv[5] || 'unknown',
        description: process.argv[6] || ''
      };
      const sessionId = logger.startSession(sessionData);
      console.log(`Started session: ${sessionId}`);
      break;
      
    case 'log':
      const logSessionId = process.argv[3];
      const aiResult = JSON.parse(process.argv[4]);
      logger.logAIResult(logSessionId, aiResult);
      console.log(`Logged AI result for session: ${logSessionId}`);
      break;
      
    case 'complete':
      const completeSessionId = process.argv[3];
      const finalData = JSON.parse(process.argv[4] || '{}');
      logger.completeSession(completeSessionId, finalData);
      console.log(`Completed session: ${completeSessionId}`);
      break;
      
    case 'stats':
      logger.generateDailyStats();
      console.log(`Generated daily stats for ${logger.currentDate}`);
      break;
      
    default:
      console.log(`Usage: 
  node verification-logger.js start [trigger] [level] [target] [description]
  node verification-logger.js log [sessionId] [aiResultJSON]
  node verification-logger.js complete [sessionId] [finalDataJSON]
  node verification-logger.js stats`);
  }
}

module.exports = VerificationLogger;