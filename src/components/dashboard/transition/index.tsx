/**
 * 🎯 Dashboard Transition Components
 * 
 * 자연스러운 대시보드 전환 시스템
 * - 깜빡임 없는 페이지 전환
 * - 시스템 부팅 시뮬레이션
 * - 순차적 서버 카드 생성
 * - 순차적 단계별 로딩 시스템
 */

export { default as DashboardLoader } from './DashboardLoader';
export { default as ServerCardSpawner } from './ServerCardSpawner';
export { default as SequentialLoader } from './SequentialLoader';
export { default as SystemBootSequence } from './SystemBootSequence';
export { default as SmoothTransition } from './SmoothTransition';

// 타입 정의
export interface TransitionConfig {
  skipAnimation?: boolean;
  autoStart?: boolean;
  spawnDelay?: number;
}

export type BootPhase = 'initializing' | 'core-loading' | 'server-spawning' | 'finalizing' | 'complete'; 