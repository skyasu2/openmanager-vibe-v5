#!/usr/bin/env node

/**
 * 📊 Git Push 모니터링 대시보드
 * Push 성공률, CI/CD 성능, 에러 통계를 실시간으로 추적
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// 통계 파일 경로
const STATS_FILE = path.join(process.cwd(), '.git-push-stats.json');

/**
 * 통계 로드
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('통계 파일 로드 실패:', error);
  }
  
  return {
    pushes: [],
    typeErrors: [],
    testFailures: [],
    buildTimes: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 통계 저장
 */
function saveStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('통계 저장 실패:', error);
  }
}

/**
 * 현재 상태 분석
 */
function analyzeCurrentState() {
  const state = {
    branch: 'unknown',
    ahead: 0,
    behind: 0,
    staged: 0,
    modified: 0,
    untracked: 0,
    typeErrors: 0,
    testStatus: 'unknown',
    lastCommit: '',
  };
  
  try {
    // 현재 브랜치
    state.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    
    // 원격과의 차이
    try {
      const status = execSync('git status -sb', { encoding: 'utf-8' });
      const match = status.match(/ahead (\d+)|behind (\d+)/g);
      if (match) {
        match.forEach(m => {
          if (m.includes('ahead')) state.ahead = parseInt(m.match(/\d+/)[0]);
          if (m.includes('behind')) state.behind = parseInt(m.match(/\d+/)[0]);
        });
      }
    } catch {}
    
    // 파일 상태
    try {
      const porcelain = execSync('git status --porcelain', { encoding: 'utf-8' });
      const lines = porcelain.split('\n').filter(Boolean);
      
      lines.forEach(line => {
        if (line.startsWith('M ') || line.startsWith(' M')) state.modified++;
        if (line.startsWith('A ') || line.startsWith('M')) state.staged++;
        if (line.startsWith('??')) state.untracked++;
      });
    } catch {}
    
    // TypeScript 에러
    try {
      const typeCheck = execSync('npm run type-check 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
      const errorMatch = typeCheck.match(/(\d+) errors?/);
      if (errorMatch) {
        state.typeErrors = parseInt(errorMatch[1]);
      }
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const errorMatch = output.match(/(\d+) errors?/);
      if (errorMatch) {
        state.typeErrors = parseInt(errorMatch[1]);
      }
    }
    
    // 테스트 상태
    try {
      execSync('npm run test:quick', { stdio: 'pipe' });
      state.testStatus = 'passing';
    } catch {
      state.testStatus = 'failing';
    }
    
    // 마지막 커밋
    try {
      state.lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
    } catch {}
    
  } catch (error) {
    console.error('상태 분석 실패:', error.message);
  }
  
  return state;
}

/**
 * Push 성공률 계산
 */
function calculatePushSuccessRate(stats) {
  const recentPushes = stats.pushes.slice(-20); // 최근 20개
  if (recentPushes.length === 0) return 0;
  
  const successful = recentPushes.filter(p => p.success).length;
  return Math.round((successful / recentPushes.length) * 100);
}

/**
 * 평균 빌드 시간 계산
 */
function calculateAverageBuildTime(stats) {
  const recentBuilds = stats.buildTimes.slice(-10);
  if (recentBuilds.length === 0) return 0;
  
  const sum = recentBuilds.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / recentBuilds.length);
}

/**
 * 대시보드 표시
 */
function displayDashboard(state, stats) {
  console.clear();
  
  console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                   📊 Git Push 모니터링 대시보드                ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 현재 상태
  console.log(`${colors.bold}📍 현재 상태${colors.reset}`);
  console.log(`  브랜치: ${colors.yellow}${state.branch}${colors.reset}`);
  console.log(`  원격 상태: ${state.ahead > 0 ? colors.green + `↑${state.ahead}` : ''}${state.behind > 0 ? colors.red + ` ↓${state.behind}` : ''}${state.ahead === 0 && state.behind === 0 ? colors.gray + '동기화됨' : ''}${colors.reset}`);
  console.log(`  파일: ${colors.green}+${state.staged}${colors.reset} | ${colors.yellow}~${state.modified}${colors.reset} | ${colors.gray}?${state.untracked}${colors.reset}`);
  console.log(`  마지막 커밋: ${colors.gray}${state.lastCommit}${colors.reset}\n`);
  
  // 검증 상태
  console.log(`${colors.bold}🧪 검증 상태${colors.reset}`);
  console.log(`  TypeScript: ${state.typeErrors > 0 ? colors.red + `❌ ${state.typeErrors}개 에러` : colors.green + '✅ 통과'}${colors.reset}`);
  console.log(`  테스트: ${state.testStatus === 'passing' ? colors.green + '✅ 통과' : state.testStatus === 'failing' ? colors.red + '❌ 실패' : colors.gray + '⏸ 미실행'}${colors.reset}\n`);
  
  // 성과 지표
  const successRate = calculatePushSuccessRate(stats);
  const avgBuildTime = calculateAverageBuildTime(stats);
  
  console.log(`${colors.bold}📈 성과 지표${colors.reset}`);
  console.log(`  Push 성공률: ${successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
  console.log(`  평균 빌드 시간: ${colors.cyan}${avgBuildTime}초${colors.reset}`);
  console.log(`  총 Push 횟수: ${colors.blue}${stats.pushes.length}회${colors.reset}\n`);
  
  // 최근 이력
  console.log(`${colors.bold}📝 최근 Push 이력${colors.reset}`);
  const recentPushes = stats.pushes.slice(-5);
  if (recentPushes.length > 0) {
    recentPushes.forEach(push => {
      const time = new Date(push.timestamp).toLocaleTimeString();
      const icon = push.success ? '✅' : '❌';
      console.log(`  ${icon} ${colors.gray}${time}${colors.reset} - ${push.message || '메시지 없음'}`);
    });
  } else {
    console.log(`  ${colors.gray}이력 없음${colors.reset}`);
  }
  
  console.log(`\n${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.gray}마지막 업데이트: ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.gray}[Ctrl+C로 종료] [R로 새로고침] [C로 통계 초기화]${colors.reset}`);
}

/**
 * Push 시도 기록
 */
function recordPushAttempt(success, message = '') {
  const stats = loadStats();
  
  stats.pushes.push({
    timestamp: new Date().toISOString(),
    success,
    message,
  });
  
  // 최대 100개 유지
  if (stats.pushes.length > 100) {
    stats.pushes = stats.pushes.slice(-100);
  }
  
  stats.lastUpdated = new Date().toISOString();
  saveStats(stats);
}

/**
 * 실시간 모니터링 모드
 */
function startMonitoring() {
  const readline = require('readline');
  readline.emitKeypressEvents(process.stdin);
  
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  let stats = loadStats();
  let state = analyzeCurrentState();
  
  // 초기 표시
  displayDashboard(state, stats);
  
  // 자동 새로고침 (10초마다)
  const refreshInterval = setInterval(() => {
    state = analyzeCurrentState();
    stats = loadStats();
    displayDashboard(state, stats);
  }, 10000);
  
  // 키 입력 처리
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      clearInterval(refreshInterval);
      process.exit();
    }
    
    if (key.name === 'r') {
      state = analyzeCurrentState();
      stats = loadStats();
      displayDashboard(state, stats);
    }
    
    if (key.name === 'c') {
      stats = {
        pushes: [],
        typeErrors: [],
        testFailures: [],
        buildTimes: [],
        lastUpdated: new Date().toISOString(),
      };
      saveStats(stats);
      displayDashboard(state, stats);
      console.log(`\n${colors.yellow}✨ 통계가 초기화되었습니다.${colors.reset}`);
    }
  });
}

/**
 * 메인 실행
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--record-success')) {
    recordPushAttempt(true, args[args.indexOf('--record-success') + 1] || '');
    console.log(`${colors.green}✅ Push 성공 기록됨${colors.reset}`);
  } else if (args.includes('--record-failure')) {
    recordPushAttempt(false, args[args.indexOf('--record-failure') + 1] || '');
    console.log(`${colors.red}❌ Push 실패 기록됨${colors.reset}`);
  } else if (args.includes('--stats')) {
    const stats = loadStats();
    console.log(JSON.stringify(stats, null, 2));
  } else {
    // 모니터링 모드
    startMonitoring();
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = {
  loadStats,
  saveStats,
  analyzeCurrentState,
  recordPushAttempt,
};