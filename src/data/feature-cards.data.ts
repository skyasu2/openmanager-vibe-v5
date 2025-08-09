/**
 * Feature Cards 데이터
 * 메인 페이지에 표시되는 4개의 주요 기능 카드 데이터
 */

import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import type { FeatureCard } from '@/types/feature-card.types';

export const FEATURE_CARDS_DATA: FeatureCard[] = [
  {
    id: 'mcp-ai-engine',
    title: '🧠 AI 어시스턴트',
    description:
      'AI로 시스템을 분석하는 도구입니다. 질문하면 답변해주고, 앞일을 예측하며, 보고서까지 자동으로 만들어줍니다.',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
    detailedContent: {
      overview: `v5.66.33 - GCP VM MCP 시스템으로 구동되는 AI 어시스턴트! Google Cloud VM에서 실행되는 Google AI 자연어 처리 전용 서버가 강력한 AI 기능을 제공합니다.`,
      features: [
        '🌐 GCP VM MCP (클라우드): Google AI 자연어 질의 처리 전용 서버 (포트 10000)',
        '🤖 하이브리드 AI 엔진: Supabase pgVector + GCP Functions + Google AI 통합',
        '📊 서버 상태 분석: 실시간 메트릭 분석 및 자연어 답변 제공',
        '🇰🇷 한국어 자연어 질의: "CPU 높은 서버?", "메모리 부족한 서버?" 등',
        '🗄️ pgVector 벡터 검색: 126ms 응답 속도, 7.5x 성능 향상 달성',
        '🆓 완전 무료 운영: Supabase + GCP 무료 티어 100% 활용',
      ],
      technologies: [
        'GCP VM MCP 서버',
        'Supabase pgVector',
        'GCP Cloud Functions',
        'Korean NLP Engine',
        'Google Gemini 2.0',
        'Google AI Studio',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel, Supabase, GCP 무료 티어만으로 하나의 통합된 클라우드 기반 포트폴리오용 AI 프로토타입을 구축했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v5.66.32 - 무료 티어 최적화로 월 $0 운영! 3개 핵심 클라우드 플랫폼 통합으로 엔터프라이즈급 인프라 구축. 100% 무료로 99.95% 가동률과 152ms 응답 시간 달성.`,
      features: [
        '▲ Vercel 플랫폼: 프론트엔드 애플리케이션 클라우드 호스팅, 전 세계 CDN 자동 배포, Git 기반 지속적 배포',
        '🌐 Vercel로 구현한 기능: 자동 HTTPS/SSL 인증서, 도메인 관리, 환경 변수 보안 관리, 분석 대시보드',
        '🚀 Vercel 핵심 가치: 무료 100GB 대역폭/월, 자동 스케일링, 빌드 최적화, 프리뷰 배포로 팀 협업 지원',
        '🐘 Supabase 플랫폼: PostgreSQL + pgVector + Row Level Security, 실시간 구독 지원',
        '📊 Supabase로 구현한 기능: 서버 메트릭 저장, AI 벡터 검색, 사용자 인증 시스템, 실시간 데이터 동기화',
        '☁️ GCP Functions: Python 3.11 기반 AI 처리 서버 3개 (enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor)',
        '🖥️ GCP VM (향후 계획): e2-micro 무료 티어로 백엔드 API, 크론잡, 백그라운드 작업 예정',
        '💾 Memory Cache: 네트워크 지연 0ms, 초고속 응답으로 Redis 대체',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL',
        'GCP Cloud Functions',
        'Memory Cache System',
        'GitHub Actions CI/CD',
        'GCP VM (계획)',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 15 · React 18 · TypeScript 기반. 실시간 UI와 대시보드 차트를 갖춘 프로덕션급 웹 스택',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `v5.66.33 - 실제 사용 중인 프로덕션급 기술 스택! Next.js 15 App Router, TypeScript strict mode, 실시간 차트, 고급 UI 컴포넌트로 엔터프라이즈급 웹 애플리케이션 구현.`,
      features: [
        '⚛️ React 18.3.1 + Next.js 15.4.5: App Router, Edge Runtime 최적화',
        '🔷 TypeScript: strict mode 적용으로 타입 안전성 강화',
        '📊 Recharts: 실시간 대시보드 차트 및 메트릭 시각화',
        '🎨 Tailwind CSS: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest: 40개 테스트 파일, 3단계 테스트 전략 (minimal → smart → full)',
        '🎬 Framer Motion: 부드러운 페이지 전환 및 애니메이션 효과',
        '🏬 Radix UI: 14개+ 헤드리스 UI 컴포넌트 (Dialog, Accordion, Tabs, Select 등)',
        '🎆 Lucide React: 1000+ 아이콘 라이브러리 (121곳에서 활용)',
        '🧰 Zustand: 글로벌 상태 관리 및 persist 미들웨어 적용',
        '🔔 Radix Toast: 접근성 표준 기반 알림 시스템',
      ],
      technologies: [
        'Next.js 15.4.5',
        'React 18.3.1',
        'TypeScript 5.7.2',
        'Tailwind CSS 3.4.17',
        'Recharts 2.12.7',
        'Framer Motion 11.3.21',
        'Zustand 4.5.4',
        'Vitest 3.2.4',
        'Radix UI',
        'Lucide React',
        'Radix Toast',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      'Vibe Coding으로 모니터링 웹 자동 생성. 프롬프트 기반으로 AI 어시스턴트를 완성했습니다.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.66.30 - Claude Code가 현재 메인 개발 도구! 11개 MCP 서버로 완벽한 자동화를 구현하며, Cursor AI, Windsurf, AWS Kiro 등 다양한 AI 도구들과 협업하여 개발 속도 10배 향상을 달성했습니다.`,
      features: [
        '🤖 Claude Code (현재 메인): 11개 MCP 서버로 파일, Git, DB 등 모든 개발 작업 자동화',
        '🚀 Cursor AI: 자동 오류 감지/수정, 백그라운드 에이전트, Composer로 멀티파일 동시 생성',
        '🌊 Windsurf: 차세대 AI 코드 에디터, Flow 모드로 자연스러운 개발 경험 제공',
        '☁️ AWS Kiro: AWS 전용 AI 코딩 어시스턴트, 클라우드 리소스 자동 관리',
        '💡 Gemini CLI: 1M 토큰 컨텍스트로 전체 코드베이스 분석 (일 1,000회 무료)',
        '🔧 실제 성과: TypeScript 에러 302→0개, ESLint 문제 475→400개 감소',
        '📊 17개 서브에이전트: code-review, test-automation, debugger 등으로 품질 자동 관리',
      ],
      technologies: [
        'Claude Code (현재 메인)',
        'MCP 서버 11개 (보조 도구)',
        'Cursor AI',
        'Windsurf',
        'AWS Kiro',
        'Gemini CLI',
        'Git + GitHub 자동화',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];

/**
 * 카드별 완성도 데이터
 */
export const CARD_COMPLETION_RATES: Record<string, number> = {
  'mcp-ai-engine': 95,
  'fullstack-ecosystem': 88,
  'tech-stack': 92,
  'cursor-ai': 85,
  default: 80,
};
