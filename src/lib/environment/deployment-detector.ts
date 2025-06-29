/**
 * 🔍 배포 환경 감지기 v1.0
 *
 * LocalRAG 엔진을 개발/테스트 환경에서만 사용하도록 제어
 * 배포 환경에서는 Supabase RAG만 사용
 */

export interface EnvironmentInfo {
  isProduction: boolean;
  isVercelDeployment: boolean;
  isRenderDeployment: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  shouldUseLocalRAG: boolean;
  shouldUseSupabaseRAG: boolean;
  environmentType: 'development' | 'test' | 'production';
}

export class DeploymentDetector {
  private static instance: DeploymentDetector | null = null;
  private environmentInfo: EnvironmentInfo;

  private constructor() {
    this.environmentInfo = this.detectEnvironment();
  }

  public static getInstance(): DeploymentDetector {
    if (!DeploymentDetector.instance) {
      DeploymentDetector.instance = new DeploymentDetector();
    }
    return DeploymentDetector.instance;
  }

  /**
   * 🔍 환경 감지
   */
  private detectEnvironment(): EnvironmentInfo {
    const nodeEnv = process.env.NODE_ENV;
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    const isRender = !!(process.env.RENDER || process.env.RENDER_SERVICE_ID);
    const isTest = !!(process.env.JEST_WORKER_ID || nodeEnv === 'test');
    const isDev = nodeEnv === 'development' || !nodeEnv;
    const isProd = nodeEnv === 'production';

    // 강제 설정 체크
    const forceLocalRAG = process.env.FORCE_LOCAL_RAG === 'true';
    const disableLocalRAG = process.env.DISABLE_LOCAL_RAG === 'true';

    // LocalRAG 사용 여부 결정
    let shouldUseLocalRAG = false;
    if (forceLocalRAG) {
      shouldUseLocalRAG = true;
    } else if (disableLocalRAG || isProd || isVercel || isRender) {
      shouldUseLocalRAG = false;
    } else if (isDev || isTest) {
      shouldUseLocalRAG = true;
    }

    // 환경 타입 결정
    let environmentType: 'development' | 'test' | 'production';
    if (isProd || isVercel || isRender) {
      environmentType = 'production';
    } else if (isTest) {
      environmentType = 'test';
    } else {
      environmentType = 'development';
    }

    return {
      isProduction: isProd || isVercel || isRender,
      isVercelDeployment: isVercel,
      isRenderDeployment: isRender,
      isDevelopment: isDev,
      isTest,
      shouldUseLocalRAG,
      shouldUseSupabaseRAG: true, // 항상 Supabase RAG 사용 가능
      environmentType,
    };
  }

  /**
   * 📊 환경 정보 반환
   */
  public getEnvironmentInfo(): EnvironmentInfo {
    return { ...this.environmentInfo };
  }

  /**
   * 🔍 LocalRAG 사용 가능 여부
   */
  public shouldUseLocalRAG(): boolean {
    return this.environmentInfo.shouldUseLocalRAG;
  }

  /**
   * 🎯 Supabase RAG 사용 가능 여부
   */
  public shouldUseSupabaseRAG(): boolean {
    return this.environmentInfo.shouldUseSupabaseRAG;
  }

  /**
   * 🏷️ 환경 타입 반환
   */
  public getEnvironmentType(): 'development' | 'test' | 'production' {
    return this.environmentInfo.environmentType;
  }

  /**
   * 📝 환경 정보 로깅
   */
  public logEnvironmentInfo(): void {
    const info = this.environmentInfo;
    console.log('🔍 배포 환경 감지 결과:', {
      environmentType: info.environmentType,
      nodeEnv: process.env.NODE_ENV,
      isVercel: info.isVercelDeployment,
      isRender: info.isRenderDeployment,
      shouldUseLocalRAG: info.shouldUseLocalRAG,
      shouldUseSupabaseRAG: info.shouldUseSupabaseRAG,
      forceLocalRAG: process.env.FORCE_LOCAL_RAG,
      disableLocalRAG: process.env.DISABLE_LOCAL_RAG,
    });

    if (!info.shouldUseLocalRAG && info.isProduction) {
      console.log('🚫 LocalRAG 비활성화: 배포 환경에서는 Supabase RAG만 사용');
    } else if (info.shouldUseLocalRAG) {
      console.log('🔧 LocalRAG 활성화: 개발/테스트 환경에서 사용 가능');
    }
  }

  /**
   * 🎯 AI 엔진 우선순위 반환
   */
  public getAIEnginePriority(): string[] {
    if (this.environmentInfo.isProduction) {
      // 배포 환경: LocalRAG 제외
      return ['supabase_rag', 'rule_based', 'mcp', 'google_ai'];
    } else {
      // 개발/테스트 환경: 전체 엔진 사용
      return ['supabase_rag', 'rule_based', 'local_rag', 'mcp', 'google_ai'];
    }
  }

  /**
   * 🔄 환경 재감지 (런타임 변경 시)
   */
  public refresh(): void {
    this.environmentInfo = this.detectEnvironment();
    this.logEnvironmentInfo();
  }
}

// 싱글톤 인스턴스 export
export const deploymentDetector = DeploymentDetector.getInstance();
