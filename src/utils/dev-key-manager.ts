/**
 * 🛠️ DevKeyManager - 개발용 통합 키 관리자
 *
 * 기능:
 * - 모든 API 키 중앙 관리
 * - 개발/프로덕션 모드 자동 감지
 * - 중복된 암호화 기능 통합
 * - 환경변수 자동 생성/복원
 * - 키 유효성 검증
 *
 * 개발 철학:
 * - 개발 환경: 효율성 우선 (Base64 인코딩)
 * - 프로덕션: 보안 우선 (AES-256-GCM)
 * - 공개 버전: 완전한 보안 강화
 */

import fs from 'fs';
import path from 'path';

interface KeyStatus {
  service: string;
  status: 'active' | 'missing' | 'invalid';
  source: 'env' | 'default' | 'encrypted';
  preview: string;
  lastChecked: Date;
}

export interface DevKey {
  name: string;
  envKey: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description?: string;
}

export interface KeyValidationResult {
  key: string;
  status: 'valid' | 'invalid' | 'missing';
  message: string;
}

export interface KeyGroupValidation {
  group: string;
  keys: string[];
  allValid: boolean;
  results: KeyValidationResult[];
}

export class DevKeyManager {
  private static instance: DevKeyManager;
  private isDevelopment: boolean;
  private keyCache: Map<string, string> = new Map();
  private keys: Map<string, string> = new Map();
  private keyDefinitions: DevKey[] = [
    // Google AI API 키만 관리
    {
      name: 'Google AI API Key',
      envKey: 'GOOGLE_AI_API_KEY',
      required: true,
      validator: value => value.startsWith('AIza') && value.length > 30,
      description: 'Google AI Studio에서 발급받은 API 키',
    },
  ];

  // 키 그룹 정의
  private keyGroups: Record<string, string[]> = {
    ai: ['GOOGLE_AI_API_KEY'],
  };

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.loadKeysFromEnv();

    console.log(
      `🔑 개발 키 관리자 초기화됨 (환경: ${this.isDevelopment ? '개발' : '프로덕션'})`
    );
  }

  static getInstance(): DevKeyManager {
    if (!DevKeyManager.instance) {
      DevKeyManager.instance = new DevKeyManager();
    }
    return DevKeyManager.instance;
  }

  /**
   * 🔄 환경변수에서 키 로드
   */
  private loadKeysFromEnv(): void {
    this.keyDefinitions.forEach(keyDef => {
      const value = process.env[keyDef.envKey];
      if (value) {
        this.keys.set(keyDef.envKey, value);
      }
    });

    console.log(
      `🔑 개발 키 로드 완료: ${this.keys.size}/${this.keyDefinitions.length}개`
    );
  }

  /**
   * 🔑 키 가져오기 (캐시 우선)
   */
  getKey(envKey: string): string | null {
    return this.keys.get(envKey) || null;
  }

  /**
   * 🔍 모든 서비스 상태 확인
   */
  getAllKeyStatus(): KeyStatus[] {
    return this.keyDefinitions.map(keyDef => {
      const value = this.getKey(keyDef.envKey);
      const isValid = value
        ? keyDef.validator
          ? keyDef.validator(value)
          : true
        : false;

      let status: 'active' | 'missing' | 'invalid' = 'missing';
      const source: 'env' | 'default' | 'encrypted' = 'env';

      if (value) {
        if (isValid) {
          status = 'active';
          // 기본값 사용 여부 확인
        } else {
          status = 'invalid';
        }
      }

      return {
        service: keyDef.name,
        status,
        source,
        preview: value ? this.createPreview(value) : 'none',
        lastChecked: new Date(),
      };
    });
  }

  /**
   * 🎭 키 미리보기 생성 (보안)
   */
  private createPreview(value: string): string {
    if (value.length <= 10) return value;

    if (value.startsWith('https://')) {
      const url = new URL(value);
      return `${url.protocol}//${url.hostname}/...`;
    }

    if (value.startsWith('AIza')) {
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
    }

    return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
  }

  /**
   * 📝 .env.local 파일 자동 생성
   */
  async generateEnvFile(): Promise<{
    success: boolean;
    path: string;
    message: string;
  }> {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      const envContent = this.generateEnvContent();

      // 🚨 베르셀 환경에서 파일 저장 건너뛰기
      if (
        process.env.VERCEL ||
        (process.env.NODE_ENV as string) === 'production'
      ) {
        console.log(
          '⚠️ [DevKeyManager] 베르셀 환경에서 환경 변수 파일 저장 무력화'
        );
        return {
          success: true,
          path: '',
          message: '베르셀 환경에서 파일 저장이 무력화되었습니다.',
        };
      }

      // 파일 저장 (개발 환경에서만)
      fs.writeFileSync(envPath, envContent, 'utf8');

      return {
        success: true,
        path: envPath,
        message: `✅ .env.local 파일이 생성되었습니다. (${this.keyDefinitions.length}개 서비스)`,
      };
    } catch (error) {
      return {
        success: false,
        path: '',
        message: `❌ .env.local 생성 실패: ${error}`,
      };
    }
  }

  /**
   * 📄 환경변수 파일 내용 생성
   */
  private generateEnvContent(): string {
    const timestamp = new Date().toISOString();

    let content = `# 🛠️ OpenManager Vibe v5 - 개발용 환경변수
# 자동 생성: ${timestamp}
# DevKeyManager v1.0

NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true

`;

    // 카테고리별로 그룹화
    const categories = [
      {
        title: '🤖 AI 서비스',
        keys: ['GOOGLE_AI_API_KEY'],
      },
    ];

    categories.forEach(category => {
      content += `# ${category.title}\n`;
      category.keys.forEach(envKey => {
        const keyDef = this.keyDefinitions.find(k => k.envKey === envKey);
        const value = this.getKey(envKey);

        if (keyDef && value) {
          content += `${envKey}=${value}\n`;
        } else if (keyDef) {
          content += `# ${envKey}=  # ${keyDef.name} - 설정 필요\n`;
        }
      });
      content += '\n';
    });

    // 추가 설정들
    content += `# 🧠 AI 엔진 설정
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_BETA_MODE=true
GOOGLE_AI_ENABLED=true
GOOGLE_AI_DAILY_LIMIT=10000
GOOGLE_AI_RPM_LIMIT=100
GOOGLE_AI_QUOTA_PROTECTION=false

# 🔄 기타 설정
RAG_FORCE_MEMORY=true
GEMINI_LEARNING_ENABLED=true
CRON_SECRET=dev-local-secret-2025
CRON_HEALTH_CHECK=true
CRON_KEEP_ALIVE=true
CRON_GEMINI_LEARNING=true
`;

    return content;
  }

  /**
   * 🧪 모든 키 유효성 검증
   */
  validateAllKeys(): {
    details: KeyValidationResult[];
    valid: number;
    invalid: number;
    missing: number;
  } {
    const results: KeyValidationResult[] = [];
    let valid = 0;
    let invalid = 0;
    let missing = 0;

    this.keyDefinitions.forEach(keyDef => {
      const value = this.getKey(keyDef.envKey);
      if (value) {
        if (keyDef.validator && keyDef.validator(value)) {
          results.push({
            key: keyDef.name,
            status: 'valid',
            message: '정상적으로 설정되었습니다.',
          });
          valid++;
        } else {
          results.push({
            key: keyDef.name,
            status: 'invalid',
            message: '키 형식이 올바르지 않습니다.',
          });
          invalid++;
        }
      } else {
        if (keyDef.required) {
          results.push({
            key: keyDef.name,
            status: 'missing',
            message: '필수 키가 누락되었습니다.',
          });
          missing++;
        }
      }
    });

    return {
      details: results,
      valid,
      invalid,
      missing,
    };
  }

  /**
   * 📊 개발자 친화적 상태 리포트
   */
  getStatusReport(): string {
    const { details, valid, invalid, missing } = this.validateAllKeys();
    const total = details.length;

    let report = `
# 🔑 DevKeyManager 상태 보고서
- 생성 시간: ${new Date().toISOString()}
- 검사 대상: ${total}개 키
- 요약: ✅ 정상 ${valid}개, ❌ 오류 ${invalid}개, ❓ 누락 ${missing}개
---
`;

    details.forEach(result => {
      const icon =
        result.status === 'valid'
          ? '✅'
          : result.status === 'invalid'
            ? '❌'
            : '❓';
      report += `${icon} [${result.status.toUpperCase()}] ${result.key}: ${result.message}\n`;
    });

    return report;
  }

  /**
   * 🚀 빠른 설정 (개발용)
   */
  async quickSetup(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 환경변수 파일 생성
      const envResult = await this.generateEnvFile();
      if (!envResult.success) {
        return envResult;
      }

      // 2. 캐시 새로고침
      this.loadKeysFromEnv();

      // 3. 검증
      const validation = this.validateAllKeys();

      return {
        success:
          validation.valid >=
          this.keyDefinitions.filter(k => k.required).length,
        message: `🚀 빠른 설정 완료! ${validation.valid}/${this.keyDefinitions.length} 서비스 활성화`,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ 빠른 설정 실패: ${error}`,
      };
    }
  }

  /**
   * 🔄 키 캐시 새로고침
   */
  refreshCache(): void {
    this.keys.clear();
    this.loadKeysFromEnv();
  }

  /**
   * 📊 개발자 친화적 상태 요약
   */
  getKeyStatus() {
    const total = this.keyDefinitions.length;
    const loaded = this.keys.size;
    const valid = this.validateAllKeys().valid;

    return {
      total,
      loaded,
      valid,
      missing: this.keyDefinitions
        .filter(k => k.required && !this.keys.has(k.envKey))
        .map(k => k.envKey),
    };
  }

  /**
   * 📄 키 정의 목록
   */
  getKeyDefinitions(): DevKey[] {
    return [...this.keyDefinitions];
  }

  // 🔧 편의 메서드들 (기존 코드 호환성)
  getGoogleAIKey(): string | null {
    return this.getKey('GOOGLE_AI_API_KEY');
  }

  /**
   * 🔧 Supabase URL 가져오기 (호환성용)
   */
  getSupabaseUrl(): string | null {
    return this.getKey('SUPABASE_URL') || process.env.SUPABASE_URL || null;
  }

  /**
   * 🔧 Supabase Anon Key 가져오기 (호환성용)
   */
  getSupabaseAnonKey(): string | null {
    return (
      this.getKey('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY || null
    );
  }

  /**
   * 🔧 MCP URL 가져오기 (로컬 개발 도구용)
   */
  getMCPUrl(): string | null {
    // MCP는 로컬 개발 도구이므로 로컬 URL만 반환
    return (
      this.getKey('MCP_URL') ||
      process.env.MCP_URL ||
      'http://localhost:3000' // 기본 로컬 개발 서버
    );
  }
}

// 🌟 전역 인스턴스 (싱글톤)
export const devKeyManager = DevKeyManager.getInstance();

// 🔧 편의 함수들 (기존 코드 호환성)
export const getSecureGoogleAIKey = () => devKeyManager.getGoogleAIKey();

// 🚀 개발자 도구 함수들
export const generateDevEnv = () => devKeyManager.generateEnvFile();
export const validateDevKeys = () => devKeyManager.validateAllKeys();
export const getDevStatusReport = () => devKeyManager.getStatusReport();
export const quickDevSetup = () => devKeyManager.quickSetup();
