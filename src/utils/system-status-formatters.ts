/**
 * 🔧 TDD Refactor - 시스템 상태 포맷터 유틸리티
 *
 * @description
 * EnhancedProfileStatusDisplay에서 분리된 유틸리티 함수들
 * 재사용성과 테스트 가능성을 높이기 위해 분리했습니다.
 */

/**
 * 업타임을 사람이 읽기 쉬운 형태로 변환
 *
 * @param seconds 업타임 (초 단위)
 * @returns 포맷된 업타임 문자열
 *
 * @example
 * formatUptime(0) // "0분"
 * formatUptime(3600) // "1시간 0분"
 * formatUptime(7260) // "2시간 1분"
 */
export const formatUptime = (seconds: number): string => {
  if (seconds === 0) return '0분';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

/**
 * 환경 이름을 표시용으로 변환
 *
 * @param env 환경 문자열
 * @returns 표시용 환경 이름
 *
 * @example
 * formatEnvironment('production') // "Production"
 * formatEnvironment('development') // "Development"
 */
export const formatEnvironment = (env: string): string => {
  const envMap: Record<string, string> = {
    production: 'Production',
    development: 'Development',
    staging: 'Staging',
    test: 'Test',
  };
  return envMap[env] || env;
};

/**
 * 시스템 상태에 따른 CSS 클래스 반환
 *
 * @param isRunning 시스템 실행 여부
 * @param isStarting 시스템 시작 중 여부
 * @returns CSS 클래스 문자열
 */
export const getStatusStyle = (
  isRunning: boolean,
  isStarting: boolean
): string => {
  if (isStarting) {
    return 'text-yellow-500 animate-pulse';
  }
  if (isRunning) {
    return 'text-green-500 animate-pulse';
  }
  return 'text-red-500';
};

/**
 * 시스템 상태에 따른 텍스트 반환
 *
 * @param isRunning 시스템 실행 여부
 * @param isStarting 시스템 시작 중 여부
 * @returns 상태 텍스트
 */
export const getStatusText = (
  isRunning: boolean,
  isStarting: boolean
): string => {
  if (isStarting) {
    return '시스템 시작 중...';
  }
  if (isRunning) {
    return '시스템 실행 중';
  }
  return '시스템 중지됨';
};

/**
 * 서비스 상태에 따른 CSS 클래스 반환
 *
 * @param isHealthy 서비스 건강 상태
 * @returns CSS 클래스 문자열
 */
export const getServiceStatusStyle = (isHealthy: boolean): string => {
  return isHealthy ? 'text-green-500' : 'text-red-500';
};
