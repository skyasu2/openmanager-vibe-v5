/**
 * Tech Stacks 데이터
 * 각 Feature Card의 모달에서 표시되는 상세 기술 스택 정보
 */

import type { TechItem } from '@/types/feature-card.types';

export const TECH_STACKS_DATA: Record<string, TechItem[]> = {
  'mcp-ai-engine': [
    {
      name: 'AI 사이드바 어시스턴트',
      category: 'ai',
      importance: 'critical',
      description: '로컬 AI + Supabase RAG 기반 실시간 어시스턴트',
      implementation: 'Supabase pgvector RAG와 로컬 AI 엔진 통합으로 빠른 응답',
      version: 'v5.66.31',
      status: 'active',
      icon: '🤖',
      tags: ['실시간AI', '사이드바', 'RAG통합'],
      type: 'custom',
    },
    {
      name: 'LOCAL/GOOGLE 2-Mode',
      category: 'ai',
      importance: 'critical',
      description: '로컬 AI 기본 모드 + Google AI 선택 모드',
      implementation:
        '모든 기능 로컬 AI로 기본 제공, 사용자 선택으로 Google AI 전환',
      version: 'v5.66.22',
      status: 'active',
      icon: '🎯',
      tags: ['AI모드', '무료우선', '핵심기능'],
      type: 'custom',
    },
    {
      name: '한국어 자연어 처리',
      category: 'language',
      importance: 'high',
      description: '"CPU 높은 서버?" 같은 한국어 자연어 질문 처리',
      implementation:
        '로컬 AI 기본으로 처리, Google AI 모드 선택 시 더 정교한 분석',
      status: 'active',
      icon: '🇰🇷',
      tags: ['한국어', 'NLP', '자연어'],
      type: 'custom',
      aiType: 'local-engine',
    },
    {
      name: '실시간 서버 분석',
      category: 'ai',
      importance: 'high',
      description: '로컬 AI로 서버 메트릭 실시간 분석 및 답변',
      implementation: '로컬 AI가 15초마다 갱신되는 메트릭 데이터 분석',
      status: 'active',
      icon: '📊',
      tags: ['실시간분석', '메트릭', 'AI분석'],
      type: 'custom',
      aiType: 'local-engine',
    },
    {
      name: '이상 징후 감지',
      category: 'ai',
      importance: 'high',
      description: '로컬 AI로 CPU/메모리 급증 등 이상 패턴 감지',
      implementation: '로컬 AI가 임계값 기반으로 패턴 분석 및 예방 알림',
      status: 'active',
      icon: '🚨',
      tags: ['이상감지', '예방알림', 'AI'],
      type: 'custom',
      aiType: 'local-engine',
    },
    {
      name: 'Supabase pgVector',
      category: 'database',
      importance: 'medium',
      description: '문서 벡터 검색으로 관련 정보를 AI가 찾아서 답변',
      implementation: 'PostgreSQL pgVector 확장으로 임베딩 검색 구현',
      status: 'active',
      icon: '🔍',
      tags: ['벡터검색', 'RAG', '지식베이스'],
      type: 'commercial',
    },
    {
      name: '지능형 쿼리 엔진',
      category: 'ai',
      importance: 'medium',
      description: '로컬 AI 기본 쿼리 처리, Google AI 선택 가능',
      implementation:
        '모든 쿼리 로컬 AI로 기본 처리, 선택적으로 Google Gemini 활용',
      status: 'active',
      icon: '🧠',
      tags: ['쿼리엔진', 'NLP', '지능형분석'],
      type: 'custom',
    },
    {
      name: 'Google AI Studio',
      category: 'ai',
      importance: 'high',
      description: 'Gemini 2.0 Flash 모델로 고급 AI 분석',
      implementation: '일 1,000회 무료 할당량, 분당 15회 제한으로 비용 최적화',
      status: 'active',
      icon: '🤖',
      tags: ['AI', '무료할당량', 'Gemini'],
      type: 'commercial',
      aiType: 'google-api',
    },
  ],
  'fullstack-ecosystem': [
    {
      name: 'Vercel Platform',
      category: 'deployment',
      importance: 'critical',
      description: '프론트엔드 애플리케이션 클라우드 호스팅 플랫폼',
      implementation:
        'GitHub 연동으로 Push 시 자동 빌드, 전 세계 CDN으로 즉시 배포',
      status: 'active',
      icon: '▲',
      tags: ['배포', '클라우드 호스팅', '무료티어'],
      type: 'commercial',
    },
    {
      name: 'Supabase PostgreSQL',
      category: 'database',
      importance: 'critical',
      description: '메인 데이터베이스로 모든 데이터 저장 및 관리',
      implementation: 'PostgreSQL + pgVector (벡터 검색) + RLS (행 수준 보안)',
      status: 'active',
      icon: '🐘',
      tags: ['데이터베이스', 'pgVector', '500MB무료'],
      type: 'commercial',
    },
    {
      name: 'GCP Functions (Python 3.11)',
      category: 'deployment',
      importance: 'high',
      description: '3개의 Python 서버리스 함수 배포 완료',
      implementation:
        'enhanced-korean-nlp (한국어 처리), ml-analytics-engine (ML 분석), unified-ai-processor (AI 통합)',
      version: 'Python 3.11',
      status: 'active',
      icon: '☁️',
      tags: ['클라우드', 'Python3.11', '배포완료'],
      type: 'commercial',
    },
    {
      name: 'GitHub Actions',
      category: 'deployment',
      importance: 'medium',
      description: 'CI/CD 파이프라인으로 자동 테스트 및 배포',
      implementation: 'Workflow 파일로 테스트→빌드→배포 자동화',
      status: 'active',
      icon: '🔄',
      tags: ['CI/CD', '자동화', '월2000분무료'],
      type: 'commercial',
    },
  ],
  'tech-stack': [
    {
      name: 'Next.js 15',
      category: 'framework',
      importance: 'critical',
      description: 'React 기반 풀스택 프레임워크',
      implementation:
        'App Router + 서버 컴포넌트로 최적화된 서버 사이드 렌더링',
      version: '15.4.5',
      status: 'active',
      icon: '⚛️',
      tags: ['프레임워크', '오픈소스', 'React'],
      type: 'opensource',
    },
    {
      name: 'React 18',
      category: 'framework',
      importance: 'critical',
      description: 'UI 구축을 위한 JavaScript 라이브러리',
      implementation: 'Concurrent Features와 Suspense로 최적화된 렌더링',
      version: '18.3.1',
      status: 'active',
      icon: '⚛️',
      tags: ['UI라이브러리', '오픈소스', 'Meta'],
      type: 'opensource',
    },
    {
      name: 'TypeScript',
      category: 'language',
      importance: 'critical',
      description: '타입 안전성을 보장하는 JavaScript 확장',
      implementation: 'strict 모드로 컴파일 타임 오류 방지 및 개발 생산성 향상',
      version: '5.7.2',
      status: 'active',
      icon: '🔷',
      tags: ['언어', '오픈소스', '타입안전'],
      type: 'opensource',
    },
    {
      name: 'Tailwind CSS',
      category: 'ui',
      importance: 'high',
      description: 'Utility-first CSS 프레임워크',
      implementation: 'JIT 컴파일러로 빠른 스타일링 및 다크모드 구현',
      version: '3.4+',
      status: 'active',
      icon: '🎨',
      tags: ['UI', '오픈소스', 'CSS'],
      type: 'opensource',
    },
    {
      name: 'Vitest',
      category: 'framework',
      importance: 'high',
      description: '고속 테스트 프레임워크',
      implementation:
        '55개 테스트, 98.2% 커버리지, 3단계 테스트 전략 (minimal 6ms → smart → full)',
      status: 'active',
      icon: '🧪',
      tags: ['테스트', '오픈소스', '고속'],
      type: 'opensource',
    },
    {
      name: 'Zustand',
      category: 'framework',
      importance: 'medium',
      description: '경량 상태 관리 라이브러리',
      implementation: 'TypeScript 기반 글로벌 상태 관리 및 지속성 구현',
      version: '4.5.4',
      status: 'active',
      icon: '🔄',
      tags: ['상태관리', '오픈소스', 'React'],
      type: 'opensource',
    },
    {
      name: 'Recharts',
      category: 'ui',
      importance: 'high',
      description: '대시보드 차트 렌더링 라이브러리',
      implementation: '실시간 메트릭 시각화, 반응형 차트, 커스텀 툴팁 구현',
      version: '2.12.7',
      status: 'active',
      icon: '📊',
      tags: ['차트', '오픈소스', '시각화'],
      type: 'opensource',
    },
    {
      name: 'CSS 애니메이션 (최적화)',
      category: 'ui',
      importance: 'medium',
      description: 'Framer Motion 대체 순수 CSS 애니메이션 시스템',
      implementation:
        '커스텀 키프레임, 호버 효과, 페이지 전환 - 60% 성능 향상 달성',
      version: 'CSS3',
      status: 'active',
      icon: '⚡',
      tags: ['CSS애니메이션', '성능최적화', '네이티브'],
      type: 'custom',
    },
    {
      name: 'Lucide React',
      category: 'ui',
      importance: 'medium',
      description: '경량 아이콘 라이브러리',
      implementation:
        '1000+ 아이콘 지원, Tree-shaking 최적화, TypeScript 완벽 지원',
      version: '0.441.0',
      status: 'active',
      icon: '🎨',
      tags: ['아이콘', '오픈소스', 'UI'],
      type: 'opensource',
    },

    {
      name: 'Radix UI',
      category: 'ui',
      importance: 'high',
      description: '접근성 높은 헤드리스 UI 컴포넌트',
      implementation:
        '17개 컴포넌트 사용 중 (Dialog, Toast, Dropdown, Tabs 등)',
      version: '1.x',
      status: 'active',
      icon: '🎯',
      tags: ['UI컴포넌트', '오픈소스', '접근성'],
      type: 'opensource',
    },
    {
      name: 'Radix Toast',
      category: 'ui',
      importance: 'medium',
      description: '접근성 표준을 따르는 토스트 알림 컴포넌트',
      implementation:
        'Radix UI Toast 프리미티브 기반 커스텀 토스트 컴포넌트 사용',
      status: 'active',
      icon: '🔔',
      tags: ['알림', '접근성', 'UI'],
      type: 'opensource',
    },

    {
      name: 'clsx',
      category: 'utility',
      importance: 'high',
      description: '조건부 클래스 결합 유틸리티',
      implementation: 'Tailwind CSS와 완벽 호환, TypeScript 지원, 경량화(228B)',
      version: '2.1.1',
      status: 'active',
      icon: '🎯',
      tags: ['유틸리티', '오픈소스', '스타일링'],
      type: 'opensource',
    },
  ],
  'cursor-ai': [
    {
      name: 'Claude Code (현재 메인)',
      category: 'ai',
      importance: 'critical',
      description:
        '현재 메인 개발 도구 - Anthropic의 공식 CLI 기반 AI 코딩 어시스턴트',
      implementation:
        'claude.ai/code로 제공되는 강력한 AI 개발 도구. 파일 읽기/쓰기, 코드 수정, 터미널 명령어 실행, 웹 검색 등을 자연어로 수행. Opus 4.1 모델 기반으로 복잡한 코딩 작업 자동화',
      version: 'v1.0.95+',
      status: 'active',
      icon: '🤖',
      tags: ['현재메인', 'AI개발', '자연어코딩', 'CLI'],
      type: 'commercial',
    },
    {
      name: 'MCP 서버 8개 (보조 도구)',
      category: 'ai',
      importance: 'high',
      description:
        'Claude Code의 기능을 확장하는 Model Context Protocol 서버들',
      implementation: `• filesystem: 파일 시스템 작업 자동화
• memory: 지식 그래프 관리 및 컨텍스트 유지
• github: GitHub 저장소, PR, 이슈 관리
• supabase: PostgreSQL 데이터베이스 직접 작업
• tavily-remote: 웹 검색 및 콘텐츠 추출
• sequential-thinking: 복잡한 문제 단계별 해결
• playwright: 브라우저 자동화 및 E2E 테스트
• time: 시간대 변환 및 시간 계산
• context7: 라이브러리 문서 실시간 검색
• serena: 고급 코드 분석 및 리팩토링
• shadcn-ui: UI 컴포넌트 개발 지원`,
      status: 'active',
      icon: '🔌',
      tags: ['MCP서버', '자동화도구', '확장기능', '8개서버'],
      type: 'opensource',
    },
    {
      name: 'Cursor AI',
      category: 'ai',
      importance: 'critical',
      description: '프로젝트 초기부터 사용한 핵심 AI 개발 도구',
      implementation:
        'GPT-4와 Claude 3.7 지원, 자동 오류 감지/수정, 백그라운드 에이전트, Composer로 멀티파일 동시 생성',
      status: 'active',
      icon: '🚀',
      tags: ['AI개발', '자동완성', '오류수정'],
      type: 'commercial',
    },
    {
      name: 'Windsurf',
      category: 'ai',
      importance: 'high',
      description: '차세대 AI 코드 에디터',
      implementation:
        'Flow 모드로 자연스러운 개발 경험 제공, AI와의 대화형 코딩, 실시간 코드 리뷰 및 제안',
      status: 'active',
      icon: '🌊',
      tags: ['차세대에디터', 'Flow모드', 'AI대화'],
      type: 'commercial',
    },
    {
      name: 'AWS Kiro',
      category: 'ai',
      importance: 'high',
      description: 'AWS 전용 AI 코딩 어시스턴트',
      implementation:
        'AWS 리소스 자동 관리, Lambda 함수 생성, CloudFormation 템플릿 작성, AWS 베스트 프랙티스 제안',
      status: 'active',
      icon: '☁️',
      tags: ['AWS전용', '클라우드자동화', '인프라코드'],
      type: 'commercial',
    },
    {
      name: 'Gemini CLI',
      category: 'ai',
      importance: 'medium',
      description: 'WSL 터미널에서 1M 토큰으로 대규모 분석',
      implementation:
        '코드베이스 전체 분석, 대용량 로그 분석, Claude Code와 협업',
      status: 'active',
      icon: '✨',
      tags: ['Gemini', '대용량분석', '협업AI'],
      type: 'commercial',
      aiType: 'google-api',
    },
    {
      name: 'Git + GitHub 자동화',
      category: 'custom',
      importance: 'high',
      description: '버전 관리부터 PR까지 모든 Git 작업 자동화',
      implementation: 'GitHub MCP 서버로 커밋, 푸시, PR 생성, 이슈 관리 자동화',
      status: 'active',
      icon: '📝',
      tags: ['Git자동화', 'CI/CD', 'GitHub'],
      type: 'custom',
    },
  ],
};

/**
 * 중요도별 스타일 정보
 */
export const IMPORTANCE_STYLES = {
  critical: {
    bg: 'bg-red-500/20 border-red-500/40',
    text: 'text-red-300',
    badge: 'bg-red-500/30 text-red-200',
    label: '필수',
  },
  high: {
    bg: 'bg-orange-500/20 border-orange-500/40',
    text: 'text-orange-300',
    badge: 'bg-orange-500/30 text-orange-200',
    label: '중요',
  },
  medium: {
    bg: 'bg-blue-500/20 border-blue-500/40',
    text: 'text-blue-300',
    badge: 'bg-blue-500/30 text-blue-200',
    label: '보통',
  },
  low: {
    bg: 'bg-gray-500/20 border-gray-500/40',
    text: 'text-gray-300',
    badge: 'bg-gray-500/30 text-gray-200',
    label: '낮음',
  },
};

/**
 * 카테고리별 스타일 정보
 */
export const CATEGORY_STYLES = {
  framework: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
  language: { color: 'text-green-400', bg: 'bg-green-500/10' },
  database: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ai: { color: 'text-pink-400', bg: 'bg-pink-500/10' },
  opensource: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  custom: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  deployment: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ui: { color: 'text-teal-400', bg: 'bg-teal-500/10' },
  utility: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
};
