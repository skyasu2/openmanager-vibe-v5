#!/usr/bin/env node

/**
 * AI 교차검증 히스토리 로깅 시스템 테스트
 */

const VerificationLogger = require('./verification-logger');
const HistoryAnalyzer = require('./history-analyzer');

async function testLoggingSystem() {
  console.log('🧪 AI 교차검증 히스토리 로깅 시스템 테스트 시작\n');

  const logger = new VerificationLogger();
  
  // 테스트 세션 1: Button 컴포넌트 검토
  console.log('📝 테스트 세션 1: Button 컴포넌트 접근성 검토');
  const session1 = logger.startSession({
    trigger: 'verification-specialist',
    level: 3,
    target: 'src/components/Button.tsx',
    description: 'Button 컴포넌트 접근성 및 성능 검토'
  });
  console.log(`   세션 시작: ${session1}`);

  // AI 결과들 추가
  logger.logAIResult(session1, {
    ai: 'claude',
    role: '조정자',
    score: 8.5,
    weight: 1.0,
    duration: 45,
    insights: ['접근성 라벨 누락', '키보드 네비게이션 부족'],
    recommendations: ['aria-label 추가', 'tabIndex 설정'],
    status: 'completed'
  });

  logger.logAIResult(session1, {
    ai: 'codex',
    role: '실무검증',
    score: 9.0,
    weight: 0.99,
    duration: 67,
    insights: ['TypeScript 타입 안전성 우수', 'React 18 호환성 확인'],
    recommendations: ['PropTypes 추가 고려', '성능 최적화'],
    status: 'completed'
  });

  logger.logAIResult(session1, {
    ai: 'gemini',
    role: '구조분석',
    score: 8.7,
    weight: 0.98,
    duration: 89,
    insights: ['컴포넌트 재사용성 우수', '스타일링 일관성 좋음'],
    recommendations: ['Storybook 문서 추가', '테스트 케이스 확장'],
    status: 'completed'
  });

  logger.logAIResult(session1, {
    ai: 'qwen',
    role: '성능최적화',
    score: 8.3,
    weight: 0.97,
    duration: 125,
    insights: ['렌더링 횟수 최적화 가능', '메모리 효율성 양호'],
    recommendations: ['React.memo 적용', 'useCallback 최적화'],
    status: 'completed'
  });

  // 세션 완료
  logger.completeSession(session1, {
    consensus: '조건부승인',
    actionsTaken: ['aria-label 추가', '접근성 테스트 작성', 'React.memo 적용']
  });
  console.log(`   세션 완료: ${session1}\n`);

  // 테스트 세션 2: API 라우트 보안 검토
  console.log('📝 테스트 세션 2: API 라우트 보안 검토');
  const session2 = logger.startSession({
    trigger: 'security-auditor',
    level: 3,
    target: 'src/app/api/auth/route.ts',
    description: '인증 API 보안성 및 성능 검토'
  });
  
  logger.logAIResult(session2, {
    ai: 'claude',
    role: '조정자',
    score: 9.2,
    weight: 1.0,
    duration: 55,
    insights: ['JWT 토큰 처리 안전', 'CORS 설정 적절'],
    recommendations: ['레이트 리미팅 추가', '로그 강화'],
    status: 'completed'
  });

  logger.logAIResult(session2, {
    ai: 'codex',
    role: '보안검증',
    score: 9.5,
    weight: 0.99,
    duration: 78,
    insights: ['입력 검증 완벽', 'SQL 인젝션 방어 우수'],
    recommendations: ['2FA 지원 고려', '세션 만료 정책 검토'],
    status: 'completed'
  });

  logger.completeSession(session2, {
    consensus: '완전승인',
    actionsTaken: ['레이트 리미팅 추가', '보안 로그 강화']
  });
  console.log(`   세션 완료: ${session2}\n`);

  // 통계 생성
  console.log('📊 일별 통계 생성');
  logger.generateDailyStats();
  console.log('   통계 생성 완료\n');

  // 히스토리 분석
  console.log('🔍 히스토리 분석 시작');
  const analyzer = new HistoryAnalyzer();
  const analysis = analyzer.analyzeAll();
  
  console.log('📈 분석 결과:');
  console.log(`   총 세션: ${analysis.overview.totalSessions}개`);
  console.log(`   평균 점수: ${analysis.overview.averageScore}/10`);
  console.log(`   평균 소요시간: ${analysis.overview.averageDuration}초`);
  
  console.log('\n🤖 AI별 성능:');
  Object.entries(analysis.aiPerformance).forEach(([ai, stats]) => {
    console.log(`   ${ai.toUpperCase()}: ${stats.averageScore}/10 (${stats.count}회)`);
  });

  console.log('\n💡 권장사항:');
  analysis.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. [${rec.priority}] ${rec.message}`);
  });

  // 리포트 저장
  console.log('\n📄 분석 리포트 저장');
  const reportPaths = analyzer.saveAnalysis(analysis);
  console.log(`   JSON 리포트: ${reportPaths.jsonPath}`);
  console.log(`   Markdown 리포트: ${reportPaths.mdPath}`);

  console.log('\n✅ 테스트 완료! 히스토리 로깅 시스템이 정상 작동합니다.');
}

// 테스트 실행
if (require.main === module) {
  testLoggingSystem().catch(console.error);
}

module.exports = testLoggingSystem;