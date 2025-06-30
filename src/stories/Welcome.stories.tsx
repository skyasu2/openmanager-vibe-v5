import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const Welcome: React.FC = () => {
  return (
    <div className='max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-gray-800 mb-4'>
          🎨 OpenManager Vibe v5.56.0 Storybook
        </h1>
        <p className='text-xl text-gray-600'>
          AI 통합 서버 관리 시스템 UI 컴포넌트 개발 환경
        </p>
        <div className='mt-4 text-sm text-gray-500'>
          ⏰ 현재 시간: 2025년 6월 30일 09:05:27 (KST) | 🚀 21일 완전 개발 완료
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'>
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
            🚀 시작하기
          </h2>
          <ul className='space-y-3 text-gray-600'>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-blue-500 rounded-full mr-3'></span>
              좌측 사이드바에서 11개 컴포넌트 탐색
            </li>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
              Controls 패널에서 props 실시간 조정
            </li>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-purple-500 rounded-full mr-3'></span>
              Docs 탭에서 완전한 문서 확인
            </li>
          </ul>
        </div>

        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
            🎯 Multi-AI 시스템 (4개 엔진)
          </h2>
          <ul className='space-y-3 text-gray-600'>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-blue-500 rounded-full mr-3'></span>
              <strong>MCP Engine:</strong> 외부 서버 연동
            </li>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
              <strong>RAG Engine:</strong> 벡터 검색 시스템
            </li>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-purple-500 rounded-full mr-3'></span>
              <strong>Google AI:</strong> Gemini 고급 분석
            </li>
            <li className='flex items-center'>
              <span className='w-2 h-2 bg-red-500 rounded-full mr-3'></span>
              <strong>Rule-based:</strong> 패턴 매칭 엔진
            </li>
          </ul>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-lg p-6 mb-8'>
        <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
          🛠️ 최신 개발 현황 (2025-06-30)
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
              ✅
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>테스트</h3>
            <p className='text-sm text-gray-600'>539개 테스트 100% 통과</p>
          </div>
          <div className='text-center'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
              🌍
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>배포</h3>
            <p className='text-sm text-gray-600'>Vercel 프로덕션 완전 정상</p>
          </div>
          <div className='text-center'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
              📱
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>스토리북</h3>
            <p className='text-sm text-gray-600'>11개 스토리 완전 최신화</p>
          </div>
        </div>
      </div>

      <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white text-center'>
        <h2 className='text-2xl font-semibold mb-4'>🔒 완전한 목업 환경</h2>
        <p className='text-blue-100 mb-4'>
          스토리북은 프로덕션과 완전히 격리된 안전한 환경에서 실행됩니다
        </p>
        <div className='flex flex-wrap justify-center gap-2 text-sm'>
          <span className='bg-white/20 px-3 py-1 rounded-full'>Redis 목업</span>
          <span className='bg-white/20 px-3 py-1 rounded-full'>
            Google AI 목업
          </span>
          <span className='bg-white/20 px-3 py-1 rounded-full'>
            크론 비활성화
          </span>
          <span className='bg-white/20 px-3 py-1 rounded-full'>
            헬스체크 비활성화
          </span>
          <span className='bg-white/20 px-3 py-1 rounded-full'>
            외부 API 차단
          </span>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof Welcome> = {
  title: 'Introduction/Welcome',
  component: Welcome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'OpenManager Vibe v5 Storybook 시작 페이지입니다. 전체 컴포넌트 구조와 사용법을 안내합니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
