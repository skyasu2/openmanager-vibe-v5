/**
 * 🔧 SystemChecklist Component v2.0
 * 
 * 미니멀하고 시각적인 시스템 체크리스트
 * - 텍스트 최소화, 아이콘 중심 디자인
 * - 화면 깜박임 방지
 * - 실제 검증 실패 시 대기
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemChecklist, type SystemComponent, type ComponentStatus } from '../../../hooks/useSystemChecklist';

interface SystemChecklistProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

// 컴포넌트 아이콘 매핑 (텍스트 대신 시각적 아이콘)
const getComponentIcon = (name: string) => {
  switch (name) {
    case 'API 서버 연결': return '🌐';
    case '메트릭 데이터베이스': return '📊';
    case 'AI 분석 엔진': return '🧠';
    case 'Prometheus 허브': return '📈';
    case '서버 생성기': return '🖥️';
    case '캐시 시스템': return '⚡';
    case '보안 검증': return '🔒';
    case 'UI 컴포넌트': return '🎨';
    default: return '⚙️';
  }
};

// 상태별 아이콘
const getStatusIcon = (status: ComponentStatus) => {
  if (status.status === 'loading') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
      />
    );
  }
  
  switch (status.status) {
    case 'completed':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      );
    case 'failed':
      return (
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'pending':
      return <div className="w-4 h-4 bg-gray-600 rounded-full opacity-50" />;
    default:
      return <div className="w-4 h-4 bg-gray-600 rounded-full opacity-50" />;
  }
};

// 우선순위별 테두리 색상
const getPriorityBorder = (priority: SystemComponent['priority']) => {
  switch (priority) {
    case 'critical': return 'border-red-500/50';
    case 'high': return 'border-orange-500/50';
    case 'medium': return 'border-yellow-500/50';
    case 'low': return 'border-gray-500/50';
  }
};

export default function SystemChecklist({ onComplete, skipCondition = false }: SystemChecklistProps) {
  const { 
    components, 
    componentDefinitions,
    isCompleted,
    totalProgress,
    completedCount, 
    failedCount,
    loadingCount,
    canSkip
  } = useSystemChecklist({
    onComplete,
    skipCondition,
    autoStart: true
  });
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [shouldProceed, setShouldProceed] = useState(false);

  // 완료 처리 로직 개선
  useEffect(() => {
    if (isCompleted && !showCompleted) {
      setShowCompleted(true);
      
      // 2초 후 완전히 준비된 상태에서만 진행
      const timer = setTimeout(() => {
        // Critical 컴포넌트가 모두 성공했는지 확인
        const criticalComponents = componentDefinitions.filter(c => c.priority === 'critical');
        const allCriticalCompleted = criticalComponents.every(c => {
          const status = components[c.id];
          return status && status.status === 'completed';
        });
        
        if (allCriticalCompleted || skipCondition) {
          setShouldProceed(true);
          setTimeout(() => onComplete(), 300); // 부드러운 전환을 위한 짧은 지연
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isCompleted, showCompleted, skipCondition, onComplete, components, componentDefinitions]);

  // 키보드 단축키 (이미 훅에서 처리되고 있지만 추가 재시도 기능)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        // 재시도 로직 - 실패한 컴포넌트를 다시 시작
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 스킵된 경우 즉시 완료 처리
  if (isCompleted && skipCondition) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 
                    flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: shouldProceed ? 0 : 1, scale: shouldProceed ? 0.9 : 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* 로고 섹션 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r 
                          from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
            <span className="text-2xl font-bold text-white">OM</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">OpenManager</h1>
          <p className="text-sm text-gray-300">시스템 초기화 중...</p>
        </motion.div>

        {/* 전체 진행률 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">전체 진행률</span>
            <span className="text-sm font-bold text-white">{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* 컴팩트한 체크리스트 */}
        <div className="space-y-2">
          {componentDefinitions.map((component, index) => {
            const status = components[component.id];
            if (!status) return null;

            return (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center p-3 rounded-xl border backdrop-blur-sm
                  ${getPriorityBorder(component.priority)}
                  ${status.status === 'completed' ? 'bg-green-500/10' : 
                    status.status === 'failed' ? 'bg-red-500/10' : 
                    status.status === 'loading' ? 'bg-blue-500/10' : 'bg-gray-500/10'}
                  transition-all duration-300
                `}
              >
                {/* 컴포넌트 아이콘 */}
                <span className="text-2xl mr-3">{getComponentIcon(component.name)}</span>
                
                {/* 상태 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">
                      {component.name}
                    </span>
                    {getStatusIcon(status)}
                  </div>
                  
                  {/* 진행률 바 (로딩 중일 때만) */}
                  {status.status === 'loading' && (
                    <div className="w-full bg-gray-600/30 rounded-full h-1 mt-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 상태 정보 */}
        <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-300">완료 {completedCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-300">실패 {failedCount}</span>
          </div>
        </div>

        {/* 에러 시 재시도 버튼 */}
        {failedCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 
                         hover:bg-red-500/30 transition-colors text-sm"
            >
              재시도 (R)
            </button>
          </motion.div>
        )}

        {/* 완료 상태 표시 */}
        <AnimatePresence>
          {showCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center 
                         bg-green-500/20 backdrop-blur-sm rounded-2xl border border-green-500/50"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">시스템 준비 완료!</h3>
                <p className="text-sm text-gray-300">OpenManager를 시작합니다...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 스킵 버튼 (3초 후 표시) */}
        <AnimatePresence>
          {canSkip && !showCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center"
            >
              <button
                onClick={onComplete}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/50 
                           hover:bg-blue-500/30 transition-colors text-sm"
              >
                건너뛰기 (ESC)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 단축키 안내 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>ESC/Space: 건너뛰기 • R: 재시도</p>
        </div>
      </motion.div>
    </div>
  );
} 