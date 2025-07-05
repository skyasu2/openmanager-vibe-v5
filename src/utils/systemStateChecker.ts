/**
 * 🔍 시스템 상태 확인 유틸리티
 *
 * 시스템 온오프 상태를 확인하여 "오프일 때는 무동작 원칙" 구현
 */

export interface SystemStateInfo {
  isSystemActive: boolean;
  powerMode: 'sleep' | 'active' | 'monitoring' | 'emergency';
  isDataCollecting: boolean;
  reason: string;
  shouldSkipOperation: boolean;
}

/**
 * 🎯 시스템 활성 상태 확인
 */
export async function checkSystemState(): Promise<SystemStateInfo> {
  try {
    // 환경변수 기반 시스템 상태 확인
    const forceSystemOff = process.env.FORCE_SYSTEM_OFF === 'true';
    const systemMaintenanceMode = process.env.SYSTEM_MAINTENANCE === 'true';

    // 🎯 강제 비활성화 조건들 (DISABLE 환경변수 제거)
    if (forceSystemOff || systemMaintenanceMode) {
      return {
        isSystemActive: false,
        powerMode: 'sleep',
        isDataCollecting: false,
        reason: forceSystemOff
          ? '시스템 강제 비활성화'
          : systemMaintenanceMode
            ? '시스템 유지보수 모드'
            : '크론 작업 비활성화',
        shouldSkipOperation: true,
      };
    }

    // 기본값: 개발환경에서는 활성화, 프로덕션에서는 환경변수 확인
    const defaultActive =
      process.env.NODE_ENV === 'development' ||
      process.env.SYSTEM_DEFAULT_ACTIVE === 'true';

    return {
      isSystemActive: defaultActive,
      powerMode: defaultActive ? 'active' : 'sleep',
      isDataCollecting: defaultActive,
      reason: defaultActive ? '시스템 활성화 상태' : '시스템 비활성화 상태',
      shouldSkipOperation: !defaultActive,
    };
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);

    return {
      isSystemActive: false,
      powerMode: 'sleep',
      isDataCollecting: false,
      reason: `시스템 상태 확인 오류: ${error.message}`,
      shouldSkipOperation: true,
    };
  }
}

/**
 * 🚀 간단한 시스템 활성화 확인
 */
export async function isSystemActive(): Promise<boolean> {
  const state = await checkSystemState();
  return state.isSystemActive;
}

/**
 * 🛑 작업 실행 전 시스템 상태 검증
 */
export async function validateSystemForOperation(
  operationName: string
): Promise<{
  canProceed: boolean;
  reason: string;
  systemState: SystemStateInfo;
}> {
  const systemState = await checkSystemState();

  if (systemState.shouldSkipOperation) {
    console.log(
      `🛑 [${operationName}] 시스템 비활성화로 인한 작업 중단: ${systemState.reason}`
    );

    return {
      canProceed: false,
      reason: systemState.reason,
      systemState,
    };
  }

  console.log(
    `✅ [${operationName}] 시스템 활성화 확인됨: ${systemState.reason}`
  );

  return {
    canProceed: true,
    reason: systemState.reason,
    systemState,
  };
}

/**
 * 🔄 환경변수 기반 시스템 제어
 */
export function getSystemControlEnvVars(): {
  forceOff: boolean;
  maintenanceMode: boolean;
  cronDisabled: boolean;
  dataGenerationDisabled: boolean;
} {
  return {
    forceOff: process.env.FORCE_SYSTEM_OFF === 'true',
    maintenanceMode: process.env.SYSTEM_MAINTENANCE === 'true',
    cronDisabled: false, // 환경변수 비활성화 제거
    dataGenerationDisabled: false, // 환경변수 비활성화 제거
  };
}
