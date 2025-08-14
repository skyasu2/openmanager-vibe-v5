#!/usr/bin/env node

/**
 * 간단한 ccusage 상태 표시 스크립트
 * session N/A 문제를 우회하여 필수 정보만 표시
 */

const { spawn } = require('child_process');

// ccusage blocks --current 실행하고 파싱
const ccusage = spawn('npx', ['-y', 'ccusage', 'blocks', '--current'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';

ccusage.stdout.on('data', (data) => {
  output += data.toString();
});

ccusage.on('close', () => {
  try {
    // ACTIVE 블록 찾기
    const activeMatch = output.match(/ACTIVE.*?opus-4.*?(\d+,[\d,]+).*?\$([0-9.]+)/s);
    const activeBlock = activeMatch ? `$${activeMatch[2]}` : 'No active block';
    
    // REMAINING 시간 찾기
    const remainingMatch = output.match(/(\d+h \d+m) remaining/);
    const remaining = remainingMatch ? remainingMatch[1] : '0h 0m';
    
    // 토큰 사용률 찾기
    const tokenMatch = output.match(/ACTIVE.*?(\d+,[\d,]+).*?(\d+\.\d+)%/s);
    const tokens = tokenMatch ? `${tokenMatch[1].replace(/,/g, '')} (${tokenMatch[2]}%)` : 'N/A';
    
    // 오늘 총 비용 계산 (모든 블록의 합)
    const costMatches = [...output.matchAll(/\$([0-9.]+)/g)];
    let todayTotal = 0;
    costMatches.forEach(match => {
      const cost = parseFloat(match[1]);
      if (!isNaN(cost) && cost < 200) { // 200달러 이하만 (전체 합계 제외)
        todayTotal += cost;
      }
    });
    
    // 시간당 비용 계산
    const hoursElapsed = new Date().getHours() + new Date().getMinutes() / 60;
    const hourlyRate = hoursElapsed > 0 ? (todayTotal / hoursElapsed).toFixed(2) : '0.00';
    
    // 상태줄 포맷
    const statusLine = `🤖 Opus 4.1 | 💰 $${todayTotal.toFixed(2)} today / ${activeBlock} block (${remaining} left) | 🔥 $${hourlyRate}/hr | 🧠 ${tokens}`;
    
    console.log(statusLine);
  } catch (error) {
    // 에러 시 기본 메시지
    console.log('🤖 Opus 4.1 | 💰 Loading...');
  }
});

ccusage.stderr.on('data', () => {
  // stderr 무시 (경고 메시지 숨김)
});