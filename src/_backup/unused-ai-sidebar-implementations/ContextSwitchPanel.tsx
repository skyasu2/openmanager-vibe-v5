/**
 * ⚙️ AI 컨텍스트 선택 패널 컴포넌트 (사이드 패널용)
 *
 * - 기본/고급/커스텀 컨텍스트 선택
 * - 컨텍스트 미리보기
 * - 적용 중인 컨텍스트 표시
 * - 편집은 관리 페이지에서만 가능
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Check,
  FileText,
  Layers,
  Database,
  Crown,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import Link from 'next/link';

interface ContextConfig {
  id: 'basic' | 'advanced' | 'custom';
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  content: string;
  wordCount: number;
}

interface ContextSwitchPanelProps {
  className?: string;
}

const ContextSwitchPanel: React.FC<ContextSwitchPanelProps> = ({
  className = '',
}) => {
  const { selectedContext, setSelectedContext } = useAISidebarStore();

  const contextConfigs: ContextConfig[] = [
    {
      id: 'basic',
      name: '기본 컨텍스트',
      description: '일반적인 서버 모니터링 기능',
      icon: <Database className='w-5 h-5' />,
      features: [
        '서버 상태 조회',
        '기본 메트릭 분석',
        '간단한 알림 처리',
        '상태 요약 보고',
      ],
      content: `당신은 서버 모니터링 AI 어시스턴트입니다.

주요 역할:
- 서버 상태 모니터링
- 기본 성능 지표 분석
- 간단한 문제 진단
- 상태 요약 제공

응답 스타일:
- 간결하고 명확한 답변
- 전문 용어 최소화
- 실용적인 권장사항 제공`,
      wordCount: 87,
    },
    {
      id: 'advanced',
      name: '고급 컨텍스트',
      description: '전문가 수준의 분석 및 예측 기능',
      icon: <Crown className='w-5 h-5' />,
      features: [
        '고급 패턴 분석',
        '장애 예측 모델링',
        '성능 최적화 제안',
        '복합 지표 분석',
        '트렌드 분석',
        '리소스 예측',
      ],
      content: `당신은 전문가 수준의 서버 모니터링 AI 어시스턴트입니다.

주요 역할:
- 고급 서버 분석 및 진단
- 장애 예측 및 예방
- 성능 최적화 권장사항
- 복합 메트릭 상관관계 분석
- 용량 계획 및 스케일링 조언
- 보안 이상 탐지

전문 분야:
- 시스템 아키텍처 분석
- 성능 병목 지점 식별
- 리소스 사용 패턴 분석
- 장애 시나리오 모델링
- 비용 최적화 전략

응답 스타일:
- 기술적으로 정확한 분석
- 데이터 기반 인사이트 제공
- 구체적인 액션 아이템 포함
- 위험도 및 우선순위 평가`,
      wordCount: 234,
    },
    {
      id: 'custom',
      name: '커스텀 컨텍스트',
      description: '사용자 정의 AI 동작 설정',
      icon: <Wrench className='w-5 h-5' />,
      features: [
        '사용자 정의 지침',
        '특화된 응답 스타일',
        '도메인별 전문성',
        '커스텀 분석 기준',
      ],
      content: `당신은 사용자가 정의한 서버 모니터링 AI 어시스턴트입니다.

사용자의 요구사항에 맞춰 설정된 맞춤형 컨텍스트입니다:
- 특정 업무 환경에 맞는 전문성
- 조직의 용어 및 프로세스 반영
- 특화된 분석 기준 적용
- 맞춤형 응답 스타일

※ 커스텀 컨텍스트 편집은 관리자 페이지에서 가능합니다.`,
      wordCount: 98,
    },
  ];

  const handleContextSelect = (contextId: 'basic' | 'advanced' | 'custom') => {
    setSelectedContext(contextId);
  };

  const getCurrentConfig = () => {
    return (
      contextConfigs.find(c => c.id === selectedContext) || contextConfigs[0]
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900/50 ${className}`}>
      {/* 헤더 */}
      <div className='p-4 border-b border-gray-700/50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center'>
              <Settings className='w-4 h-4 text-white' />
            </div>
            <div>
              <h3 className='text-white font-medium'>컨텍스트 선택</h3>
              <p className='text-gray-400 text-sm'>AI 동작 방식 선택</p>
            </div>
          </div>

          {/* 관리 페이지 링크 */}
          <Link href='/admin' target='_blank'>
            <motion.button
              className='flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                         border border-blue-500/30 rounded-lg text-blue-300 text-xs transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className='w-3 h-3' />
              관리
            </motion.button>
          </Link>
        </div>
      </div>

      {/* 현재 적용 중인 컨텍스트 */}
      <div className='p-4 border-b border-gray-700/30'>
        <div className='flex items-center gap-2 mb-2'>
          <Layers className='w-4 h-4 text-green-400' />
          <span className='text-green-300 text-sm font-medium'>
            현재 적용 중
          </span>
        </div>
        <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-3'>
          <div className='flex items-center gap-2 mb-1'>
            {getCurrentConfig().icon}
            <span className='text-white font-medium'>
              {getCurrentConfig().name}
            </span>
          </div>
          <p className='text-green-200 text-xs'>
            {getCurrentConfig().description}
          </p>
          <div className='text-green-300 text-xs mt-1'>
            단어 수: {getCurrentConfig().wordCount}개
          </div>
        </div>
      </div>

      {/* 컨텍스트 선택 */}
      <div className='p-4 border-b border-gray-700/30'>
        <h4 className='text-white text-sm font-medium mb-3'>
          🎯 컨텍스트 선택
        </h4>
        <div className='space-y-3'>
          {contextConfigs.map(config => (
            <motion.div
              key={config.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedContext === config.id
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-gray-800/50 border-gray-600/30 text-gray-300 hover:bg-gray-700/70'
              }`}
              onClick={() => handleContextSelect(config.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    {config.icon}
                    <span className='font-medium'>{config.name}</span>
                    {selectedContext === config.id && (
                      <Check className='w-4 h-4 text-green-400' />
                    )}
                  </div>
                  <p className='text-sm opacity-80 mb-2'>
                    {config.description}
                  </p>
                  <div className='flex flex-wrap gap-1'>
                    {config.features.map((feature, index) => (
                      <span
                        key={index}
                        className='text-xs px-2 py-1 bg-gray-700/50 rounded-md opacity-70'
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 컨텍스트 미리보기 */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='flex items-center gap-2 mb-3'>
          <FileText className='w-4 h-4 text-blue-400' />
          <span className='text-blue-300 text-sm font-medium'>
            컨텍스트 미리보기
          </span>
        </div>

        <div className='bg-gray-800/30 border border-gray-600/20 rounded-lg p-4'>
          <pre className='text-gray-200 text-sm whitespace-pre-wrap leading-relaxed'>
            {getCurrentConfig().content}
          </pre>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className='p-4 border-t border-gray-700/50'>
        <div className='text-center'>
          <p className='text-gray-400 text-xs'>
            💡 컨텍스트는 AI의 응답 스타일과 전문성을 결정합니다
          </p>
          <p className='text-gray-500 text-xs mt-1'>
            커스텀 컨텍스트 편집은 관리자 페이지에서 가능합니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextSwitchPanel;
