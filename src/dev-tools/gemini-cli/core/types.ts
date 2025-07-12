/**
 * Gemini CLI 개발도구 타입 정의
 * 
 * @description TypeScript 기반 Gemini CLI 통합 개발도구의 핵심 타입들
 * @note 로컬 개발 전용 - Vercel 배포 제외
 */

export interface GeminiConfig {
  /** Gemini CLI 실행 경로 */
  executablePath: string;
  /** 기본 타임아웃 (ms) */
  timeout: number;
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 로그 레벨 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface GeminiQuery {
  /** 질문/명령어 */
  prompt: string;
  /** 입력 데이터 (파이프용) */
  input?: string;
  /** 파일 참조 (@파일경로 구문) */
  fileReferences?: string[];
  /** 컨텍스트 정보 */
  context?: Record<string, any>;
}

export interface GeminiResponse {
  /** 응답 내용 */
  content: string;
  /** 실행 시간 (ms) */
  executionTime: number;
  /** 성공 여부 */
  success: boolean;
  /** 오류 정보 */
  error?: string;
  /** 사용된 토큰 수 (추정) */
  estimatedTokens?: number;
}

export interface CodeAnalysisOptions {
  /** 분석할 파일 패턴 */
  filePatterns: string[];
  /** 분석 깊이 */
  depth: 'basic' | 'detailed' | 'comprehensive';
  /** 포함할 분석 유형 */
  analysisTypes: Array<'structure' | 'quality' | 'security' | 'performance'>;
  /** 출력 형식 */
  outputFormat: 'markdown' | 'json' | 'text';
}

export interface GitReviewOptions {
  /** 리뷰할 브랜치/커밋 */
  target?: string;
  /** 베이스 브랜치 */
  base?: string;
  /** 리뷰 유형 */
  reviewType: 'changes' | 'full' | 'security' | 'performance';
  /** 제외할 파일 패턴 */
  excludePatterns?: string[];
}

export interface ProjectAnalysisOptions {
  /** 분석할 디렉토리 */
  directories: string[];
  /** 프로젝트 유형 */
  projectType: 'nextjs' | 'react' | 'nodejs' | 'typescript' | 'auto';
  /** 분석 범위 */
  scope: 'architecture' | 'dependencies' | 'performance' | 'all';
  /** 리포트 형식 */
  reportFormat: 'summary' | 'detailed' | 'executive';
}

export interface DocumentationOptions {
  /** 소스 디렉토리 */
  sourceDir: string;
  /** 출력 디렉토리 */
  outputDir: string;
  /** 문서 유형 */
  docType: 'api' | 'readme' | 'architecture' | 'deployment';
  /** 템플릿 사용 여부 */
  useTemplate: boolean;
  /** 언어 설정 */
  language: 'ko' | 'en';
}

export interface ModuleResult<T = any> {
  /** 결과 데이터 */
  data: T;
  /** 메타데이터 */
  metadata: {
    /** 실행 시간 */
    executionTime: number;
    /** 처리된 파일 수 */
    processedFiles: number;
    /** 생성된 출력 크기 */
    outputSize: number;
    /** 사용된 Gemini 호출 수 */
    geminiCalls: number;
  };
  /** 성공 여부 */
  success: boolean;
  /** 오류 정보 */
  errors?: string[];
  /** 경고 정보 */
  warnings?: string[];
}

export interface CLICommand {
  /** 명령어 이름 */
  name: string;
  /** 명령어 설명 */
  description: string;
  /** 옵션 정의 */
  options?: Record<string, {
    type: 'string' | 'boolean' | 'number' | 'array';
    description: string;
    default?: any;
    required?: boolean;
  }>;
  /** 실행 함수 */
  execute: (args: any) => Promise<ModuleResult>;
}

/** 개발 환경 전용 설정 */
export interface DevOnlyConfig {
  /** 개발 모드 여부 */
  isDevelopment: boolean;
  /** 빌드에서 제외 */
  excludeFromBuild: true;
  /** Vercel 배포 제외 */
  excludeFromDeploy: true;
}