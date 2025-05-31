/**
 * 🎬 SequentialLoader Component v1.0
 * 
 * 순차적 단계별 로딩 시각화 컴포넌트
 * - 5단계 명확한 진행: 시스템 초기화 → 데이터 수집 → AI 엔진 웜업 → 서버 생성 → 최종 준비
 * - 각 단계별 아이콘, 색상, 설명으로 시각적 피드백 강화
 * - 이중 진행률 표시 (전체 + 현재 단계)
 * - 3초 후 스킵 옵션 제공
 * - 부드러운 단계 전환 애니메이션
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSequentialLoadingTime, type LoadingStage } from '../../../hooks/useSequentialLoadingTime';

interface SequentialLoaderProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

// 시간 포맷팅 유틸리티
const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}초`;
};

// 단계별 배경 그라데이션 생성
const getStageBackgroundStyle = (stage: LoadingStage | null) => {
  if (!stage) return {};
  
  return {
    background: `linear-gradient(135deg, 
      var(--stage-color-1, #1e3a8a) 0%, 
      var(--stage-color-2, #3b82f6) 50%, 
      var(--stage-color-3, #6366f1) 100%)`,
    '--stage-color-1': stage.id === 'system-initialization' ? '#1e3a8a' : 
                      stage.id === 'data-collection' ? '#0891b2' :
                      stage.id === 'ai-engine-warmup' ? '#059669' :
                      stage.id === 'server-spawning' ? '#7c3aed' : '#ea580c',
    '--stage-color-2': stage.id === 'system-initialization' ? '#3b82f6' : 
                      stage.id === 'data-collection' ? '#06b6d4' :
                      stage.id === 'ai-engine-warmup' ? '#10b981' :
                      stage.id === 'server-spawning' ? '#8b5cf6' : '#f97316',
    '--stage-color-3': stage.id === 'system-initialization' ? '#6366f1' : 
                      stage.id === 'data-collection' ? '#10b981' :
                      stage.id === 'ai-engine-warmup' ? '#8b5cf6' :
                      stage.id === 'server-spawning' ? '#ec4899' : '#fb923c'
  } as React.CSSProperties;
};

export const SequentialLoader: React.FC<SequentialLoaderProps> = ({ 
  onComplete, 
  skipCondition = false 
}) => {
  const {
    currentStage,
    stageProgress,
    overallProgress,
    stageIndex,
    totalStages,
    elapsedTime,
    estimatedTimeRemaining,
    canSkip,
    isCompleted
  } = useSequentialLoadingTime({ 
    onComplete, 
    skipCondition,
    autoStart: true 
  });

  if (isCompleted || !currentStage) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={getStageBackgroundStyle(currentStage)}
    >
      {/* 🌟 동적 배경 효과 */}
      <div className="absolute inset-0 opacity-20">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-xl"
          style={{ backgroundColor: 'currentColor' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full mix-blend-screen filter blur-xl"
          style={{ backgroundColor: 'currentColor' }}
          animate={{ 
            scale: [1.1, 0.9, 1.1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full mix-blend-screen filter blur-xl"
          style={{ backgroundColor: 'currentColor' }}
          animate={{ 
            scale: [0.9, 1.3, 0.9],
            opacity: [0.4, 0.2, 0.4],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* 🎯 메인 로딩 인터페이스 */}
      <div className="relative z-10 max-w-lg w-full mx-4">
        {/* 🏢 브랜딩 로고 영역 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center shadow-2xl border border-white/20"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(255,255,255,0.3)',
                '0 0 40px rgba(255,255,255,0.5)',
                '0 0 20px rgba(255,255,255,0.3)'
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
          <p className="text-white/80 text-lg font-medium">AI 서버 모니터링 시스템</p>
        </motion.div>

        {/* 🎯 현재 단계 표시 */}
        <motion.div
          key={`stage-${stageIndex}`}
          className="text-center mb-8"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <motion.div 
            className="text-7xl mb-6"
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: currentStage.id === 'ai-engine-warmup' ? [0, 10, -10, 0] : 0
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {currentStage.icon}
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            {currentStage.name}
          </h2>
          <p className="text-white/90 text-lg leading-relaxed px-4">
            {currentStage.description}
          </p>
        </motion.div>

        {/* 📊 이중 진행률 표시 */}
        <div className="space-y-6 mb-8">
          {/* 전체 진행률 */}
          <div>
            <div className="flex justify-between text-white/90 text-sm font-medium mb-3">
              <span>전체 진행률</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-black/20 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/20">
              <motion.div
                className={`h-full bg-gradient-to-r ${currentStage.bgGradient} rounded-full shadow-lg`}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* 현재 단계 진행률 */}
          <div>
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>현재 단계</span>
              <span>{Math.round(stageProgress)}%</span>
            </div>
            <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full shadow-sm"
                style={{ width: `${stageProgress}%` }}
                animate={{ 
                  boxShadow: [
                    '0 0 5px rgba(255,255,255,0.5)',
                    '0 0 15px rgba(255,255,255,0.8)',
                    '0 0 5px rgba(255,255,255,0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>

        {/* 🔢 단계 인디케이터 */}
        <div className="flex justify-center space-x-3 mb-8">
          {Array.from({ length: totalStages }, (_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full border-2 ${
                index < stageIndex 
                  ? 'bg-white border-white shadow-lg' 
                  : index === stageIndex
                  ? 'bg-white/60 border-white shadow-md'
                  : 'bg-transparent border-white/40'
              }`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              whileHover={{ scale: 1.3 }}
            />
          ))}
        </div>

        {/* ⏱️ 시간 정보 및 단계 상태 */}
        <div className="text-center space-y-3 mb-8">
          <div className="text-white/90 text-lg font-medium">
            단계 {stageIndex + 1} / {totalStages}
          </div>
          
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-white/80">
              <span className="block text-white/60">경과 시간</span>
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="text-white/80">
              <span className="block text-white/60">예상 남은 시간</span>
              <span className="font-mono">{formatTime(estimatedTimeRemaining)}</span>
            </div>
          </div>

          {/* 현재 단계별 상세 상태 */}
          <motion.div 
            className="text-white/70 text-sm py-2 px-4 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {currentStage.id === 'system-initialization' && '🔧 시스템 코어 모듈 초기화 중...'}
            {currentStage.id === 'data-collection' && '📊 서버 메트릭 및 상태 정보 수집 중...'}
            {currentStage.id === 'ai-engine-warmup' && '🧠 AI 분석 엔진 가동 및 모델 로딩 중...'}
            {currentStage.id === 'server-spawning' && '🚀 가상 서버 인스턴스 생성 및 배치 중...'}
            {currentStage.id === 'finalization' && '✨ 대시보드 UI 구성 및 최종 점검 중...'}
          </motion.div>
        </div>

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
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white border border-white/30 hover:border-white/50 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                whileHover={{ 
                  boxShadow: '0 0 25px rgba(255,255,255,0.3)' 
                }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 대시보드로 바로 이동
              </motion.button>
              
              <div className="mt-3 text-white/60 text-xs space-y-1">
                <div>또는 키보드 단축키:</div>
                <div className="font-mono">Enter • Space • Escape</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🛠️ 개발자 디버깅 정보 (하단 우측) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-lg text-white text-xs p-3 rounded-lg border border-white/20 max-w-xs">
            <div className="font-semibold text-cyan-400 mb-2">🛠️ 디버깅 정보</div>
            <div className="space-y-1">
              <div>현재 단계: {currentStage.name}</div>
              <div>단계 진행률: {Math.round(stageProgress)}%</div>
              <div>전체 진행률: {Math.round(overallProgress)}%</div>
              <div>스킵 가능: {canSkip ? '✅' : '❌'}</div>
              <div>경과: {formatTime(elapsedTime)}</div>
              <div>남은 시간: {formatTime(estimatedTimeRemaining)}</div>
            </div>
            <div className="border-t border-white/20 pt-2 mt-2 text-yellow-300">
              <div>🚀 강제 완료:</div>
              <div>• Enter/Space/Escape 키</div>
              <div>• emergencyCompleteSequential()</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SequentialLoader; 