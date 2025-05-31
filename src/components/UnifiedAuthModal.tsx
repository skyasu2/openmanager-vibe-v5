'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Lock, Shield, AlertTriangle } from 'lucide-react';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => { success: boolean; message: string; remainingTime?: number };
  isLocked: boolean;
  attempts: number;
  lockoutEndTime: number | null;
  clickPosition?: { x: number; y: number };
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLocked,
  attempts,
  lockoutEndTime,
  clickPosition
}) => {
  console.log('🎯 UnifiedAuthModal 렌더링:', { isOpen, isLocked, attempts });
  
  if (isOpen) {
    console.log('✅ UnifiedAuthModal이 열려있음, 백드롭과 모달 렌더링 중');
  }

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('error');
  const [remainingTime, setRemainingTime] = useState(0);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // 클릭 위치 기반 모달 위치 계산
  useEffect(() => {
    if (isOpen && clickPosition) {
      const modalWidth = 400; // 모달 너비
      const modalHeight = 500; // 모달 높이
      const padding = 20; // 화면 가장자리 여백
      
      // 화면 크기 가져오기
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 클릭 위치 기준으로 모달 위치 계산
      let x = clickPosition.x - modalWidth / 2;
      let y = clickPosition.y - modalHeight / 2;
      
      // 화면 경계 확인 및 조정
      if (x < padding) x = padding;
      if (x + modalWidth > screenWidth - padding) x = screenWidth - modalWidth - padding;
      if (y < padding) y = padding;
      if (y + modalHeight > screenHeight - padding) y = screenHeight - modalHeight - padding;
      
      setModalPosition({ x, y });
    } else {
      // 기본값: 화면 중앙
      setModalPosition({ x: 0, y: 0 });
    }
  }, [isOpen, clickPosition]);

  // 잠금 시간 카운트다운
  useEffect(() => {
    if (isLocked && lockoutEndTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, lockoutEndTime - Date.now());
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          setMessage('');
          setRemainingTime(0);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 100);
      return () => clearInterval(interval);
    } else {
      setRemainingTime(0);
    }
  }, [isLocked, lockoutEndTime]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isLocked) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLocked]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isSubmitting || !password.trim()) return;

    setIsSubmitting(true);
    
    try {
      const result = onSubmit(password);
      setMessage(result.message);
      setMessageType(result.success ? 'success' : 'error');

      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setPassword('');
      }
    } catch (error) {
      setMessage('인증 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatRemainingTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${seconds}초`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 백드롭 */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 모달 */}
          <motion.div
            className={`w-full max-w-md bg-gray-900/98 backdrop-blur-xl border border-gray-700/70 rounded-2xl shadow-2xl shadow-black/50 ${
              clickPosition ? 'fixed transform-none' : 'relative'
            }`}
            initial={{ 
              opacity: 0, 
              scale: 0.9, 
              x: clickPosition ? -200 : 0,
              y: clickPosition ? -250 : 0
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: clickPosition ? modalPosition.x - 200 : 0,
              y: clickPosition ? modalPosition.y - 250 : 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9,
              x: clickPosition ? modalPosition.x - 200 : 0,
              y: clickPosition ? modalPosition.y - 250 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={clickPosition ? { 
              left: modalPosition.x, 
              top: modalPosition.y,
              transform: `translate(-50%, -50%)`
            } : {}}
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isLocked 
                      ? 'bg-gradient-to-br from-red-500 to-orange-600' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                  }`}>
                    {isLocked ? <AlertTriangle className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {isLocked ? '계정 잠김' : 'AI 에이전트 모드'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {isLocked ? '접근이 일시적으로 제한되었습니다' : 'AI 에이전트 활성화를 위한 인증'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6">
              {/* 잠금 상태 */}
              {isLocked && (
                <div className="mb-6">
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-red-300 font-medium mb-1">계정이 잠겼습니다</p>
                      <p className="text-red-200/80 mb-2">
                        5번 연속 비밀번호를 틀려서 10분간 잠겼습니다.
                      </p>
                      {remainingTime > 0 && (
                        <p className="text-red-300 font-medium">
                          {formatRemainingTime(remainingTime)} 후 다시 시도할 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 설명 */}
              {!isLocked && (
                <div className="mb-6">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-blue-300 font-medium mb-1">AI 에이전트 모드 활성화</p>
                      <p className="text-blue-200/80">
                        지능형 AI 분석 기능을 사용하려면 AI 에이전트 모드를 활성화해야 합니다.
                        <br />기본 모드에서는 서버 모니터링 기능만 사용할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 입력 폼 */}
              {!isLocked && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      AI 에이전트 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                        placeholder="비밀번호를 입력하세요"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 시도 횟수 표시 */}
                  {attempts > 0 && (
                    <div className="text-xs text-yellow-400">
                      실패 횟수: {attempts}/5 (5번 실패 시 10분 잠금)
                    </div>
                  )}

                  {/* 메시지 */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-sm ${
                        messageType === 'success' 
                          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                          : messageType === 'warning'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                          : 'bg-red-500/20 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {message}
                    </motion.div>
                  )}

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !password.trim()}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>인증 중...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>인증</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 잠금 상태에서는 닫기 버튼만 */}
              {isLocked && (
                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnifiedAuthModal; 