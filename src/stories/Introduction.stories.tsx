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
        <h3 className='font-medium text-green-800 mb-2'>🆕 최신 업데이트 (v5.44.4)</h3>
        <ul className='text-sm text-green-700 space-y-1'>
          <li>• 홈페이지 개발과정 페이지 경로 변경: /vibe-coding → /about</li>
          <li>• FeatureCardsGrid 컴포넌트 &quot;개발과정 보기&quot; 버튼 추가</li>
          <li>• 새로운 스토리북 스토리 추가 및 기존 스토리 업데이트</li>
          <li>• AI 에이전트 상태 연동 개선</li>
        </ul>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>📖 개요</h2>
      <p className='mb-6'>
        OpenManager Vibe는 React + Next.js 기반의 현대적인 서버 모니터링
        플랫폼입니다. 이 Storybook에서는 프로젝트에서 사용되는 모든 주요
        컴포넌트들을 문서화하고 테스트할 수 있습니다.
      </p>

      <h2 className='text-2xl font-semibold mb-4'>🏗️ 아키텍처 특징</h2>

      <h3 className='text-xl font-medium mb-3'>🎯 핵심 원칙</h3>
      <ul className='list-disc pl-6 mb-6'>
        <li>
          <strong>React.memo</strong> 최적화 적용
        </li>
        <li>
          <strong>React.lazy()</strong> 코드 스플리팅
        </li>
        <li>
          <strong>TypeScript</strong> 타입 안정성
        </li>
        <li>
          <strong>접근성(A11y)</strong> 표준 준수
        </li>
        <li>
          <strong>반응형 디자인</strong> 모바일 퍼스트
        </li>
      </ul>

      <h3 className='text-xl font-medium mb-3'>⚡ 성능 최적화</h3>
      <ul className='list-disc pl-6 mb-6'>
        <li>
          <strong>초기 번들 크기</strong> 14% 감소
        </li>
        <li>
          <strong>첫 페인트 시간</strong> 25% 개선
        </li>
        <li>
          <strong>메모이제이션</strong> 및 <strong>디바운스</strong> 적용
        </li>
        <li>
          <strong>Suspense 경계</strong> 설정
        </li>
      </ul>

      <h2 className='text-2xl font-semibold mb-4'>📁 컴포넌트 카테고리</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🖥️ Dashboard</h3>
          <p className='text-sm text-gray-600'>메인 대시보드 관련 컴포넌트들</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• DashboardHeader - 헤더 영역</li>
            <li>• SystemStatusDisplay - 시스템 상태 표시</li>
            <li>• DashboardContent - 메인 콘텐츠</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🏠 Home</h3>
          <p className='text-sm text-gray-600'>홈페이지 관련 컴포넌트들</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• FeatureCardsGrid - 기능 카드 그리드</li>
            <li>• 개발과정 보기 버튼 (/about 링크)</li>
            <li>• 다크모드 지원</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🤖 AI Components</h3>
          <p className='text-sm text-gray-600'>AI 에이전트 관련 컴포넌트들</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• PresetQuestions - 미리 정의된 질문</li>
            <li>• FlexibleAISidebar - AI 사이드바</li>
            <li>• ThinkingProcess - AI 사고 과정</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>🛠️ System</h3>
          <p className='text-sm text-gray-600'>시스템 제어 관련 컴포넌트들</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• FloatingSystemControl - 플로팅 제어판</li>
            <li>• SystemControlPanel - 통합 제어 패널</li>
          </ul>
        </div>

        <div className='p-4 border rounded-lg'>
          <h3 className='text-lg font-medium mb-2'>📊 Charts</h3>
          <p className='text-sm text-gray-600'>데이터 시각화 컴포넌트들</p>
          <ul className='text-sm mt-2 space-y-1'>
            <li>• RealtimeChart - 실시간 차트</li>
            <li>• PredictionChart - 예측 차트</li>
          </ul>
        </div>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>🎨 디자인 시스템</h2>

      <div className='mb-6'>
        <h3 className='text-xl font-medium mb-3'>🎨 색상 팔레트</h3>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-2'></div>
            <div className='text-sm font-medium'>Primary</div>
            <div className='text-xs text-gray-500'>#3B82F6</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-500 rounded-lg mx-auto mb-2'></div>
            <div className='text-sm font-medium'>Success</div>
            <div className='text-xs text-gray-500'>#10B981</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-yellow-500 rounded-lg mx-auto mb-2'></div>
            <div className='text-sm font-medium'>Warning</div>
            <div className='text-xs text-gray-500'>#F59E0B</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-500 rounded-lg mx-auto mb-2'></div>
            <div className='text-sm font-medium'>Error</div>
            <div className='text-xs text-gray-500'>#EF4444</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-purple-500 rounded-lg mx-auto mb-2'></div>
            <div className='text-sm font-medium'>Info</div>
            <div className='text-xs text-gray-500'>#8B5CF6</div>
          </div>
        </div>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>🚀 빠른 시작</h2>

      <div className='bg-gray-100 p-4 rounded-lg mb-6'>
        <h3 className='font-medium mb-2'>개발 모드에서 Storybook 실행</h3>
        <code className='text-sm bg-gray-800 text-white p-2 rounded block'>
          npm run storybook
        </code>
      </div>

      <div className='bg-gray-100 p-4 rounded-lg mb-6'>
        <h3 className='font-medium mb-2'>Storybook 빌드</h3>
        <code className='text-sm bg-gray-800 text-white p-2 rounded block'>
          npm run build-storybook
        </code>
      </div>

      <h2 className='text-2xl font-semibold mb-4'>📞 지원</h2>

      <div className='bg-blue-50 p-6 rounded-lg'>
        <h3 className='font-medium mb-2'>개발팀 연락처</h3>
        <ul className='space-y-1 text-sm'>
          <li>
            <strong>프로젝트</strong>: OpenManager Vibe v5.44.4
          </li>
          <li>
            <strong>버전</strong>: 5.44.4
          </li>
          <li>
            <strong>마지막 업데이트</strong>: 2025-06-18
          </li>
        </ul>

        <div className='mt-4'>
          <p className='text-lg font-semibold text-blue-600'>
            Happy Coding! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof IntroductionComponent> = {
  title: 'OpenManager Vibe/소개',
  component: IntroductionComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'OpenManager Vibe v5.44.4 컴포넌트 라이브러리 소개 및 가이드',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {};
