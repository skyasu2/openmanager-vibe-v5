/**
 * 🧪 Encryption Adapter 유틸리티 단위 테스트
 *
 * Vercel 무료 티어 안전:
 * - 순수 함수 테스트 (외부 API 호출 없음)
 * - 암호화 작업 없음 (타입 변환만 테스트)
 * - 동기 연산만 수행
 */

import { describe, expect, it } from 'vitest';
import type { EncryptedEnvData } from '@/lib/crypto/EnhancedEnvCryptoManager';
import {
  adaptEncryptedEnvDataToEnvVar,
  adaptEncryptedEnvironmentConfigToEnvConfig,
  adaptEncryptedEnvVarArrayToEnvDataArray,
  adaptEncryptedEnvVarRecordToEnvDataRecord,
  adaptEncryptedEnvVarToEnvData,
  type EncryptedEnvironmentConfig,
  type EncryptedEnvVar,
  isCompleteEncryptedEnvData,
  safeAdaptToEncryptedEnvData,
} from './encryption-adapter';

describe('Encryption Adapter Utilities', () => {
  // ============================================================================
  // adaptEncryptedEnvVarToEnvData 테스트
  // ============================================================================
  describe('adaptEncryptedEnvVarToEnvData', () => {
    it('should convert minimal EncryptedEnvVar to EncryptedEnvData', () => {
      const envVar: EncryptedEnvVar = {
        encrypted: 'encrypted-data',
        iv: 'init-vector',
        authTag: 'auth-tag',
        salt: 'salt-value',
      };

      const result = adaptEncryptedEnvVarToEnvData(envVar);

      expect(result.encrypted).toBe('encrypted-data');
      expect(result.iv).toBe('init-vector');
      expect(result.authTag).toBe('auth-tag');
      expect(result.salt).toBe('salt-value');
      expect(result.algorithm).toBe('aes-256-gcm'); // default
      expect(result.iterations).toBe(100000); // default
      expect(result.version).toBe('1.0.0'); // default
      expect(typeof result.timestamp).toBe('number');
    });

    it('should preserve existing optional fields', () => {
      const envVar: EncryptedEnvVar = {
        encrypted: 'encrypted-data',
        iv: 'init-vector',
        authTag: 'auth-tag',
        salt: 'salt-value',
        algorithm: 'aes-128-gcm',
        iterations: 50000,
        version: '2.0.0',
        timestamp: 1700000000000,
      };

      const result = adaptEncryptedEnvVarToEnvData(envVar);

      expect(result.algorithm).toBe('aes-128-gcm');
      expect(result.iterations).toBe(50000);
      expect(result.version).toBe('2.0.0');
      expect(result.timestamp).toBe(1700000000000);
    });

    it('should parse string timestamp', () => {
      const envVar: EncryptedEnvVar = {
        encrypted: 'encrypted-data',
        iv: 'init-vector',
        authTag: 'auth-tag',
        salt: 'salt-value',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = adaptEncryptedEnvVarToEnvData(envVar);

      expect(result.timestamp).toBe(Date.parse('2024-01-01T00:00:00.000Z'));
    });
  });

  // ============================================================================
  // adaptEncryptedEnvDataToEnvVar 테스트
  // ============================================================================
  describe('adaptEncryptedEnvDataToEnvVar', () => {
    it('should convert EncryptedEnvData to EncryptedEnvVar', () => {
      const envData: EncryptedEnvData = {
        encrypted: 'encrypted-data',
        iv: 'init-vector',
        authTag: 'auth-tag',
        salt: 'salt-value',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      const result = adaptEncryptedEnvDataToEnvVar(envData);

      expect(result.encrypted).toBe('encrypted-data');
      expect(result.iv).toBe('init-vector');
      expect(result.authTag).toBe('auth-tag');
      expect(result.salt).toBe('salt-value');
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result.iterations).toBe(100000);
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBe(1700000000000);
    });

    it('should be reversible with adaptEncryptedEnvVarToEnvData', () => {
      const original: EncryptedEnvData = {
        encrypted: 'test-encrypted',
        iv: 'test-iv',
        authTag: 'test-auth',
        salt: 'test-salt',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      const envVar = adaptEncryptedEnvDataToEnvVar(original);
      const restored = adaptEncryptedEnvVarToEnvData(envVar);

      expect(restored).toEqual(original);
    });
  });

  // ============================================================================
  // isCompleteEncryptedEnvData 테스트
  // ============================================================================
  describe('isCompleteEncryptedEnvData', () => {
    it('should return true for complete EncryptedEnvData', () => {
      const complete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      expect(isCompleteEncryptedEnvData(complete)).toBe(true);
    });

    it('should return false for missing algorithm', () => {
      const incomplete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        iterations: 100000,
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      expect(isCompleteEncryptedEnvData(incomplete)).toBe(false);
    });

    it('should return false for missing iterations', () => {
      const incomplete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      expect(isCompleteEncryptedEnvData(incomplete)).toBe(false);
    });

    it('should return false for missing timestamp', () => {
      const incomplete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        version: '1.0.0',
      };

      expect(isCompleteEncryptedEnvData(incomplete)).toBe(false);
    });

    it('should return false for missing version', () => {
      const incomplete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: 1700000000000,
      };

      expect(isCompleteEncryptedEnvData(incomplete)).toBe(false);
    });
  });

  // ============================================================================
  // safeAdaptToEncryptedEnvData 테스트
  // ============================================================================
  describe('safeAdaptToEncryptedEnvData', () => {
    it('should return data as-is if already complete', () => {
      const complete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: 1700000000000,
        version: '1.0.0',
      };

      const result = safeAdaptToEncryptedEnvData(complete);

      // Should preserve exact values
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result.iterations).toBe(100000);
      expect(result.timestamp).toBe(1700000000000);
      expect(result.version).toBe('1.0.0');
    });

    it('should adapt incomplete data with defaults', () => {
      const incomplete: EncryptedEnvVar = {
        encrypted: 'data',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
      };

      const result = safeAdaptToEncryptedEnvData(incomplete);

      expect(result.algorithm).toBe('aes-256-gcm'); // default
      expect(result.iterations).toBe(100000); // default
      expect(result.version).toBe('1.0.0'); // default
      expect(typeof result.timestamp).toBe('number');
    });
  });

  // ============================================================================
  // adaptEncryptedEnvVarArrayToEnvDataArray 테스트
  // ============================================================================
  describe('adaptEncryptedEnvVarArrayToEnvDataArray', () => {
    it('should convert array of EncryptedEnvVar to EncryptedEnvData', () => {
      const envVars: EncryptedEnvVar[] = [
        { encrypted: 'e1', iv: 'iv1', authTag: 'at1', salt: 's1' },
        { encrypted: 'e2', iv: 'iv2', authTag: 'at2', salt: 's2' },
      ];

      const result = adaptEncryptedEnvVarArrayToEnvDataArray(envVars);

      expect(result).toHaveLength(2);
      expect(result[0].encrypted).toBe('e1');
      expect(result[1].encrypted).toBe('e2');
      expect(result[0].algorithm).toBe('aes-256-gcm');
      expect(result[1].algorithm).toBe('aes-256-gcm');
    });

    it('should handle empty array', () => {
      const result = adaptEncryptedEnvVarArrayToEnvDataArray([]);
      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // adaptEncryptedEnvVarRecordToEnvDataRecord 테스트
  // ============================================================================
  describe('adaptEncryptedEnvVarRecordToEnvDataRecord', () => {
    it('should convert Record of EncryptedEnvVar to EncryptedEnvData', () => {
      const envVarRecord: Record<string, EncryptedEnvVar> = {
        API_KEY: { encrypted: 'e1', iv: 'iv1', authTag: 'at1', salt: 's1' },
        SECRET: { encrypted: 'e2', iv: 'iv2', authTag: 'at2', salt: 's2' },
      };

      const result = adaptEncryptedEnvVarRecordToEnvDataRecord(envVarRecord);

      expect(Object.keys(result)).toEqual(['API_KEY', 'SECRET']);
      expect(result.API_KEY.encrypted).toBe('e1');
      expect(result.SECRET.encrypted).toBe('e2');
      expect(result.API_KEY.algorithm).toBe('aes-256-gcm');
    });

    it('should handle empty record', () => {
      const result = adaptEncryptedEnvVarRecordToEnvDataRecord({});
      expect(result).toEqual({});
    });
  });

  // ============================================================================
  // adaptEncryptedEnvironmentConfigToEnvConfig 테스트
  // ============================================================================
  describe('adaptEncryptedEnvironmentConfigToEnvConfig', () => {
    it('should convert EncryptedEnvironmentConfig to EncryptedEnvConfig', () => {
      const config: EncryptedEnvironmentConfig = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        teamPasswordHash: 'hash123',
        variables: {
          API_KEY: { encrypted: 'e1', iv: 'iv1', authTag: 'at1', salt: 's1' },
        },
      };

      const result = adaptEncryptedEnvironmentConfigToEnvConfig(config);

      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('production'); // default
      expect(result.variables.API_KEY.encrypted).toBe('e1');
      expect(typeof result.checksum).toBe('string');
    });

    it('should generate consistent checksum for same data', () => {
      const config: EncryptedEnvironmentConfig = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        teamPasswordHash: 'hash123',
        variables: {
          API_KEY: {
            encrypted: 'e1',
            iv: 'iv1',
            authTag: 'at1',
            salt: 's1',
            algorithm: 'aes-256-gcm',
            iterations: 100000,
            timestamp: 1700000000000,
            version: '1.0.0',
          },
        },
      };

      const result1 = adaptEncryptedEnvironmentConfigToEnvConfig(config);
      const result2 = adaptEncryptedEnvironmentConfigToEnvConfig(config);

      expect(result1.checksum).toBe(result2.checksum);
    });

    it('should generate different checksum for different data', () => {
      const config1: EncryptedEnvironmentConfig = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        teamPasswordHash: 'hash123',
        variables: {
          API_KEY: {
            encrypted: 'e1',
            iv: 'iv1',
            authTag: 'at1',
            salt: 's1',
            algorithm: 'aes-256-gcm',
            iterations: 100000,
            timestamp: 1700000000000,
            version: '1.0.0',
          },
        },
      };

      const config2: EncryptedEnvironmentConfig = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        teamPasswordHash: 'hash123',
        variables: {
          API_KEY: {
            encrypted: 'different',
            iv: 'iv1',
            authTag: 'at1',
            salt: 's1',
            algorithm: 'aes-256-gcm',
            iterations: 100000,
            timestamp: 1700000000000,
            version: '1.0.0',
          },
        },
      };

      const result1 = adaptEncryptedEnvironmentConfigToEnvConfig(config1);
      const result2 = adaptEncryptedEnvironmentConfigToEnvConfig(config2);

      expect(result1.checksum).not.toBe(result2.checksum);
    });
  });
});
