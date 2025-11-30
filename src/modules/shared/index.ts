/**
 * Shared Module
 *
 * 🔧 모든 모듈에서 공통으로 사용하는 유틸리티
 * - 공통 타입 정의
 * - 유틸리티 함수
 * - 상수 정의
 */

// Constants
export {
  API_ENDPOINTS,
  DEFAULT_TIMEOUTS,
  ERROR_CODES,
  MODULE_VERSIONS,
} from './constants';
// Types
export type { APIResponse, BaseConfig, ErrorInfo, ModuleInfo } from './types';
// Utils
export {
  debounce,
  deepMerge,
  formatDate,
  generateId,
  throttle,
  validateConfig,
} from './utils';

// Module info
export const SHARED_MODULE_VERSION = '1.0.0';
export const SHARED_MODULE_NAME = 'OpenManager Shared';

/**
 * 모듈 호환성 검사
 */
export const checkModuleCompatibility = (
  requiredVersion: string,
  currentVersion: string
): boolean => {
  const reqParts = requiredVersion.split('.').map(Number);
  const curParts = currentVersion.split('.').map(Number);

  const reqMajor = reqParts[0] ?? 0;
  const reqMinor = reqParts[1] ?? 0;
  const curMajor = curParts[0] ?? 0;
  const curMinor = curParts[1] ?? 0;

  return curMajor >= reqMajor && curMinor >= reqMinor;
};
