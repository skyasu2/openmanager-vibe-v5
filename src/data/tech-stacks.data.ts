/**
 * Tech Stacks 데이터
 * 각 Feature Card의 모달에서 표시되는 상세 기술 스택 정보
 */

import type { TechItem } from '../types/feature-card.types';

// 바이브 코딩 전용 현재/4단계 히스토리 구분 타입
export interface VibeCodeData {
  current: TechItem[];
  history: {
    stage1: TechItem[]; // 초기: ChatGPT → 개별 페이지 → Netlify
    stage2: TechItem[]; // 중기: Cursor → Vercel → Supabase
    stage3: TechItem[]; // 후기: Claude Code → WSL → 멀티 AI CLI
    stage4: TechItem[]; // 현재: Claude Code v2.0+ → MCP 완전 통합 → 자동화 고도화 (2025.11~)
  };
}

export const TECH_STACKS_DATA: Record<string, TechItem[] | VibeCodeData> = {
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
      tags: ['AI모드', '유연성', '핵심기능'],
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
      implementation:
        '일 1,000회 호출 한도, 분당 15회 제한으로 안정적 AI 서비스',
      status: 'active',
      icon: '🤖',
      tags: ['AI', '고성능', 'Gemini'],
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
      tags: ['배포', '클라우드 호스팅', '전역 CDN'],
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
      tags: ['데이터베이스', 'pgVector', '확장가능'],
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
      tags: ['CI/CD', '자동화', '워크플로우'],
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
  'cursor-ai': {
    current: [
      {
        name: 'Claude Code',
        category: 'ai',
        importance: 'critical',
        description:
          '현재 메인 개발 도구 - Anthropic의 공식 CLI 기반 AI 코딩 어시스턴트',
        implementation:
          'claude.ai/code로 제공되는 강력한 AI 개발 도구. 파일 읽기/쓰기, 코드 수정, 터미널 명령어 실행, 웹 검색 등을 자연어로 수행. Opus 4.1 모델 기반으로 복잡한 코딩 작업 자동화',
        version: 'v1.0.95+',
        status: 'active',
        icon: '🤖',
        tags: ['메인도구', 'AI개발', '자연어코딩', 'CLI'],
        type: 'commercial',
      },
      {
        name: 'MCP 서버',
        category: 'ai',
        importance: 'high',
        description:
          'Claude Code의 기능을 확장하는 Model Context Protocol 서버들',
        implementation: `핵심 서버들로 개발 효율성 극대화:
• memory: 지식 그래프 관리 및 컨텍스트 유지
• supabase: PostgreSQL 데이터베이스 직접 작업  
• playwright: 브라우저 자동화 및 E2E 테스트
• sequential-thinking: 복잡한 문제 단계별 해결
• context7: 라이브러리 문서 실시간 검색
• serena: 고급 코드 분석 및 리팩토링
• shadcn-ui: UI 컴포넌트 개발 지원
• time: 시간대 변환 및 시간 계산
• vercel: Vercel 플랫폼 배포 및 관리`,
        status: 'active',
        icon: '🔌',
        tags: ['MCP서버', '자동화도구', '확장기능'],
        type: 'opensource',
      },
      {
        name: 'Gemini CLI',
        category: 'ai',
        importance: 'high',
        description: 'WSL 터미널에서 1M 토큰으로 대규모 분석 전용 도구',
        implementation:
          '코드베이스 전체 분석, 대용량 로그 분석, Claude Code와 협업하여 복잡한 문제 해결',
        status: 'active',
        icon: '✨',
        tags: ['대용량분석', '협업AI', '터미널'],
        type: 'commercial',
        aiType: 'google-api',
      },
      {
        name: 'Codex CLI',
        category: 'ai',
        importance: 'high',
        description: 'ChatGPT Plus 기반 코드 리뷰 및 검증 전문 도구',
        implementation:
          'WSL에서 실행되는 ChatGPT CLI로 Claude Code와 교차 검증, 코드 리뷰, 복잡한 알고리즘 분석 담당',
        version: 'v0.25.0',
        status: 'active',
        icon: '💎',
        tags: ['코드리뷰', '교차검증', '알고리즘'],
        type: 'commercial',
      },
      {
        name: 'Qwen Code CLI',
        category: 'ai',
        importance: 'medium',
        description: '오픈소스 AI로 빠른 프로토타이핑과 알고리즘 검증',
        implementation:
          'WSL 환경에서 Qwen OAuth 통합, 2,000회/일 활용. 빠른 코드 스니펫 생성과 알고리즘 검증 담당',
        version: 'v0.0.9',
        status: 'active',
        icon: '🧠',
        tags: ['오픈소스AI', '프로토타이핑', '검증'],
        type: 'opensource',
      },
      {
        name: 'Git + GitHub 통합',
        category: 'custom',
        importance: 'high',
        description: '버전 관리부터 PR까지 모든 Git 작업 자동화',
        implementation:
          'MCP GitHub 서버로 커밋, 푸시, PR 생성, 이슈 관리를 Claude Code에서 직접 자동화',
        status: 'active',
        icon: '📝',
        tags: ['Git자동화', 'CI/CD', 'GitHub통합'],
        type: 'custom',
      },
    ],
    history: {
      // 1단계: 초기 (2025.05~06) - ChatGPT 기반 개별 페이지 생성
      stage1: [
        {
          name: 'ChatGPT',
          category: 'ai',
          importance: 'critical',
          description: '프로젝트 최초 시작 도구 - AI로 개별 페이지 생성',
          implementation:
            'GPT-3.5/4.0으로 HTML/CSS/JS 페이지를 개별적으로 생성. 프롬프트 기반으로 모니터링 웹 인터페이스의 기초를 구축. 각 페이지를 독립적으로 개발',
          version: 'GPT-3.5/4.0',
          status: 'history',
          icon: '🤖',
          tags: ['최초도구', '개별페이지', 'AI생성'],
          type: 'commercial',
        },
        {
          name: 'GitHub Web Interface',
          category: 'custom',
          importance: 'high',
          description: 'Git CLI 없이 웹 인터페이스로 파일 수동 업로드',
          implementation:
            '로컬에서 ChatGPT로 생성한 파일들을 GitHub 웹사이트에서 직접 업로드. 체계적인 버전 관리 없이 파일 기반 관리',
          status: 'history',
          icon: '🌐',
          tags: ['수동업로드', 'Git없음', '웹기반'],
          type: 'commercial',
        },
        {
          name: 'Netlify',
          category: 'deployment',
          importance: 'high',
          description: '최초 배포 플랫폼 - GitHub 연동 정적 사이트',
          implementation:
            'GitHub 저장소와 연동하여 정적 사이트 자동 배포. 수동 빌드 과정 없이 기본적인 호스팅 서비스 활용',
          status: 'history',
          icon: '🌍',
          tags: ['정적배포', '첫배포', '자동화없음'],
          type: 'commercial',
        },
        {
          name: '기본 텍스트 에디터',
          category: 'utility',
          importance: 'medium',
          description: '로컬 개발을 위한 기본 에디터',
          implementation:
            'AI 통합 없는 기본 텍스트 에디터로 ChatGPT 생성 코드 수정. VSCode 없이 메모장 수준 편집',
          status: 'history',
          icon: '📝',
          tags: ['기본편집', 'AI없음', '단순수정'],
          type: 'opensource',
        },
      ],
      // 2단계: 중기 (2025.06~07) - Cursor + Vercel + Supabase 통합
      stage2: [
        {
          name: 'Cursor AI',
          category: 'ai',
          importance: 'critical',
          description: '2단계 메인 개발 도구 - 프로덕션급 웹앱 구축',
          implementation:
            'GPT-4와 Claude 3.7 지원, 자동 오류 감지/수정, 백그라운드 에이전트, Composer로 멀티파일 동시 생성. 정적 목업에서 동적 웹 애플리케이션으로 발전시킨 핵심 도구',
          version: '0.42+',
          status: 'history',
          icon: '🚀',
          tags: ['2단계메인', 'AI개발', 'Composer', '프로덕션'],
          type: 'commercial',
        },
        {
          name: 'Git CLI',
          category: 'custom',
          importance: 'high',
          description: '체계적인 버전 관리 시스템 도입',
          implementation:
            '웹 인터페이스에서 Git CLI로 전환. 브랜치 기반 개발, 커밋 히스토리 관리, Pull Request 도입으로 개발 프로세스 체계화',
          status: 'history',
          icon: '📋',
          tags: ['버전관리', 'CLI도입', '체계화'],
          type: 'opensource',
        },
        {
          name: 'Vercel Platform',
          category: 'deployment',
          importance: 'critical',
          description: 'Netlify에서 Vercel로 배포 플랫폼 전환',
          implementation:
            'Next.js SSR/SSG 지원, 자동 배포 파이프라인 구축, 프리뷰 환경 제공. 정적 사이트에서 동적 웹 애플리케이션 배포로 발전',
          status: 'history',
          icon: '▲',
          tags: ['배포전환', 'Next.js', '자동배포'],
          type: 'commercial',
        },
        {
          name: 'Supabase PostgreSQL',
          category: 'database',
          importance: 'critical',
          description: '데이터베이스 도입으로 CRUD 웹앱 완성',
          implementation:
            'PostgreSQL 데이터베이스 연동, 실시간 데이터 서빙, 사용자 인증 시스템, RESTful API 설계. 하드코딩 목업에서 데이터베이스 기반 동적 앱으로 전환',
          status: 'history',
          icon: '🐘',
          tags: ['DB도입', 'CRUD', '실시간데이터'],
          type: 'commercial',
        },
        {
          name: 'Next.js + TypeScript',
          category: 'framework',
          importance: 'high',
          description: '프로덕션급 개발 스택 구축',
          implementation:
            'Next.js 13+ App Router, TypeScript strict mode 도입. 개별 HTML 페이지에서 체계적인 컴포넌트 기반 아키텍처로 발전',
          status: 'history',
          icon: '⚛️',
          tags: ['프레임워크', 'TypeScript', '아키텍처'],
          type: 'opensource',
        },
      ],
      // 3단계: 후기 (2025.07~현재) - Claude Code + WSL + 멀티 AI CLI
      stage3: [
        {
          name: 'Claude Code (Cursor 대체)',
          category: 'ai',
          importance: 'critical',
          description:
            'Cursor의 토큰/비용 문제 해결 - 기능은 우수하지만 경제성으로 전환',
          implementation:
            'Cursor 자체는 훌륭했으나 토큰 사용량과 비용 부담으로 Claude Code 전환. MCP 9개 서버 통합으로 82% 토큰 절약 + @-mention 필터링으로 추가 10-18% 절약 달성. 서브에이전트 12개로 전문화, Opus 4.1 모델로 복잡한 작업 자동화하면서도 비용 효율적인 개발 환경 구축',
          version: 'v1.0.95+',
          status: 'history',
          icon: '🤖',
          tags: ['토큰절약', '비용효율', 'MCP통합', 'Cursor대체'],
          type: 'commercial',
        },
        {
          name: 'WSL 2 Ubuntu',
          category: 'custom',
          importance: 'high',
          description: 'Linux 네이티브 개발 환경으로 성능 대폭 향상',
          implementation:
            '16GB 메모리 할당, I/O 54배 향상, sudo 비밀번호 없이 사용, bash 별칭 최적화. Windows 대비 개발 효율성 극대화',
          version: 'Ubuntu 24.04',
          status: 'history',
          icon: '🐧',
          tags: ['WSL최적화', 'Linux성능', '개발환경'],
          type: 'opensource',
        },
        {
          name: 'Windsurf (실험)',
          category: 'ai',
          importance: 'medium',
          description: '3단계에서 테스트한 Codeium 기반 AI IDE',
          implementation:
            'Flow 모드로 자연스러운 개발 경험, WSL 환경에서 실험적으로 테스트. Claude Code의 우수성 확인 후 전환',
          status: 'history',
          icon: '🌊',
          tags: ['3단계실험', 'Flow모드', 'Codeium'],
          type: 'commercial',
        },
        {
          name: 'AWS Kiro (베타 테스트)',
          category: 'ai',
          importance: 'medium',
          description: '3단계에서 테스트한 AWS 베타 AI IDE',
          implementation:
            'AWS에서 일정기간 베타로 제공한 Claude Sonnet 모델 기반 AI 개발 환경. WSL에서 테스트 후 Claude Code로 통합',
          status: 'history',
          icon: '☁️',
          tags: ['3단계베타', 'Sonnet모델', 'AWS제공'],
          type: 'commercial',
        },
        {
          name: '멀티 AI CLI 통합',
          category: 'ai',
          importance: 'high',
          description: '4-AI 교차 검증 시스템으로 개발 품질 극대화',
          implementation:
            'Claude Code(메인) + Codex CLI(ChatGPT) + Gemini CLI + Qwen CLI로 교차 검증. 단일 AI 한계 극복, 95%+ 문제 발견율 달성',
          status: 'history',
          icon: '🔄',
          tags: ['4AI교차검증', '멀티CLI', '품질극대화'],
          type: 'custom',
        },
        {
          name: 'GCP Functions 추가',
          category: 'deployment',
          importance: 'high',
          description: '3단계에서 서버리스 AI 백엔드 도구 추가',
          implementation:
            '기존 Vercel + Supabase 환경에 서버리스 AI 백엔드 추가. 한국어 자연어 처리와 머신러닝 분석을 위한 서버리스 Functions 도입',
          status: 'history',
          icon: '☁️',
          tags: ['서버리스추가', 'AI백엔드', '3단계신규'],
          type: 'commercial',
        },
        {
          name: 'VSCode + WSL 호스팅',
          category: 'custom',
          importance: 'medium',
          description: '현재 Claude Code 호스팅 환경',
          implementation:
            'VSCode를 WSL 터미널 호스팅 환경으로 활용, Claude Code가 WSL 내부에서 실행되며 모든 AI CLI 도구들과 완벽 통합',
          status: 'history',
          icon: '💻',
          tags: ['VSCode호스팅', 'WSL통합', '터미널환경'],
          type: 'opensource',
        },
      ],
      // 4단계: 현재 (2025.11~) - Claude Code v2.0+ 고도화 + MCP 완전 통합 + 자동화 시스템
      stage4: [
        {
          name: 'Claude Code v2.0+',
          category: 'ai',
          importance: 'critical',
          description:
            'stage3부터 현재까지 메인 개발 도구 - Extended Thinking과 @-mention 서버 필터링 추가',
          implementation:
            'stage3에서 Cursor 대체로 선택된 후 지속 사용. Extended Thinking 모드(Tab 키, ultrathink)로 복잡한 문제 단계별 해결, @-mention 서버 필터링으로 10-18% 추가 토큰 절약, Prompt Caching 자동 활성화로 효율성 극대화',
          version: 'v2.0.37',
          status: 'active',
          icon: '🤖',
          tags: ['메인도구', 'stage3부터', 'ExtendedThinking', '@mention'],
          type: 'commercial',
        },
        {
          name: 'Google Antigravity IDE',
          category: 'ai',
          importance: 'medium',
          description:
            'Gemini 3 탑재 신규 IDE - Windows에서 실행, 터미널에서 WSL + Claude Code 병행 (2025.11)',
          implementation:
            'Google의 새로운 AI 에이전트 개발 플랫폼, Gemini 3 Pro 모델 탑재. Windows에서 Antigravity IDE 실행 → 터미널에서 WSL 열기 → WSL 안에서 Claude Code 사용. VSCode 기반 에이전트 우선 아키텍처로 자율 AI가 복잡한 코딩 작업을 계획/실행/검증 (SWE-bench 76.2%). IDE는 Gemini 3 활용, 터미널은 Claude Code로 이중 AI 개발 환경 구축',
          version: 'Public Preview',
          status: 'active',
          icon: '🌐',
          tags: ['신규IDE', 'Windows실행', 'Gemini3탑재', '터미널WSL+Claude'],
          type: 'commercial',
        },
        {
          name: 'MCP 서버 완전 통합',
          category: 'ai',
          importance: 'critical',
          description: '9개 MCP 서버 100% 가동률 달성 및 최적화 완료',
          implementation: `완전 통합된 MCP 서버 생태계:
• memory: 지식 그래프 기반 프로젝트 컨텍스트 관리
• supabase: PostgreSQL 데이터베이스 직접 작업  
• playwright: E2E 테스트 자동화 (v0.0.45)
• sequential-thinking: 복잡한 문제 단계별 해결
• context7: 라이브러리 최신 문서 실시간 검색
• serena: 코드 분석 및 리팩토링 전문
• shadcn-ui: UI 컴포넌트 개발 지원
• time: 시간대 변환 및 계산
• vercel: Vercel 플랫폼 배포 관리`,
          status: 'active',
          icon: '🔌',
          tags: ['MCP완전통합', '100%가동', '9개서버'],
          type: 'opensource',
        },
        {
          name: 'Claude Code Skills',
          category: 'ai',
          importance: 'high',
          description: '반복 작업 자동화로 73% 토큰 효율 달성',
          implementation: `4개 Skills로 개발 생산성 극대화:
• lint-smoke: 린트+테스트 자동화 (62% 절약)
• next-router-bottleneck: Next.js 성능 진단 (75% 절약)
• ai-report-export: AI 리뷰 문서화 (78% 절약)
• playwright-triage: E2E 실패 분류 (77% 절약)`,
          version: 'Phase 1 Complete',
          status: 'active',
          icon: '⚡',
          tags: ['Skills', '73%효율', '자동화'],
          type: 'custom',
        },
        {
          name: '자동 AI 코드 리뷰 v3.2.0',
          category: 'ai',
          importance: 'high',
          description: 'Codex → Gemini → Claude Code 완전 자동화 폴백 시스템',
          implementation:
            '99.9% 가용성 보장: 1차 2:1 비율 선택(Codex 2회, Gemini 1회) → 2차 Primary AI 실패 시 Secondary AI → 3차 최종 Claude Code 자동 리뷰. 평균 응답 시간 ~10초(레거시 대비 4.5배 빠름)',
          version: 'v3.2.0',
          status: 'active',
          icon: '🔄',
          tags: ['자동리뷰', '99.9%가용성', '3단계폴백'],
          type: 'custom',
        },
        {
          name: 'Gemini 3 CLI',
          category: 'ai',
          importance: 'high',
          description:
            'Gemini 2.5 → 3으로 업그레이드 - SOTA 추론 능력 + 생성형 UI',
          implementation:
            'Gemini 2.5 Pro에서 Gemini 3 Pro로 업그레이드 (2025.11): 1M 토큰 컨텍스트 + 텍스트/이미지/비디오/오디오/코드 멀티모달 동시 처리. MMMU-Pro 81%, Video-MMMU 87.6% 달성. 대규模 코드베이스 전체 분석, 자동 리뷰 시스템 폴백 AI로 통합, Codex 실패 시 자동 전환. 생성형 인터페이스로 맞춤형 출력',
          version: 'v0.15.4 (Gemini 3)',
          status: 'active',
          icon: '✨',
          tags: ['Gemini2.5→3', 'SOTA추론', '멀티모달', '폴백AI', '생성UI'],
          type: 'commercial',
          aiType: 'google-api',
        },
        {
          name: 'Codex CLI (ChatGPT Plus)',
          category: 'ai',
          importance: 'high',
          description:
            '코드 리뷰 및 검증 전문 - Claude Code 교차 검증 목적 도입',
          implementation:
            'ChatGPT Plus 기반 WSL CLI 도구. Claude Code의 단일 AI 한계를 극복하기 위해 stage3부터 도입, 자동 리뷰 시스템 1차 AI로 활용. GPT-4 기반 실무 관점 코드 리뷰와 버그 분석으로 품질 극대화',
          version: 'v0.58.0',
          status: 'active',
          icon: '💎',
          tags: ['교차검증', '1차AI', 'ChatGPT', 'stage3도입'],
          type: 'commercial',
        },
        {
          name: 'Kiro CLI (AWS Beta)',
          category: 'ai',
          importance: 'medium',
          description:
            '터미널 멀티 에이전트 오케스트레이터 - Claude 보완 목적 도입',
          implementation:
            'AWS 베타 제공 Claude Sonnet 기반 멀티 에이전트 CLI. chat/agent/doctor/settings 4가지 모드로 터미널 환경 최적화. Claude Code의 단일 세션 한계를 보완하기 위해 stage3부터 추가 도입, 병렬 작업 처리 및 시스템 진단 담당',
          version: 'v1.20.0',
          status: 'active',
          icon: '☁️',
          tags: ['멀티에이전트', 'AWS베타', '터미널', 'stage3도입'],
          type: 'commercial',
        },
        {
          name: 'Qwen Code CLI',
          category: 'ai',
          importance: 'medium',
          description: '오픈소스 AI로 빠른 프로토타이핑',
          implementation:
            'WSL 환경에서 Qwen OAuth 통합, 2,000회/일 활용, 빠른 코드 스니펫과 알고리즘 검증',
          version: 'v0.2.1',
          status: 'active',
          icon: '🧠',
          tags: ['오픈소스AI', '프로토타이핑', '2K회/일'],
          type: 'opensource',
        },
        {
          name: 'WSL 2 최적화',
          category: 'custom',
          importance: 'high',
          description: '개발 환경 완전 최적화 및 안정화',
          implementation:
            '20GB 메모리 할당, mirrored 네트워킹, dnsTunneling + autoProxy 활성화, I/O 성능 54배 향상, Ubuntu 24.04.1 + 커널 6.6.87.2',
          version: 'Ubuntu 24.04.1',
          status: 'active',
          icon: '🐧',
          tags: ['WSL최적화', '20GB메모리', '성능극대화'],
          type: 'opensource',
        },
        {
          name: 'Node.js v22 안정화',
          category: 'custom',
          importance: 'high',
          description: 'v24에서 v22로 다운그레이드 후 안정성 검증 완료',
          implementation:
            'v22.21.1로 다운그레이드 후 모든 테스트 통과, 88.9% 통과율 달성, npm v11.6.2 + Rust v1.91.0 + uv v0.9.7 통합',
          version: 'v22.21.1',
          status: 'active',
          icon: '🟢',
          tags: ['안정화', 'v22.21.1', '검증완료'],
          type: 'opensource',
        },
        {
          name: 'Git Hooks 자동화',
          category: 'custom',
          importance: 'high',
          description: 'post-commit hook으로 자동 코드 리뷰 트리거',
          implementation:
            '.husky/post-commit에서 auto-ai-review.sh v3.2.0 자동 실행, 백그라운드 처리로 개발 흐름 방해 없음',
          status: 'active',
          icon: '🪝',
          tags: ['Git자동화', 'post-commit', '백그라운드'],
          type: 'custom',
        },
        {
          name: 'GitHub + Vercel + Supabase + GCP',
          category: 'deployment',
          importance: 'critical',
          description:
            'stage3부터 현재까지 지속 사용 중인 완전 자동화 배포 환경',
          implementation:
            'stage2에서 구축한 배포 파이프라인 지속 활용: git push → Vercel 자동 배포 → Supabase 실시간 동기화 → GCP Functions 서버리스 백엔드. 무료 티어 100% 활용(월 $0 운영비), MCP 서버로 GitHub/Vercel 직접 관리',
          status: 'active',
          icon: '🚀',
          tags: ['stage2부터지속', '완전자동화', '무료100%', 'CI/CD'],
          type: 'commercial',
        },
      ],
    },
  },
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
