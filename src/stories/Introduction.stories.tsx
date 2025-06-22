/**
 * 📖 OpenManager Vibe v5 Introduction
 *
 * 프로젝트 소개 및 개요 문서
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';

// Introduction 컴포넌트
const Introduction = () => (
  <div className='max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 to-black text-white'>
    <div className='text-center mb-12'>
      <h1 className='text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent'>
        🚀 OpenManager Vibe v5
      </h1>
      <p className='text-xl text-gray-300'>
        AI 기반 차세대 서버 모니터링 및 관리 시스템
      </p>
    </div>

    <div className='grid md:grid-cols-2 gap-8'>
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold text-blue-400'>🎯 프로젝트 개요</h2>
        <ul className='space-y-3 text-gray-300'>
          <li>• 개발 기간: 20일 (2025.05.25-06.10)</li>
          <li>• 개발 규모: 603파일, 200,081라인</li>
          <li>• 개발 방식: 1인 개발 + AI 협업</li>
          <li>• 기술 스택: Next.js, TypeScript, AI Engines</li>
        </ul>
      </div>

      <div className='space-y-6'>
        <h2 className='text-2xl font-bold text-purple-400'>🤖 AI 시스템</h2>
        <ul className='space-y-3 text-gray-300'>
          <li>• Google AI Studio (Gemini 베타)</li>
          <li>• UnifiedAIEngine 자체 개발</li>
          <li>• RAG 엔진 (로컬 벡터 DB)</li>
          <li>• MCP 서버 시스템</li>
        </ul>
      </div>
    </div>

    <div className='mt-12 p-6 bg-gray-800 rounded-lg'>
      <h2 className='text-2xl font-bold text-green-400 mb-4'>✨ 주요 특징</h2>
      <div className='grid md:grid-cols-3 gap-6'>
        <div>
          <h3 className='font-bold text-white mb-2'>실시간 모니터링</h3>
          <p className='text-sm text-gray-400'>
            서버 상태 실시간 추적 및 시각화
          </p>
        </div>
        <div>
          <h3 className='font-bold text-white mb-2'>AI 장애 예측</h3>
          <p className='text-sm text-gray-400'>머신러닝 기반 이상 징후 탐지</p>
        </div>
        <div>
          <h3 className='font-bold text-white mb-2'>자동 스케일링</h3>
          <p className='text-sm text-gray-400'>8-30대 서버 동적 스케일링</p>
        </div>
      </div>
    </div>

    <div className='mt-8 text-center'>
      <p className='text-gray-400'>
        Storybook으로 문서화된 UI 컴포넌트들을 탐색해보세요
      </p>
    </div>
  </div>
);

const meta: Meta = {
  title: '📚 Documentation/Introduction',
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: () => (
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
          <h1>🚀 OpenManager Vibe v5.44.0</h1>
          <p
            style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}
          >
            AI 기반 차세대 서버 모니터링 시스템 - 스토리북 컴포넌트 라이브러리
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
              }}
            >
              <h3>🎯 주요 기능</h3>
              <ul>
                <li>실시간 서버 모니터링</li>
                <li>AI 기반 장애 예측</li>
                <li>자동 스케일링 시뮬레이션</li>
                <li>Multi-AI 엔진 통합</li>
                <li>한국어 자연어 처리</li>
              </ul>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
              }}
            >
              <h3>🧪 테스트 현황</h3>
              <ul>
                <li>✅ 139개 테스트 통과 (95.2%)</li>
                <li>✅ 128개 스토리북 컴포넌트</li>
                <li>✅ TypeScript 100% 지원</li>
                <li>✅ 목업 시스템 완벽 동작</li>
              </ul>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
              }}
            >
              <h3>🔧 기술 스택</h3>
              <ul>
                <li>Next.js 15 + TypeScript</li>
                <li>React Query + Zustand</li>
                <li>Tailwind CSS + Shadcn/ui</li>
                <li>Vitest + Storybook</li>
                <li>Google AI + MCP</li>
              </ul>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
              }}
            >
              <h3>📊 AI 엔진</h3>
              <ul>
                <li>Google AI Studio (Gemini)</li>
                <li>UnifiedAIEngine</li>
                <li>Korean RAG Engine</li>
                <li>Smart Fallback System</li>
                <li>Graceful Degradation</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h3>🎨 컴포넌트 카테고리</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <h4>📊 Dashboard</h4>
                <p>서버 카드, 차트, 메트릭</p>
              </div>
              <div>
                <h4>🤖 AI Components</h4>
                <p>AI 엔진, 사이드바, 테스트</p>
              </div>
              <div>
                <h4>🎛️ Admin</h4>
                <p>관리자 도구, 설정, 모니터링</p>
              </div>
              <div>
                <h4>🧩 UI Components</h4>
                <p>버튼, 카드, 폼, 알림</p>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#e8f4fd',
              borderRadius: '8px',
            }}
          >
            <h3>🚀 최신 업데이트 (v5.44.0)</h3>
            <ul>
              <li>✨ 테스트 개선: 95.2% 통과율 달성</li>
              <li>🔧 환경변수 최적화: FORCE_MOCK_GOOGLE_AI 추가</li>
              <li>📱 스토리북 최신화: 128개 컴포넌트 스토리</li>
              <li>🎯 API 테스트 정규화: config-adaptive 완전 수정</li>
              <li>⚡ 성능 최적화: Worker 안정성 개선</li>
            </ul>
          </div>

          <div
            style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
            }}
          >
            <p style={{ margin: 0, color: '#0369a1', fontWeight: 'bold' }}>
              🎭 바이브 코딩으로 20일만에 완성된 차세대 AI 모니터링 시스템
            </p>
          </div>
        </div>
      ),
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  name: '환영합니다',
};
