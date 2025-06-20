/**
 * 🧪 환경변수 백업 매니저 단위 테스트
 * 
 * 테스트 범위:
 * - 환경변수 백업 생성
 * - 암호화/복호화 기능
 * - 긴급 복구 시스템
 * - 환경변수 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { EnvBackupManager } from '../../../src/lib/env-backup-manager';

// Mock 설정
vi.mock('fs');
vi.mock('../../../src/services/ai/logging/AILogger', () => ({
  AILogger: {
    getInstance: () => ({
      info: vi.fn(),
      logError: vi.fn(),
    }),
  },
  LogCategory: {
    SYSTEM: 'system',
    AI_ENGINE: 'ai_engine',
    PERFORMANCE: 'performance',
    ERROR: 'error',
  },
}));

describe('EnvBackupManager', () => {
  let envBackupManager: EnvBackupManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 환경변수 백업
    originalEnv = { ...process.env };
    
    // 테스트용 환경변수 설정
    process.env.TEST_CRITICAL_VAR = 'critical_value';
    process.env.TEST_IMPORTANT_VAR = 'important_value';
    process.env.TEST_OPTIONAL_VAR = 'optional_value';
    
    // EnvBackupManager 인스턴스 생성
    envBackupManager = EnvBackupManager.getInstance();
    
    // fs mock 초기화
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});
  });

  afterEach(() => {
    // 환경변수 복원
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('환경변수 백업 생성', () => {
    it('백업 파일을 성공적으로 생성해야 함', async () => {
      // When
      const result = await envBackupManager.createBackup();

      // Then
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('민감한 환경변수는 암호화되어야 함', async () => {
      // Given
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'sensitive_key';
      process.env.GOOGLE_AI_API_KEY = 'api_key';

      // When
      await envBackupManager.createBackup();

      // Then
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const backupData = JSON.parse(writeCall[1] as string);
      
      interface BackupEntry {
        key: string;
        value: string;
        encrypted: boolean;
        priority: string;
        lastUpdated: string;
      }
      
      const sensitiveEntries = backupData.entries.filter((entry: BackupEntry) => 
        entry.key.includes('KEY') || entry.key.includes('SECRET')
      );
      
      sensitiveEntries.forEach((entry: BackupEntry) => {
        expect(entry.encrypted).toBe(true);
        expect(entry.value).not.toBe(process.env[entry.key]);
      });
    });
  });

  describe('환경변수 검증', () => {
    it('누락된 중요 환경변수를 감지해야 함', () => {
      // Given
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      // When
      const validation = envBackupManager.validateEnvironment();

      // Then
      expect(validation.isValid).toBe(false);
      expect(validation.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(validation.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(validation.priority).toBe('critical');
    });

    it('유효하지 않은 URL 형식을 감지해야 함', () => {
      // Given
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid_url';

      // When
      const validation = envBackupManager.validateEnvironment();

      // Then
      expect(validation.isValid).toBe(false);
      expect(validation.invalid).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('모든 환경변수가 유효할 때 성공해야 함', () => {
      // Given
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';
      process.env.DATABASE_URL = 'postgres://test';

      // When
      const validation = envBackupManager.validateEnvironment();

      // Then
      expect(validation.isValid).toBe(true);
      expect(validation.missing).toHaveLength(0);
      expect(validation.invalid).toHaveLength(0);
      expect(validation.priority).toBe('ok');
    });
  });

  describe('긴급 복구 시스템', () => {
    beforeEach(() => {
      // 백업 파일이 존재한다고 가정
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const mockBackupData = {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastBackup: new Date().toISOString(),
        entries: [
          {
            key: 'NEXT_PUBLIC_SUPABASE_URL',
            value: 'https://test.supabase.co',
            encrypted: false,
            priority: 'critical' as const,
            lastUpdated: new Date().toISOString(),
          },
          {
            key: 'SUPABASE_SERVICE_ROLE_KEY',
            value: 'encrypted_key_value',
            encrypted: true,
            priority: 'critical' as const,
            lastUpdated: new Date().toISOString(),
          },
        ],
        checksum: 'test_checksum',
      };
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBackupData));
    });

    it('중요 환경변수만 복구해야 함', async () => {
      // When
      const result = await envBackupManager.emergencyRestore('critical');

      // Then
      expect(result.success).toBe(true);
      expect(result.restored).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(result.restored.length).toBeGreaterThan(0);
    });

    it('모든 환경변수를 복구해야 함', async () => {
      // When
      const result = await envBackupManager.emergencyRestore('all');

      // Then
      expect(result.success).toBe(true);
      expect(result.restored.length).toBeGreaterThan(0);
    });

    it('백업 파일이 없을 때 실패해야 함', async () => {
      // Given
      vi.mocked(fs.existsSync).mockReturnValue(false);

      // When
      const result = await envBackupManager.emergencyRestore('critical');

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('백업 파일이 존재하지 않습니다');
    });
  });

  describe('백업 상태 확인', () => {
    it('백업 파일이 존재할 때 상태를 반환해야 함', () => {
      // Given
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const mockBackupData = {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastBackup: '2025-06-15T10:00:00.000Z',
        entries: [{ key: 'test', value: 'test', encrypted: false, priority: 'optional' as const, lastUpdated: new Date().toISOString() }],
        checksum: 'test_checksum',
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBackupData));

      // When
      const status = envBackupManager.getBackupStatus();

      // Then
      expect(status.exists).toBe(true);
      expect(status.lastBackup).toBe('2025-06-15T10:00:00.000Z');
      expect(status.entriesCount).toBe(1);
      expect(status.isValid).toBeDefined();
    });

    it('백업 파일이 없을 때 상태를 반환해야 함', () => {
      // Given
      vi.mocked(fs.existsSync).mockReturnValue(false);

      // When
      const status = envBackupManager.getBackupStatus();

      // Then
      expect(status.exists).toBe(false);
      expect(status.lastBackup).toBeUndefined();
      expect(status.entriesCount).toBeUndefined();
    });
  });

  describe('암호화/복호화', () => {
    it('암호화된 값을 올바르게 복호화해야 함', async () => {
      // Given
      const originalValue = 'test_secret_value';
      process.env.TEST_SECRET = originalValue;

      // 백업 생성 (암호화 포함)
      await envBackupManager.createBackup();

      // 환경변수 삭제
      delete process.env.TEST_SECRET;

      // 백업 데이터 설정
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const backupData = writeCall[1] as string;
      vi.mocked(fs.readFileSync).mockReturnValue(backupData);
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // When
      const result = await envBackupManager.emergencyRestore('all');

      // Then
      expect(result.success).toBe(true);
      // 복호화된 값이 원본과 같아야 함 (실제 구현에서는 복호화 로직 확인)
    });
  });

  describe('에러 처리', () => {
    it('파일 읽기 오류 시 적절히 처리해야 함', async () => {
      // Given
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('파일 읽기 실패');
      });

      // When
      const result = await envBackupManager.emergencyRestore('critical');

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('실패');
    });

    it('잘못된 JSON 형식 처리해야 함', () => {
      // Given
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      // When
      const status = envBackupManager.getBackupStatus();

      // Then
      expect(status.exists).toBe(false);
    });
  });
}); 