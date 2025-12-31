/**
 * Feature Cards 데이터
 * 메인 페이지에 표시되는 4개의 주요 기능 카드 데이터
 */

import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import type { FeatureCard } from '@/types/feature-card.types';

export const FEATURE_CARDS_DATA: FeatureCard[] = [
  {
    id: 'ai-assistant-pro',
    title: '🧠 AI Assistant',
    description:
      'Orchestrator + NLQ · Analyst · Reporter · Advisor 5-Agent 협업 시스템. Cerebras · Groq · Mistral 삼중 Provider 기반.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `5개의 전문 에이전트가 협업하는 멀티 에이전트 시스템입니다. Orchestrator가 사용자 의도를 분석하여 NLQ(서버 조회), Analyst(이상 탐지), Reporter(보고서 생성), Advisor(해결 안내) 에이전트에 자동 라우팅합니다. Cerebras(24M/일), Groq(100K/일), Mistral 3개 Provider가 각 에이전트의 특성에 맞게 배치되어 최적의 성능을 제공합니다.`,
      features: [
        '🎯 Orchestrator: Cerebras 기반 의도 분석 및 자동 에이전트 라우팅',
        '📊 NLQ Agent: Cerebras 기반 서버 메트릭 조회 및 자연어 질의 처리',
        '🔬 Analyst Agent: Groq 기반 이상 탐지, 트렌드 예측, 패턴 분석',
        '📋 Reporter Agent: Groq 기반 장애 보고서 및 타임라인 생성',
        '💡 Advisor Agent: Mistral 기반 GraphRAG 검색 및 해결 방법 안내',
      ],
      technologies: [
        'Cerebras (Orchestrator + NLQ Agent)',
        'Groq (Analyst + Reporter Agent)',
        'Mistral (Advisor Agent + Verifier)',
        'Vercel AI SDK (Multi-Agent)',
        'Supabase pgVector (RAG Store)',
        '@ai-sdk-tools/agents',
      ],
    },
    subSections: [
      {
        title: 'Orchestrator (Cerebras)',
        description:
          '사용자 질문을 분석하여 가장 적합한 전문 에이전트에게 라우팅합니다. Cerebras WSE-3의 24M 토큰/일 무료 티어를 활용하여 초고속 의도 분류를 수행합니다.',
        icon: Zap,
        gradient: 'from-orange-500 to-red-500',
        features: [
          'Role: 의도 분석 & 에이전트 라우팅',
          'Model: Cerebras llama-3.3-70b',
          'Capacity: 24M tokens/day 무료',
        ],
      },
      {
        title: 'NLQ + Analyst (Dual)',
        description:
          'NLQ Agent(Cerebras)는 서버 메트릭 조회를, Analyst Agent(Groq)는 이상 탐지와 트렌드 예측을 담당합니다. 각각 최적의 Provider로 성능을 극대화합니다.',
        icon: Zap,
        gradient: 'from-blue-500 to-indigo-600',
        features: [
          'NLQ: 서버 상태/메트릭 질의 (Cerebras)',
          'Analyst: 이상 탐지/예측 (Groq)',
          'Tools: getServerMetrics, detectAnomalies',
        ],
      },
      {
        title: 'Reporter + Advisor (Dual)',
        description:
          'Reporter Agent(Groq)는 장애 보고서를, Advisor Agent(Mistral)는 해결 방법 안내를 담당합니다. GraphRAG로 과거 사례를 검색하여 정확한 조언을 제공합니다.',
        icon: Sparkles,
        gradient: 'from-purple-500 to-pink-600',
        features: [
          'Reporter: 인시던트 보고서 (Groq)',
          'Advisor: 트러블슈팅 가이드 (Mistral)',
          'Tools: buildTimeline, searchKnowledgeBase',
        ],
      },
      {
        title: 'AI SDK Multi-Agent',
        description:
          '@ai-sdk-tools/agents 패키지 기반 멀티 에이전트 오케스트레이션. Handoff 메커니즘으로 에이전트 간 작업을 자동 위임합니다.',
        icon: Database,
        gradient: 'from-slate-500 to-gray-600',
        features: [
          'Framework: @ai-sdk-tools/agents',
          'Pattern: Orchestrator-Worker Handoff',
          'Execution: Multi-step Tool Calling',
        ],
      },
      {
        title: 'RAG + LlamaIndex.TS',
        description:
          'LlamaIndex.TS 오픈소스 기반 GraphRAG. Mistral AI로 Knowledge Triplet을 추출하고, Supabase pgVector와 결합한 하이브리드 검색을 수행합니다.',
        icon: Database,
        gradient: 'from-green-500 to-emerald-600',
        features: [
          'Framework: LlamaIndex.TS (OSS)',
          'Triplet: Mistral AI Extraction',
          'Search: Vector + Graph Hybrid',
        ],
      },
    ],
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'cloud-platform',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel(웹) · Supabase(DB) · Google Cloud(AI) · Upstash(Redis) 통합. 각 서비스의 장점을 활용하여 배포했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `Vercel, Supabase, GCP Cloud Run, Upstash 4대 플랫폼 완전 통합! 웹은 Vercel Edge, 데이터는 Supabase, AI는 Google Cloud Run, 캐시는 Upstash Redis에 분산 배포되어 최상의 성능과 안정성을 보장합니다.`,
      features: [
        '▲ Vercel: Next.js 16 최적화 호스팅, 글로벌 CDN, Edge Runtime, 자동 스케일링',
        '🐘 Supabase: PostgreSQL 15 + pgVector(AI 벡터 검색) + RLS(행 수준 보안)',
        '☁️ GCP Cloud Run: Node.js AI SDK Multi-Agent Engine 컨테이너 배포, Scale to Zero',
        '⚡ Upstash: Serverless Redis를 이용한 초고속 데이터 캐싱 및 Rate Limiting',
        '🐋 Docker: Cloud Run 로컬 개발 환경 에뮬레이션',
        '🔄 GitHub Actions: CI/CD 파이프라인, 자동 테스트 및 배포',
        '💰 무료 티어 최적화: Vercel/Supabase/Cloud Run/Upstash 무료 사용량 100% 활용',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL 15 + pgVector',
        'Google Cloud Run',
        'Upstash Redis',
        'Docker',
        'GitHub Actions CI/CD',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 16 · React 19 · TypeScript 5.9 기반. 최신 기술을 선제적으로 도입한 Next-Gen 웹 아키텍처',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `실제 사용 중인 Next-Gen 기술 스택! Next.js 16, React 19, TypeScript 5.9 등 최신 안정화 버전을 도입하여 최고의 성능과 개발 경험을 제공합니다.`,
      features: [
        '⚛️ React 19: Concurrent Rendering, Server Components 등 최신 기능 적용',
        '▲ Next.js 16: Server Actions, Partial Prerendering, Edge Runtime 지원',
        '🔷 TypeScript 5.9: 최신 컴파일러 기능을 활용한 강력한 타입 안전성 확보',
        '🎨 Tailwind CSS 4.1: 최신 Oxides 엔진으로 빌드 성능 극대화',
        '📊 Recharts 3.2: 실시간 대시보드 차트 및 메트릭 시각화',
        '🔄 TanStack Query v5: 서버 상태 관리 및 데이터 캐싱 최적화',
        '🧰 Zustand 5.0: 글로벌 상태 관리 및 미들웨어 최적화',
        '🏬 Radix UI: 접근성이 보장된 Headless UI 컴포넌트',
        '🧪 Vitest 4.0: 차세대 테스트 프레임워크 적용',
      ],
      technologies: [
        'Next.js 16',
        'React 19',
        'TypeScript 5.9',
        'Tailwind CSS 4.1',
        'Recharts 3.2',
        'TanStack Query v5',
        'Zustand 5.0',
        'Radix UI / Lucide',
        'Vitest 4.0',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '🔥 Vibe Coding',
    description:
      'Claude Code가 주도하고 Codex·Gemini가 코드 리뷰합니다. 커밋 시 자동 실행되는 다중 모델 검증 파이프라인.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `Vibe Coding의 4단계 진화. [1단계] GPT 수동 코딩/Netlify 목업 → [2단계] Cursor 자동 개발 → [3단계] 분기점: Windsurf/VSCode는 스크린샷 분석 등 보조로 물러나고, WSL + Claude Code가 메인이 됨 → [4단계] 현재: WSL 환경에서 Claude Code(Main), Codex, Gemini, Qwen, Kiro-CLI가 협업하며, Google Antigravity(Agent-first IDE)가 함께하는 Agentic Era.`,
      features: [
        '1️⃣ Stage 1 (Manual): GPT/Gemini 창에서 수동 코딩 → Netlify 목업',
        '2️⃣ Stage 2 (Auto): Cursor의 등장, "IDE 자동 개발"의 시작',
        '3️⃣ Stage 3 (Pivot): IDE는 보조(시각 분석)로, 메인은 WSL + Claude Code로 이동',
        '4️⃣ Stage 4 (Current): WSL 위의 Multi-CLI (Codex/Gemini/Qwen/Kiro) + Google Antigravity',
        '📺 IDE Role Shift: 개발의 주체에서 "터미널 뷰어" 및 "스크린샷 분석도구"로 축소',
        '🐧 WSL Main Base: 모든 지능형 에이전트들이 활동하는 실제 본부',
        '🤖 Agentic Ecosystem: Claude Code(Main)을 중심으로 복수 에이전트 협업',
        '🚀 Google Antigravity: Agent-first IDE - AI가 계획·실행·검증하는 새 패러다임 (Google)',
      ],
      technologies: [
        'Google Antigravity (IDE)',
        'WSL Terminal (Main)',
        'Claude Code (Core)',
        'Multi-CLI Agents',
        'VSCode (Visual Aux)',
        'Cursor/Windsurf (Legacy)',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];
