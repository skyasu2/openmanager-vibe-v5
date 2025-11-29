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
      overview: `Google AI Unified Engine 완성! Gemini 2.5 Flash + Supabase RAG + GCP ML을 통합하여 5개 AI 기능을 제공합니다. 평균 응답 250ms, 캐시 히트 시 15ms로 빠른 성능을 자랑합니다.`,
      features: [
        '💬 자연어 질의: "서버 상태 확인해줘" 등 직관적 질문으로 시스템 조회',
        '📄 자동장애 보고서: 시스템 전체 장애 분석 보고서 자동 생성 (요약, 이슈, 권장 조치)',
        '🧠 이상감지/예측: 4단계 워크플로우 (이상탐지→근본원인→예측모니터링→AI인사이트)',
        '⚙️ AI 고급관리: ML 학습 센터 + 모델 관리 + 성능 모니터링',
        '📊 무료 티어 모니터: Vercel/Supabase/Google AI 사용량 실시간 추적 (60초 갱신)',
        '🇰🇷 한국어 NLP: Google AI 기반 고도화된 의도 분석 및 엔티티 추출',
        '🎯 Provider 패턴: RAG/ML/NLP Provider로 확장 가능한 아키텍처',
        '⚡ 성능: 평균 응답 250-350ms, 캐시 히트 15ms (95% 단축), 85% 캐시 히트율',
        '💰 비용: 무료 티어 내 운영 ($0/월), 99.7% 시스템 가용성',
      ],
      technologies: [
        'Google AI Unified Engine',
        'Gemini 2.5 Flash',
        'Supabase pgvector (RAG)',
        'SimplifiedQueryEngine',
        'Provider Pattern',
        'Circuit Breaker + Retry',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      '엔터프라이즈급 클라우드 인프라 구축. 핵심 플랫폼의 완전 통합으로 안정적이고 확장 가능한 시스템을 구현했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `Vercel + Supabase + Google AI 완전 통합! 핵심 플랫폼으로 엔터프라이즈급 인프라를 구축했습니다.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 15 완벽 최적화, 전 세계 CDN 배포, Edge Runtime 활용',
        '🚀 Vercel 성능: 자동 스케일링, 빌드 최적화, 무제한 프리뷰 배포 환경',
        '🌐 Vercel 고급 기능: 자동 HTTPS/SSL, 환경변수 암호화, Analytics 대시보드, Git 통합',
        '🐘 Supabase 플랫폼: PostgreSQL 15 + pgVector AI 검색 + Row Level Security 완전 구현',
        '📊 Supabase 데이터: 실시간 구독, 사용자 인증, 즉시 동기화 완전 지원',
        '🔐 Supabase 보안: RLS 정책, JWT 토큰, 암호화 저장, API 키 관리',
        '🔗 HTTP REST API: 직접 호출 방식 (SDK 미사용, 번들 크기 0KB)',
        '💰 무료 티어 최적화: Vercel 10/100GB (90% 여유), Supabase 50/500MB (90% 여유), Google AI 300/1200 요청/일 (80% 여유), 총 운영비 $0/월',
        '📡 12개 AI API 엔드포인트: /api/ai/query, /api/ai/incident-report, /api/ai/intelligent-monitoring 등',
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
        '📊 Recharts 2.12.7: 실시간 대시보드 차트 및 메트릭 시각화',
        '🎨 Tailwind CSS 3.4.17: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest 3.2.4: 포괄적인 테스트 커버리지, 빠른 테스트 실행',
        '✨ CSS 애니메이션: Framer Motion 제거 후 순수 CSS로 성능 최적화',
        '🏬 Radix UI: 다양한 헤드리스 UI 컴포넌트 (Dialog, Accordion, Tabs, Select 등)',
        '🎆 Lucide React 0.441.0: 풍부한 아이콘 라이브러리, 프로젝트 전체 활용',
        '🧰 Zustand: 글로벌 상태 관리 및 persist 미들웨어 적용',
        '🔔 Radix Toast: 접근성 표준 기반 알림 시스템',
        '📈 성능 최적화: UnifiedServerDataSource 99.6% CPU 절약, 평균 응답 152ms',
      ],
      technologies: [
        'Next.js 15.5.5',
        'React 18.3.1',
        'TypeScript 5.7.3',
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
      'Claude Code 메인 개발 + Codex/Gemini 코드 리뷰. AI 협업으로 높은 코드 품질을 달성했습니다.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `Claude Code 메인 개발 + Codex/Gemini CLI 코드 리뷰 시스템! AI 협업으로 TypeScript strict mode 완벽 적용과 높은 테스트 커버리지를 달성했습니다.`,
      features: [
        '🤖 Claude Code (메인 개발): 9개 MCP 서버로 파일, Git, DB, AI 도구 통합 자동화',
        '💎 Codex CLI (코드 리뷰): 고급 코드 리뷰 및 복잡한 알고리즘 분석',
        '🌐 Gemini CLI (코드 리뷰): 대용량 컨텍스트로 대규모 코드베이스 분석',
        '🔄 협업 플로우: Claude 개발 → Codex/Gemini 리뷰 → 개선 반영',
        '📊 실제 성과: TypeScript strict mode 완벽 적용, 테스트 통과율 98.2%, 코드 품질 9.0/10',
        '💰 비용 효율성: Codex $20/월, Gemini/Qwen 무료, Claude Max $200/월 (총 $220/월)',
        '🔧 9개 MCP 서버: Filesystem, Git, Supabase, Memory 등 핵심 도구 통합',
        '🎯 포트폴리오 가치: AI 도구 활용 능력, 코드 품질 관리 역량 입증',
      ],
      technologies: [
        'Claude Code (Main)',
        '9개 MCP 서버',
        'Codex CLI',
        'Gemini CLI',
        'Qwen CLI',
        'AI Code Review',
        'Git + GitHub 자동화',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];
