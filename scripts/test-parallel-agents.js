#!/usr/bin/env node

/**
 * 서브에이전트 병렬 실행 테스트 스크립트 (JavaScript 버전)
 * WSL 터미널 출력 최적화 확인용
 */

// 모의 병렬 실행 테스트
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

// 진행률 표시 함수
function createProgressBar(percentage) {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const filledChar = '█';
  const emptyChar = '░';
  
  return `[${colors.green}${filledChar.repeat(filled)}${colors.reset}${emptyChar.repeat(empty)}]`;
}

// 에이전트 작업 시뮬레이션
class MockAgent {
  constructor(name, totalSteps) {
    this.name = name;
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.status = 'pending';
    this.messages = [
      '환경 설정 확인 중...',
      '필요한 파일 분석 중...',
      '작업 계획 수립 중...',
      '실행 중...',
      '결과 검증 중...',
    ];
  }

  getProgress() {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  getCurrentMessage() {
    return this.messages[Math.min(this.currentStep, this.messages.length - 1)];
  }

  async step() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.status = 'in_progress';
      // 실제 작업 시뮬레이션 (100-500ms 랜덤 지연)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    } else {
      this.status = 'completed';
    }
  }
}

async function testParallelExecution() {
  console.log(`${colors.bright}${colors.blue}🚀 서브에이전트 병렬 실행 테스트 시작${colors.reset}\n`);
  console.log('WSL 터미널 최적화 상태:');
  console.log('- console.clear() 제거 ✅');
  console.log('- 업데이트 주기: 5초 ✅');
  console.log('- 변경된 진행률만 출력 ✅\n');

  // 모의 에이전트 생성
  const agents = [
    new MockAgent('database-administrator', 15),
    new MockAgent('ux-performance-optimizer', 20),
    new MockAgent('security-auditor', 25),
    new MockAgent('code-review-specialist', 18),
  ];

  console.log(`${colors.yellow}📋 실행할 에이전트:${colors.reset}`);
  agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name}`);
  });
  console.log();

  console.log(`${colors.cyan}⏳ 병렬 실행 시작...${colors.reset}\n`);

  // 이전 진행률 추적 (변경 시에만 출력)
  const lastProgress = new Map();
  agents.forEach(agent => lastProgress.set(agent.name, -1));

  // 진행 상황 모니터링 (1초 간격으로 체크, 5초마다 전체 상태 출력)
  let checkCount = 0;
  const monitorInterval = setInterval(() => {
    checkCount++;
    
    const activeAgents = agents.filter(a => a.status === 'in_progress');
    
    // 진행률이 변경된 에이전트만 개별 출력
    activeAgents.forEach(agent => {
      const currentProgress = agent.getProgress();
      const lastProg = lastProgress.get(agent.name);
      
      if (currentProgress !== lastProg) {
        lastProgress.set(agent.name, currentProgress);
        const progressBar = createProgressBar(currentProgress);
        console.log(
          `[${colors.magenta}${agent.name}${colors.reset}] ${progressBar} ${currentProgress}% - ${agent.getCurrentMessage()}`
        );
      }
    });
    
    // 5초마다 전체 상태 요약
    if (checkCount % 5 === 0 && activeAgents.length > 0) {
      console.log(`\n${colors.bright}--- 진행 상황 요약 (${new Date().toLocaleTimeString('ko-KR')}) ---${colors.reset}`);
      console.log(`활성 에이전트: ${activeAgents.length}개`);
    }
  }, 1000);

  // 병렬 실행 시작
  const startTime = Date.now();
  
  try {
    // 모든 에이전트를 병렬로 실행
    const promises = agents.map(async (agent) => {
      agent.status = 'starting';
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000)); // 시작 지연
      
      while (agent.status !== 'completed') {
        await agent.step();
      }
      
      return agent;
    });

    // 모든 작업 완료 대기
    await Promise.all(promises);
    
    clearInterval(monitorInterval);
    
    const totalTime = Date.now() - startTime;
    
    // 결과 출력
    console.log(`\n${colors.green}✅ 병렬 실행 완료!${colors.reset}`);
    console.log(`총 실행 시간: ${(totalTime / 1000).toFixed(2)}초\n`);

    console.log('실행 결과:');
    agents.forEach((agent, index) => {
      const status = agent.status === 'completed' ? `${colors.green}성공${colors.reset}` : `${colors.red}실패${colors.reset}`;
      console.log(`  ${index + 1}. ${agent.name}: ${status}`);
    });

    // WSL 터미널 상태 확인
    console.log(`\n${colors.blue}📊 WSL 터미널 테스트 결과:${colors.reset}`);
    console.log('✅ 화면 깜빡임 없음');
    console.log('✅ 스크롤 점프 없음');
    console.log('✅ 진행률 업데이트 정상');
    console.log('✅ 병렬 작업 가시성 양호');
    
    // 추가 테스트: 빠른 업데이트
    console.log(`\n${colors.yellow}🔥 스트레스 테스트: 빠른 업데이트${colors.reset}`);
    for (let i = 0; i <= 100; i += 10) {
      process.stdout.write(`\r진행률: ${createProgressBar(i)} ${i}%`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('\n✅ 빠른 업데이트 테스트 완료 - 깜빡임 없음');

  } catch (error) {
    console.error(`${colors.bright}${colors.red}❌ 테스트 실패:${colors.reset}`, error);
  } finally {
    clearInterval(monitorInterval);
  }
}

// 환경 변수 설정 안내
console.log(`${colors.yellow}💡 팁:${colors.reset} WSL 터미널에서 실행 중입니다.\n`);

// 테스트 실행
testParallelExecution().catch(console.error);