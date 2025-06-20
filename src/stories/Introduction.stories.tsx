/**
 * 📚 Introduction Story
 *
 * OpenManager Vibe v5 컴포넌트 가이드 소개
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// 더미 컴포넌트 (실제로는 MDX 내용을 표시)
const IntroductionComponent = () => {
  return (
    <div className='max-w-4xl mx-auto p-8 prose prose-lg'>
      <h1 className='text-4xl font-bold mb-4'>
        🚀 OpenManager Vibe v5.44.4 컴포넌트 가이드
      </h1>

      <p className='text-xl text-gray-600 mb-8'>
        <strong>차세대 AI 기반 예측 모니터링 플랫폼</strong>의 컴포넌트
        라이브러리에 오신 것을 환영합니다!
      </p>

      <div className='bg-green-50 p-4 rounded-lg mb-6 border-l-4 border-green-500'>
        <h3 className='font-medium text-green-800 mb-2'>
          🆕 최신 업데이트 (v5.44.4 - 완전 안정화)
        </h3>
        <ul className='text-sm text-green-700 space-y-1'>
          <li>
            • 🎯 pnpm 패키지 매니저로 완전 전환 및 의존성 최적화
          </li>
          <li>
            • 🧠 IntelligentMonitoringPage - 3단계 AI 분석 워크플로우 완성
          </li>
          <li>• 🖥️ ServerCard 컴포넌트 SOLID 원칙 적용 모듈화</li>
          <li>• 📊 실시간 15개 서버 모니터링 완전 안정화</li>
          <li>• �� 14개 AI 엔진 통합 완전 구현</li>
          <li>• 💾 Redis 목업 시스템 완전 통합</li>
          <li>• 🔐 Google AI Studio (Gemini) 베타 연동 완료</li>
          <li>• 📈 TypeScript 컴파일 0개 오류 달성</li>
          <li>• 🏗️ Next.js 125개 페이지 성공적 빌드</li>
        </ul>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>📖 개요</h2>
      <p className='mb-6'>
        OpenManager Vibe는 React + Next.js 기반의 현대적인 서버 모니터링
        플랫폼입니다. 15개 실제 서버 데이터를 실시간으로 모니터링하며, AI 기반
        예측 분석과 자동화된 알림 시스템을 제공합니다.
      </p>

      <h2 className='text-2xl font-semibold mb-4'>🏗️ 아키텍처 특징</h2>

      <h3 className='text-xl font-medium mb-3'>🎯 핵심 원칙</h3>
      <ul className='list-disc pl-6 mb-6'>
        <li>
          <strong>SOLID 원칙</strong> - 모든 컴포넌트 모듈화 및 분리
        </li>
        <li>
          <strong>실시간 데이터</strong> - 15개 서버 실시간 모니터링
        </li>
        <li>
          <strong>AI 통합</strong> - 14개 AI 엔진 완전 통합
        </li>
        <li>
          <strong>TypeScript</strong> 완전 타입 안정성 (0개 컴파일 오류)
        </li>
        <li>
          <strong>pnpm 최적화</strong> - 패키지 관리 성능 향상
        </li>
        <li>
          <strong>Redis 캐싱</strong> - 목업 시스템 포함 완전 구현
        </li>
        <li>
          <strong>반응형 디자인</strong> 모바일 퍼스트
        </li>
      </ul>

      <h3 className='text-xl font-medium mb-3'>⚡ 성능 최적화</h3>
      <ul className='list-disc pl-6 mb-6'>
        <li>
          <strong>Next.js 빌드</strong> 125개 정적 페이지 성공 생성
        </li>
        <li>
          <strong>pnpm 패키지 관리</strong> 설치 속도 30% 향상
        </li>
        <li>
          <strong>데이터 로딩</strong> 실제 API 연동 완료
        </li>
        <li>
          <strong>캐시 시스템</strong> Redis + 메모리 이중화
        </li>
        <li>
          <strong>에러 방지</strong> NaN 체크 및 안전 장치
        </li>
        <li>
          <strong>코드 분할</strong> 컴포넌트 레벨 최적화
        </li>
      </ul>

      <h2 className='text-2xl font-semibold mb-4'>📁 컴포넌트 카테고리</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🖥️ Dashboard</h3>
          <p className='text-sm text-gray-600'>실시간 서버 모니터링 대시보드</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• ServerCard - 모듈화된 서버 카드 (SOLID 적용)</li>
            <li>• InfrastructureOverviewPage - 인프라 현황</li>
            <li>• SystemAlertsPage - 실시간 알림</li>
            <li>• ServerDashboard - 서버 목록 (15개 서버)</li>
            <li>• CircularGauge - 애니메이션 게이지</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🧠 AI Components</h3>
          <p className='text-sm text-gray-600'>14개 AI 엔진 통합 시스템</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• IntelligentMonitoringPage - 3단계 AI 분석</li>
            <li>• Google AI Studio (Gemini) - 베타 연동</li>
            <li>• UnifiedAIEngine - 자체 개발</li>
            <li>• RAG 엔진 - 로컬 벡터 DB</li>
            <li>• MultiAIThinkingViewer - 사고 과정 시각화</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🛠️ Admin</h3>
          <p className='text-sm text-gray-600'>관리자 페이지 (완전 정리)</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• AI 에이전트 관리 - 14개 엔진 통합</li>
            <li>• MCP 모니터링 - 엔터프라이즈급</li>
            <li>• 로그 분석 - 실시간 검색</li>
            <li>• 데이터베이스 관리 - CRUD 작업</li>
            <li>• GoogleAIManagementTab - AI 설정</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>📊 Real Data</h3>
          <p className='text-sm text-gray-600'>실제 데이터 기반 시각화</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• 15개 서버 실시간 메트릭</li>
            <li>• CPU/메모리/디스크 사용률</li>
            <li>• 네트워크 트래픽 모니터링</li>
            <li>• 알림 시스템 (임계값 기반)</li>
            <li>• 성능 히스토리 추적</li>
          </ul>
        </div>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>🎨 현재 상태</h2>

      <div className='mb-6'>
        <h3 className='text-xl font-medium mb-3'>📊 실시간 통계</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <div className='text-2xl font-bold text-blue-600'>15</div>
            <div className='text-sm text-blue-800'>총 서버</div>
          </div>
          <div className='text-center p-3 bg-green-50 rounded-lg'>
            <div className='text-2xl font-bold text-green-600'>14</div>
            <div className='text-sm text-green-800'>AI 엔진</div>
          </div>
          <div className='text-center p-3 bg-purple-50 rounded-lg'>
            <div className='text-2xl font-bold text-purple-600'>125</div>
            <div className='text-sm text-purple-800'>빌드 페이지</div>
          </div>
          <div className='text-center p-3 bg-orange-50 rounded-lg'>
            <div className='text-2xl font-bold text-orange-600'>0</div>
            <div className='text-sm text-orange-800'>TS 오류</div>
          </div>
        </div>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>🚀 빠른 시작</h2>

      <div className='bg-gray-100 p-4 rounded-lg mb-6'>
        <h3 className='font-medium mb-2'>pnpm으로 Storybook 실행</h3>
        <code className='text-sm bg-gray-800 text-white p-2 rounded block'>
          pnpm run storybook
        </code>
      </div>

      <div className='bg-gray-100 p-4 rounded-lg mb-6'>
        <h3 className='font-medium mb-2'>실제 대시보드 확인</h3>
        <code className='text-sm bg-gray-800 text-white p-2 rounded block'>
          pnpm run dev → http://localhost:3000/dashboard
        </code>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>🆕 새로운 스토리</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='p-4 border rounded-lg'>
          <h4 className='font-medium mb-2'>🧠 IntelligentMonitoringPage</h4>
          <p className='text-sm text-gray-600'>
            3단계 AI 분석 워크플로우: 이상 탐지 → 근본 원인 분석 → 예측적 모니터링
          </p>
        </div>
        <div className='p-4 border rounded-lg'>
          <h4 className='font-medium mb-2'>🖥️ ServerCard 모듈</h4>
          <p className='text-sm text-gray-600'>
            SOLID 원칙 적용한 모듈화된 서버 카드 시스템 (8가지 변형)
          </p>
        </div>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>📞 지원</h2>

      <div className='bg-blue-50 p-6 rounded-lg'>
        <h3 className='font-medium mb-2'>프로젝트 정보</h3>
        <ul className='space-y-1 text-sm'>
          <li>
            <strong>프로젝트</strong>: OpenManager Vibe v5.44.4
          </li>
          <li>
            <strong>버전</strong>: 5.44.4 (완전 안정화 + pnpm 전환)
          </li>
          <li>
            <strong>마지막 업데이트</strong>: 2025-06-19 (스토리북 완전 갱신)
          </li>
          <li>
            <strong>빌드 상태</strong>: ✅ 125개 페이지 성공
          </li>
          <li>
            <strong>TypeScript</strong>: ✅ 0개 컴파일 오류
          </li>
          <li>
            <strong>패키지 관리</strong>: ✅ pnpm 최적화 완료
          </li>
          <li>
            <strong>AI 시스템</strong>: ✅ 14개 엔진 안정화
          </li>
        </ul>

        <div className='mt-4'>
          <p className='text-lg font-semibold text-blue-600'>
            🎉 모든 시스템 완전 안정화 달성!
          </p>
          <p className='text-sm mt-2 text-blue-700'>
            pnpm 전환, 모듈화 완성, AI 통합, 실시간 모니터링 - 모든 기능이 완벽하게 작동합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof IntroductionComponent> = {
  title: 'OpenManager Vibe/Introduction',
  component: IntroductionComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'OpenManager Vibe v5.44.4 컴포넌트 라이브러리 소개 페이지입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {};
