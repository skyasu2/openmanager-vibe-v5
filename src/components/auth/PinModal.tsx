'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Shield, AlertTriangle, Clock } from 'lucide-react';
import { useSystemStore } from '@/stores/useSystemStore';

export function PinModal() {
  const { 
    showPinModal, 
    hidePinDialog, 
    authenticate, 
    failedAttempts,
    isBlocked,
    blockUntil,
    checkBlockStatus
  } = useSystemStore();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  // 차단 시간 카운트다운
  useEffect(() => {
    if (isBlocked && blockUntil) {
      const interval = setInterval(() => {
        const timeLeft = Math.max(0, blockUntil - Date.now());
        setBlockTimeLeft(timeLeft);
        
        if (timeLeft === 0) {
          checkBlockStatus();
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isBlocked, blockUntil, checkBlockStatus]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePinInput = (digit: string) => {
    if (isBlocked) return;
    
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      // 4자리 완성 시 자동 인증
      if (newPin.length === 4) {
        setTimeout(() => {
          if (authenticate(newPin)) {
            setPin('');
          } else {
            if (failedAttempts >= 4) {
              setError('5회 실패로 30분간 차단됩니다');
            } else {
              setError(`잘못된 PIN입니다 (${failedAttempts + 1}/5)`);
            }
            setPin('');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
          }
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    if (isBlocked) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClose = () => {
    setPin('');
    setError('');
    hidePinDialog();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    
    if (showPinModal) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showPinModal]);

  return (
    <AnimatePresence>
      {showPinModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: isShaking ? [1, 1.05, 0.95, 1] : 1, 
              opacity: 1 
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              scale: isShaking ? { duration: 0.5 } : { duration: 0.3 }
            }}
            className="relative bg-gradient-to-br from-slate-900 to-purple-900 p-8 rounded-2xl border border-white/20 shadow-2xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className={`
                inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                ${isBlocked 
                  ? 'bg-gradient-to-br from-red-500 to-orange-600' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }
              `}>
                {isBlocked ? (
                  <AlertTriangle className="w-8 h-8 text-white" />
                ) : (
                  <Shield className="w-8 h-8 text-white" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {isBlocked ? '접근 차단' : 'AI 관리자 인증'}
              </h2>
              
              <p className="text-gray-300 text-sm">
                {isBlocked 
                  ? `${formatTime(blockTimeLeft)} 후 재시도 가능`
                  : '4자리 PIN을 입력하세요'
                }
              </p>
            </div>

            {/* 차단 상태 */}
            {isBlocked ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-300 text-sm">
                    5회 연속 실패로 일시적으로 차단되었습니다
                  </p>
                  <p className="text-red-200 font-mono text-lg mt-2">
                    {formatTime(blockTimeLeft)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* PIN 입력 표시 */}
                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3].map((index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center
                        ${pin.length > index 
                          ? 'border-blue-500 bg-blue-500/20' 
                          : 'border-white/30 bg-white/5'
                        }
                      `}
                    >
                      {pin.length > index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 bg-blue-400 rounded-full"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* 실패 횟수 표시 */}
                {failedAttempts > 0 && (
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 text-sm">
                        실패 {failedAttempts}/5회
                      </span>
                    </div>
                  </div>
                )}

                {/* 오류 메시지 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-red-400 text-sm mb-4"
                  >
                    {error}
                  </motion.div>
                )}

                {/* 숫자 키패드 */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <motion.button
                      key={digit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePinInput(digit.toString())}
                      className="w-full h-12 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all disabled:opacity-50"
                      disabled={isBlocked}
                    >
                      {digit}
                    </motion.button>
                  ))}
                  
                  {/* 0과 백스페이스 */}
                  <div></div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePinInput('0')}
                    className="w-full h-12 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all disabled:opacity-50"
                    disabled={isBlocked}
                  >
                    0
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackspace}
                    className="w-full h-12 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all disabled:opacity-50"
                    disabled={pin.length === 0 || isBlocked}
                  >
                    ⌫
                  </motion.button>
                </div>

                {/* 힌트 */}
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    AI 에이전트 기능을 사용하려면 관리자 인증이 필요합니다
                  </p>
                  {failedAttempts >= 3 && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ 5회 실패 시 30분간 차단됩니다
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 