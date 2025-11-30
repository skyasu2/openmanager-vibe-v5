/**
 * 시스템 모듈 통합 Export
 *
 * 리팩토링된 버전과 기존 버전의 호환성을 위한 중앙 export 파일
 * 점진적으로 모든 import를 이 파일로 통합
 */

// 리팩토링된 버전 export
export { ProcessManager as ProcessManagerRefactored } from './ProcessManager.refactored';
export {
  getSystemBootstrapper,
  resetSystemBootstrapper,
  type SystemBootstrapConfig,
  SystemBootstrapper,
} from './SystemBootstrapper';
export { SystemWatchdog as SystemWatchdogRefactored } from './SystemWatchdog.refactored';

// 내부 사용을 위한 import
import {
  getSystemBootstrapper,
  type SystemBootstrapConfig,
} from './SystemBootstrapper';

// 기존 버전도 export (임시 - 점진적 마이그레이션용)
export { ProcessManager } from './ProcessManager';
// 공통 타입 export
export type {
  ProcessConfig,
  ProcessState,
  SystemMetrics,
} from './ProcessManager.refactored';
// Process 설정 export
export * from './process-configs';
export { SystemWatchdog } from './SystemWatchdog';
export type {
  SystemMetrics as WatchdogMetrics,
  WatchdogAlerts,
} from './SystemWatchdog.refactored';

/**
 * 시스템 초기화 헬퍼 함수
 * 새로운 부트스트래퍼를 사용하여 시스템 초기화
 */
export async function initializeSystem(config?: SystemBootstrapConfig) {
  const bootstrapper = getSystemBootstrapper(config);
  await bootstrapper.initialize();
  return bootstrapper;
}

/**
 * 기존 코드와의 호환성을 위한 팩토리 함수
 * @deprecated 새로운 코드에서는 SystemBootstrapper를 직접 사용하세요
 */
export function createProcessManager() {
  const bootstrapper = getSystemBootstrapper();
  return bootstrapper.getProcessManager();
}

/**
 * 기존 코드와의 호환성을 위한 팩토리 함수
 * @deprecated 새로운 코드에서는 SystemBootstrapper를 직접 사용하세요
 */
export function createSystemWatchdog() {
  const bootstrapper = getSystemBootstrapper();
  return bootstrapper.getWatchdog();
}
