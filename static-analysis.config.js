/**
 * 🔍 정적 분석 설정
 * 불필요한 테스트 제거 후 정적 분석 중심의 품질 관리
 */

module.exports = {
    // 🎯 분석 대상 범위
    targets: {
        // 핵심 기능 분석 대상
        core: [
            'src/services/data-generator/**/*.ts',
            'src/services/gcp/**/*.ts',
            'src/services/ai/**/*.ts',
            'src/lib/**/*.ts',
            'src/core/**/*.ts',
            'src/modules/ai-agent/**/*.ts',
        ],

        // UI 컴포넌트 분석 대상
        components: [
            'src/components/**/*.tsx',
            'src/app/**/*.tsx',
        ],

        // 타입 정의 분석 대상
        types: [
            'src/types/**/*.ts',
        ],

        // 제외할 파일들 (제거된 기능)
        exclude: [
            'src/services/health-check/**',
            'src/services/monitoring/**',
            'src/services/redis/**',
            'src/components/health-check/**',
            'src/components/monitoring/**',
            'tests/**',
            '**/*.test.ts',
            '**/*.spec.ts',
        ],
    },

    // 🔧 TypeScript 정적 분석 설정
    typescript: {
        strict: true,
        noImplicitAny: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        exactOptionalPropertyTypes: true,
    },

    // 📏 ESLint 규칙 강화
    eslint: {
        rules: {
            // 코드 품질
            'prefer-const': 'error',
            'no-var': 'error',
            'no-unused-vars': 'error',

            // React 관련
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // TypeScript 관련
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/prefer-readonly': 'warn',

            // 보안 관련
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
        },
    },

    // 📊 번들 분석 설정
    bundleAnalysis: {
        enabled: true,
        thresholds: {
            maxBundleSize: '2MB',
            maxChunkSize: '500KB',
            maxAssetSize: '250KB',
        },
    },

    // 🔒 보안 분석 설정
    security: {
        auditLevel: 'high',
        excludeDevDependencies: true,
        ignorePatterns: [
            'GHSA-*', // GitHub Security Advisory (필요시 특정 항목 제외)
        ],
    },

    // 📋 의존성 분석 설정
    dependencies: {
        checkUnused: true,
        checkOutdated: true,
        excludeDevDependencies: false,
        ignorePatterns: [
            '@types/*', // 타입 정의는 사용되지 않아도 필요
            'eslint-*', // ESLint 플러그인들
            'prettier', // 코드 포맷팅
        ],
    },

    // 🎯 성능 분석 설정
    performance: {
        lighthouse: {
            enabled: true,
            categories: ['performance', 'accessibility', 'best-practices', 'seo'],
            thresholds: {
                performance: 90,
                accessibility: 95,
                'best-practices': 90,
                seo: 90,
            },
        },
    },

    // 📈 품질 메트릭 설정
    quality: {
        complexity: {
            max: 10, // 순환 복잡도 최대값
            warn: 8,
        },
        duplicateCode: {
            enabled: true,
            minLines: 5,
        },
        maintainability: {
            enabled: true,
            minIndex: 60,
        },
    },

    // 🔄 CI/CD 통합 설정
    ci: {
        failOnError: true,
        generateReports: true,
        reportFormats: ['json', 'html', 'junit'],
        outputDir: './static-analysis-reports',
    },
}; 