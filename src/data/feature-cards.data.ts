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
      overview: `v5.66.27 - 무료 티어 최적화로 월 $0 운영! 3개 핵심 클라우드 플랫폼과 GCP 무료 VM을 통합하여 완전한 인프라 구축, 자동 스케일링과 글로벌 CDN으로 성능 최적화.`,
      features: [
        '▲ Vercel 플랫폼: 프론트엔드 애플리케이션 클라우드 호스팅, 전 세계 CDN 자동 배포, Git 기반 지속적 배포',
        '🌐 Vercel로 구현한 기능: 자동 HTTPS/SSL 인증서, 도메인 관리, 환경 변수 보안 관리, 분석 대시보드',
        '🚀 Vercel 핵심 가치: 무료 100GB 대역폭/월, 자동 스케일링, 빌드 최적화, 프리뷰 배포로 팀 협업 지원',
        '🐘 Supabase 플랫폼: PostgreSQL + pgVector + Row Level Security, 실시간 구독 지원',
        '📊 Supabase로 구현한 기능: 서버 메트릭 저장, AI 벡터 검색, 사용자 인증 시스템, 실시간 데이터 동기화',
        '🖥️ GCP Compute Engine: e2-micro 무료 VM 1개 활용 (1vCPU, 1GB RAM, 30GB SSD)',
        '☁️ GCP Functions: Python 3.11 기반 AI 처리 서버 3개 (enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor)',
        '🤖 Google AI Studio: Gemini 2.0 Flash API 통합, 일 1,000회 무료 할당량 활용',
      ],
      technologies: [
        'Vercel Platform',
        'Supabase PostgreSQL',
        'GCP Compute Engine',
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
      'Cursor AI로 시작한 AI 기반 개발! 자동 오류 수정, 백그라운드 에이전트, Composer 멀티파일 생성으로 개발 속도 10배 향상',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.66.30 - Cursor AI가 핵심! 프로젝트 초기부터 현재까지 Cursor로 개발하며, 중반부터 Claude Code와 MCP를 추가로 활용해 더 강력한 자동화를 구현했습니다.`,
      features: [
        '🚀 Cursor AI 핵심 기능: 자동 오류 감지/수정, 백그라운드 에이전트로 지속적 코드 개선',
        '✨ Composer 멀티파일: 여러 파일을 동시에 생성/수정하여 복잡한 기능도 한 번에 구현',
        '🔧 실시간 AI 지원: Tab 자동완성, 오류 예측, 리팩토링 제안으로 코딩 속도 극대화',
        '📈 개발 진화 과정: 초기 단순 자동완성 → 중반 오류 수정 활용 → 현재 풀스택 개발',
        '🔄 중반 전환점: v5.65부터 Claude Code 추가 도입으로 Git/DB 작업까지 자동화',
        '🤝 AI 협업 체계: Cursor(코드 작성) + Claude Code(프로젝트 관리) + Gemini CLI(대규모 분석)',
        '📊 구체적 성과: TypeScript 에러 302→0개, ESLint 475→400개, 빌드 시간 70% 단축',
      ],
      technologies: [
        'Cursor AI (핵심 개발 도구)',
        'Cursor 개발 전환점',
        'Claude Code (보조 자동화)',
        'MCP 서버 11개 통합',
        'Gemini CLI 협업',
        '실제 개발 성과',
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