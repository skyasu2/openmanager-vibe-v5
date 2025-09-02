/**
 * 🔐 향상된 환경변수 암호화 매니저
 *
 * - AES-256-GCM으로 인증된 암호화
 * - PBKDF2 100,000회 반복으로 강력한 키 유도
 * - 자동 초기화 및 캐싱 지원
 * - Vercel 배포 환경 최적화
 */

import * as crypto from 'crypto';

export interface EncryptedEnvData {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  algorithm: string;
  iterations: number;
  timestamp: number;
  version: string;
}

export interface EncryptedEnvConfig {
  version: string;
  environment: string;
  variables: Record<string, EncryptedEnvData>;
  checksum: string;
}

export class EnhancedEnvCryptoManager {
  private static instance: EnhancedEnvCryptoManager;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly SALT_LENGTH = 32;
  private readonly IV_LENGTH = 16;
  private readonly TAG_LENGTH = 16;
  private readonly PBKDF2_ITERATIONS = 100000;
  private readonly VERSION = '2.0';

  private decryptedCache: Map<string, string> = new Map();
  private masterKey: Buffer | null = null;

  private constructor() {}

  static getInstance(): EnhancedEnvCryptoManager {
    if (!EnhancedEnvCryptoManager.instance) {
      EnhancedEnvCryptoManager.instance = new EnhancedEnvCryptoManager();
    }
    return EnhancedEnvCryptoManager.instance;
  }

  /**
   * 마스터 키 초기화
   */
  _initializeMasterKey(password: string): void {
    if (!password) {
      throw new Error('마스터 비밀번호가 필요합니다');
    }

    // 고정 salt 사용 (마스터 키 일관성을 위해)
    const masterSalt = crypto
      .createHash('sha256')
      .update('OpenManager-Vibe-v5-Master-Salt')
      .digest();

    this.masterKey = crypto.pbkdf2Sync(
      password,
      masterSalt,
      this.PBKDF2_ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );

    console.log('🔐 마스터 키 초기화 완료');
  }

  /**
   * 환경변수 암호화
   */
  encryptVariable(
    key: string,
    value: string,
    password?: string
  ): EncryptedEnvData {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    // 키 유도
    const derivedKey = password
      ? crypto.pbkdf2Sync(
          password,
          salt,
          this.PBKDF2_ITERATIONS,
          this.KEY_LENGTH,
          'sha256'
        )
      : this.deriveKey(salt);

    // 암호화
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.ALGORITHM,
      iterations: this.PBKDF2_ITERATIONS,
      timestamp: Date.now(),
      version: this.VERSION,
    };
  }

  /**
   * 환경변수 복호화
   */
  decryptVariable(encryptedData: EncryptedEnvData, password?: string): string {
    // 캐시 확인
    const cacheKey = encryptedData.encrypted;
    const cachedValue = this.decryptedCache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // 버전 호환성 체크
    if (encryptedData.version !== this.VERSION) {
      console.warn(
        `⚠️ 암호화 버전 불일치: ${encryptedData.version} != ${this.VERSION}`
      );
    }

    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

    // 키 유도
    const derivedKey = password
      ? crypto.pbkdf2Sync(
          password,
          salt,
          encryptedData.iterations,
          this.KEY_LENGTH,
          'sha256'
        )
      : this.deriveKey(salt);

    // 복호화
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      derivedKey,
      iv
    ) as any;
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');

      // 캐시 저장
      this.decryptedCache.set(cacheKey, decrypted);

      return decrypted;
    } catch (error) {
      throw new Error(
        `복호화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 전체 환경변수 암호화
   */
  encryptEnvironment(
    env: Record<string, string>,
    password?: string
  ): EncryptedEnvConfig {
    const encryptedVariables: Record<string, EncryptedEnvData> = {};

    for (const [key, value] of Object.entries(env)) {
      encryptedVariables[key] = this.encryptVariable(key, value, password);
    }

    const config: EncryptedEnvConfig = {
      version: this.VERSION,
      environment: process.env.NODE_ENV || 'development',
      variables: encryptedVariables,
      checksum: '',
    };

    // 체크섬 생성
    config.checksum = this.generateChecksum(config);

    return config;
  }

  /**
   * 전체 환경변수 복호화
   */
  decryptEnvironment(
    config: EncryptedEnvConfig,
    password?: string
  ): Record<string, string> {
    // 체크섬 검증
    const calculatedChecksum = this.generateChecksum({
      ...config,
      checksum: '',
    });
    if (calculatedChecksum !== config.checksum) {
      throw new Error('체크섬 검증 실패: 데이터가 변조되었을 수 있습니다');
    }

    const decryptedEnv: Record<string, string> = {};

    for (const [key, encryptedData] of Object.entries(config.variables)) {
      try {
        decryptedEnv[key] = this.decryptVariable(encryptedData, password);
      } catch (error) {
        console.error(`❌ ${key} 복호화 실패:`, error);
      }
    }

    return decryptedEnv;
  }

  /**
   * Process.env에 복호화된 환경변수 로드
   */
  loadToProcess(config: EncryptedEnvConfig, password?: string): void {
    const decrypted = this.decryptEnvironment(config, password);

    for (const [key, value] of Object.entries(decrypted)) {
      process.env[key] = value;
    }

    console.log(`✅ ${Object.keys(decrypted).length}개 환경변수 로드 완료`);
  }

  /**
   * 키 유도 (마스터 키 사용)
   */
  private deriveKey(salt: Buffer): Buffer {
    if (!this.masterKey) {
      throw new Error('마스터 키가 초기화되지 않았습니다');
    }

    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      1000, // 마스터 키는 이미 강력하므로 낮은 반복 횟수 사용
      this.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * 체크섬 생성
   */
  private generateChecksum(config: Partial<EncryptedEnvConfig>): string {
    const { checksum, ...configWithoutChecksum } = config;
    const content = JSON.stringify(configWithoutChecksum);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.decryptedCache.clear();
    console.log('🧹 복호화 캐시 초기화됨');
  }

  /**
   * 보안 환경변수 접근자
   */
  getSecureEnv(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * 환경변수 존재 여부 확인
   */
  hasEnv(key: string): boolean {
    return process.env[key] !== undefined;
  }
}

// 싱글톤 인스턴스 export
export const enhancedCryptoManager = EnhancedEnvCryptoManager.getInstance();
