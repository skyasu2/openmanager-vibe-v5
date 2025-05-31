'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

// 추가된 임포트
import UnifiedProfileComponent from '../UnifiedProfileComponent';

/**
 * 서버 통계 인터페이스
 */
interface ServerStats {
  /** 전체 서버 수 */
  total: number;
  /** 온라인 서버 수 */
  online: number;
  /** 경고 상태 서버 수 */
  warning: number;
  /** 오프라인 서버 수 */
  offline: number;
}

/**
 * 대시보드 헤더 컴포넌트 Props
 */
interface DashboardHeaderProps {
  /** 서버 통계 데이터 */
  serverStats: ServerStats;
  /** 홈으로 이동 핸들러 */
  onNavigateHome: () => void;
  /** AI 에이전트 토글 핸들러 */
  onToggleAgent: () => void;
  /** AI 에이전트 열림 상태 */
  isAgentOpen: boolean;
  /** 시스템 상태 표시 컴포넌트 */
  systemStatusDisplay: React.ReactNode;
}

/**
 * 대시보드 메인 헤더 컴포넌트
 * 
 * @description
 * - 브랜드 로고 및 네비게이션
 * - 실시간 서버 통계 표시
 * - AI 에이전트 토글 버튼
 * - 시스템 상태 표시
 * 
 * @example
 * ```tsx
 * <DashboardHeader
 *   serverStats={{ total: 10, online: 8, warning: 1, offline: 1 }}
 *   onNavigateHome={() => router.push('/')}
 *   onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
 *   isAgentOpen={false}
 *   systemStatusDisplay={<SystemStatusDisplay />}
 * />
 * ```
 */
const DashboardHeader = memo(function DashboardHeader({
  serverStats,
  onNavigateHome,
  onToggleAgent,
  isAgentOpen,
  systemStatusDisplay
}: DashboardHeaderProps) {
  const { aiAgent } = useUnifiedAdminStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="홈으로 이동"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-white text-sm" aria-hidden="true"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OpenManager</h1>
              <p className="text-xs text-gray-500">AI 서버 모니터링</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* 시스템 상태 표시 */}
          {systemStatusDisplay}
          
          {/* 빠른 통계 - 실시간 데이터 */}
          <div className="hidden md:flex items-center gap-6" role="status" aria-label="서버 통계">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{serverStats.total}대</div>
              <div className="text-xs text-gray-500">전체 서버</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">{serverStats.online}대</div>
              <div className="text-xs text-gray-500">온라인</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">{serverStats.warning}대</div>
              <div className="text-xs text-gray-500">경고</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-600">{serverStats.offline}대</div>
              <div className="text-xs text-gray-500">오프라인</div>
            </div>
          </div>

          {/* AI 에이전트 토글 버튼 - 프로필 바로 왼쪽에 배치 */}
          <div className="relative">
            {/* 손가락 애니메이션 - AI 비활성화 시에만 표시 */}
            {!aiAgent.isEnabled && (
              <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xl pointer-events-none z-10"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                👆
              </motion.div>
            )}

            <motion.button
              onClick={onToggleAgent}
              className={`
                relative p-3 rounded-xl transition-all duration-300 transform
                ${isAgentOpen || aiAgent.isEnabled
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }
              `}
              title={isAgentOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
              aria-label={isAgentOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
              aria-pressed={isAgentOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* AI 활성화 시 그라데이션 테두리 애니메이션 */}
              {aiAgent.isEnabled && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-75"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #06b6d4, #a855f7)',
                    padding: '2px',
                    borderRadius: '0.75rem',
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl" />
                </motion.div>
              )}

              <div className="relative flex items-center gap-2">
                <motion.div 
                  className={`w-5 h-5 ${isAgentOpen || aiAgent.isEnabled ? 'text-white' : 'text-gray-600'}`}
                  animate={aiAgent.isEnabled ? {
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <Bot className="w-5 h-5" />
                </motion.div>
                <span className="hidden sm:inline text-sm font-medium">
                  {aiAgent.isEnabled ? (
                    <motion.span 
                      className="bg-gradient-to-r from-purple-100 via-pink-100 to-cyan-100 bg-clip-text text-transparent font-bold"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      AI 활성
                    </motion.span>
                  ) : (
                    'AI 에이전트'
                  )}
                </span>
              </div>
              
              {/* 활성화 상태 표시 */}
              {(isAgentOpen || aiAgent.isEnabled) && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  aria-hidden="true"
                />
              )}
            </motion.button>
          </div>

          {/* 프로필 컴포넌트 - 가장 오른쪽에 배치 */}
          <UnifiedProfileComponent userName="사용자" />
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader; 