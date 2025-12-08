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
      'Google AI 통합 엔진으로 시스템을 분석합니다. 5개 AI 기능으로 질의, 보고서, 예측, 관리, 모니터링을 제공합니다.',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
    detailedContent: {
      overview: `Google AI Unified Engine 완성! Groq Router + Gemini 2.5 + GCP Cloud Run을 통합하여 5개 AI 기능을 제공합니다. Groq의 초고속 라우팅으로 0.2초 내 의도를 파악하고 최적 모델을 선택합니다.`,
      features: [
        '🚀 Quad AI Engine: 8B Router가 Gemini(Flash/Pro)와 Llama(70B/8B) 4종 모델을 상황에 맞춰 복합 사용',
        '⚡ 고속 모드 (Flash): Gemini 2.5 Flash로 단순 조회 250ms 처리 (Llama 8B 활용)',
        '🧠 추론 모드 (Pro): Gemini 2.5 Pro로 복잡한 원인 분석 및 코드 생성 (Llama 70B 활용)',
        '📄 자동장애 보고서: 시스템 전체 장애 분석 보고서 자동 생성 (요약, 이슈, 권장 조치)',
        '⚙️ AI 고급관리: ML 학습 센터 + 모델 관리 + 성능 모니터링',
        '📊 무료 티어 모니터: Vercel/Supabase/Google/Groq 티어 실시간 추적',
        '🔗 Hybrid Architecture: Cloud Run (Python) + Next.js (Edge) + Groq (Llama)',
        '💰 비용 최적화: 무료 티어(Gemini/Groq/Cloud Run) 100% 활용, 운영비 $0',
        '🛡️ 이중 안전장치: Google AI 장애 시 Groq가 즉시 이어받는 무중단 시스템',
      ],
      technologies: [
        'Vercel AI SDK (Stream)',
        'Groq Llama 3.1 Router',
        'Gemini 2.5 Flash/Pro',
        'Groq Llama 3.3 (Fallback)',
        'GCP Cloud Run (Python)',
        'Supabase pgvector (RAG)',
        'Provider Pattern',
        'Circuit Breaker',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      '엔터프라이즈급 클라우드 인프라 구축. 3개 핵심 플랫폼의 완전 통합으로 안정적이고 확장 가능한 시스템을 구현했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `Vercel + Supabase + GCP Cloud Run 완전 통합! 3개 핵심 플랫폼으로 엔터프라이즈급 인프라를 구축했습니다.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 15 완벽 최적화, 전 세계 CDN 배포, Edge Runtime 활용',
        '🚀 Vercel 성능: 자동 스케일링, 빌드 최적화, 무제한 프리뷰 배포 환경',
        '🐋 Docker 개발 환경: 로컬에서 Cloud Run과 동일한 Docker 환경으로 개발 생산성 극대화',
        '🐘 Supabase 플랫폼: PostgreSQL 15 + pgVector AI 검색 + Row Level Security 완전 구현',
        '☁️ GCP Cloud Run: Python ML 서비스를 Docker 컨테이너로 완전 관리형 배포',
        '🔄 Scale to Zero: 사용량 없을 시 인스턴스 0개로 축소하여 비용 절감 (Cold Start 최적화)',
        '🔗 HTTP REST API: 직접 호출 방식 (SDK 미사용, 번들 크기 0KB)',
        '💰 무료 티어 최적화: Vercel/Supabase/Cloud Run/Groq 무료 사용량 100% 활용, 운영비 $0',
        '📡 12개 AI API 엔드포인트: /api/ai/query, /api/ai/incident-report, /api/ai/intelligent-monitoring 등',
        '🔐 통합 보안: Vercel 환경변수 + Supabase RLS + GCP IAM 통합 인증',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL',
        'Next.js 15 Edge Runtime',
        'PostgreSQL 15 + pgVector',
        'Real-time Subscription',
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
      overview: `실제 사용 중인 프로덕션급 기술 스택! Next.js 15 App Router, TypeScript strict mode, 실시간 차트, 고급 UI 컴포넌트로 엔터프라이즈급 웹 애플리케이션 구현.`,
      features: [
        '⚛️ React 18.3.1 + Next.js 15.5.5: App Router, Edge Runtime 최적화',
        '🔷 TypeScript 5.7.3: strict mode 적용으로 타입 안전성 강화',
        '📊 Recharts 3.2.1: 실시간 대시보드 차트 및 메트릭 시각화',
        '🔄 TanStack Query v5: 서버 상태 관리 및 데이터 캐싱 최적화',
        '🔒 NextAuth.js v5: 보안 강화된 인증 시스템 (Beta)',
        '🎨 Tailwind CSS 3.4.17: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest 3.2.4: 포괄적인 테스트 커버리지, 빠른 테스트 실행',
        '✨ CSS 애니메이션: Framer Motion 제거 후 순수 CSS로 성능 최적화',
        '🏬 Radix UI: 다양한 헤드리스 UI 컴포넌트 (Dialog, Accordion, Tabs, Select 등)',
        '🎆 Lucide React 0.441.0: 풍부한 아이콘 라이브러리, 프로젝트 전체 활용',
        '🧰 Zustand 4.5.7: 글로벌 상태 관리 및 persist 미들웨어 적용',
        '🔔 Radix Toast: 접근성 표준 기반 알림 시스템',
        '📈 성능 최적화: UnifiedServerDataSource 99.6% CPU 절약, 평균 응답 152ms',
      ],
      technologies: [
        'Next.js 15.5.5',
        'React 18.3.1',
        'TypeScript 5.7.3',
        'Tailwind CSS 3.4.17',
        'Recharts 3.2.1',
        'TanStack Query v5',
        'NextAuth.js v5',
        'CSS Animations (Optimized)',
        'Zustand 4.5.7',
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
      'Claude Code 메인 개발 + 4-AI 균등분배 코드 리뷰 (v5.0). AI 협업으로 높은 코드 품질을 달성했습니다.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `Claude Code 메인 개발 + 4-AI 균등분배 코드 리뷰 시스템 (v5.0)! Codex/Gemini/Qwen/Claude 1:1:1:1 순환으로 99.99% 가용성을 달성했습니다.`,
      features: [
        '🤖 Claude Code (메인 개발): 11개 MCP 서버로 파일, Git, DB, AI 도구 통합 자동화',
        '🔄 4-AI 균등분배 (v5.0): Codex → Gemini → Qwen → Claude 1:1:1:1 순환 선택',
        '📈 시스템 진화: v1.0 Codex 단독 → v2.0 폴백 → v4.0 4:1 비율 → v5.0 균등분배',
        '💎 Codex CLI: 고급 코드 리뷰, Rate Limit 자동 감지 및 폴백',
        '🌐 Gemini/Qwen CLI: 무료 티어, 대용량 컨텍스트 분석',
        '📊 실제 성과: TypeScript strict 완벽 적용, 테스트 88.9%, 99.99% 가용성',
        '💰 비용 효율성: Codex $20/월, Gemini/Qwen 무료, Claude Max $200/월 (총 $220/월)',
        '🔧 11개 MCP 서버: Vercel, Supabase, Serena, Context7, Playwright, GitHub 등',
        '🎯 포트폴리오 가치: AI 도구 활용 능력, 코드 품질 관리 역량 입증',
      ],
      technologies: [
        'Claude Code (Main)',
        '11개 MCP 서버',
        'Codex CLI v0.63.0',
        'Gemini CLI v0.18.4',
        'Qwen CLI v0.3.0',
        'auto-ai-review v5.0',
        'Git + GitHub 자동화',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];
