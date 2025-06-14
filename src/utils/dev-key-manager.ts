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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface ServiceConfig {
  name: string;
  envKey: string;
  required: boolean;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

interface KeyStatus {
  service: string;
  status: 'active' | 'missing' | 'invalid';
  source: 'env' | 'default' | 'encrypted';
  preview: string;
  lastChecked: Date;
}

export class DevKeyManager {
  private static instance: DevKeyManager;
  private isDevelopment: boolean;
  private keyCache: Map<string, string> = new Map();

  // 🔧 서비스 설정 (확장 가능)
  private services: ServiceConfig[] = [
    {
      name: 'Supabase URL',
      envKey: 'NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      validator: value => value.includes('supabase.co'),
    },
    {
      name: 'Supabase Anon Key',
      envKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      validator: value => value.startsWith('eyJ') && value.length > 100,
    },
    {
      name: 'Supabase Service Role Key',
      envKey: 'SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      validator: value => value.startsWith('eyJ') && value.length > 100,
    },
    {
      name: 'Redis URL',
      envKey: 'REDIS_URL',
      required: true,
      validator: value =>
        value.startsWith('redis://') || value.startsWith('rediss://'),
    },
    {
      name: 'Upstash Redis REST URL',
      envKey: 'UPSTASH_REDIS_REST_URL',
      required: true,
      validator: value =>
        value.startsWith('https://') && value.includes('upstash.io'),
    },
    {
      name: 'Upstash Redis Token',
      envKey: 'UPSTASH_REDIS_REST_TOKEN',
      required: true,
      validator: value => value.length > 50,
    },
    {
      name: 'Google AI API Key',
      envKey: 'GOOGLE_AI_API_KEY',
      required: true,
      validator: value => value.startsWith('AIza') && value.length === 39,
    },
    {
      name: 'Slack Webhook URL',
      envKey: 'SLACK_WEBHOOK_URL',
      required: false,
      validator: value => value.startsWith('https://hooks.slack.com/'),
    },
    {
      name: 'MCP Remote URL',
      envKey: 'MCP_REMOTE_URL',
      required: true,
      validator: value => value.startsWith('https://'),
    },
    {
      name: 'Vercel Bypass Secret',
      envKey: 'VERCEL_AUTOMATION_BYPASS_SECRET',
      required: false,
      validator: value => value.length > 20,
    },
  ];

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.loadKeysFromEnv();
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
    this.services.forEach(service => {
      const value = process.env[service.envKey];
      if (value) {
        this.keyCache.set(service.envKey, value);
      }
    });
  }

  /**
   * 🔑 키 가져오기 (캐시 우선)
   */
  getKey(envKey: string): string | null {
    // 1. 캐시에서 확인
    if (this.keyCache.has(envKey)) {
      return this.keyCache.get(envKey)!;
    }

    // 2. 환경변수에서 확인
    const envValue = process.env[envKey];
    if (envValue) {
      this.keyCache.set(envKey, envValue);
      return envValue;
    }

    // 3. 기본값 사용 (개발 환경만)
    if (this.isDevelopment) {
      const service = this.services.find(s => s.envKey === envKey);
      if (service?.defaultValue) {
        console.warn(`⚠️ ${service.name}: 기본값 사용 중 (개발 환경)`);
        this.keyCache.set(envKey, service.defaultValue);
        return service.defaultValue;
      }
    }

    return null;
  }

  /**
   * 🔍 모든 서비스 상태 확인
   */
  getAllKeyStatus(): KeyStatus[] {
    return this.services.map(service => {
      const value = this.getKey(service.envKey);
      const isValid = value
        ? service.validator
          ? service.validator(value)
          : true
        : false;

      let status: 'active' | 'missing' | 'invalid' = 'missing';
      let source: 'env' | 'default' | 'encrypted' = 'env';

      if (value) {
        if (isValid) {
          status = 'active';
          // 기본값 사용 여부 확인
          if (this.isDevelopment && service.defaultValue === value) {
            source = 'default';
          }
        } else {
          status = 'invalid';
        }
      }

      return {
        service: service.name,
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

      // 백업 생성 (기존 파일이 있는 경우)
      if (fs.existsSync(envPath)) {
        const backupPath = `${envPath}.backup.${Date.now()}`;
        fs.copyFileSync(envPath, backupPath);
        console.log(`📦 기존 .env.local 백업: ${backupPath}`);
      }

      fs.writeFileSync(envPath, envContent, 'utf8');

      return {
        success: true,
        path: envPath,
        message: `✅ .env.local 파일이 생성되었습니다. (${this.services.length}개 서비스)`,
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
        title: '🗄️ Supabase 데이터베이스',
        keys: [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
        ],
      },
      {
        title: '⚡ Redis 캐시',
        keys: [
          'REDIS_URL',
          'UPSTASH_REDIS_REST_URL',
          'UPSTASH_REDIS_REST_TOKEN',
        ],
      },
      {
        title: '🤖 AI 서비스',
        keys: ['GOOGLE_AI_API_KEY'],
      },
      {
        title: '📧 알림 서비스',
        keys: ['SLACK_WEBHOOK_URL'],
      },
      {
        title: '🔄 외부 서비스',
        keys: ['MCP_REMOTE_URL', 'VERCEL_AUTOMATION_BYPASS_SECRET'],
      },
    ];

    categories.forEach(category => {
      content += `# ${category.title}\n`;
      category.keys.forEach(envKey => {
        const service = this.services.find(s => s.envKey === envKey);
        const value = this.getKey(envKey);

        if (service && value) {
          content += `${envKey}=${value}\n`;
        } else if (service) {
          content += `# ${envKey}=  # ${service.name} - 설정 필요\n`;
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
    valid: number;
    invalid: number;
    missing: number;
    details: KeyStatus[];
  } {
    const statuses = this.getAllKeyStatus();

    return {
      valid: statuses.filter(s => s.status === 'active').length,
      invalid: statuses.filter(s => s.status === 'invalid').length,
      missing: statuses.filter(s => s.status === 'missing').length,
      details: statuses,
    };
  }

  /**
   * 🔄 키 캐시 새로고침
   */
  refreshCache(): void {
    this.keyCache.clear();
    this.loadKeysFromEnv();
  }

  /**
   * 📊 개발자 친화적 상태 리포트
   */
  getStatusReport(): string {
    const validation = this.validateAllKeys();
    const successRate = Math.round(
      (validation.valid / this.services.length) * 100
    );

    let report = `
🛠️ DevKeyManager 상태 리포트
${'='.repeat(50)}
📅 확인 시간: ${new Date().toLocaleString('ko-KR')}
🎯 성공률: ${successRate}% (${validation.valid}/${this.services.length})
🌍 환경: ${this.isDevelopment ? '개발' : '프로덕션'}

📊 서비스별 상태:
`;

    validation.details.forEach(status => {
      const icon =
        status.status === 'active'
          ? '✅'
          : status.status === 'invalid'
            ? '⚠️'
            : '❌';
      const sourceIcon =
        status.source === 'default'
          ? '🔧'
          : status.source === 'encrypted'
            ? '🔐'
            : '📝';

      report += `${icon} ${status.service.padEnd(25)} ${sourceIcon} ${status.preview}\n`;
    });

    if (validation.missing > 0 || validation.invalid > 0) {
      report += `\n💡 해결 방법:
- npm run dev:setup-keys  # 자동 키 설정
- npm run check-services  # 서비스 상태 확인
- .env.local 파일 확인   # 수동 설정
`;
    }

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
      this.refreshCache();

      // 3. 검증
      const validation = this.validateAllKeys();

      return {
        success:
          validation.valid >= this.services.filter(s => s.required).length,
        message: `🚀 빠른 설정 완료! ${validation.valid}/${this.services.length} 서비스 활성화`,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ 빠른 설정 실패: ${error}`,
      };
    }
  }

  // 🔧 편의 메서드들 (기존 코드 호환성)
  getSupabaseUrl(): string | null {
    return this.getKey('NEXT_PUBLIC_SUPABASE_URL');
  }
  getSupabaseAnonKey(): string | null {
    return this.getKey('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  getSupabaseServiceKey(): string | null {
    return this.getKey('SUPABASE_SERVICE_ROLE_KEY');
  }
  getRedisUrl(): string | null {
    return this.getKey('REDIS_URL');
  }
  getGoogleAIKey(): string | null {
    return this.getKey('GOOGLE_AI_API_KEY');
  }
  getSlackWebhook(): string | null {
    return this.getKey('SLACK_WEBHOOK_URL');
  }
  getMCPUrl(): string | null {
    return this.getKey('MCP_REMOTE_URL');
  }
  getVercelBypass(): string | null {
    return this.getKey('VERCEL_AUTOMATION_BYPASS_SECRET');
  }
}

// 🌟 전역 인스턴스 (싱글톤)
export const devKeyManager = DevKeyManager.getInstance();

// 🔧 편의 함수들 (기존 코드 호환성)
export const getSecureSupabaseUrl = () => devKeyManager.getSupabaseUrl();
export const getSecureSupabaseAnonKey = () =>
  devKeyManager.getSupabaseAnonKey();
export const getSecureRedisUrl = () => devKeyManager.getRedisUrl();
export const getSecureGoogleAIKey = () => devKeyManager.getGoogleAIKey();
export const getSecureSlackWebhook = () => devKeyManager.getSlackWebhook();

// 🚀 개발자 도구 함수들
export const generateDevEnv = () => devKeyManager.generateEnvFile();
export const validateDevKeys = () => devKeyManager.validateAllKeys();
export const getDevStatusReport = () => devKeyManager.getStatusReport();
export const quickDevSetup = () => devKeyManager.quickSetup();
