/**
 * AI Agent Power Management API
 *
 * 🔋 AI 에이전트 전원 관리 시스템
 * - 이식성을 해치지 않는 모듈화된 설계
 * - 시스템 활성화/비활성화와 연동
 * - 절전 모드 자동 관리
 */

import { NextRequest, NextResponse } from 'next/server';

// AI 에이전트 전원 상태 관리
class AIAgentPowerManager {
  private static instance: AIAgentPowerManager;
  private isActive: boolean = false;
  private powerMode: 'active' | 'idle' | 'sleep' = 'sleep';
  private lastActivity: number = Date.now();
  private powerTimers: Map<string, NodeJS.Timeout> = new Map();

  // 설정
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5분
  private readonly SLEEP_TIMEOUT = 15 * 60 * 1000; // 15분

  static getInstance(): AIAgentPowerManager {
    if (!AIAgentPowerManager.instance) {
      AIAgentPowerManager.instance = new AIAgentPowerManager();
    }
    return AIAgentPowerManager.instance;
  }

  /**
   * AI 에이전트 활성화
   */
  activate(): { success: boolean; message: string; powerMode: string } {
    this.isActive = true;
    this.powerMode = 'active';
    this.lastActivity = Date.now();

    // 기존 타이머 정리
    this.clearAllTimers();

    // 새로운 절전 타이머 시작
    this.startPowerTimers();

    console.log(
      '🤖 AI Agent activated - isActive:',
      this.isActive,
      'powerMode:',
      this.powerMode
    );

    return {
      success: true,
      message: 'AI 에이전트가 활성화되었습니다.',
      powerMode: this.powerMode,
    };
  }

  /**
   * AI 에이전트 비활성화
   */
  deactivate(): { success: boolean; message: string; powerMode: string } {
    this.isActive = false;
    this.powerMode = 'sleep';

    // 모든 타이머 정리
    this.clearAllTimers();

    console.log('🤖 AI Agent deactivated');

    return {
      success: true,
      message: 'AI 에이전트가 비활성화되었습니다.',
      powerMode: this.powerMode,
    };
  }

  /**
   * 활동 기록 (자동 깨우기)
   */
  recordActivity(): void {
    this.lastActivity = Date.now();

    // 시스템이 비활성화되어 있으면 자동으로 활성화
    if (!this.isActive) {
      console.log('🔄 AI Agent auto-activating due to activity');
      this.isActive = true;
      this.powerMode = 'active';
    }

    if (this.powerMode !== 'active' && this.isActive) {
      this.wakeUp();
    } else if (this.isActive) {
      // 타이머 리셋
      this.clearAllTimers();
      this.startPowerTimers();
    }

    console.log(
      '📝 AI Agent activity recorded - isActive:',
      this.isActive,
      'powerMode:',
      this.powerMode
    );
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): {
    isActive: boolean;
    powerMode: string;
    lastActivity: number;
    timeSinceLastActivity: number;
  } {
    return {
      isActive: this.isActive,
      powerMode: this.powerMode,
      lastActivity: this.lastActivity,
      timeSinceLastActivity: Date.now() - this.lastActivity,
    };
  }

  /**
   * 활성 모드로 깨우기
   */
  private wakeUp(): void {
    if (this.powerMode === 'active') return;

    const previousMode = this.powerMode;
    this.powerMode = 'active';

    console.log(`🌟 AI Agent waking up from ${previousMode} mode`);

    // 타이머 정리 후 새로 시작
    this.clearAllTimers();
    this.startPowerTimers();
  }

  /**
   * 유휴 모드 진입
   */
  private enterIdleMode(): void {
    if (this.powerMode === 'idle' || !this.isActive) return;

    this.powerMode = 'idle';
    console.log('💤 AI Agent entering idle mode');

    // 절전 모드 타이머 시작
    const sleepTimer = setTimeout(() => {
      this.enterSleepMode();
    }, this.SLEEP_TIMEOUT - this.IDLE_TIMEOUT);

    this.powerTimers.set('sleep', sleepTimer);
  }

  /**
   * 절전 모드 진입
   */
  private enterSleepMode(): void {
    if (this.powerMode === 'sleep' || !this.isActive) return;

    this.powerMode = 'sleep';
    console.log('😴 AI Agent entering sleep mode');

    this.clearAllTimers();
  }

  /**
   * 절전 타이머 시작
   */
  private startPowerTimers(): void {
    if (!this.isActive) return;

    // 유휴 모드 타이머
    const idleTimer = setTimeout(() => {
      this.enterIdleMode();
    }, this.IDLE_TIMEOUT);

    this.powerTimers.set('idle', idleTimer);
  }

  /**
   * 모든 타이머 정리
   */
  private clearAllTimers(): void {
    this.powerTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.powerTimers.clear();
  }
}

// 싱글톤 인스턴스
const aiPowerManager = AIAgentPowerManager.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { timestamp, action, agent } = body;

    // 🟢 TDD Green: 최소 구현 - 로그만 기록
    console.log(`[AI Agent Activity] ${timestamp} - ${agent}: ${action}`);

    // 향후 실제 데이터베이스나 분석 시스템에 저장할 수 있음

    return NextResponse.json({
      success: true,
      recorded: {
        timestamp,
        action,
        agent,
      },
    });
  } catch (error) {
    console.error('AI Agent 활동 기록 실패:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to record activity' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 🟢 향후 활동 기록 조회용
  return NextResponse.json({
    message: 'AI Agent 활동 기록 API',
    endpoints: {
      POST: '활동 기록',
      GET: '활동 기록 조회 (향후 구현)',
    },
  });
}

/**
 * 전원 모드 설명
 */
function getStatusDescription(powerMode: string): string {
  switch (powerMode) {
    case 'active':
      return 'AI 에이전트 완전 활성화됨';
    case 'idle':
      return 'AI 에이전트 유휴 모드 (절전 준비)';
    case 'sleep':
      return 'AI 에이전트 절전 모드';
    default:
      return '알 수 없는 상태';
  }
}

/**
 * 전원 모드별 기능
 */
function getPowerModeFeatures(powerMode: string): string[] {
  switch (powerMode) {
    case 'active':
      return [
        '실시간 질의 응답',
        '고급 분석 기능',
        '자동 보고서 생성',
        '실시간 모니터링',
      ];
    case 'idle':
      return ['기본 질의 응답', '절전 모드 준비', '활동 감지 대기'];
    case 'sleep':
      return ['모든 기능 정지', '수동 활성화 대기', '최소 리소스 사용'];
    default:
      return [];
  }
}
