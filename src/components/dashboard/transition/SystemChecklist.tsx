/**
 * 🔧 SystemChecklist Component v1.1
 * 
 * 실제 시스템 구성 요소별 체크리스트 UI
 * - 8개 구성 요소의 병렬 진행 표시
 * - 컴팩트하고 모바일 친화적인 디자인
 * - 완료 후 2초 대기 시간
 * - 실시간 체크마크 애니메이션
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemChecklist, type SystemComponent, type ComponentStatus } from '../../../hooks/useSystemChecklist';

interface SystemChecklistProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

// 우선순위별 색상 매핑
const getPriorityColor = (priority: SystemComponent['priority']) => {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
};

// 상태별 아이콘 컴포넌트 (더 작게)
const StatusIcon: React.FC<{ status: ComponentStatus }> = ({ status }) => {
  switch (status.status) {
    case 'completed':
      return (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <motion.span 
            className="text-white text-xs font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✓
          </motion.span>
        </motion.div>
      );
    case 'loading':
      return (
        <div className="relative">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <motion.div 
            className="absolute inset-0 bg-blue-500/20 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      );
    case 'failed':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-xs font-bold">✗</span>
        </motion.div>
      );
    default: // pending
      return (
        <div className="w-5 h-5 bg-slate-600 rounded-full border-2 border-slate-500" />
      );
  }
};

// 개별 컴포넌트 행 (더 컴팩트)
const ComponentRow: React.FC<{
  component: SystemComponent;
  status: ComponentStatus;
  index: number;
}> = ({ component, status, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center p-3 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-300"
    >
      {/* 상태 아이콘 */}
      <div className="mr-3 flex-shrink-0">
        <StatusIcon status={status} />
      </div>
      
      {/* 컴포넌트 정보 */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center mb-1">
          <span className="text-lg mr-2">{component.icon}</span>
          <h3 className="text-white font-medium text-sm truncate">
            {component.name}
          </h3>
          <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full font-medium ${getPriorityColor(component.priority)}`}>
            {component.priority}
          </span>
        </div>
        
        <p className="text-slate-300 text-xs leading-relaxed mb-1">
          {component.description}
        </p>
        
        {/* 의존성 표시 (컴팩트) */}
        {component.dependencies && component.dependencies.length > 0 && (
          <div className="text-slate-400 text-xs">
            <span className="mr-1">의존성:</span>
            {component.dependencies.map((dep, i) => (
              <span key={dep} className="text-blue-300">
                {dep}{i < component.dependencies!.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
        
        {/* 진행률 바 (더 작게) */}
        {status.status === 'loading' && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>진행률</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        
        {/* 에러 메시지 (실패 시) */}
        {status.status === 'failed' && status.error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs">
            ❌ {status.error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const SystemChecklist: React.FC<SystemChecklistProps> = ({ 
  onComplete, 
  skipCondition = false 
}) => {
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completionStartTime, setCompletionStartTime] = useState<number | null>(null);

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
    onComplete: () => {
      // 완료 시 즉시 콜백하지 않고 2초 대기
      setShowCompletionMessage(true);
      setCompletionStartTime(Date.now());
    }, 
    skipCondition,
    autoStart: true 
  });

  // 완료 후 2초 대기 로직
  useEffect(() => {
    if (showCompletionMessage && completionStartTime) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showCompletionMessage, completionStartTime, onComplete]);

  if (isCompleted && !showCompletionMessage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 🏢 헤더 (더 컴팩트) */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(59, 130, 246, 0.4)',
                '0 0 30px rgba(139, 92, 246, 0.6)',
                '0 0 20px rgba(59, 130, 246, 0.4)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div 
              className="text-white text-xl font-bold"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              OM
            </motion.div>
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">OpenManager</h1>
          <p className="text-blue-200 text-sm md:text-base">시스템 구성 요소를 준비하고 있습니다...</p>
        </motion.div>
        
        {/* 📊 전체 진행률 (컴팩트) */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-white mb-2">
            <span className="text-sm md:text-base font-semibold">전체 진행률</span>
            <span className="text-sm md:text-base font-mono">{totalProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* 📈 상태 요약 (더 작게) */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="text-green-400 text-lg md:text-xl font-bold">{completedCount}</div>
            <div className="text-green-300 text-xs">완료</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="text-blue-400 text-lg md:text-xl font-bold">{loadingCount}</div>
            <div className="text-blue-300 text-xs">진행 중</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <div className="text-red-400 text-lg md:text-xl font-bold">{failedCount}</div>
            <div className="text-red-300 text-xs">실패</div>
          </div>
        </motion.div>
        
        {/* 🔧 시스템 구성 요소 체크리스트 (컴팩트) */}
        <motion.div 
          className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 mb-4 border border-slate-700/50"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🔧</span>
            시스템 구성 요소
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({completedCount + failedCount}/{componentDefinitions.length})
            </span>
          </h2>
          
          <div className="space-y-3">
            {componentDefinitions.map((comp, index) => (
              <ComponentRow
                key={comp.id}
                component={comp}
                status={components[comp.id]}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* 🎉 완료 메시지 (2초 표시) */}
        <AnimatePresence>
          {showCompletionMessage && (
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                <div className="text-green-400 text-xl font-bold mb-2">🎉 시스템 준비 완료!</div>
                <div className="text-green-300 text-sm">모든 핵심 구성 요소가 성공적으로 로드되었습니다</div>
                <div className="text-green-200 text-xs mt-2">대시보드로 이동 중...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 🚀 스킵 옵션 (3초 후 표시) */}
        <AnimatePresence>
          {canSkip && !showCompletionMessage && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <motion.button
                onClick={onComplete}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg border border-blue-500/30"
                whileHover={{ 
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' 
                }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 대시보드로 바로 이동
              </motion.button>
              
              <div className="mt-3 text-blue-200 text-xs space-y-1">
                <div>또는 키보드 단축키:</div>
                <div className="font-mono text-blue-300">Enter • Space • Escape</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🛠️ 개발자 디버깅 정보 (더 작게) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 p-3 bg-slate-900/70 backdrop-blur-lg text-white text-xs rounded-lg border border-slate-600/50 max-w-sm mx-auto"
          >
            <div className="font-semibold text-cyan-400 mb-2">🛠️ 개발자 도구</div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>완료: {completedCount}/{componentDefinitions.length}</div>
              <div>진행률: {totalProgress}%</div>
              <div>로딩 중: {loadingCount}</div>
              <div>실패: {failedCount}</div>
              <div>스킵 가능: {canSkip ? '✅' : '❌'}</div>
              <div>완료 상태: {isCompleted ? '✅' : '❌'}</div>
            </div>
            <div className="border-t border-slate-600/50 pt-2 mt-2 text-yellow-300">
              <div className="mb-1">🚀 강제 완료:</div>
              <div>• Enter/Space/Escape 키</div>
              <div>• emergencyCompleteChecklist()</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SystemChecklist; 