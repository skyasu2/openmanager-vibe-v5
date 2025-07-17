import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  EnhancedEnvCryptoManager as UnifiedEnvCryptoManager,
  type EncryptedEnvData,
} from '../../../src/lib/crypto/EnhancedEnvCryptoManager';

describe('UnifiedEnvCryptoManager', () => {
  let cryptoManager: UnifiedEnvCryptoManager;
  const testPassword = 'openmanager2025';
  const testValue = 'test-secret-value';

  beforeEach(() => {
    cryptoManager = UnifiedEnvCryptoManager.getInstance();
  });

  afterEach(() => {
    // EnhancedEnvCryptoManager doesn't have clearSensitiveData method
    // Using reflection to clear cache if needed
    if ((cryptoManager as any).decryptedCache) {
      (cryptoManager as any).decryptedCache.clear();
    }
  });

  describe('싱글톤 패턴', () => {
    it('동일한 인스턴스를 반환해야 함', () => {
      const instance1 = UnifiedEnvCryptoManager.getInstance();
      const instance2 = UnifiedEnvCryptoManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('암호화 기능', () => {
    it('값을 성공적으로 암호화해야 함', async () => {
      const encrypted = cryptoManager.encryptVariable('TEST_KEY', testValue, testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.timestamp).toBeDefined();
      expect(encrypted.version).toBe('1.0.0');
    });

    it('같은 값도 매번 다른 암호화 결과를 생성해야 함', async () => {
      const encrypted1 = cryptoManager.encryptVariable('TEST_KEY', testValue, testPassword);
      const encrypted2 = cryptoManager.encryptVariable('TEST_KEY', testValue, testPassword);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('빈 값 암호화 시 오류를 발생시켜야 함', async () => {
      expect(() => cryptoManager.encryptVariable('TEST_KEY', '', testPassword)).toThrow();
    });

    it('빈 비밀번호로 암호화 시 오류를 발생시켜야 함', async () => {
      expect(() => cryptoManager.encryptVariable('TEST_KEY', testValue, '')).toThrow();
    });
  });

  describe('복호화 기능', () => {
    it('암호화된 값을 성공적으로 복호화해야 함', async () => {
      const encrypted = await cryptoManager.encrypt(testValue, testPassword);
      const decrypted = await cryptoManager.decrypt(encrypted, testPassword);

      expect(decrypted).toBe(testValue);
    });

    it('잘못된 비밀번호로 복호화 시 오류를 발생시켜야 함', async () => {
      const encrypted = cryptoManager.encryptVariable('TEST_KEY', testValue, testPassword);

      expect(() =>
        cryptoManager.decryptVariable(encrypted, 'wrong-password')
      ).toThrow();
    });

    it('잘못된 암호화 데이터로 복호화 시 오류를 발생시켜야 핈', async () => {
      const invalidData: EncryptedEnvData = {
        encrypted: 'invalid',
        salt: 'invalid',
        iv: 'invalid',
        authTag: 'invalid',
        algorithm: 'aes-256-gcm',
        iterations: 100000,
        timestamp: Date.now(),
        version: '2.0',
      };

      expect(() =>
        cryptoManager.decryptVariable(invalidData, testPassword)
      ).toThrow();
    });
  });

  describe('암복호화 통합 테스트', () => {
    it('다양한 문자열을 암복호화해야 함', async () => {
      const testCases = [
        'simple-string',
        'special-chars-!@#$%^&*()',
        'korean-한글-테스트',
        'numbers-123456789',
        'mixed-문자열123!@#',
        'very-long-string-' + 'a'.repeat(1000),
      ];

      for (const testCase of testCases) {
        const encrypted = await cryptoManager.encrypt(testCase, testPassword);
        const decrypted = await cryptoManager.decrypt(encrypted, testPassword);
        expect(decrypted).toBe(testCase);
      }
    });

    it('다양한 비밀번호로 암복호화해야 함', async () => {
      const passwords = [
        'openmanager2025',
        'openmanager-vibe-v5-2025',
        'team-password-2025',
        'special-chars-!@#$%',
        'korean-비밀번호-테스트',
      ];

      for (const password of passwords) {
        const encrypted = await cryptoManager.encrypt(testValue, password);
        const decrypted = await cryptoManager.decrypt(encrypted, password);
        expect(decrypted).toBe(testValue);
      }
    });
  });

  describe('자동 복구 기능', () => {
    it('자동 복구 메서드가 정의되어야 함', () => {
      expect(cryptoManager.autoRecoverEnvVars).toBeDefined();
      expect(typeof cryptoManager.autoRecoverEnvVars).toBe('function');
    });

    it('자동 복구 메서드가 객체를 반환해야 함', async () => {
      const result = await cryptoManager.autoRecoverEnvVars(['test-password']);
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });

  describe('성능 테스트', () => {
    it('10회 암복호화가 합리적인 시간 내에 완료되어야 함', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        const encrypted = await cryptoManager.encrypt(
          `test-value-${i}`,
          testPassword
        );
        const decrypted = await cryptoManager.decrypt(encrypted, testPassword);
        expect(decrypted).toBe(`test-value-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10초 이내에 완료되어야 함
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('보안 기능', () => {
    it('민감한 데이터 정리 메서드가 정의되어야 함', () => {
      expect(cryptoManager.clearSensitiveData).toBeDefined();
      expect(typeof cryptoManager.clearSensitiveData).toBe('function');
    });

    it('민감한 데이터 정리가 오류 없이 실행되어야 함', () => {
      expect(() => cryptoManager.clearSensitiveData()).not.toThrow();
    });
  });

  describe('에러 처리', () => {
    it('암호화 실패 시 적절한 에러 메시지를 제공해야 함', async () => {
      try {
        await cryptoManager.encrypt(testValue, '');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('암호화 실패');
      }
    });

    it('복호화 실패 시 적절한 에러 메시지를 제공해야 함', async () => {
      const invalidData: EncryptedData = {
        encrypted: 'invalid',
        salt: 'invalid',
        iv: 'invalid',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      try {
        await cryptoManager.decrypt(invalidData, testPassword);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('복호화 실패');
      }
    });
  });
});
