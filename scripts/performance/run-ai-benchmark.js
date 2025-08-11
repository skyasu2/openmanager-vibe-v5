#!/usr/bin/env node
/**
 * 🚀 AI 성능 벤치마크 실행 스크립트
 * 
 * 사용법:
 * node scripts/performance/run-ai-benchmark.js [options]
 * 
 * 옵션:
 * --quick          : 빠른 벤치마크 (2개 엔진, 5개 쿼리)
 * --full           : 전체 벤치마크 (모든 엔진, 15개 쿼리)
 * --target         : 목표 달성 테스트만 실행
 * --monitor        : 실시간 모니터링
 * --iterations N   : 반복 횟수 설정 (기본값: 3)
 * --timeout N      : 타임아웃 설정 (기본값: 5000ms)
 * 
 * @author AI Systems Engineer
 */

const fs = require('fs');
const path = require('path');

// 환경 설정
process.env.NODE_ENV = 'test';

// Next.js 환경 변수 로드
const envPath = path.join(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  console.log('🚀 AI 성능 벤치마크 시작');
  console.log('옵션:', options);
  
  try {
    // 동적 import를 사용하여 ES 모듈 로드
    const { getAIPerformanceBenchmark, quickBenchmark, validatePerformanceTarget } = 
      await import('../../src/services/ai/performance-benchmark.js');
    
    const benchmark = getAIPerformanceBenchmark();
    
    if (options.quick) {
      console.log('\n⚡ 빠른 벤치마크 실행...');
      const report = await quickBenchmark();
      benchmark.printBenchmarkReport(report);
      await saveReport(report, 'quick-benchmark');
      
    } else if (options.target) {
      console.log('\n🎯 목표 달성 테스트 실행...');
      const result = await benchmark.validateTargetAchievement(152, 30);
      
      console.log('\n📊 목표 달성 결과:');
      console.log(`달성률: ${(result.achievementRate * 100).toFixed(1)}%`);
      console.log(`평균 시간: ${result.averageTime.toFixed(1)}ms`);
      console.log(`성공 테스트: ${result.successfulTests}/${result.successfulTests + result.failedTests}`);
      
      const passed = await validatePerformanceTarget(152);
      console.log(`\n🏆 성능 목표 ${passed ? '달성!' : '미달성'}`);
      
    } else if (options.monitor) {
      console.log('\n📈 실시간 모니터링 시작...');
      const monitorResult = await benchmark.startRealTimeMonitoring(60000); // 1분간
      
      console.log('\n📊 모니터링 결과:');
      console.log(`평균 응답시간: ${monitorResult.averageResponseTime.toFixed(1)}ms`);
      console.log(`초당 요청수: ${monitorResult.requestsPerSecond.toFixed(1)}`);
      console.log(`오류율: ${(monitorResult.errorRate * 100).toFixed(1)}%`);
      console.log(`캐시 적중률: ${(monitorResult.cacheHitRate * 100).toFixed(1)}%`);
      
    } else {
      console.log('\n🏆 전체 벤치마크 실행...');
      const config = {
        engines: ['simplified', 'performance-optimized', 'ultra-performance'],
        testQueries: [
          '서버 상태 확인',
          'CPU 사용률 분석해줘',
          '메모리 사용량은 어때?',
          '디스크 용량 체크',
          '네트워크 트래픽 모니터링',
          '전체 시스템 건강상태',
          '성능 지표 요약',
          '로그 분석 결과',
          '알림 설정 확인',
          '보안 상태 검사',
        ],
        iterations: options.iterations,
        concurrentUsers: 1,
        timeout: options.timeout,
      };
      
      const report = await benchmark.runFullBenchmark(config);
      benchmark.printBenchmarkReport(report);
      await saveReport(report, 'full-benchmark');
      
      // 목표 달성 여부 확인
      const ultraEngine = report.engineResults.find(e => e.engineName === 'ultra-performance');
      if (ultraEngine) {
        const targetAchieved = ultraEngine.targetAchievedRate >= 0.8 && ultraEngine.averageResponseTime <= 200;
        console.log(`\n🎯 최종 평가: ${targetAchieved ? '목표 달성 ✅' : '추가 최적화 필요 ⚠️'}`);
        
        if (targetAchieved) {
          console.log('🚀 Ultra Performance 엔진을 운영 환경에 배포할 수 있습니다!');
        } else {
          console.log('💡 성능 개선이 더 필요합니다. 추천사항을 확인하세요.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 벤치마크 실행 중 오류 발생:', error);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n💡 해결 방법:');
      console.log('1. npm run build 실행');
      console.log('2. TypeScript 컴파일 확인');
      console.log('3. 모든 의존성이 설치되어 있는지 확인');
    }
    
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    quick: false,
    full: false,
    target: false,
    monitor: false,
    iterations: 3,
    timeout: 5000,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--quick':
        options.quick = true;
        break;
      case '--full':
        options.full = true;
        break;
      case '--target':
        options.target = true;
        break;
      case '--monitor':
        options.monitor = true;
        break;
      case '--iterations':
        options.iterations = parseInt(args[++i]) || 3;
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]) || 5000;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  // 기본값 설정
  if (!options.quick && !options.target && !options.monitor) {
    options.full = true;
  }
  
  return options;
}

function printHelp() {
  console.log(`
🚀 AI 성능 벤치마크 도구

사용법:
  node scripts/performance/run-ai-benchmark.js [options]

옵션:
  --quick          빠른 벤치마크 (2개 엔진, 5개 쿼리)
  --full           전체 벤치마크 (모든 엔진, 15개 쿼리) [기본값]
  --target         목표 달성 테스트만 실행
  --monitor        실시간 모니터링 (1분간)
  --iterations N   반복 횟수 설정 (기본값: 3)
  --timeout N      타임아웃 설정 (기본값: 5000ms)
  --help, -h       도움말 표시

예시:
  node scripts/performance/run-ai-benchmark.js --quick
  node scripts/performance/run-ai-benchmark.js --target
  node scripts/performance/run-ai-benchmark.js --full --iterations 5
  node scripts/performance/run-ai-benchmark.js --monitor
`);
}

async function saveReport(report, type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ai-performance-${type}-${timestamp}.json`;
  const filepath = path.join(__dirname, '../../reports/performance', filename);
  
  // 디렉토리가 없으면 생성
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📁 리포트 저장됨: ${filepath}`);
    
    // 요약 리포트도 생성
    const summaryPath = path.join(dir, `summary-${type}-latest.json`);
    const summary = {
      timestamp: new Date().toISOString(),
      type,
      summary: report.summary,
      bestPerformer: report.engineResults.reduce((best, current) => 
        current.averageResponseTime < best.averageResponseTime ? current : best
      ),
      recommendations: report.recommendations.slice(0, 3), // 상위 3개만
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`📄 요약 리포트: ${summaryPath}`);
    
  } catch (error) {
    console.warn('⚠️ 리포트 저장 실패:', error.message);
  }
}

// 종료 핸들러
process.on('SIGINT', () => {
  console.log('\n\n⏹️  벤치마크 중단됨');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

// 실행
main().catch(error => {
  console.error('❌ 메인 함수 실행 실패:', error);
  process.exit(1);
});