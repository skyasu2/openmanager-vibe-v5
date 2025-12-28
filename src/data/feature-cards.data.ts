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
      'Groq(Supervisor) + Cerebras(Worker) + Mistral(Verifier) + RAG가 결합된 LangGraph 멀티 에이전트 시스템입니다.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `단순한 구현을 넘어, 최신 AI 기술 트렌드(Wafer-Scale, LPU, SLM, Agentic)에 대한 깊은 이해를 바탕으로 설계되었습니다. GPU 병목을 해결한 Cerebras, 결정론적 속도의 Groq, 효율적인 SLM Mistral, 그리고 순환형 워크플로우인 LangGraph를 유기적으로 결합하여 차세대 AI 아키텍처를 제시합니다.`,
      features: [
        '🚀 Wafer-Scale Inference: GPU 클러스터의 통신 병목을 제거한 Cerebras WSE 활용',
        '⚡ LPU Architecture: 폰 노이만 구조를 탈피한 Groq의 결정론적(Deterministic) 추론',
        '� SLM Efficiency: 거대 모델 대신 Mistral 24B(SLM)를 활용한 실용적 검증',
        '🔄 Agentic Workflow: 단방향 Chain을 넘어선 LangGraph의 순환형(Cyclic) 추론',
      ],
      technologies: [
        'LangGraph (Agentic Framework)',
        'Cerebras (Wafer-Scale Engine)',
        'Groq (LPU Inference)',
        'Mistral (Efficient SLM)',
        'Google AI (Vector Embedding)',
        'Supabase (Vector Store)',
      ],
    },
    subSections: [
      {
        title: 'Cerebras (Wafer-Scale)',
        description:
          'GPU 연결 병목(Interconnect bottleneck)을 웨이퍼 단위 칩(WSE)으로 해결. 메모리 대역폭의 한계를 뛰어넘어 압도적인 처리량을 보여주는 차세대 추론 엔진입니다.',
        icon: Zap,
        gradient: 'from-orange-500 to-red-500',
        features: [
          'Trend: Beyond GPU (웨이퍼 스케일)',
          'Tech: Memory Bandwidth 혁신',
          'Value: 24M/Day 처리량 확보',
        ],
      },
      {
        title: 'Groq (LPU Architecture)',
        description:
          '복잡한 스케줄링이 필요한 GPU와 달리, 데이터 흐름을 컴파일러단에서 제어하는 LPU(Language Processing Unit)로 결정론적 초저지연을 구현했습니다.',
        icon: Zap,
        gradient: 'from-blue-500 to-indigo-600',
        features: [
          'Trend: Specialized AI Hardware',
          'Tech: Deterministic Latency',
          'Value: 실시간 인터랙션 보장',
        ],
      },
      {
        title: 'Mistral (Efficient SLM)',
        description:
          '무조건 큰 모델이 답은 아닙니다. 24B 파라미터의 Small Language Model로도 불필요한 연산 비용 없이 논리적 검증이 가능함을 증명합니다.',
        icon: Sparkles,
        gradient: 'from-purple-500 to-pink-600',
        features: [
          'Trend: SLM (소형 언어 모델)',
          'Tech: Parameter Efficiency',
          'Value: 비용/성능 최적화',
        ],
      },
      {
        title: 'LangGraph (Agentic)',
        description:
          '기존의 선형적인 LLM Chain(DAG) 한계를 넘어, 인간의 사고 과정처럼 루프(Loop)와 피드백이 가능한 "순환형 에이전트"를 설계했습니다.',
        icon: Database,
        gradient: 'from-slate-500 to-gray-600',
        features: [
          'Trend: From Chains to Agents',
          'Tech: Cyclic State Management',
          'Value: 복잡한 문제 해결 능력',
        ],
      },
      {
        title: 'Google AI (Embedding)',
        description:
          'LLM이 모든 지식을 외울 수는 없습니다. 텍스트를 벡터 공간에 매핑(Embedding)하여 외부 지식을 정확하게 찾아내는 RAG의 핵심 모듈입니다.',
        icon: Database,
        gradient: 'from-green-500 to-emerald-600',
        features: [
          'Trend: RAG (검색 증강 생성)',
          'Tech: Semantic Vector Search',
          'Value: 할루시네이션 최소화',
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
        '☁️ GCP Cloud Run: Node.js LangGraph AI Engine 컨테이너 배포, Scale to Zero',
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
