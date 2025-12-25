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
      'Google Gemini 2.5 Flash Lite(Supervisor) + Groq Llama 3.3(Worker) + RAG(Memory)가 결합된 LangGraph A2A(Agent-to-Agent) 시스템입니다.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `단일 모델의 한계를 넘어선 Hybrid Multi-Agent 시스템! Gemini의 빠른 의도 분류로 지휘하고, Groq의 압도적 처리 속도와 RAG의 전문 지식이 LangGraph 위에서 유기적으로 협업합니다.`,
      features: [
        '🤝 A2A Collaboration: Supervisor(Gemini)가 하위 전문가 에이전트(Groq 등)를 적재적소에 배치',
        '⚡ Zero-Latency: Gemini Flash Lite 기반 Supervisor로 빠른 의도 분류',
        '🛡️ Failover System: 메인 에이전트 응답 불가 시 백업 에이전트가 즉시 투입되는 무중단 구조',
      ],
      technologies: [
        'LangGraph (Multi-Agent)',
        'Google Gemini 2.5 Flash Lite (Supervisor)',
        'Groq Llama 3.3 70b (Worker)',
        'Supabase pgVector',
        'Official PostgreSQL MCP',
      ],
    },
    subSections: [
      {
        title: 'Gemini 2.5 Flash Lite Supervisor',
        description:
          '시스템의 "지휘관" 역할. 빠른 의도 분류로 에이전트 간 작업을 조율하는 오케스트레이션 엔진입니다.',
        icon: Zap,
        gradient: 'from-blue-500 to-indigo-600',
        features: [
          'Supervisor Agent: 하위 에이전트 지휘 및 의사결정',
          'Fast Intent: Gemini Flash Lite로 빠른 의도 분류 및 라우팅',
          'Routing: 사용자 의도를 파악하여 적절한 전문가에게 위임',
        ],
      },
      {
        title: 'Groq Llama 3.3 70b Worker',
        description:
          '시스템의 "분석가" 역할. 초고속 LPU로 대량의 데이터를 정밀하게 분석합니다.',
        icon: Bot,
        gradient: 'from-orange-500 to-red-500',
        features: [
          'Analyst Agent: 로그/메트릭 심층 분석',
          'Hyper-Speed: 500 Tokens/s 속도로 빠른 처리',
          'Specialist: NLQ 및 이상 탐지 전문 수행',
        ],
      },
      {
        title: 'RAG & MCP Core',
        description:
          '시스템의 "기억" 역할. Supabase RAG로 지식을 참조하고, 단 하나의 공식 MCP로 DB에 연결합니다.',
        icon: Database,
        gradient: 'from-cyan-500 to-blue-600',
        features: [
          'Supabase RAG: pgVector 기반의 실시간 문서/지식 검색',
          'Single MCP: 복잡한 설정 없이 "Official PostgreSQL MCP" 하나로 통합 연결',
          'Context Awareness: 프로젝트의 맥락과 히스토리를 AI에 제공',
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
