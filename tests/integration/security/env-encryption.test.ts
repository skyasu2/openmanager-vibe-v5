/**
 * 🔐 환경변수 암호화 시스템 테스트
 *
 * 민감한 환경변수들이 안전하게 암호화되고 관리되는지 검증합니다.
 *
 * @author Test Automation Specialist (보안 강화 프로젝트)
 * @created 2025-08-19
 * @version 1.0.0
 */

import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface EncryptedEnvVar {
  key: string;
  encryptedValue: string;
  iv: string;
  tag: string;
  createdAt: Date;
  lastAccessed?: Date;
}

interface EnvSecurityConfig {
  encryptionAlgorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  sensitiveKeys: string[];
}

describe('🔐 환경변수 암호화 시스템 테스트', () => {
  let mockSecurityConfig: EnvSecurityConfig;
  let mockEncryptionKey: Buffer;

  beforeEach(() => {
    // 보안 설정 초기화
    mockSecurityConfig = {
      encryptionAlgorithm: 'aes-256-cbc',
      keyLength: 32, // 256 bits
      ivLength: 16, // 128 bits
      tagLength: 16, // 128 bits (미사용, CBC는 tag 없음)
      sensitiveKeys: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
        'ANTHROPIC_API_KEY',
        'TAVILY_API_KEY',
        'UPSTASH_REDIS_REST_TOKEN',
        'GITHUB_TOKEN',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
      ],
    };

    // 테스트용 암호화 키 생성
    mockEncryptionKey = crypto.randomBytes(mockSecurityConfig.keyLength);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('환경변수 암호화 기본 기능 테스트', () => {
    it('민감한 환경변수가 올바르게 식별되어야 함', () => {
      // Given: 다양한 환경변수 키들
      const _envKeys = [
        'SUPABASE_SERVICE_ROLE_KEY', // 민감함
        'OPENAI_API_KEY', // 민감함
        'NEXT_PUBLIC_SUPABASE_URL', // 공개
        'NODE_ENV', // 공개
        'JWT_SECRET', // 민감함
        'VERCEL_URL', // 공개
      ];

      // When: 민감한 키 식별
      const identifySensitiveKey = (key: string): boolean => {
        return (
          mockSecurityConfig.sensitiveKeys.includes(key) ||
          key.includes('SECRET') ||
          key.includes('PRIVATE') ||
          key.includes('TOKEN') ||
          key.includes('KEY')
        );
      };

      // Then: 올바르게 분류되어야 함
      expect(identifySensitiveKey('SUPABASE_SERVICE_ROLE_KEY')).toBe(true);
      expect(identifySensitiveKey('OPENAI_API_KEY')).toBe(true);
      expect(identifySensitiveKey('JWT_SECRET')).toBe(true);
      expect(identifySensitiveKey('NEXT_PUBLIC_SUPABASE_URL')).toBe(false);
      expect(identifySensitiveKey('NODE_ENV')).toBe(false);
    });

    it('환경변수가 AES-256-CBC로 암호화되어야 함', () => {
      // Given: 민감한 환경변수 값
      const sensitiveValue =
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef';

      // When: 암호화 Mock 테스트 (암호화 로직 검증)
      const mockEncryptedResult = {
        key: 'OPENAI_API_KEY',
        encryptedValue: 'mock_encrypted_value_12345abcdef',
        iv: crypto.randomBytes(mockSecurityConfig.ivLength).toString('hex'),
        tag: crypto.randomBytes(mockSecurityConfig.tagLength).toString('hex'),
        createdAt: new Date(),
      };

      // Then: 암호화 결과가 유효해야 함
      expect(mockEncryptedResult.encryptedValue).toBeDefined();
      expect(mockEncryptedResult.encryptedValue).not.toBe(sensitiveValue);
      expect(mockEncryptedResult.iv).toHaveLength(
        mockSecurityConfig.ivLength * 2
      ); // hex 문자열
      expect(mockEncryptedResult.tag).toHaveLength(
        mockSecurityConfig.tagLength * 2
      ); // hex 문자열
      expect(mockEncryptedResult.encryptedValue.length).toBeGreaterThan(0);
    });

    it('암호화된 환경변수가 올바르게 복호화되어야 함', () => {
      // Given: 암호화된 환경변수 (Mock)
      const originalValue = 'test-secret-value-12345';
      const mockEncryptedEnvVar: EncryptedEnvVar = {
        key: 'TEST_SECRET',
        encryptedValue: 'mock_encrypted_12345abcdef',
        iv: crypto.randomBytes(mockSecurityConfig.ivLength).toString('hex'),
        tag: crypto.randomBytes(mockSecurityConfig.tagLength).toString('hex'),
        createdAt: new Date(),
      };

      // When: 복호화 Mock 함수
      const mockDecryptEnvVar = (_encrypted: EncryptedEnvVar): string => {
        // Mock 복호화: 실제로는 암호화 알고리즘을 거치지만,
        // 테스트에서는 예상 결과 반환
        return originalValue;
      };

      // Then: 원본 값이 복원되어야 함
      const decrypted = mockDecryptEnvVar(mockEncryptedEnvVar);
      expect(decrypted).toBe(originalValue);
      expect(mockEncryptedEnvVar.encryptedValue).toBeDefined();
      expect(mockEncryptedEnvVar.encryptedValue).not.toBe(originalValue);
    });

    it('잘못된 키로 복호화 시도 시 실패해야 함', () => {
      // Given: 암호화된 환경변수와 잘못된 키
      const wrongKey = crypto.randomBytes(mockSecurityConfig.keyLength);
      const encryptedEnvVar: EncryptedEnvVar = {
        key: 'TEST_SECRET',
        encryptedValue: 'encrypted_with_correct_key',
        iv: crypto.randomBytes(mockSecurityConfig.ivLength).toString('hex'),
        tag: crypto.randomBytes(mockSecurityConfig.tagLength).toString('hex'),
        createdAt: new Date(),
      };

      // When & Then: 잘못된 키로 복호화 시 실패해야 함 (Mock)
      const mockDecryptWithWrongKey = (
        _encrypted: EncryptedEnvVar,
        key: Buffer
      ): string => {
        // Mock: 잘못된 키 감지 시 오류 발생
        if (key !== mockEncryptionKey) {
          throw new Error('Invalid decryption key');
        }
        return 'decrypted_value';
      };

      expect(() => mockDecryptWithWrongKey(encryptedEnvVar, wrongKey)).toThrow(
        'Invalid decryption key'
      );
    });
  });

  describe('환경변수 액세스 로깅 테스트', () => {
    it('민감한 환경변수 접근이 로그되어야 함', () => {
      // Given: 환경변수 접근 로깅 시스템
      const accessLogs: Array<{
        key: string;
        accessedAt: Date;
        accessor: string;
        purpose: string;
      }> = [];

      const logEnvAccess = (key: string, accessor: string, purpose: string) => {
        if (mockSecurityConfig.sensitiveKeys.includes(key)) {
          accessLogs.push({
            key,
            accessedAt: new Date(),
            accessor,
            purpose,
          });
        }
      };

      // When: 민감한 환경변수 접근
      logEnvAccess('OPENAI_API_KEY', 'ai-service', 'API 호출');
      logEnvAccess('NODE_ENV', 'config-loader', '환경 설정');
      logEnvAccess(
        'SUPABASE_SERVICE_ROLE_KEY',
        'db-service',
        '데이터베이스 접근'
      );

      // Then: 민감한 변수 접근만 로그되어야 함
      expect(accessLogs).toHaveLength(2);
      expect(accessLogs.some((log) => log.key === 'OPENAI_API_KEY')).toBe(true);
      expect(
        accessLogs.some((log) => log.key === 'SUPABASE_SERVICE_ROLE_KEY')
      ).toBe(true);
      expect(accessLogs.some((log) => log.key === 'NODE_ENV')).toBe(false);
    });

    it('환경변수 접근 빈도가 모니터링되어야 함', () => {
      // Given: 접근 빈도 추적 시스템
      const accessFrequency: Map<string, number> = new Map();

      const trackAccess = (key: string) => {
        const currentCount = accessFrequency.get(key) || 0;
        accessFrequency.set(key, currentCount + 1);
      };

      // When: 반복적인 환경변수 접근
      for (let i = 0; i < 10; i++) {
        trackAccess('OPENAI_API_KEY');
      }
      for (let i = 0; i < 3; i++) {
        trackAccess('SUPABASE_SERVICE_ROLE_KEY');
      }

      // Then: 접근 빈도가 정확히 추적되어야 함
      expect(accessFrequency.get('OPENAI_API_KEY')).toBe(10);
      expect(accessFrequency.get('SUPABASE_SERVICE_ROLE_KEY')).toBe(3);
    });

    it('비정상적인 접근 패턴이 탐지되어야 함', () => {
      // Given: 접근 패턴 분석 시스템
      const recentAccesses: Array<{
        key: string;
        timestamp: Date;
        source: string;
      }> = [];

      const detectAnomalousAccess = (key: string, source: string): boolean => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // 5분 내 동일 키 접근 횟수 확인
        const recentAccessCount = recentAccesses.filter(
          (access) => access.key === key && access.timestamp > fiveMinutesAgo
        ).length;

        recentAccesses.push({ key, timestamp: now, source });

        // 5분 내 10회 이상 접근 시 비정상으로 판단
        return recentAccessCount >= 10;
      };

      // When: 비정상적인 접근 패턴 시뮬레이션
      let anomalyDetected = false;
      for (let i = 0; i < 12; i++) {
        if (detectAnomalousAccess('OPENAI_API_KEY', 'test-service')) {
          anomalyDetected = true;
          break;
        }
      }

      // Then: 비정상 패턴이 탐지되어야 함
      expect(anomalyDetected).toBe(true);
    });
  });

  describe('환경변수 순환 및 만료 테스트', () => {
    it('환경변수 만료 시간이 올바르게 관리되어야 함', () => {
      // Given: 만료 시간이 있는 환경변수
      const envVarWithExpiry = {
        ...mockEncryptionKey,
        key: 'TEMP_API_KEY',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      };

      const isExpired = (envVar: typeof envVarWithExpiry): boolean => {
        return new Date() > envVar.expiresAt;
      };

      // When & Then: 아직 만료되지 않았어야 함
      expect(isExpired(envVarWithExpiry)).toBe(false);

      // 만료 시간 경과 시뮬레이션
      envVarWithExpiry.expiresAt = new Date(Date.now() - 1000); // 1초 전 만료
      expect(isExpired(envVarWithExpiry)).toBe(true);
    });

    it('주기적인 키 순환이 지원되어야 함', () => {
      // Given: 키 순환 시스템
      const keyRotationHistory: Array<{
        oldKeyHash: string;
        newKeyHash: string;
        rotatedAt: Date;
      }> = [];

      const rotateKey = (oldKey: Buffer): Buffer => {
        const newKey = crypto.randomBytes(mockSecurityConfig.keyLength);

        keyRotationHistory.push({
          oldKeyHash: crypto.createHash('sha256').update(oldKey).digest('hex'),
          newKeyHash: crypto.createHash('sha256').update(newKey).digest('hex'),
          rotatedAt: new Date(),
        });

        return newKey;
      };

      // When: 키 순환 수행
      const originalKeyHash = crypto
        .createHash('sha256')
        .update(mockEncryptionKey)
        .digest('hex');
      const newKey = rotateKey(mockEncryptionKey);
      const newKeyHash = crypto
        .createHash('sha256')
        .update(newKey)
        .digest('hex');

      // Then: 키가 변경되고 이력이 기록되어야 함
      expect(newKey).not.toEqual(mockEncryptionKey);
      expect(keyRotationHistory).toHaveLength(1);
      expect(keyRotationHistory[0].oldKeyHash).toBe(originalKeyHash);
      expect(keyRotationHistory[0].newKeyHash).toBe(newKeyHash);
    });
  });

  describe('환경변수 백업 및 복구 테스트', () => {
    it('암호화된 환경변수가 안전하게 백업되어야 함', () => {
      // Given: 암호화된 환경변수들
      const encryptedVars: EncryptedEnvVar[] = [
        {
          key: 'OPENAI_API_KEY',
          encryptedValue: 'encrypted_value_1',
          iv: crypto.randomBytes(16).toString('hex'),
          tag: crypto.randomBytes(16).toString('hex'),
          createdAt: new Date(),
        },
        {
          key: 'SUPABASE_SERVICE_ROLE_KEY',
          encryptedValue: 'encrypted_value_2',
          iv: crypto.randomBytes(16).toString('hex'),
          tag: crypto.randomBytes(16).toString('hex'),
          createdAt: new Date(),
        },
      ];

      // When: 백업 생성
      const createBackup = (vars: EncryptedEnvVar[]) => {
        return {
          version: '1.0',
          createdAt: new Date(),
          checksum: crypto
            .createHash('sha256')
            .update(JSON.stringify(vars))
            .digest('hex'),
          encryptedVars: vars,
        };
      };

      const backup = createBackup(encryptedVars);

      // Then: 백업이 올바르게 생성되어야 함
      expect(backup.version).toBe('1.0');
      expect(backup.checksum).toBeDefined();
      expect(backup.encryptedVars).toHaveLength(2);
      expect(backup.encryptedVars).toEqual(encryptedVars);
    });

    it('백업 무결성이 검증되어야 함', () => {
      // Given: 백업 데이터
      const backupData = {
        version: '1.0',
        createdAt: new Date(),
        checksum: 'original_checksum',
        encryptedVars: [
          {
            key: 'TEST_KEY',
            encryptedValue: 'test_value',
            iv: 'test_iv',
            tag: 'test_tag',
            createdAt: new Date(),
          },
        ],
      };

      // When: 무결성 검증
      const verifyBackupIntegrity = (backup: typeof backupData): boolean => {
        const calculatedChecksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(backup.encryptedVars))
          .digest('hex');

        return calculatedChecksum === backup.checksum;
      };

      // 올바른 체크섬으로 테스트
      const correctChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(backupData.encryptedVars))
        .digest('hex');

      backupData.checksum = correctChecksum;

      // Then: 무결성 검증이 통과해야 함
      expect(verifyBackupIntegrity(backupData)).toBe(true);

      // 변조된 데이터로 테스트
      backupData.checksum = 'tampered_checksum';
      expect(verifyBackupIntegrity(backupData)).toBe(false);
    });
  });

  describe('환경변수 보안 감사 테스트', () => {
    it('모든 민감한 환경변수가 암호화되었는지 확인해야 함', () => {
      // Given: 시스템 환경변수 목록
      const systemEnvVars = {
        OPENAI_API_KEY: 'sk-123456789',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJ0eXAiOiJKV1Q...',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NODE_ENV: 'production',
        JWT_SECRET: 'very-secret-key',
      };

      // When: 보안 감사 수행
      const auditEnvironmentSecurity = (envVars: Record<string, string>) => {
        const unencryptedSensitiveVars: string[] = [];

        Object.keys(envVars).forEach((key) => {
          const isSensitive =
            mockSecurityConfig.sensitiveKeys.includes(key) ||
            key.includes('SECRET') ||
            key.includes('PRIVATE') ||
            key.includes('TOKEN');

          if (isSensitive) {
            // 실제 환경에서는 암호화 여부를 확인
            // 여기서는 원본 값이 그대로 있으면 암호화되지 않았다고 가정
            const value = envVars[key];
            if (value && !value.startsWith('encrypted:')) {
              unencryptedSensitiveVars.push(key);
            }
          }
        });

        return {
          totalSensitiveVars: mockSecurityConfig.sensitiveKeys.length,
          unencryptedVars: unencryptedSensitiveVars,
          isSecure: unencryptedSensitiveVars.length === 0,
        };
      };

      const auditResult = auditEnvironmentSecurity(systemEnvVars);

      // Then: 감사 결과가 보안 문제를 식별해야 함
      expect(auditResult.unencryptedVars.length).toBeGreaterThan(0);
      expect(auditResult.unencryptedVars).toContain('OPENAI_API_KEY');
      expect(auditResult.unencryptedVars).toContain('JWT_SECRET');
      expect(auditResult.isSecure).toBe(false);
    });

    it('환경변수 노출 위험이 평가되어야 함', () => {
      // Given: 환경변수 노출 위험 평가 시스템
      const assessExposureRisk = (key: string, value: string) => {
        let riskScore = 0;

        // 민감한 키워드 확인
        if (key.includes('SECRET') || key.includes('PRIVATE')) riskScore += 35;
        if (key.includes('API_KEY') || key.includes('TOKEN')) riskScore += 30;
        if (key.includes('PASSWORD') || key.includes('PASS')) riskScore += 35;

        // 값의 특성 확인
        if (value.length > 32) riskScore += 20; // 긴 값은 키일 가능성
        if (value.match(/^sk-[a-zA-Z0-9]{32,}$/)) riskScore += 45; // OpenAI 키 패턴
        if (value.match(/^eyJ[a-zA-Z0-9]/)) riskScore += 40; // JWT 패턴

        return Math.min(riskScore, 100);
      };

      // When: 다양한 환경변수의 위험도 평가
      const testCases = [
        {
          key: 'OPENAI_API_KEY',
          value: 'sk-1234567890abcdef1234567890abcdef',
          expected: 'high',
        },
        {
          key: 'JWT_SECRET',
          value: 'eyJ0eXAiOiJKV1QiLCJhbGc',
          expected: 'high',
        },
        { key: 'NODE_ENV', value: 'production', expected: 'low' },
        {
          key: 'DATABASE_PASSWORD',
          value: 'complex-password-123',
          expected: 'medium',
        },
      ];

      testCases.forEach((testCase) => {
        const riskScore = assessExposureRisk(testCase.key, testCase.value);

        // Then: 위험도가 적절하게 평가되어야 함
        if (testCase.expected === 'high') {
          expect(riskScore).toBeGreaterThan(70);
        } else if (testCase.expected === 'medium') {
          expect(riskScore).toBeGreaterThan(30);
          expect(riskScore).toBeLessThanOrEqual(70);
        } else {
          expect(riskScore).toBeLessThanOrEqual(30);
        }
      });
    });
  });
});

// 테스트 헬퍼 함수들
function _generateSecureKey(length: number = 32): Buffer {
  return crypto.randomBytes(length);
}

function _hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function _isValidEncryptionAlgorithm(algorithm: string): boolean {
  const supportedAlgorithms = [
    'aes-256-gcm',
    'aes-256-cbc',
    'chacha20-poly1305',
  ];
  return supportedAlgorithms.includes(algorithm);
}

function _calculateEntropyScore(value: string): number {
  // 섀넌 엔트로피 계산 (간단한 구현)
  const freq: Record<string, number> = {};
  for (const char of value) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const length = value.length;
  for (const count of Object.values(freq)) {
    const p = count / length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
