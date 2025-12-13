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
      'RAG(문서) + ML(예측) + LLM(Gemini/Groq) 결합 엔진. 3가지 핵심 AI 기술의 유기적 통합으로 정확한 시스템 분석을 제공합니다.',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
    detailedContent: {
      overview: `RAG + ML + LLM 완전 통합! Supabase RAG로 문서를 찾고, ML 엔진으로 장애를 예측하며, Gemini/Groq LLM으로 최종 답변을 생성하는 3단계 파이프라인입니다.`,
      features: [
        '🚀 Quad AI Engine: 8B Router가 Gemini와 Llama 4종 모델을 상황에 맞춰 복합 사용',
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
        'Vercel AI SDK 5.0 (Stream)',
        'Groq Llama 3.1 Router',
        'Gemini 2.5 Flash/Pro',
        'Python 3.11 (Flask 3.0)',
        'spaCy 3.7 (NLP)',
        'Supabase pgvector (RAG)',
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
      'Vercel(웹) · Supabase(DB) · Google Cloud(AI) 완전 통합. 각 분야 최고의 클라우드 서비스에 최적화하여 배포했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `Vercel, Supabase, GCP Cloud Run 3대 플랫폼 완전 통합! 웹은 Vercel, 데이터는 Supabase, AI는 Google Cloud에 각각 최적화하여 배포했습니다.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 16 완벽 최적화, 전 세계 CDN 배포, Edge Runtime 활용',
        '🚀 Vercel 성능: 자동 스케일링, 빌드 최적화, 무제한 프리뷰 배포 환경',
        '🐋 Docker 개발 환경: 로컬에서 Cloud Run과 동일한 Docker 환경으로 개발 생산성 극대화',
        '🐘 Supabase 플랫폼: PostgreSQL 15 + pgVector AI 검색 + Row Level Security 완전 구현',
        '☁️ GCP Cloud Run: Python ML 서비스를 Docker 컨테이너로 완전 관리형 배포',
        '🔄 Scale to Zero: 사용량 없을 시 인스턴스 0개로 축소하여 비용 절감 (Cold Start 최적화)',
        '🔗 HTTP REST API: 직접 호출 방식 (SDK 미사용, 번들 크기 0KB)',
        '💰 무료 티어 최적화: Vercel/Supabase/Cloud Run/Groq 무료 사용량 100% 활용, 운영비 $0',
        '📡 통합 AI API 엔드포인트: /api/ai/unified-stream (LangGraph Multi-Agent)',
        '🔐 통합 보안: Vercel 환경변수 + Supabase RLS + GCP IAM 통합 인증',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL 15',
        'Next.js 16 Edge Runtime',
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
      'Next.js 16 · React 19 · TypeScript 5.9 기반. 최신 기술을 선제적으로 도입한 Next-Gen 웹 아키텍처',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `실제 사용 중인 Next-Gen 기술 스택! Next.js 16 Canary, React 19 RC, TypeScript 5.9 등 최신 기술을 선제적으로 도입하여 미래 표준을 제시합니다.`,
      features: [
        '⚛️ React 19 + Next.js 16: Server Actions, Partial Prerendering 등 최신 기능 선행 적용',
        '🔷 TypeScript 5.9: 최신 컴파일러 기능을 활용한 강력한 타입 안전성 확보 (Bleeding Edge)',
        '🐍 Python 3.11 + Flask 3.0: Cloud Run 기반의 경량화된 고성능 AI 백엔드',
        '🧠 spaCy 3.7 + scikit-learn: 영어 NLP 및 머신러닝 분석 엔진',
        '📊 Recharts 3.2: 실시간 대시보드 차트 및 메트릭 시각화',
        '🔄 TanStack Query v5: 서버 상태 관리 및 데이터 캐싱 최적화',
        '🔒 NextAuth.js v5: 보안 강화된 인증 시스템 (Beta)',
        '🎨 Tailwind CSS 4.1: 최신 Oxides 엔진으로 빌드 성능 극대화',
        '🧪 Vitest 4.0: 차세대 테스트 프레임워크 적용',
        '🏬 Radix UI: 접근성이 보장된 Headless UI 컴포넌트',
        '🧰 Zustand 5.0: 글로벌 상태 관리 및 미들웨어 최적화',
        '📈 성능 최적화: 최신 런타임 적용으로 평균 응답 속도 및 리소스 효율 개선',
      ],
      technologies: [
        'Next.js 16 (Canary)',
        'React 19 (RC)',
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
