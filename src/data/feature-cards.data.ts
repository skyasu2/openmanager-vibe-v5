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
      overview: `v5.66.22 - 실시간 AI 어시스턴트! 대시보드 사이드바에서 한국어로 자연스럽게 질문하고 즉시 답변받으세요. 서버 상태 분석, 이상 징후 감지, 성능 예측까지.`,
      features: [
        '🤖 실시간 AI 사이드바: 대시보드에서 항상 대기 중인 AI 어시스턴트',
        '🇰🇷 한국어 자연어 처리: "CPU 높은 서버?", "메모리 부족한 VM?"',
        '📊 서버 상태 분석: 실시간 메트릭 기반 지능형 분석 및 답변',
        '🚨 이상 징후 감지: 패턴 분석으로 문제 사전 예방 알림',
        '🆓 LOCAL 모드: Supabase pgVector + 한국어 엔진 (완전 무료)',
        '🚀 GOOGLE 모드: Gemini 2.0 Flash로 고급 분석 (일 1,000회 무료)',
      ],
      technologies: [
        '2-Mode System',
        'Supabase pgVector',
        'Korean NLP Engine',
        'Google Gemini 2.0',
        'Real-time Assistant',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel + Supabase + GCP. 프론트엔드부터 AI 서버까지 통합된 현대적 클라우드 개발 플랫폼 - 100% 무료 티어로 운영',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v5.66.27 - 무료 티어 최적화로 월 $0 운영! 3개 핵심 클라우드 플랫폼을 통합하여 완전한 서버리스 인프라 구축, 자동 스케일링과 글로벌 CDN으로 성능 최적화.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 15 전용 호스팅, Edge Runtime으로 전 세계 CDN 배포, GitHub 연동 자동 배포',
        '🌐 Vercel로 구현한 기능: 서버리스 API Routes 12개, Preview URL 브랜치별 테스트, 실시간 빌드 최적화',
        '🚀 Vercel 핵심 활용: App Router 기반 SSR/SSG, Edge Functions로 지연시간 최소화, 자동 이미지 최적화',
        '🐘 Supabase 플랫폼: PostgreSQL + pgVector + Row Level Security, 실시간 구독 지원',
        '📊 Supabase로 구현한 기능: 서버 메트릭 저장, AI 벡터 검색, 사용자 인증 시스템, 실시간 데이터 동기화',
        '⚡ 메모리 캐싱: 내장 LRU 캐시로 <1ms 응답 속도 달성, 네트워크 지연 제로, 100% 무료 운영',
        '☁️ GCP Functions: Python 3.11 기반 AI 처리 서버 3개 (enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor)',
        '🤖 Google AI Studio: Gemini 2.0 Flash API 통합, 일 1,000회 무료 할당량 활용',
      ],
      technologies: [
        'Vercel Edge Runtime',
        'Supabase PostgreSQL',
        'Memory-based LRU Cache',
        'GCP Cloud Functions',
        'Google AI Studio',
        'GitHub Actions',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 15 + React 18 + TypeScript. 안정적인 프로덕션급 웹 기술로 구현된 현대적인 풀스택 애플리케이션',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `v5.66.22 - 코드 품질 지속적 개선! TypeScript strict mode 적용, 코드 품질 관리 시스템 구축, 테스트 자동화로 안정성 확보.`,
      features: [
        '⚛️ React 18.3.1 + Next.js 15.4.5: App Router, Edge Runtime 최적화',
        '🔷 TypeScript: strict mode 적용으로 타입 안전성 강화',
        '✨ ESLint: 코드 품질 지속적 개선 중 (린트 문제 15% 감소)',
        '🎨 Tailwind CSS: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest: 40개 테스트 파일, 3단계 테스트 전략 (minimal → smart → full)',
        '📦 npm 패키지 관리: 검증된 의존성 관리 (Node.js 22+)',
      ],
      technologies: [
        'Next.js 15.4.5',
        'React 18.3.1',
        'TypeScript',
        'Tailwind CSS',
        'Zustand',
        'Vitest',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      'AI 기반 Vibe Coding으로 Claude Code & Gemini CLI를 활용하여 자연어 프롬프트 기반 UI/기능 프로토타입을 빠르게 구현',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.66.26 - AI 트리오로 개발 속도 10배 향상! Cursor의 자동 오류 수정, Claude Code의 11개 MCP 서버, Gemini CLI의 1M 토큰으로 이 프로젝트의 코드 품질을 475→400개 문제로 개선했습니다.`,
      features: [
        '🚀 Cursor AI (2025): 자동 오류 감지/수정, 백그라운드 에이전트, Composer로 멀티파일 동시 생성',
        '🤖 Claude Code + MCP: filesystem, github, supabase 등 11개 서버로 프로젝트 전체 관리',
        '💡 Gemini CLI (무료): 1M 토큰 컨텍스트로 전체 코드베이스 분석 (일 1,000회 무료)',
        '🔧 실제 활용: TypeScript 타입 에러 302개 → 0개, ESLint 문제 475개 → 400개 감소',
        '📊 MCP 활용 예시: supabase 서버로 DB 마이그레이션, github 서버로 PR 자동 생성',
        '⚡ 협업 전략: Claude로 코드 생성 → Gemini로 대규모 분석 → Cursor로 실시간 수정',
        '🔍 17개 서브에이전트: code-review, test-automation, debugger 등으로 품질 자동 관리',
      ],
      technologies: [
        'Cursor AI: GPT-4, Claude 3.7 지원, SOC 2 인증, $20/월 Pro 플랜',
        'Claude Code: Pro $20/월, Max $100/월, Remote MCP 원클릭 설치',
        'Gemini CLI: Gemini 2.5 Pro, ReAct 루프, Veo 3/Deep Research 통합',
        '11개 MCP 서버: filesystem, memory, github, supabase, tavily-remote, playwright 등',
        '개발 성과: 3단계 테스트 전략 구축, 메모리 캐시 최적화, GCP Functions 3개 배포',
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