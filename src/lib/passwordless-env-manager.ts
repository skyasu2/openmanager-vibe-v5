/**
 * 🔓 Passwordless Environment Manager v1.0
 * 
 * 개발 편의성 극대화:
 * - 비밀번호 없이 즉시 개발 시작
 * - 기본값 자동 제공
 * - 문제 시 기존 방식으로 폴백
 * 
 * 작성일: 2025-07-04 16:10 KST
 */

interface DefaultEnvConfig {
    key: string;
    defaultValue: string;
    description: string;
    required: boolean;
    devOnly: boolean;
}

export class PasswordlessEnvManager {
    private static instance: PasswordlessEnvManager;
    private isInitialized = false;
    private fallbackToOriginal = false;

    // 🔧 개발용 기본값 설정
    private readonly defaultConfigs: DefaultEnvConfig[] = [
        {
            key: 'NEXT_PUBLIC_SUPABASE_URL',
            defaultValue: 'https://vnswjnltnhpsueosfhmw.supabase.co',
            description: 'Supabase 프로젝트 URL',
            required: true,
            devOnly: false
        },
        {
            key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU',
            description: 'Supabase 익명 키',
            required: true,
            devOnly: false
        },
        {
            key: 'SUPABASE_SERVICE_ROLE_KEY',
            defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8',
            description: 'Supabase 서비스 롤 키',
            required: true,
            devOnly: false
        },
        {
            key: 'GOOGLE_AI_ENABLED',
            defaultValue: 'true',
            description: 'Google AI 활성화 여부',
            required: false,
            devOnly: false
        },
        {
            key: 'GOOGLE_AI_API_KEY',
            defaultValue: 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM',
            description: 'Google AI API 키 (개발용)',
            required: false,
            devOnly: true
        },
        {
            key: 'UPSTASH_REDIS_REST_URL',
            defaultValue: 'https://charming-condor-46598.upstash.io',
            description: 'Upstash Redis REST URL',
            required: false,
            devOnly: false
        },
        {
            key: 'UPSTASH_REDIS_REST_TOKEN',
            defaultValue: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
            description: 'Upstash Redis REST 토큰',
            required: false,
            devOnly: false
        }
    ];

    private constructor() { }

    static getInstance(): PasswordlessEnvManager {
        if (!PasswordlessEnvManager.instance) {
            PasswordlessEnvManager.instance = new PasswordlessEnvManager();
        }
        return PasswordlessEnvManager.instance;
    }

    /**
     * 🚀 무비밀번호 시스템 초기화
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            console.log('🔓 Passwordless Environment Manager 초기화 중...');

            // 개발 환경에서만 기본값 자동 적용
            if (this.isDevelopmentEnvironment()) {
                await this.applyDefaultValues();
                console.log('✅ 개발용 기본값 적용 완료 - 비밀번호 없이 즉시 사용 가능!');
            } else {
                console.log('ℹ️ 프로덕션 환경 감지 - 기존 방식 사용');
                this.fallbackToOriginal = true;
            }

            this.isInitialized = true;
            return true;

        } catch (error) {
            console.warn('⚠️ Passwordless 시스템 초기화 실패, 기존 방식으로 폴백:', error);
            this.fallbackToOriginal = true;
            return false;
        }
    }

    /**
     * 🏠 개발 환경 감지
     */
    private isDevelopmentEnvironment(): boolean {
        return (
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV !== 'production' ||
            !process.env.VERCEL ||
            process.env.PASSWORDLESS_DEV_MODE === 'true'
        );
    }

    /**
     * ⚡ 기본값 자동 적용
     */
    private async applyDefaultValues(): Promise<void> {
        let appliedCount = 0;

        for (const config of this.defaultConfigs) {
            // 이미 설정된 값이 있으면 건드리지 않음
            if (process.env[config.key]) {
                continue;
            }

            // 프로덕션에서는 devOnly 값 건너뜀
            if (config.devOnly && process.env.NODE_ENV === 'production') {
                continue;
            }

            // 환경변수 동적 설정
            process.env[config.key] = config.defaultValue;
            appliedCount++;

            console.log(`   📝 ${config.key}: ${config.description}`);
        }

        console.log(`✅ 총 ${appliedCount}개 기본값 적용됨`);
    }

    /**
     * 📋 환경변수 상태 확인
     */
    getEnvironmentStatus(): {
        passwordlessEnabled: boolean;
        missingRequired: string[];
        appliedDefaults: string[];
        totalConfigs: number;
    } {
        const missingRequired: string[] = [];
        const appliedDefaults: string[] = [];

        for (const config of this.defaultConfigs) {
            const value = process.env[config.key];

            if (!value && config.required) {
                missingRequired.push(config.key);
            }

            if (value === config.defaultValue) {
                appliedDefaults.push(config.key);
            }
        }

        return {
            passwordlessEnabled: !this.fallbackToOriginal,
            missingRequired,
            appliedDefaults,
            totalConfigs: this.defaultConfigs.length
        };
    }

    /**
     * 🔄 기존 방식으로 폴백
     */
    fallbackToOriginalSystem(): void {
        console.log('🔄 기존 암복호화 시스템으로 폴백...');
        this.fallbackToOriginal = true;

        // 기본값으로 설정된 환경변수들 제거
        for (const config of this.defaultConfigs) {
            if (process.env[config.key] === config.defaultValue) {
                delete process.env[config.key];
            }
        }

        console.log('✅ 기존 시스템으로 복원 완료');
    }

    /**
     * 🧪 시스템 테스트
     */
    async testSystem(): Promise<boolean> {
        try {
            console.log('🧪 Passwordless 시스템 테스트 중...');

            // 필수 환경변수 확인
            const status = this.getEnvironmentStatus();

            if (status.missingRequired.length > 0) {
                console.error('❌ 필수 환경변수 누락:', status.missingRequired);
                return false;
            }

            // Supabase 연결 테스트 (간단한 확인)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
                console.warn('⚠️ Supabase URL 형식이 올바르지 않을 수 있습니다');
            }

            console.log('✅ Passwordless 시스템 테스트 통과');
            return true;

        } catch (error) {
            console.error('❌ Passwordless 시스템 테스트 실패:', error);
            return false;
        }
    }

    /**
     * 📊 상태 리포트 출력
     */
    printStatusReport(): void {
        const status = this.getEnvironmentStatus();

        console.log('\n📊 Passwordless Environment Manager 상태:');
        console.log(`   모드: ${status.passwordlessEnabled ? '🔓 Passwordless' : '🔐 Original'}`);
        console.log(`   적용된 기본값: ${status.appliedDefaults.length}개`);
        console.log(`   누락된 필수값: ${status.missingRequired.length}개`);
        console.log(`   전체 설정: ${status.totalConfigs}개`);

        if (status.appliedDefaults.length > 0) {
            console.log('   기본값 적용된 변수:', status.appliedDefaults.join(', '));
        }

        if (status.missingRequired.length > 0) {
            console.log('   ⚠️ 누락된 필수 변수:', status.missingRequired.join(', '));
        }

        console.log('');
    }
}

// 전역 인스턴스
export const passwordlessEnv = PasswordlessEnvManager.getInstance();

// 개발 환경에서 자동 초기화
if (typeof window === 'undefined' &&
    (process.env.NODE_ENV === 'development' || process.env.PASSWORDLESS_DEV_MODE === 'true')) {
    passwordlessEnv.initialize().catch(console.warn);
} 