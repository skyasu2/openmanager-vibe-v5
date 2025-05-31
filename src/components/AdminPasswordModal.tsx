'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Lock, Shield } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => { success: boolean; message: string; remainingTime?: number };
  isLocked: boolean;
  attempts: number;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLocked,
  attempts
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('error');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 백드롭 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 모달 */}
          <motion.div
            className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">AI 관리자 모드</h2>
                    <p className="text-sm text-gray-400">관리자 인증이 필요합니다</p>
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
              {/* 설명 */}
              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-300 font-medium mb-1">관리자 모드 활성화</p>
                    <p className="text-blue-200/80">
                      AI 에이전트 기능을 사용하려면 관리자 모드를 활성화해야 합니다.
                      <br />일반 모드에서는 서버 모니터링 기능만 사용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 입력 폼 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    관리자 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLocked || isSubmitting}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked || isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 시도 횟수 표시 */}
                {attempts > 0 && !isLocked && (
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
                    disabled={isLocked || isSubmitting || !password.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '인증 중...' : isLocked ? '잠김' : '인증'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 