'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Shield, LogOut, Bot, AlertCircle, MonitorSpeaker } from 'lucide-react';
import { useSystemStore } from '@/stores/useSystemStore';

export function ProfileButton() {
  const { 
    isAuthenticated, 
    isAIAdminMode, 
    toggleAIAdminMode, 
    logout,
    isBlocked,
    blockUntil,
    failedAttempts
  } = useSystemStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleAIToggle = () => {
    if (isBlocked) {
      return;
    }
    
    if (!isAuthenticated) {
      // 인증되지 않은 사용자가 AI 에이전트 클릭 시 "구현중" 팝업
      setShowComingSoon(true);
      setTimeout(() => setShowComingSoon(false), 2000);
    }
    
    toggleAIAdminMode();
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getBlockTimeLeft = () => {
    if (!isBlocked || !blockUntil) return '';
    const minutes = Math.floor((blockUntil - Date.now()) / (1000 * 60));
    const seconds = Math.floor(((blockUntil - Date.now()) % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {/* 프로필 버튼 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-3 rounded-full border-2 transition-all duration-300
          ${isAIAdminMode 
            ? 'bg-gradient-to-r from-purple-500 to-blue-600 border-purple-400 shadow-purple-500/50 shadow-lg' 
            : isBlocked
            ? 'bg-red-500/20 border-red-400 shadow-red-500/50 shadow-lg'
            : 'bg-white/10 border-white/20 hover:bg-white/20'
          }
        `}
      >
        <User className="w-6 h-6 text-white" />
        
        {/* AI 모드 인디케이터 */}
        {isAIAdminMode && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          />
        )}
        
        {/* 차단 인디케이터 */}
        {isBlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>

      {/* "구현중" 팝업 */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute top-full right-0 mt-2 p-3 bg-yellow-500/90 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2 text-black text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>구현 중입니다</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 드롭다운 메뉴 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50"
          >
            {/* 사용자 정보 */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isAIAdminMode 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600' 
                    : isBlocked
                    ? 'bg-gradient-to-r from-red-500 to-orange-600'
                    : 'bg-white/20'
                  }
                `}>
                  {isAIAdminMode ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : isBlocked ? (
                    <AlertCircle className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {isAuthenticated ? 'AI 관리자' : isBlocked ? '접근 차단' : '사용자'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {isBlocked 
                      ? `${getBlockTimeLeft()} 후 재시도 가능`
                      : isAIAdminMode 
                        ? 'AI 에이전트 모드' 
                        : '모니터링 모드'
                    }
                  </div>
                </div>
              </div>
              
              {/* 차단 경고 */}
              {isBlocked && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-xs">
                    5회 연속 실패로 30분간 차단되었습니다
                  </p>
                </div>
              )}
              
              {/* 실패 횟수 경고 */}
              {!isBlocked && failedAttempts > 0 && (
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-300 text-xs">
                    ⚠️ PIN 실패 {failedAttempts}/5회 - {5 - failedAttempts}회 더 실패 시 차단
                  </p>
                </div>
              )}
            </div>

            {/* 메뉴 아이템들 */}
            <div className="p-2">
              {/* AI 관리자 모드 토글 */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={handleAIToggle}
                disabled={isBlocked}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`
                  p-2 rounded-lg
                  ${isAIAdminMode 
                    ? 'bg-green-500/20 text-green-400' 
                    : isBlocked
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-purple-500/20 text-purple-400'
                  }
                `}>
                  {isAIAdminMode ? (
                    <MonitorSpeaker className="w-4 h-4" />
                  ) : isBlocked ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {isBlocked 
                      ? '접근 차단됨'
                      : isAIAdminMode 
                        ? '모니터링 모드로 전환' 
                        : isAuthenticated
                          ? 'AI 에이전트 활성화'
                          : 'AI 관리자 모드'
                    }
                  </div>
                  <div className="text-gray-400 text-xs">
                    {isBlocked
                      ? '차단 시간이 끝날 때까지 대기'
                      : isAIAdminMode 
                        ? '기본 서버 모니터링으로 전환' 
                        : isAuthenticated
                          ? 'AI 에이전트 시스템 시작'
                          : 'PIN 인증이 필요합니다'
                    }
                  </div>
                </div>
              </motion.button>

              {/* 로그아웃 (인증된 경우만) */}
              {isAuthenticated && !isBlocked && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                >
                  <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-medium">로그아웃</div>
                    <div className="text-gray-400 text-xs">
                      AI 관리자 인증 해제
                    </div>
                  </div>
                </motion.button>
              )}

              {/* 설정 */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
              >
                <div className="p-2 rounded-lg bg-gray-500/20 text-gray-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-medium">설정</div>
                  <div className="text-gray-400 text-xs">
                    시스템 환경설정
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 클릭 외부 영역 감지 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 