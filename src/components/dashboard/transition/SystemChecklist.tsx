/**
 * 🔧 SystemChecklist Component v1.0
 * 
 * 실제 시스템 구성 요소별 체크리스트 UI
 * - 8개 구성 요소의 병렬 진행 표시
 * - 우선순위별 색상 구분
 * - 실시간 체크마크 애니메이션
 * - 의존성 순서 시각화
 */

'use client';

import React from 'react';
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

// 상태별 아이콘 컴포넌트
const StatusIcon: React.FC<{ status: ComponentStatus }> = ({ status }) => {
  switch (status.status) {
    case 'completed':
      return (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <motion.span 
            className="text-white text-sm font-bold"
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
          <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-sm font-bold">✗</span>
        </motion.div>
      );
    default: // pending
      return (
        <div className="w-7 h-7 bg-slate-600 rounded-full border-2 border-slate-500" />
      );
  }
};

// 개별 컴포넌트 행
const ComponentRow: React.FC<{
  component: SystemComponent;
  status: ComponentStatus;
  index: number;
}> = ({ component, status, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-300"
    >
      {/* 상태 아이콘 */}
      <div className="mr-4 flex-shrink-0">
        <StatusIcon status={status} />
      </div>
      
      {/* 컴포넌트 정보 */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">{component.icon}</span>
          <h3 className="text-white font-semibold text-lg truncate">
            {component.name}
          </h3>
          <span className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(component.priority)}`}>
            {component.priority}
          </span>
        </div>
        
        <p className="text-slate-300 text-sm leading-relaxed mb-2">
          {component.description}
        </p>
        
        {/* 의존성 표시 */}
        {component.dependencies && component.dependencies.length > 0 && (
          <div className="text-slate-400 text-xs">
            <span className="mr-2">의존성:</span>
            {component.dependencies.map((dep, i) => (
              <span key={dep} className="text-blue-300">
                {dep}{i < component.dependencies!.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
        
        {/* 진행률 바 (로딩 중일 때만) */}
        {status.status === 'loading' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>진행률</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
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

  if (isCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* 🏢 헤더 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl"
            animate={{ 
              boxShadow: [
                '0 0 30px rgba(59, 130, 246, 0.5)',
                '0 0 50px rgba(139, 92, 246, 0.7)',
                '0 0 30px rgba(59, 130, 246, 0.5)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div 
              className="text-white text-2xl font-bold"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              OM
            </motion.div>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">OpenManager</h1>
          <p className="text-blue-200 text-lg">시스템 구성 요소를 준비하고 있습니다...</p>
        </motion.div>
        
        {/* 📊 전체 진행률 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between text-white mb-3">
            <span className="text-lg font-semibold">전체 진행률</span>
            <span className="text-lg font-mono">{totalProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* 📈 상태 요약 */}
        <motion.div 
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="text-green-400 text-2xl font-bold">{completedCount}</div>
            <div className="text-green-300 text-sm">완료</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-blue-400 text-2xl font-bold">{loadingCount}</div>
            <div className="text-blue-300 text-sm">진행 중</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="text-red-400 text-2xl font-bold">{failedCount}</div>
            <div className="text-red-300 text-sm">실패</div>
          </div>
        </motion.div>
        
        {/* 🔧 시스템 구성 요소 체크리스트 */}
        <motion.div 
          className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">🔧</span>
            시스템 구성 요소
            <span className="ml-3 text-sm font-normal text-slate-400">
              ({completedCount + failedCount}/{componentDefinitions.length})
            </span>
          </h2>
          
          <div className="space-y-4">
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
        
        {/* 🚀 스킵 옵션 (3초 후 표시) */}
        <AnimatePresence>
          {canSkip && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <motion.button
                onClick={onComplete}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl border border-blue-500/30"
                whileHover={{ 
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' 
                }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 대시보드로 바로 이동
              </motion.button>
              
              <div className="mt-4 text-blue-200 text-sm space-y-1">
                <div>또는 키보드 단축키:</div>
                <div className="font-mono text-blue-300">Enter • Space • Escape</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🛠️ 개발자 디버깅 정보 (하단) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 bg-slate-900/70 backdrop-blur-lg text-white text-xs rounded-lg border border-slate-600/50 max-w-md mx-auto"
          >
            <div className="font-semibold text-cyan-400 mb-3">🛠️ 개발자 도구</div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>완료: {completedCount}/{componentDefinitions.length}</div>
              <div>진행률: {totalProgress}%</div>
              <div>로딩 중: {loadingCount}</div>
              <div>실패: {failedCount}</div>
              <div>스킵 가능: {canSkip ? '✅' : '❌'}</div>
              <div>완료 상태: {isCompleted ? '✅' : '❌'}</div>
            </div>
            <div className="border-t border-slate-600/50 pt-3 mt-3 text-yellow-300">
              <div className="mb-1">🚀 강제 완료 방법:</div>
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