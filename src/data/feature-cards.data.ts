/**
 * Feature Cards 데이터
 * 메인 페이지에 표시되는 4개의 주요 기능 카드 데이터
 * @updated 2026-07-31 - visitor-facing AI card copy and evidence flow clarified
 */

import {
  Activity,
  BookOpen,
  Bot,
  Database,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { FeatureCard } from '@/types/feature-card.types';

export const FEATURE_CARDS_DATA: FeatureCard[] = [
  {
    id: 'ai-assistant',
    title: '💬 AI 어시스턴트',
    description:
      '자연어 질의부터 장애 보고서, 다운로드 가능한 장애·이상 감지 자료까지 하나의 AI 워크스페이스에서 확인할 수 있습니다.',
    icon: Bot,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    detailedContent: {
      overview: `서버 상태를 자연어로 묻고 현재 상태, 원인, 다음 조치안을 한 흐름에서 확인하는 운영 의사결정 AI입니다. 대시보드와 같은 시뮬레이션 OTel 관측 데이터를 바탕으로 수치와 상태를 판정하고, 복잡한 원인 분석과 보고서는 전문 에이전트가 처리합니다.`,
    },
    subSections: [
      {
        title: '관측 데이터 기반 분석',
        description:
          '대시보드와 AI가 같은 관측 데이터를 사용해 화면의 수치와 답변의 근거를 일치시킵니다.',
        icon: Activity,
        gradient: 'from-sky-500 to-cyan-500',
        features: [
          'CPU·메모리·응답 시간·로그를 함께 확인',
          '수치와 상태 판정은 정해진 계산 규칙으로 처리',
          'AI는 계산된 근거를 바탕으로 원인과 조치안을 설명',
        ],
      },
      {
        title: '운영 지식 활용',
        description:
          '운영 절차서, 장애 이력, 서버 연결 정보를 질문과 관련된 내용만 찾아 답변에 활용합니다.',
        icon: BookOpen,
        gradient: 'from-emerald-500 to-teal-500',
        features: [
          '저장소 문서와 기준 데이터를 원본으로 유지',
          '서버와 장애 유형에 맞는 운영 지식을 우선 검색',
          '별도 검색 서비스 없이 프로젝트 내부에서 구성',
        ],
      },
      {
        title: '답변 근거 구분',
        description:
          '답변에 사용한 운영 데이터, 내부 문서, 웹 정보, 도구 결과를 출처별로 구분해 보여줍니다.',
        icon: Search,
        gradient: 'from-violet-500 to-fuchsia-500',
        features: [
          '운영 데이터와 내부 문서를 서로 다른 근거로 표시',
          '최신 외부 정보는 웹 출처와 함께 표시',
          '도구 실행 결과와 대화 맥락을 구분해 추적',
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
      'Vercel 프론트엔드와 Cloud Run AI Engine을 분리하고 Supabase·Upstash·Cloud Tasks로 무료 티어 친화 실행 경계를 구성했습니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `화면과 AI 분석 런타임을 분리해 사용자 응답성과 운영 안정성을 함께 확보한 하이브리드 구조입니다. Vercel은 프론트엔드, Cloud Run은 AI 분석을 담당하고 Supabase·Upstash·Cloud Tasks가 데이터, 요청 제한, 비동기 작업 경계를 나눠 맡습니다.`,
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 16, React 19, TypeScript 6.0, Nivo Line, SVG Sparkline으로 시계열 차트와 AI 스트리밍 UI를 처리합니다.',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `실시간 대시보드, 자연어 질의, AI 응답 스트리밍을 하나의 제품 경험으로 연결하는 실제 운영 스택입니다. Next.js 16, React 19, TypeScript 6.0을 중심으로 시계열 렌더링과 타입 안전한 개발 흐름을 구성했습니다.`,
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '🤖 AI 개발 워크플로우',
    description:
      'Claude Code·Codex·Gemini와 GitLab CI 배포 게이트를 조합해 계획, 구현, 검증, 공개 스냅샷 동기화까지 운영합니다.',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `AI 개발 도구를 계획, 구현, 검토에 선택적으로 활용하고 GitLab CI가 검증과 배포를 통제하는 개발 흐름입니다. 로컬 검증부터 프로덕션 배포, 공개 코드 스냅샷까지 각 단계의 권한과 책임을 분리해 운영합니다.`,
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];
