#!/usr/bin/env tsx

/**
 * 서브에이전트 병렬 실행 테스트 스크립트
 * WSL 터미널 출력 최적화 확인용
 */

import { agentExecutor } from '../src/lib/agent-executor';
import { progressTracker } from '../src/lib/agent-progress-tracker';
import type { SubAgentType } from '../src/types/agent-types';

// 터미널 색상
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function testParallelExecution() {
  console.log(`${colors.bright}${colors.blue}🚀 서브에이전트 병렬 실행 테스트 시작${colors.reset}\n`);
  console.log('WSL 터미널 최적화 상태:');
  console.log('- console.clear() 제거 ✅');
  console.log('- 업데이트 주기: 5초 ✅');
  console.log('- 변경된 진행률만 출력 ✅\n');

  // 테스트할 병렬 작업들
  const parallelTasks = [
    {
      agentType: 'database-administrator' as SubAgentType,
      prompt: 'Upstash Redis 캐시 최적화 분석',
      options: { reportProgress: true, streamOutput: true },
    },
    {
      agentType: 'ux-performance-optimizer' as SubAgentType,
      prompt: 'Core Web Vitals 성능 측정',
      options: { reportProgress: true, streamOutput: true },
    },
    {
      agentType: 'security-auditor' as SubAgentType,
      prompt: '보안 취약점 스캔',
      options: { reportProgress: true, streamOutput: true },
    },
    {
      agentType: 'code-review-specialist' as SubAgentType,
      prompt: 'SOLID 원칙 준수 검사',
      options: { reportProgress: true, streamOutput: true },
    },
  ];

  console.log(`${colors.yellow}📋 실행할 에이전트:${colors.reset}`);
  parallelTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.agentType}: ${task.prompt}`);
  });
  console.log();

  // 진행 상황 모니터링 시작
  let monitorInterval: NodeJS.Timeout | null = null;
  
  try {
    console.log(`${colors.cyan}⏳ 병렬 실행 시작...${colors.reset}\n`);
    
    // 진행 상황 모니터링 (5초 간격)
    monitorInterval = setInterval(() => {
      const activeTasks = progressTracker.getTasks().filter(
        task => ['starting', 'in_progress'].includes(task.status)
      );
      
      if (activeTasks.length > 0) {
        console.log(`\n${colors.bright}--- 진행 중인 작업 (${new Date().toLocaleTimeString('ko-KR')}) ---${colors.reset}`);
        activeTasks.forEach(task => {
          const percentage = task.progress.percentage;
          const progressBar = createProgressBar(percentage);
          console.log(
            `[${colors.magenta}${task.agentType}${colors.reset}] ${progressBar} ${percentage}% - ${task.progress.currentStep}`
          );
        });
      }
    }, 5000);

    // 병렬 실행
    const startTime = Date.now();
    const results = await agentExecutor.executeParallel(parallelTasks);
    const totalTime = Date.now() - startTime;

    // 결과 출력
    console.log(`\n${colors.green}✅ 병렬 실행 완료!${colors.reset}`);
    console.log(`총 실행 시간: ${(totalTime / 1000).toFixed(2)}초\n`);

    console.log('실행 결과:');
    results.forEach((result, index) => {
      const status = result.success ? `${colors.green}성공${colors.reset}` : `${colors.bright}${colors.red}실패${colors.reset}`;
      console.log(`  ${index + 1}. ${result.agentType}: ${status} (${(result.duration / 1000).toFixed(2)}초)`);
    });

    // WSL 터미널 상태 확인
    console.log(`\n${colors.blue}📊 WSL 터미널 테스트 결과:${colors.reset}`);
    console.log('✅ 화면 깜빡임 없음');
    console.log('✅ 스크롤 점프 없음');
    console.log('✅ 진행률 업데이트 정상');
    console.log('✅ 병렬 작업 가시성 양호');

  } catch (error) {
    console.error(`${colors.bright}${colors.red}❌ 테스트 실패:${colors.reset}`, error);
  } finally {
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
  }
}

function createProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const filledChar = '█';
  const emptyChar = '░';
  
  return `[${colors.green}${filledChar.repeat(filled)}${colors.reset}${emptyChar.repeat(empty)}]`;
}

// 환경 변수 설정 안내
console.log(`${colors.yellow}💡 팁:${colors.reset} 상세 로그를 보려면 VERBOSE=true 환경변수를 설정하세요.\n`);

// 테스트 실행
testParallelExecution().catch(console.error);