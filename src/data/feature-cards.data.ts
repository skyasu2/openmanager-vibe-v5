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
      overview: `v5.71.0+ - 하이브리드 AI 시스템 완성! GCP Functions 기반 AI 처리로 실시간 서버 분석과 한국어 자연어 처리를 통해 직관적인 시스템 관리를 제공합니다.`,
      features: [
        '🌐 GCP Functions: enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor 3개 서버리스 AI 엔진',
        '📊 실시간 서버 분석: 고급 통계 알고리즘 + GCP ML 엔진으로 장애 예측',
        '🇰🇷 한국어 자연어 질의: "CPU 높은 서버?", "메모리 부족한 서버?" 등',
        '🆓 완전 무료 운영: GCP Functions 200만 호출/월 + Supabase 무료 티어',
      ],
      technologies: [
        'GCP Cloud Functions',
        'enhanced-korean-nlp',
        'ml-analytics-engine',
        'unified-ai-processor',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel, Supabase, GCP Functions 무료 티어로 완전 통합된 클라우드 AI 플랫폼을 구축. 실시간 서버 모니터링으로 엔터프라이즈급 인프라를 제공합니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v5.71.0+ - 무료 티어 완전 최적화로 월 $0 운영! 3개 핵심 클라우드 플랫폼으로 엔터프라이즈급 인프라 구축. 272ms 응답 시간, 99.95% 안정성으로 실시간 서버 모니터링 제공.`,
      features: [
        '▲ Vercel 플랫폼: 프론트엔드 + API 호스팅, 전 세계 CDN 배포, Edge Functions 최적화',
        '🌐 Vercel 핵심 구현: 자동 HTTPS/SSL, 실시간 데이터 서빙, 환경변수 보안, 분석 대시보드',
        '🚀 Vercel 성능: 30GB/월 (30% 사용), 자동 스케일링, 빌드 최적화, 무제한 프리뷰 배포',
        '🐘 Supabase 플랫폼: PostgreSQL + pgVector + Row Level Security, 실시간 구독 지원',
        '📊 Supabase 데이터: 15MB (3% 사용), AI 벡터 검색, 사용자 인증, 실시간 동기화',
        '☁️ GCP Functions: enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor (200만 호출/월)',
        '🎯 실시간 모니터링: 15개 서버, 10개 타입별 프로필, 실시간 메트릭 수집 및 분석',
        '💰 최적화 효과: 완전 무료 운영으로 연간 $680+ 절약, 무제한 확장성 확보',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL',
        'GCP Cloud Functions',
        'Real-time Metrics System',
        'Advanced Analytics Engine',
        'GitHub Actions CI/CD',
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
        '🔷 TypeScript 5.7.2: strict mode 적용으로 타입 안전성 강화',
        '📊 Recharts 2.12.7: 실시간 대시보드 차트 및 메트릭 시각화',
        '🎨 Tailwind CSS 3.4.17: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest 3.2.4: 54개 테스트 파일, 98% 커버리지 (6ms 평균 실행)',
        '✨ CSS 애니메이션: Framer Motion 제거 후 순수 CSS로 60% 성능 향상',
        '🏬 Radix UI: 14개+ 헤드리스 UI 컴포넌트 (Dialog, Accordion, Tabs, Select 등)',
        '🎆 Lucide React 0.441.0: 1000+ 아이콘 라이브러리 (150+ 곳에서 활용)',
        '🧰 Zustand: 글로벌 상태 관리 및 persist 미들웨어 적용',
        '🔔 Radix Toast: 접근성 표준 기반 알림 시스템',
      ],
      technologies: [
        'Next.js 15.4.5',
        'React 18.3.1',
        'TypeScript 5.7.2',
        'Tailwind CSS 3.4.17',
        'Recharts 2.12.7',
        'CSS Animations (Optimized)',
        'Zustand 4.5.4',
        'Vitest 3.2.4',
        'Radix UI',
        'Lucide React 0.441.0',
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
      overview: `v5.71.0+ - 4-AI 교차 검증 시스템 완성! Claude Code 중심의 8개 MCP 서버 + Codex CLI + Gemini CLI + Qwen CLI로 95%+ 문제 발견율을 달성하며, AI 교차 검증으로 코드 품질을 극대화했습니다.`,
      features: [
        '🏆 4-AI 교차 검증: Claude(메인) + Codex + Gemini + Qwen 병렬 개발로 95%+ 문제 발견',
        '🤖 Claude Code (메인): 8개 MCP 서버로 파일, Git, DB, AI 도구 등 통합 자동화 (27% 토큰 절약)',
        '💎 Codex CLI: ChatGPT Plus 기반 코드 리뷰 전문가 ($20/월 유료, 무제한 사용)',
        '🌐 Gemini CLI: Google AI 1M 토큰 컨텍스트 대용량 분석 (1,000회/일 무료)',
        '🧠 Qwen CLI: 오픈소스 무료 480B MoE, 256K-1M 토큰 (2,000회/일 무료)',
        '🔄 교차 검증 플로우: Claude A안 제시 → 3-AI 개선점 제안 → Claude 최종 결정',
        '📊 실제 성과: 8.1/10 HIGH 합의, TypeScript 에러 0개, 98.2% 테스트 커버리지',
      ],
      technologies: [
        'Claude Code (Main)',
        '8개 MCP 서버 (최적화)',
        'Codex CLI (유료)',
        'Gemini CLI (무료)',
        'Qwen CLI (무료)',
        '4-AI Cross Verification',
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
