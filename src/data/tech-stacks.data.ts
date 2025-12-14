/**
 * Tech Stacks 데이터
 * 각 Feature Card의 모달에서 표시되는 상세 기술 스택 정보
 */

import { MCP_SERVERS } from '@/config/constants';
import type { TechItem } from '../types/feature-card.types';

// 바이브 코딩 전용 현재/히스토리 구분 타입
export interface VibeCodeData {
  current: TechItem[];
  history: {
    stage1: TechItem[]; // 1단계: 수동 개발 (ChatGPT/Gemini -> Copy/Paste -> Netlify)
    stage2: TechItem[]; // 2단계: 자동 개발 (Cursor IDE Vibe)
    stage3: TechItem[]; // 3단계: 분기점 (Windsurf/VSCode=보조, WSL/Claude=메인)
  };
}

export const TECH_STACKS_DATA: Record<string, TechItem[] | VibeCodeData> = {
  'ai-assistant-pro': [
    {
      name: 'LangGraph',
      category: 'ai',
      importance: 'critical',
      description: 'LangChain 팀의 Multi-Agent 오케스트레이션 프레임워크',
      implementation:
        'StateGraph로 Supervisor-Worker 패턴 구현, 에이전트 간 통신 및 상태 관리',
      version: '0.2.x',
      status: 'active',
      icon: '🕸️',
      tags: ['Multi-Agent', 'StateGraph', 'LangChain'],
      type: 'opensource',
    },
    {
      name: 'Google Gemini 2.5',
      category: 'ai',
      importance: 'critical',
      description: 'Google의 최신 LLM - Supervisor 에이전트로 사용',
      implementation:
        'Gemini 2.5 Pro(심층 분석)와 Flash(빠른 응답) 모델을 목적에 맞게 사용',
      version: '2.5 Pro/Flash',
      status: 'active',
      icon: '🧠',
      tags: ['LLM', 'Google AI', 'Supervisor'],
      type: 'commercial',
      aiType: 'google-api',
    },
    {
      name: 'Groq Cloud + Llama 3',
      category: 'ai',
      importance: 'critical',
      description: 'Groq LPU 기반 초고속 추론 API - Worker 에이전트로 사용',
      implementation:
        'Llama 3.1 70B/8B 모델을 Groq LPU(500 Tokens/s)로 실행, 도구 호출 담당',
      version: 'Llama 3.1 70B',
      status: 'active',
      icon: '⚡',
      tags: ['LLM', 'Groq LPU', 'Worker'],
      type: 'commercial',
    },
    {
      name: 'Supabase PostgreSQL + pgVector',
      category: 'database',
      importance: 'high',
      description: 'PostgreSQL 기반 BaaS + 벡터 검색 확장',
      implementation: 'RAG 지식 베이스 구축, 임베딩 저장 및 유사도 검색',
      version: 'PostgreSQL 15',
      status: 'active',
      icon: '🐘',
      tags: ['Database', 'RAG', 'Vector Search'],
      type: 'commercial',
    },
    {
      name: 'Official PostgreSQL MCP',
      category: 'ai',
      importance: 'high',
      description: 'Cloud Run에 배포된 Supabase MCP REST API 서비스',
      implementation:
        'Hono + Streamable HTTP로 DB CRUD 도구 제공 (IAM 인증, HTTP/2)',
      version: '1.0.0',
      status: 'active',
      icon: '🔌',
      tags: ['MCP', 'Cloud Run', 'Supabase'],
      type: 'custom',
    },
    {
      name: 'Vercel AI SDK',
      category: 'ai',
      importance: 'high',
      description: 'Vercel의 AI 스트리밍 및 도구 호출 SDK',
      implementation:
        'streamText, generateObject 등 API로 프론트엔드-백엔드 AI 통신',
      version: '5.x',
      status: 'active',
      icon: '▲',
      tags: ['SDK', 'Streaming', 'Vercel'],
      type: 'opensource',
    },
    {
      name: 'Python Flask (Cloud Run)',
      category: 'framework',
      importance: 'high',
      description: 'GCP Cloud Run에 배포되는 Python AI 백엔드',
      implementation:
        'LangGraph 그래프 실행 및 REST API 제공, Docker 컨테이너화',
      version: 'Python 3.11',
      status: 'active',
      icon: '🐍',
      tags: ['Backend', 'Cloud Run', 'Docker'],
      type: 'opensource',
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
      name: 'GCP Cloud Run (Python 3.11)',
      category: 'deployment',
      importance: 'high',
      description: '3개의 Python 마이크로서비스 컨테이너 배포',
      implementation:
        'Cloud Functions에서 Cloud Run으로 마이그레이션 완료. Docker 기반의 표준화된 런타임으로 Cold Start 최소화 및 확장성 확보',
      version: 'Python 3.11',
      status: 'active',
      icon: '☁️',
      tags: ['CloudRun', 'Container', 'Python3.11'],
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
    {
      name: 'Biome',
      category: 'utility',
      importance: 'high',
      description: '차세대 고성능 린터 & 포맷터',
      implementation:
        'Rust 기반으로 ESLint/Prettier 대비 25배 빠른 속도, OOM 문제 해결',
      version: '2.3.8',
      status: 'active',
      icon: '⚡',
      tags: ['린터', '포맷터', 'Rust', '고성능'],
      type: 'opensource',
    },
  ],
  'cursor-ai': {
    current: [
      {
        name: 'Antigravity (Gemini)',
        category: 'ai',
        importance: 'critical',
        description: '4단계 완성형 - Antigravity와 Multi-CLI 에이전트 시대',
        implementation:
          'WSL 환경의 Claude Code를 메인으로, Codex, Gemini, Qwen, Kiro-CLI 등 다양한 에이전트가 공존. 여기에 Antigravity가 더해져 진정한 "Agentic AI" 시대를 염',
        version: 'v1.0.0',
        status: 'active',
        icon: '🌌',
        tags: ['Antigravity', 'Multi-CLI', 'Agentic-Era', 'WSL-Native'],
        type: 'custom',
      },
      {
        name: 'MCP 서버',
        category: 'ai',
        importance: 'high',
        description: `Claude Code의 기능을 확장하는 Model Context Protocol 서버들 (${MCP_SERVERS.TOTAL_ACTIVE}개)`,
        implementation: `핵심 ${MCP_SERVERS.TOTAL_ACTIVE}개 서버로 개발 효율성 극대화:
• vercel: Vercel 플랫폼 배포 및 관리
• supabase: PostgreSQL 데이터베이스 직접 작업
• serena: 고급 코드 분석 및 리팩토링
• context7: 라이브러리 문서 실시간 검색
• playwright: 브라우저 자동화 및 E2E 테스트
• figma: Design-to-Code (6회/월)
• github: 저장소 관리 및 자동화
• tavily: 웹 검색 - 심층 리서치
• brave-search: 웹 검색 - 팩트체크`,
        status: 'active',
        icon: '🔌',
        tags: ['MCP서버', '자동화도구', '확장기능'],
        type: 'opensource',
      },
      {
        name: 'Claude Code Skills',
        category: 'ai',
        importance: 'high',
        description: '반복 작업 자동화 Skills (5개) - 평균 71.8% 토큰 절약',
        implementation: `자동화된 워크플로우:
• lint-smoke: Biome 린트 + 테스트 자동화 (62% 절약)
• next-router-bottleneck: Next.js 성능 진단 (75% 절약)
• ai-report-export: AI 리뷰 결과 문서화 (78% 절약)
• playwright-triage: E2E 테스트 실패 분류 (77% 절약)
• security-audit-workflow: 배포 전 보안 감사 (70% 절약)`,
        status: 'active',
        icon: '⚡',
        tags: ['자동화', '토큰효율', '워크플로우'],
        type: 'custom',
      },
      {
        name: 'Auto Code Review',
        category: 'ai',
        importance: 'critical',
        description:
          '4-AI 균등분배 자동 리뷰 시스템 (Codex/Gemini/Qwen/Claude 1:1:1:1, 99.99% 가용성)',
        implementation:
          '커밋 시 .husky/post-commit이 자동 트리거. 1:1:1:1 순환 선택으로 Codex → Gemini → Qwen → Claude 균등 분배. Rate Limit 자동 감지 및 폴백. 평균 응답 10초',
        version: 'v5.0',
        status: 'active',
        icon: '🔄',
        tags: ['자동리뷰', '폴백시스템', '고가용성'],
        type: 'custom',
      },
      {
        name: 'Codex CLI',
        category: 'ai',
        importance: 'high',
        description: 'ChatGPT Plus 기반 코드 리뷰 및 검증 전문 도구',
        implementation:
          'WSL에서 실행되는 ChatGPT CLI로 Claude Code와 교차 검증, 코드 리뷰, 복잡한 알고리즘 분석 담당. Auto Code Review 시스템의 1차 리뷰어',
        version: 'v0.63.0',
        status: 'active',
        icon: '💎',
        tags: ['코드리뷰', '교차검증', '알고리즘'],
        type: 'commercial',
      },
      {
        name: 'Gemini CLI',
        category: 'ai',
        importance: 'high',
        description: 'WSL 터미널에서 1M 토큰으로 대규모 분석 전용 도구',
        implementation:
          '코드베이스 전체 분석, 대용량 로그 분석, Claude Code와 협업. 4-AI 균등분배 시스템의 리뷰어 (25%)',
        version: 'v0.18.4',
        status: 'active',
        icon: '✨',
        tags: ['대용량분석', '협업AI', '터미널'],
        type: 'commercial',
        aiType: 'google-api',
      },
      {
        name: 'Qwen Code CLI',
        category: 'ai',
        importance: 'high',
        description: '4-AI 균등분배 시스템의 리뷰어 (25%) + 프로토타이핑',
        implementation:
          'WSL 환경에서 Qwen OAuth 통합, 2,000회/일 활용. v5.0 균등분배에서 Codex/Gemini/Claude와 동등한 25% 비율',
        version: 'v0.3.0',
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
      {
        name: 'Docker (Cloud Run Dev)',
        category: 'deployment',
        importance: 'high',
        description: '로컬에서 클라우드/AI 환경 완벽 에뮬레이션',
        implementation:
          'WSL 위에서 Docker를 실행하여 GCP Cloud Run 환경과 동일한 컨테이너 개발 환경 구축. "내 컴퓨터에서는 되는데" 문제 원천 차단',
        version: '24.0.x',
        status: 'active',
        icon: '🐋',
        tags: ['Docker', 'WSL', 'Local-Dev'],
        type: 'commercial',
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
          tags: ['1단계', '수동개발', 'Copy&Paste', 'Netlify'],
          type: 'commercial',
        },
        {
          name: 'Netlify (Mockup)',
          category: 'deployment',
          importance: 'medium',
          description: '초기 배포처 - 정적 페이지 호스팅',
          implementation:
            '복잡한 서버 로직 없이 HTML/JS 수준의 목업을 빠르게 띄우던 용도',
          status: 'history',
          icon: '🌐',
          tags: ['Mockup', '단순호스팅', '정적웹'],
          type: 'commercial',
        },
      ],

      // 2단계: 중기 (2025.06~07) - Cursor 자동 개발 시대
      stage2: [
        {
          name: 'Cursor AI (Auto Dev)',
          category: 'ai',
          importance: 'critical',
          description: '2단계 - "자동 개발"의 시작',
          implementation:
            'IDE 안에서 AI가 파일을 수정해주는 "Vibe Coding"의 탄생. 수동 복붙에서 벗어나 생산성이 비약적으로 향상된 시기',
          version: '0.42+',
          status: 'history',
          icon: '🚀',
          tags: ['2단계', '자동개발', 'Cursor', 'IDE중심'],
          type: 'commercial',
        },
        {
          name: 'Vercel + Supabase',
          category: 'deployment',
          importance: 'high',
          description: '현재까지 이어지는 인프라 표준 정립',
          implementation:
            'Cursor 시기에 도입된 이 조합(Next.js+Vercel+Supabase)은 현재 4단계 Agentic Era까지 변함없이 우리 서비스의 단단한 뼈대가 되어주고 있음',
          status: 'history',
          icon: '⚡',
          tags: ['FullStack', '핵심기반', '현재도사용중'],
          type: 'commercial',
        },
      ],

      // 3단계: 후기 (2025.07~10) - 분기점 (Pivot Point)
      stage3: [
        {
          name: 'WSL + Claude Code (Main)',
          category: 'ai',
          importance: 'critical',
          description: '3단계 핵심 - 메인 개발 환경의 이동 (IDE → WSL)',
          implementation:
            '이 시점부터 WSL 터미널이 메인 개발 스테이지가 됨. Claude Code가 등장하여 실질적인 개발을 주도하기 시작함',
          status: 'history',
          icon: '🐧',
          tags: ['3단계', 'WSL-Main', 'Claude-Code', '분기점'],
          type: 'custom',
        },
        {
          name: 'Visual Aux (Windsurf/VSCode)',
          category: 'ai',
          importance: 'medium',
          description: 'IDE의 역할 축소 - 보조 및 시각적 분석',
          implementation:
            'Windsurf와 VSCode를 사용하지만, 역할은 "보조"로 축소됨. 주로 프론트엔드 스크린샷 분석이나 단순 뷰어 역할을 담당',
          status: 'history',
          icon: '👁️',
          tags: ['IDE-Secondary', '시각분석', '보조역할'],
          type: 'commercial',
        },
        {
          name: 'GCP Cloud Functions (Legacy)',
          category: 'deployment',
          importance: 'medium',
          description: '3단계 배포 - 서버리스 함수의 도입',
          implementation:
            '초기에는 Docker 없이 가볍게 배포 가능한 Cloud Functions를 사용함. 하지만 로컬 개발 환경과의 불일치로 인해 이후 Cloud Run으로 전환하게 됨',
          status: 'history',
          icon: '⚡',
          tags: ['GCP', 'Functions', 'Serverless'],
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
