/**
 * 🔄 암호화 타입 어댑터 유틸리티
 *
 * EncryptedEnvVar와 EncryptedEnvData 간의 타입 호환성 문제 해결
 * 레거시 암호화 형식을 새로운 Enhanced 형식으로 변환
 */

import type {
  EncryptedEnvData,
  EncryptedEnvConfig,
} from '@/lib/crypto/EnhancedEnvCryptoManager';

/**
 * 레거시 EncryptedEnvVar 타입 정의
 */
export interface EncryptedEnvVar {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
  // 누락된 속성들 (옵셔널)
  algorithm?: string;
  iterations?: number;
  timestamp?: string | number; // 문자열 또는 숫자 모두 허용
  version?: string;
}

/**
 * 레거시 EncryptedEnvironmentConfig 타입 정의
 */
export interface EncryptedEnvironmentConfig {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

/**
 * EncryptedEnvVar를 EncryptedEnvData로 변환하는 어댑터 함수
 *
 * @param envVar 레거시 형식의 암호화 변수
 * @returns Enhanced 형식의 암호화 데이터
 */
export function adaptEncryptedEnvVarToEnvData(
  envVar: EncryptedEnvVar
): EncryptedEnvData {
  // timestamp 처리: 문자열이면 숫자로 변환, 없으면 현재 시간
  let timestamp = Date.now();
  if (envVar.timestamp) {
    if (typeof envVar.timestamp === 'string') {
      timestamp = Date.parse(envVar.timestamp);
    } else {
      timestamp = envVar.timestamp;
    }
  }

  return {
    encrypted: envVar.encrypted,
    salt: envVar.salt,
    iv: envVar.iv,
    authTag: envVar.authTag,
    algorithm: envVar.algorithm || 'aes-256-gcm', // 기본값
    iterations: envVar.iterations || 100000, // 기본값
    timestamp: timestamp,
    version: envVar.version || '1.0.0', // 기본값
  };
}

/**
 * 역방향 어댑터: EncryptedEnvData를 EncryptedEnvVar로 변환
 *
 * @param envData Enhanced 형식의 암호화 데이터
 * @returns 레거시 형식의 암호화 변수
 */
export function adaptEncryptedEnvDataToEnvVar(
  envData: EncryptedEnvData
): EncryptedEnvVar {
  return {
    encrypted: envData.encrypted,
    iv: envData.iv,
    authTag: envData.authTag,
    salt: envData.salt,
    algorithm: envData.algorithm,
    iterations: envData.iterations,
    timestamp: envData.timestamp,
    version: envData.version,
  };
}

/**
 * EncryptedEnvVar 배열을 EncryptedEnvData 배열로 변환
 */
export function adaptEncryptedEnvVarArrayToEnvDataArray(
  envVars: EncryptedEnvVar[]
): EncryptedEnvData[] {
  return envVars.map(adaptEncryptedEnvVarToEnvData);
}

/**
 * Record<string, EncryptedEnvVar>를 Record<string, EncryptedEnvData>로 변환
 */
export function adaptEncryptedEnvVarRecordToEnvDataRecord(
  envVarRecord: Record<string, EncryptedEnvVar>
): Record<string, EncryptedEnvData> {
  const result: Record<string, EncryptedEnvData> = {};

  for (const [key, envVar] of Object.entries(envVarRecord)) {
    result[key] = adaptEncryptedEnvVarToEnvData(envVar);
  }

  return result;
}

/**
 * EncryptedEnvVar가 완전한 EncryptedEnvData 형식인지 확인
 */
export function isCompleteEncryptedEnvData(
  envVar: EncryptedEnvVar
): envVar is EncryptedEnvData {
  return !!(
    envVar.algorithm &&
    envVar.iterations &&
    envVar.timestamp &&
    envVar.version
  );
}

/**
 * 안전한 어댑터: 이미 완전한 형식이면 그대로 반환, 아니면 변환
 */
export function safeAdaptToEncryptedEnvData(
  envVar: EncryptedEnvVar | EncryptedEnvData
): EncryptedEnvData {
  // 이미 완전한 EncryptedEnvData 형식인지 확인
  if (isCompleteEncryptedEnvData(envVar)) {
    return envVar as EncryptedEnvData;
  }

  // 불완전한 형식이면 어댑터를 통해 변환
  return adaptEncryptedEnvVarToEnvData(envVar);
}

/**
 * EncryptedEnvironmentConfig를 EncryptedEnvConfig로 변환하는 어댑터 함수
 *
 * @param envConfig 레거시 형식의 환경 설정
 * @returns Enhanced 형식의 환경 설정
 */
export function adaptEncryptedEnvironmentConfigToEnvConfig(
  envConfig: EncryptedEnvironmentConfig
): EncryptedEnvConfig {
  // 변수들을 EncryptedEnvData 형식으로 변환
  const adaptedVariables = adaptEncryptedEnvVarRecordToEnvDataRecord(
    envConfig.variables
  );

  // 체크섬 생성 (간단한 해시)
  const checksum = generateSimpleChecksum(JSON.stringify(adaptedVariables));

  return {
    version: envConfig.version,
    environment: 'production', // 기본값
    variables: adaptedVariables,
    checksum: checksum,
  };
}

/**
 * 간단한 체크섬 생성 함수
 */
function generateSimpleChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  return hash.toString(16);
}
