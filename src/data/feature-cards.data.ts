/**
 * Feature Cards 데이터
 * 메인 페이지에 표시되는 4개의 주요 기능 카드 데이터
 * @updated 2026-01-18 - AI Assistant subSections 제거 (UX 간소화)
 */

import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import type { FeatureCard } from '@/types/feature-card.types';

export const FEATURE_CARDS_DATA: FeatureCard[] = [
  {
    id: 'ai-assistant-pro',
    title: '🧠 AI Assistant',
    description:
      '3개 AI 프로바이더 + 5개 전문 에이전트로 서버 장애를 실시간 분석. ML 이상 탐지 + 과거 장애 이력 검색(GraphRAG) 지원.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `3개의 AI Provider(Cerebras, Groq, Mistral)와 Vercel AI SDK 6.0 기반 5-Agent 멀티 에이전트 시스템입니다. Isolation Forest ML 엔진으로 다변량 이상 탐지, LlamaIndex.TS GraphRAG로 하이브리드 검색, Mistral Embedding(1024d)으로 벡터 유사도 검색을 수행합니다. GCP Cloud Run에서 Node.js 22 + Hono로 운영됩니다.`,
      features: [
        '🧠 Cerebras Inference: WSE-3 칩 기반 24M 토큰/일 초고속 추론 (llama-3.3-70b)',
        '⚡ Groq Cloud: LPU 기반 500 Tokens/s 초고속 추론 (llama-3.3-70b-versatile)',
        '🛡️ Mistral AI: 24B SLM + mistral-embed 1024차원 벡터 임베딩',
        '▲ Vercel AI SDK 6.0: streamText, generateObject, embed 통합 API',
        '🤖 @ai-sdk-tools/agents: 5-Agent Orchestrator-Worker Handoff 패턴',
        '🌲 Isolation Forest: ML 기반 다변량 이상 탐지 + Adaptive Thresholds',
        '🦙 LlamaIndex.TS: GraphRAG + Knowledge Triplet Extraction',
        '🐘 Supabase pgVector: 벡터 유사도 검색 + 그래프 탐색',
        '📊 Langfuse: AI 호출 추적 및 품질 모니터링',
        '⚡ Upstash Redis: 응답 캐싱 및 Rate Limiting',
        '☁️ GCP Cloud Run: Node.js 22 + Hono 서버리스 컨테이너',
      ],
      technologies: [
        'Cerebras Inference (Llama 3.3 70B)',
        'Groq Cloud (LPU)',
        'Mistral AI (SLM 24B + Embedding)',
        'Vercel AI SDK 6.0',
        '@ai-sdk-tools/agents v1.2',
        'LlamaIndex.TS (GraphRAG)',
        'Isolation Forest (ML)',
        'Supabase pgVector',
        'Langfuse (Observability)',
        'Upstash Redis',
        'GCP Cloud Run + Hono',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'cloud-platform',
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel(Frontend) + Cloud Run(Backend) 분산 아키텍처. 4개 플랫폼을 연동해 하나의 시스템으로 동작시킨 통합 구현.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `4개의 서로 다른 클라우드 플랫폼을 연동하여 하나의 시스템으로 동작시킨 하이브리드 아키텍처입니다. Vercel(Frontend) + Cloud Run(Backend AI Engine) 분리 설계로 프론트엔드와 백엔드를 독립적으로 스케일링합니다. Supabase(DB+Vector)와 Upstash(Cache)가 데이터 계층을 담당합니다.`,
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
        '📊 Recharts 3.6: 실시간 대시보드 차트 및 메트릭 시각화',
        '🔄 TanStack Query v5: 서버 상태 관리 및 데이터 캐싱 최적화',
        '🧰 Zustand 5.0: 글로벌 상태 관리 및 미들웨어 최적화',
        '🏬 Radix UI: 접근성이 보장된 Headless UI 컴포넌트',
      ],
      technologies: [
        'Next.js 16',
        'React 19',
        'TypeScript 5.9',
        'Tailwind CSS 4.1',
        'Recharts 3.6',
        'TanStack Query v5',
        'Zustand 5.0',
        'Radix UI / Lucide',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '🔥 Vibe Coding',
    description:
      'AI 도구를 활용한 개발 환경. WSL + Claude Code 기반으로 Codex·Gemini 코드 리뷰가 커밋마다 자동 실행됩니다.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `이 프로젝트의 개발 환경입니다. 초기 ChatGPT 활용부터 현재 멀티 에이전트 협업 환경까지 바이브 코딩 적용.`,
      features: [
        '1️⃣ Stage 1 (Manual): GPT/Gemini 창에서 수동 코딩 → [Netlify 목업](https://openmanager-vibe-v2.netlify.app/)',
        '2️⃣ Stage 2 (Auto): Cursor의 등장, "IDE 자동 개발"의 시작',
        '3️⃣ Stage 3 (Pivot): IDE는 보조(시각 분석)로, 메인은 WSL + Claude Code로 이동',
        '4️⃣ Stage 4 (Current): WSL 위의 Multi-CLI (Codex/Gemini) + Google Antigravity',
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
