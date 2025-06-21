/**
 * 📖 OpenManager Vibe v5 Introduction
 *
 * 프로젝트 소개 및 개요 문서
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';

// Introduction 컴포넌트
const Introduction = () => (
  <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 to-black text-white">
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        🚀 OpenManager Vibe v5
      </h1>
      <p className="text-xl text-gray-300">
        AI 기반 차세대 서버 모니터링 및 관리 시스템
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-blue-400">🎯 프로젝트 개요</h2>
        <ul className="space-y-3 text-gray-300">
          <li>• 개발 기간: 20일 (2025.05.25-06.10)</li>
          <li>• 개발 규모: 603파일, 200,081라인</li>
          <li>• 개발 방식: 1인 개발 + AI 협업</li>
          <li>• 기술 스택: Next.js, TypeScript, AI Engines</li>
        </ul>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-purple-400">🤖 AI 시스템</h2>
        <ul className="space-y-3 text-gray-300">
          <li>• Google AI Studio (Gemini 베타)</li>
          <li>• UnifiedAIEngine 자체 개발</li>
          <li>• RAG 엔진 (로컬 벡터 DB)</li>
          <li>• MCP 서버 시스템</li>
        </ul>
      </div>
    </div>

    <div className="mt-12 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-green-400 mb-4">✨ 주요 특징</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-bold text-white mb-2">실시간 모니터링</h3>
          <p className="text-sm text-gray-400">서버 상태 실시간 추적 및 시각화</p>
        </div>
        <div>
          <h3 className="font-bold text-white mb-2">AI 장애 예측</h3>
          <p className="text-sm text-gray-400">머신러닝 기반 이상 징후 탐지</p>
        </div>
        <div>
          <h3 className="font-bold text-white mb-2">자동 스케일링</h3>
          <p className="text-sm text-gray-400">8-30대 서버 동적 스케일링</p>
        </div>
      </div>
    </div>

    <div className="mt-8 text-center">
      <p className="text-gray-400">
        Storybook으로 문서화된 UI 컴포넌트들을 탐색해보세요
      </p>
    </div>
  </div>
);

const meta: Meta<typeof Introduction> = {
  title: 'Welcome/Introduction',
  component: Introduction,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# OpenManager Vibe v5 Introduction

## 프로젝트 소개

AI 기반 차세대 서버 모니터링 시스템 OpenManager Vibe v5에 오신 것을 환영합니다.

### 개발 성과
- **20일간의 집중 개발**: 2025년 5월 25일부터 6월 10일까지
- **대규모 코드베이스**: 603개 파일, 200,081라인
- **AI 협업 개발**: Cursor AI + Claude Sonnet 3.7
- **완전한 문서화**: Storybook을 통한 컴포넌트 문서화

### 기술 아키텍처
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI Engines**: Google AI Studio (Gemini), UnifiedAIEngine
- **Database**: Supabase, Redis (Upstash)
- **Deployment**: Vercel (Web), Render (MCP Server)

### 주요 기능
1. **실시간 서버 모니터링**: CPU, 메모리, 네트워크 실시간 추적
2. **AI 장애 예측**: 머신러닝 기반 이상 징후 사전 탐지
3. **자동 스케일링**: 8-30대 서버 동적 관리
4. **Multi-AI 시스템**: 4종 AI 엔진 통합 운영

이 Storybook에서는 프로젝트의 모든 UI 컴포넌트들을 탐색하고 테스트할 수 있습니다.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  name: '환영합니다 👋',
  parameters: {
    docs: {
      description: {
        story: 'OpenManager Vibe v5 프로젝트 소개 및 개요',
      },
    },
  },
}; 