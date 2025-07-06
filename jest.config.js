const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 next.config.js와 .env 파일을 로드
  dir: './',
});

// Jest에 전달할 사용자 정의 설정
const customJestConfig = {
  // 테스트 환경 설정
  testEnvironment: 'jsdom',

  // 설정 파일들
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],

  // 제외할 디렉토리
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/archive/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],

  // 모듈 경로 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },

  // 모듈 디렉토리
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // 확장자 해결
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 변환 설정
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // 변환하지 않을 파일들
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/loading.tsx',
    '!src/app/error.tsx',
    '!src/app/not-found.tsx',
  ],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 커버리지 리포터
  coverageReporters: ['text', 'lcov', 'html'],

  // 글로벌 설정
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },

  // 테스트 타임아웃
  testTimeout: 30000,

  // 환경 변수 설정
  setupFiles: [
    '<rootDir>/tests/scripts/.env.test',
    '<rootDir>/tests/jest-env-setup.js'
  ],

  // 병렬 실행 설정
  maxWorkers: '50%',

  // 캐시 설정
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 상세 출력
  verbose: true,

  // 에러 처리
  errorOnDeprecated: true,

  // 테스트 결과 리포터
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // 프로젝트별 설정
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 60000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 120000,
    },
  ],
};

// createJestConfig는 next/jest가 비동기적으로 Next.js 설정을 로드할 수 있도록 내보내집니다.
module.exports = createJestConfig(customJestConfig);
