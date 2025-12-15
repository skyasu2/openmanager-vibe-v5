/**
 * Feature Cards 데이터
 * 메인 페이지에 표시되는 4개의 주요 기능 카드 데이터
 */

import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import type { FeatureCard } from '@/types/feature-card.types';

export const FEATURE_CARDS_DATA: FeatureCard[] = [
  {
    id: 'ai-assistant-pro',
    title: '🧠 AI Assistant Pro',
    description:
      'Google Gemini 2.5(Brain) + Groq(Speed) + RAG(Memory)가 결합된 LangGraph A2A(Agent-to-Agent) 시스템입니다.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `단일 모델의 한계를 넘어선 Hybrid Multi-Agent 시스템! Google의 추론 능력, Groq의 압도적 속도, 그리고 RAG의 전문 지식이 LangGraph 위에서 유기적으로 협업합니다.`,
      features: [
        '🤝 A2A Collaboration: Supervisor 에이전트가 하위 전문가 에이전트들을 적재적소에 배치',
        '⚡ Zero-Latency: Groq LPU를 통한 도구 호출로 체감 지연 시간 최소화',
        '🛡️ Failover System: 메인 에이전트 응답 불가 시 백업 에이전트가 즉시 투입되는 무중단 구조',
      ],
      technologies: [
        'LangGraph (Multi-Agent)',
        'Google Gemini 2.5 Pro',
        'Groq Llama 3 (LPU)',
        'Supabase pgVector',
        'Official PostgreSQL MCP',
      ],
    },
    subSections: [
      {
        title: 'Gemini 2.5 Brain',
        description:
          '시스템의 "대뇌" 역할. 복잡한 사용자 의도를 파악하고, 전체 작업 계획을 수립하는 Supervisor입니다.',
        icon: Bot,
        gradient: 'from-blue-500 to-indigo-600',
        features: [
          'Supervisor Agent: 하위 에이전트 지휘 및 의사결정',
          'Deep Reasoning: 시스템 로그 심층 분석 및 원인 규명',
          'Validation: 최종 답변의 정합성 및 안전성 검증',
        ],
      },
      {
        title: 'Groq Hyper-Speed',
        description:
          '시스템의 "행동대장" 역할. Supervisor의 지시를 받아 0.1초 만에 도구를 실행하고 결과를 반환합니다.',
        icon: Zap,
        gradient: 'from-orange-500 to-red-500',
        features: [
          'Worker Agent: DB 조회, 검색 등 실무 작업 수행',
          '500 Tokens/s: 인간이 인지 못할 속도로 데이터 처리',
          'Tool Execution: 빠르고 정확한 API/DB 도구 호출',
        ],
      },
      {
        title: 'RAG & MCP Core',
        description:
          '시스템의 "기억" 역할. Supabase RAG로 지식을 참조하고, 단 하나의 공식 MCP로 DB에 연결합니다.',
        icon: Database,
        gradient: 'from-emerald-500 to-teal-600',
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
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel(웹) · Supabase(DB) · Google Cloud(AI) 완전 통합. 각 분야 최고의 클라우드 서비스에 최적화하여 배포했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `Vercel, Supabase, GCP Cloud Run 3대 플랫폼 완전 통합! 웹은 Vercel Edge, 데이터는 Supabase, AI는 Google Cloud Run에 분산 배포되어 최상의 성능과 안정성을 보장합니다.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 16 완벽 최적화, 전 세계 CDN 배포, Edge Runtime 활용',
        '🚀 Vercel 성능: 자동 스케일링, 빌드 최적화, 무제한 프리뷰 배포 환경',
        '🐋 Docker 개발 환경: 로컬에서 Cloud Run과 동일한 Docker 환경으로 개발 생산성 극대화',
        '🐘 Supabase 플랫폼: PostgreSQL 15 + pgVector AI 검색 + Row Level Security 완전 구현',
        '☁️ GCP Cloud Run: Python LangGraph 서비스를 컨테이너로 완전 관리형 배포',
        '🔄 Scale to Zero: 사용량 없을 시 인스턴스 0개로 축소하여 비용 절감 (Cold Start 최적화)',
        '🔗 HTTP REST API: 표준화된 프로토콜로 프론트엔드와 AI 마이크로서비스 간 통신',
        '💰 무료 티어 최적화: Vercel/Supabase/Cloud Run/Groq 무료 사용량 100% 활용',
        '📡 LangGraph Supervisor: /api/ai/supervisor (Multi-Agent Orchestration)',
        '🔐 통합 보안: Vercel 환경변수 + Supabase RLS + GCP IAM 통합 인증',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL 15',
        'Next.js 16 Edge Runtime',
        'PostgreSQL 15 + pgVector',
        'Google Cloud Run',
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
        '⚛️ React 19 + Next.js 16: Server Actions, Partial Prerendering 등 최신 기능 적용',
        '🔷 TypeScript 5.9: 최신 컴파일러 기능을 활용한 강력한 타입 안전성 확보',
        '🐍 Python 3.11 + Flask: Cloud Run 기반의 경량화된 고성능 AI 백엔드',
        '🧠 spaCy 3.7 + scikit-learn: 영어 NLP 및 머신러닝 분석 엔진',
        '📊 Recharts 3.2: 실시간 대시보드 차트 및 메트릭 시각화',
        '🔄 TanStack Query v5: 서버 상태 관리 및 데이터 캐싱 최적화',
        '🔒 NextAuth.js v5: 보안 강화된 인증 시스템',
        '🎨 Tailwind CSS 4.1: 최신 Oxides 엔진으로 빌드 성능 극대화',
        '🧪 Vitest 4.0: 차세대 테스트 프레임워크 적용',
        '🏬 Radix UI: 접근성이 보장된 Headless UI 컴포넌트',
        '🧰 Zustand 5.0: 글로벌 상태 관리 및 미들웨어 최적화',
        '📈 성능 최적화: 최신 런타임 적용으로 평균 응답 속도 및 리소스 효율 개선',
      ],
      technologies: [
        'Next.js 16',
        'React 19',
        'TypeScript 5.9',
        'Python 3.11 (Flask)',
        'spaCy 3.7 / sklearn',
        'Tailwind CSS 4.1',
        'Recharts 3.2',
        'TanStack Query v5',
        'NextAuth.js v5',
        'Zustand 5.0',
        'Vitest 4.0',
        'Radix UI / Lucide',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      'Claude Code가 주도하고 AI 리뷰어가 보완합니다. 커밋 시 자동 실행되는 다중 모델 검증 파이프라인.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `Vibe Coding의 4단계 진화. [1단계] GPT 수동 코딩/Netlify 목업 → [2단계] Cursor 자동 개발 → [3단계] 분기점: Windsurf/VSCode는 스크린샷 분석 등 보조로 물러나고, WSL + Claude Code가 메인이 됨 → [4단계] 현재: WSL 환경에서 Claude Code(Main), Codex, Gemini, Qwen, Kiro-CLI가 협업하며, Antigravity가 함께하는 Agentic Era.`,
      features: [
        '1️⃣ Stage 1 (Manual): GPT/Gemini 창에서 수동 코딩 → Netlify 목업',
        '2️⃣ Stage 2 (Auto): Cursor의 등장, "IDE 자동 개발"의 시작',
        '3️⃣ Stage 3 (Pivot): IDE는 보조(시각 분석)로, 메인은 WSL + Claude Code로 이동',
        '4️⃣ Stage 4 (Current): WSL 위의 Multi-CLI (Codex/Gemini/Qwen/Kiro) + Antigravity',
        '📺 IDE Role Shift: 개발의 주체에서 "터미널 뷰어" 및 "스크린샷 분석도구"로 축소',
        '🐧 WSL Main Base: 모든 지능형 에이전트들이 활동하는 실제 본부',
        '🤖 Agentic Ecosystem: Claude Code(Main)을 중심으로 복수 에이전트 협업',
        '🚀 Antigravity Era: 이 모든 진화를 거쳐 도달한 현재의 완성형',
      ],
      technologies: [
        'Antigravity (Era)',
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
