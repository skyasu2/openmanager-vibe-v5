#!/usr/bin/env node

/**
 * 🎨 서버 카드 그래프 색상 시스템 테스트
 * 
 * 테스트 항목:
 * 1. critical/offline → 빨간색
 * 2. warning → 노랑/주황색
 * 3. online/healthy → 녹색
 */

const { normalizeServerStatus, getServerStatusColors } = require('../src/constants/serverStatusColors');

console.log('🎨 서버 상태별 색상 시스템 테스트\n');
console.log('='.repeat(50));

// 테스트 케이스
const testCases = [
  // Critical/Offline - 빨간색 계열
  { status: 'critical', expected: 'critical', expectedColor: '#dc2626' },
  { status: 'offline', expected: 'critical', expectedColor: '#dc2626' },
  { status: 'error', expected: 'critical', expectedColor: '#dc2626' },
  
  // Warning - 노랑/주황 계열
  { status: 'warning', expected: 'warning', expectedColor: '#f59e0b' },
  { status: 'degraded', expected: 'warning', expectedColor: '#f59e0b' },
  
  // Online/Healthy - 녹색 계열
  { status: 'online', expected: 'online', expectedColor: '#10b981' },
  { status: 'healthy', expected: 'online', expectedColor: '#10b981' },
  { status: 'running', expected: 'online', expectedColor: '#10b981' },
  
  // Unknown
  { status: 'unknown', expected: 'unknown', expectedColor: '#6b7280' },
  { status: 'pending', expected: 'unknown', expectedColor: '#6b7280' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ status, expected, expectedColor }) => {
  const normalized = normalizeServerStatus(status);
  const colors = getServerStatusColors(status);
  
  const statusMatch = normalized === expected;
  const colorMatch = colors.lineColor === expectedColor;
  
  if (statusMatch && colorMatch) {
    console.log(`✅ ${status.padEnd(10)} → ${normalized.padEnd(8)} | Color: ${colors.lineColor} | ${colors.status}`);
    passed++;
  } else {
    console.log(`❌ ${status.padEnd(10)} → ${normalized.padEnd(8)} | Expected: ${expected}/${expectedColor} | Got: ${normalized}/${colors.lineColor}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 테스트 결과: ${passed}/${testCases.length} 통과`);

if (failed > 0) {
  console.log(`❌ ${failed}개 테스트 실패`);
  process.exit(1);
} else {
  console.log('✅ 모든 테스트 통과!');
  console.log('\n🎯 색상 매핑 요약:');
  console.log('  - critical/offline/error → 🔴 빨간색 (#dc2626)');
  console.log('  - warning/degraded → 🟡 주황색 (#f59e0b)');
  console.log('  - online/healthy/running → 🟢 녹색 (#10b981)');
  console.log('  - unknown/기타 → ⚫ 회색 (#6b7280)');
}