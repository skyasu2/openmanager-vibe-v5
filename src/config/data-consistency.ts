/**
 * ��� 데이터 일관성 중앙 관리 시스템
 * 
 * 모든 페이지네이션, 데이터 크기 설정을 중앙에서 관리하여
 * 프론트엔드-백엔드 간 불일치 문제를 원천 차단합니다.
 */

import { ACTIVE_SERVER_CONFIG } from './serverConfig';

export interface DataConsistencyConfig {
  // 서버 데이터 설정
  servers: {
    totalCount: number;           // 총 서버 개수
    itemsPerPage: number;         // 페이지당 표시 개수
    apiDefaultLimit: number;      // API 기본 제한
    maxItemsPerPage: number;      // 최대 페이지 크기
  };
  
  // 캐시 설정
  cache: {
    enableMockMode: boolean;      // 목업 모드 활성화
    healthCheckInterval: number;  // 헬스체크 간격 (과도한 체크 방지)
    dataRefreshInterval: number;  // 데이터 새로고침 간격
  };
  
  // 검증 설정
  validation: {
    enableRuntimeCheck: boolean;  // 런타임 데이터 검증
    enableBuildTimeCheck: boolean; // 빌드 타임 검증
    logInconsistencies: boolean;  // 불일치 로깅
  };
}

/**
 * ��� 중앙집중식 데이터 일관성 설정
 */
export const DATA_CONSISTENCY_CONFIG: DataConsistencyConfig = {
  servers: {
    totalCount: ACTIVE_SERVER_CONFIG.maxServers,     // 15개 (중앙 설정)
    itemsPerPage: ACTIVE_SERVER_CONFIG.maxServers,   // 15개로 통일 (페이지네이션 불일치 해결)
    apiDefaultLimit: ACTIVE_SERVER_CONFIG.maxServers, // 15개로 통일
    maxItemsPerPage: 50,                             // 최대 50개
  },
  
  cache: {
    enableMockMode: false,                           // ��� 목업 모드 비활성화 (실제 데이터 사용)
    healthCheckInterval: 300000,                     // 5분 간격 (과도한 체크 방지)
    dataRefreshInterval: ACTIVE_SERVER_CONFIG.cache.updateInterval, // 35초 (중앙 설정)
  },
  
  validation: {
    enableRuntimeCheck: process.env.NODE_ENV === 'development', // 개발 환경에서만 검증
    enableBuildTimeCheck: true,                      // 빌드 타임 검증 활성화
    logInconsistencies: process.env.NODE_ENV === 'development', // 개발 환경에서만 로깅
  },
};

/**
 * ��� 데이터 일관성 검증 함수
 */
export function validateDataConsistency(): {
  isConsistent: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const config = DATA_CONSISTENCY_CONFIG;
  
  // 1. 서버 개수 일관성 체크
  if (config.servers.itemsPerPage !== config.servers.totalCount) {
    issues.push(`페이지네이션 불일치: itemsPerPage(${config.servers.itemsPerPage}) !== totalCount(${config.servers.totalCount})`);
    recommendations.push('itemsPerPage를 totalCount와 동일하게 설정하여 모든 서버가 표시되도록 하세요');
  }
  
  if (config.servers.apiDefaultLimit !== config.servers.totalCount) {
    issues.push(`API 제한 불일치: apiDefaultLimit(${config.servers.apiDefaultLimit}) !== totalCount(${config.servers.totalCount})`);
    recommendations.push('API 기본 제한을 총 서버 개수와 동일하게 설정하세요');
  }
  
  // 2. 캐시 설정 체크
  if (config.cache.healthCheckInterval < 60000) {
    issues.push(`헬스체크 간격이 너무 짧음: ${config.cache.healthCheckInterval}ms < 60초`);
    recommendations.push('과도한 헬스체크 방지를 위해 최소 1분 간격으로 설정하세요');
  }
  
  return {
    isConsistent: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * ���️ 안전한 헬스체크 설정
 */
export function getSafeHealthCheckConfig() {
  return {
    interval: DATA_CONSISTENCY_CONFIG.cache.healthCheckInterval,
    enableMockMode: DATA_CONSISTENCY_CONFIG.cache.enableMockMode,
    maxRetries: 2,                    // 최대 2회 재시도
    timeout: 3000,                    // 3초 타임아웃
    circuitBreakerThreshold: 5,       // 연속 5회 실패 시 차단
    circuitBreakerResetTime: 300000,  // 5분 후 재시도
  };
}

/**
 * ��� 데이터 일관성 상태 로깅
 */
export function logDataConsistencyStatus(): void {
  const validation = validateDataConsistency();
  const config = DATA_CONSISTENCY_CONFIG;
  
  console.log('��� 데이터 일관성 설정 상태:');
  console.log(`  ��� 서버 총 개수: ${config.servers.totalCount}개`);
  console.log(`  ��� 페이지당 표시: ${config.servers.itemsPerPage}개`);
  console.log(`  ��� API 기본 제한: ${config.servers.apiDefaultLimit}개`);
  console.log(`  ��� 목업 모드: ${config.cache.enableMockMode ? '활성화' : '비활성화'}`);
  console.log(`  ⏱️ 헬스체크 간격: ${config.cache.healthCheckInterval / 1000}초`);
  
  if (validation.isConsistent) {
    console.log('✅ 데이터 일관성 검증 통과');
  } else {
    console.warn('⚠️ 데이터 일관성 문제 발견:');
    validation.issues.forEach(issue => console.warn(`  - ${issue}`));
    console.log('��� 권장사항:');
    validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

// ��� 초기화 시 자동 검증 및 로깅
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  logDataConsistencyStatus();
}
