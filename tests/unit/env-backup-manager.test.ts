/**
 * 🧪 환경변수 백업 매니저 단위 테스트
 *
 * 테스트 범위:
 * - 환경변수 백업 생성
 * - 암호화/복호화 기능
 * - 긴급 복구 시스템
 * - 환경변수 검증
 */

import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvBackupManager } from '@/lib/env-backup-manager';

// Mock 설정
vi.mock('fs');
vi.mock('crypto-js', () => ({
  AES: {
    encrypt: vi.fn((text: string) => ({ 
      toString: () => `encrypted_${text}` 
    })),
    decrypt: vi.fn((text: string) => ({ 
      toString: () => text.replace('encrypted_', '') 
    })),
  },
}));

vi.mock('@/services/ai/logging/AILogger', () => ({
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

describe('EnvBackupManager - Real Implementation', () => {
  let manager: EnvBackupManager;
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 환경변수 백업
    originalEnv = { ...process.env };
    
    // 테스트용 환경변수 설정
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
    process.env.GOOGLE_AI_API_KEY = 'test_api_key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    
    // 싱글톤 초기화
    (EnvBackupManager as any).instance = null;
    manager = EnvBackupManager.getInstance();
    
    // fs mock 기본 설정
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterEach(() => {
    // 환경변수 복원
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('백업 생성 기능', () => {
    it('should create backup with encrypted sensitive variables', async () => {
      const result = await manager.createBackup();
      
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
      
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const backupData = JSON.parse(writeCall[1] as string);
      
      expect(backupData).toHaveProperty('version');
      expect(backupData).toHaveProperty('entries');
      expect(backupData.entries.length).toBeGreaterThan(0);
      
      // 민감한 변수가 암호화되었는지 확인
      const sensitiveEntry = backupData.entries.find(
        (e: any) => e.key === 'SUPABASE_SERVICE_ROLE_KEY'
      );
      expect(sensitiveEntry.encrypted).toBe(true);
      expect(sensitiveEntry.value).toContain('encrypted_');
    });

    it('should handle backup creation failure', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      const result = await manager.createBackup();
      
      expect(result).toBe(false);
    });
  });

  describe('환경변수 검증', () => {
    it('should detect missing critical variables', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const validation = manager.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(validation.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should validate URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';
      
      const validation = manager.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalid).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should pass validation with all required variables', () => {
      const validation = manager.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.missing).toHaveLength(0);
      expect(validation.invalid).toHaveLength(0);
    });
  });

  describe('긴급 복구', () => {
    const mockBackupData = {
      version: '1.0.0',
      created: new Date().toISOString(),
      entries: [
        {
          key: 'SUPABASE_SERVICE_ROLE_KEY',
          value: 'encrypted_backup_key',
          encrypted: true,
          priority: 'critical',
        },
        {
          key: 'GOOGLE_AI_API_KEY',
          value: 'encrypted_api_key',
          encrypted: true,
          priority: 'important',
        },
        {
          key: 'NEXT_PUBLIC_SUPABASE_URL',
          value: 'https://backup.supabase.co',
          encrypted: false,
          priority: 'critical',
        },
      ],
    };

    it('should restore critical variables only', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(mockBackupData)
      );
      
      const result = await manager.emergencyRestore('critical');
      
      expect(result.success).toBe(true);
      expect(result.restored).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(result.restored).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(result.restored).not.toContain('GOOGLE_AI_API_KEY');
    });

    it('should restore all variables', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(mockBackupData)
      );
      
      const result = await manager.emergencyRestore('all');
      
      expect(result.success).toBe(true);
      expect(result.restored.length).toBe(3);
    });

    it('should handle missing backup file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const result = await manager.emergencyRestore('all');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('백업 파일이 존재하지 않습니다');
    });
  });

  describe('백업 상태 확인', () => {
    it('should return backup status when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          lastBackup: '2024-01-01T00:00:00Z',
          entries: [{}, {}, {}],
        })
      );
      
      const status = manager.getBackupStatus();
      
      expect(status.exists).toBe(true);
      expect(status.lastBackup).toBe('2024-01-01T00:00:00Z');
      expect(status.entriesCount).toBe(3);
    });

    it('should handle missing backup file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const status = manager.getBackupStatus();
      
      expect(status.exists).toBe(false);
      expect(status.lastBackup).toBeUndefined();
    });
  });

  describe('싱글톤 패턴', () => {
    it('should always return the same instance', () => {
      const instance1 = EnvBackupManager.getInstance();
      const instance2 = EnvBackupManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});