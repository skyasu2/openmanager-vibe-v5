/**
 * 🤖 AI 설정 탭 컴포넌트
 *
 * AI 에이전트 관련 설정을 관리하는 탭
 */

'use client';

import { motion } from 'framer-motion';
import { Bot, Check, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AuthenticationState } from '../types/ProfileTypes';

interface AISettingsTabProps {
  authState: AuthenticationState;
  aiPassword: string;
  setAiPassword: (password: string) => void;
  onAuthentication: (quickPassword?: string) => Promise<void>;
  onAIOptimization: () => Promise<void>;
  onSystemDiagnosis: () => Promise<void>;
}

export function AISettingsTab({
  authState,
  aiPassword,
  setAiPassword,
  onAuthentication,
  onAIOptimization,
  onSystemDiagnosis,
}: AISettingsTabProps) {
  const { adminMode } = useUnifiedAdminStore();
  const isAdminAuthenticated = adminMode.isAuthenticated;

  return (
    <div className='space-y-6'>
      <div className='border border-white/10 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          <Bot className='w-5 h-5 text-purple-400' />
          AI 에이전트 상태
        </h3>

        <div className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
              <p className='text-xs text-gray-400 mb-1'>AI 상태</p>
              <p className='text-sm font-medium text-white'>활성화</p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div
                className={`w-3 h-3 rounded-full mx-auto mb-2 ${isAdminAuthenticated ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
              />
              <p className='text-xs text-gray-400 mb-1'>관리자 인증</p>
              <p className='text-sm font-medium text-white'>
                {isAdminAuthenticated ? '인증됨' : '인증 필요'}
              </p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
              <p className='text-xs text-gray-400 mb-1'>시스템 상태</p>
              <p className='text-sm font-medium text-white'>정상</p>
            </div>
          </div>

          {/* 관리자 인증 상태에 따른 UI 분기 */}
          {isAdminAuthenticated ? (
            <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
              <div className='flex items-center gap-3 mb-3'>
                <Check className='w-4 h-4 text-green-400' />
                <span className='text-sm font-medium text-green-300'>
                  관리자 권한 활성화
                </span>
              </div>
              <div className='grid grid-cols-1 gap-3'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAIOptimization}
                  className='px-4 py-3 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm border border-purple-500/30'
                >
                  <div className='flex flex-col items-center gap-1'>
                    <span className='font-semibold'>🤖 AI 최적화</span>
                    <span className='text-xs text-purple-200'>
                      AI 엔진 성능을 분석하고 메모리/CPU 사용량을 최적화합니다
                    </span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSystemDiagnosis}
                  className='px-4 py-3 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm border border-blue-500/30'
                >
                  <div className='flex flex-col items-center gap-1'>
                    <span className='font-semibold'>🔍 상태 진단</span>
                    <span className='text-xs text-blue-200'>
                      전체 시스템의 상태를 점검하고 이상 여부를 진단합니다
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className='bg-orange-500/10 border border-orange-500/30 rounded-lg p-4'>
              <div className='flex items-center gap-3 mb-4'>
                <Lock className='w-4 h-4 text-orange-400' />
                <span className='text-sm font-medium text-orange-300'>
                  AI 관리자 인증 필요
                </span>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    관리자 PIN (4자리)
                  </label>
                  <div className='relative'>
                    <input
                      type={authState.showPassword ? 'text' : 'password'}
                      value={aiPassword}
                      onChange={(e) => setAiPassword(e.target.value)}
                      placeholder='관리자 PIN 입력'
                      maxLength={4}
                      className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12'
                      disabled={authState.isAuthenticating || authState.isLocked}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && aiPassword.length === 4) {
                          onAuthentication();
                        }
                      }}
                    />
                    <button
                      type='button'
                      onClick={() => setAiPassword('')}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                      disabled={authState.isAuthenticating}
                    >
                      {authState.showPassword ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAuthentication()}
                  disabled={
                    authState.isAuthenticating ||
                    authState.isLocked ||
                    aiPassword.length !== 4
                  }
                  className='w-full px-4 py-3 bg-orange-500/20 text-orange-300 rounded-lg font-medium hover:bg-orange-500/30 transition-colors text-sm border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {authState.isAuthenticating ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      인증 중...
                    </>
                  ) : (
                    <>
                      <Lock className='w-4 h-4' />
                      AI 관리자 인증
                    </>
                  )}
                </motion.button>

                {authState.isLocked && (
                  <div className='text-center text-red-400 text-sm'>
                    🔒 5번 틀려서 잠겼습니다. 잠시 후 다시 시도해주세요.
                  </div>
                )}

                <div className='text-center text-gray-400 text-xs'>
                  AI 관리자 페이지 접근을 위해 PIN 인증이 필요합니다.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
