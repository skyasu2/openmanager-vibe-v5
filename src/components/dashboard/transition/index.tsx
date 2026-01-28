/**
 * 🎯 Dashboard Transition Components
 *
 * 자연스러운 대시보드 전환 시스템
 * - 깜빡임 없는 페이지 전환
 * - 시스템 부팅 시뮬레이션
 * - 순차적 서버 카드 생성
 * - 순차적 단계별 로딩 시스템
 */

// 🗑️ DashboardLoader 제거됨 - SystemBootSequence로 통합
// export { default as DashboardLoader } from './DashboardLoader';

// 🎬 순차적 로딩 관련 hooks (백업용)
export { useSequentialLoadingTime } from '@/hooks/useSequentialLoadingTime';
export type {
  ComponentStatus,
  SystemComponent,
} from '@/hooks/useSystemChecklist';
// 🔧 시스템 체크리스트 관련 hooks
export { useSystemChecklist } from '@/hooks/useSystemChecklist';
// 🗑️ ServerCardSpawner 제거됨 - 미사용
// 🗑️ SequentialLoader 제거됨 - 백업으로 이동
// export { default as SequentialLoader } from './SequentialLoader';
export { default as SmoothTransition } from './SmoothTransition';
export { default as SystemBootSequence } from './SystemBootSequence';
export { default as SystemChecklist } from './SystemChecklist';

// 타입 정의
export interface TransitionConfig {
  skipAnimation?: boolean;
  autoStart?: boolean;
  spawnDelay?: number;
}

export type BootPhase =
  | '_initializing'
  | 'core-loading'
  | 'server-spawning'
  | 'finalizing'
  | 'complete';
