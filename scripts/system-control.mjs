#!/usr/bin/env node
/**
 * ���️ OpenManager Vibe v5 - 중앙화된 시스템 제어 스크립트
 * 2025-06-28 16:10 KST
 */

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app'
  : 'http://localhost:3000';

class SystemController {
  constructor() {
    this.apiBase = API_BASE;
  }

  async startSystem() {
    console.log('��� 시스템 시작 중...');
    try {
      const response = await fetch(`${this.apiBase}/api/system/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', options: { mode: 'full' } })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ 시스템 시작 성공:', result.message);
      } else {
        console.error('❌ 시스템 시작 실패:', result.message);
      }
    } catch (error) {
      console.error('❌ 요청 실패:', error.message);
    }
  }

  async stopSystem() {
    console.log('��� 시스템 정지 중...');
    try {
      const response = await fetch(`${this.apiBase}/api/system/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ 시스템 정지 성공:', result.message);
      } else {
        console.error('❌ 시스템 정지 실패:', result.message);
      }
    } catch (error) {
      console.error('❌ 요청 실패:', error.message);
    }
  }

  async getStatus() {
    console.log('��� 시스템 상태 확인 중...');
    try {
      const response = await fetch(`${this.apiBase}/api/system/status`);
      const result = await response.json();
      
      console.log('��� 시스템 상태:');
      console.log(`   실행 상태: ${result.isRunning ? '✅ 실행 중' : '⏹️ 정지됨'}`);
      console.log(`   건강 상태: ${result.health || 'unknown'}`);
    } catch (error) {
      console.error('❌ 상태 확인 실패:', error.message);
    }
  }

  showHelp() {
    console.log('���️ OpenManager Vibe v5 - 시스템 제어');
    console.log('사용법:');
    console.log('  node scripts/system-control.mjs start   # 시스템 시작');
    console.log('  node scripts/system-control.mjs stop    # 시스템 정지');
    console.log('  node scripts/system-control.mjs status  # 상태 확인');
  }
}

// CLI 실행
const command = process.argv[2];
const controller = new SystemController();

switch (command) {
  case 'start':
    await controller.startSystem();
    break;
  case 'stop':
    await controller.stopSystem();
    break;
  case 'status':
    await controller.getStatus();
    break;
  default:
    controller.showHelp();
}
