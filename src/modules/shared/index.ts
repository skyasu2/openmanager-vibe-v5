/**
 * Shared Module
 *
 * 🔧 모든 모듈에서 공통으로 사용하는 유틸리티
 * - 공통 타입 정의
 * - 유틸리티 함수
 * - 상수 정의
 */

// Types
export type { BaseConfig, ModuleInfo, APIResponse, ErrorInfo } from './types';

// Utils
export {
  generateId,
  formatDate,
  debounce,
  throttle,
  deepMerge,
  validateConfig,
} from './utils';

// Constants
export {
  MODULE_VERSIONS,
  API_ENDPOINTS,
  ERROR_CODES,
  DEFAULT_TIMEOUTS,
} from './constants';

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
  const [reqMajor, reqMinor] = requiredVersion.split('.').map(Number);
  const [curMajor, curMinor] = currentVersion.split('.').map(Number);

  return curMajor >= reqMajor && curMinor >= reqMinor;
};
