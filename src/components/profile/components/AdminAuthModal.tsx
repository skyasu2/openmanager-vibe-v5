'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, Clock } from 'lucide-react';
import type { AdminAuthProps } from '../types/profile.types';

/**
 * 관리자 인증 모달 컴포넌트
 * 보안 강화된 관리자 비밀번호 입력
 */
export const AdminAuthModal = React.memo(function AdminAuthModal({
  isLocked,
  failedAttempts,
  remainingLockTime,
  isProcessing,
  adminPassword,
  onPasswordChange,
  onSubmit,
  onCancel,
}: AdminAuthProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLocked && !isProcessing && adminPassword) {
      onSubmit();
    }
  };

  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingLockTime / 60);
    const seconds = remainingLockTime % 60;
    return `${minutes}분 ${seconds}초`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className='px-4 py-3 border-t border-gray-100 bg-gray-50'
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* 보안 상태 표시 */}
        {(failedAttempts > 0 || isLocked) && (
          <motion.div
            className={`mb-2 p-2 rounded text-xs flex items-center gap-2 ${
              isLocked
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {isLocked ? (
              <>
                <Lock className='w-3 h-3' />
                <span>잠금됨: {formatRemainingTime()} 남음</span>
              </>
            ) : (
              <>
                <AlertTriangle className='w-3 h-3' />
                <span>실패 {failedAttempts}/5회 (3회 실패 시 5분 잠금)</span>
              </>
            )}
          </motion.div>
        )}

        {/* 비밀번호 입력 필드 */}
        <div className='space-y-2'>
          <label className='text-xs text-gray-600 font-medium block'>
            관리자 비밀번호
          </label>
          <input
            type='password'
            placeholder={isLocked ? '잠금 상태' : '비밀번호 입력'}
            value={adminPassword}
            onChange={e => onPasswordChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none transition-all ${
              isLocked
                ? 'border-red-300 bg-red-50 cursor-not-allowed'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
            disabled={isLocked || isProcessing}
            autoFocus={!isLocked}
            maxLength={4}
            aria-label='관리자 비밀번호'
            aria-invalid={failedAttempts > 0}
            aria-describedby={failedAttempts > 0 ? 'auth-error' : undefined}
          />

          {/* 힌트 텍스트 */}
          {!isLocked && failedAttempts === 0 && (
            <p className='text-xs text-gray-500'>4자리 숫자를 입력하세요</p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className='flex gap-2 mt-3'>
          <motion.button
            onClick={onSubmit}
            disabled={isLocked || isProcessing || !adminPassword}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              isLocked || isProcessing || !adminPassword
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }`}
            whileHover={
              !isLocked && !isProcessing && adminPassword
                ? { scale: 1.02 }
                : undefined
            }
            whileTap={
              !isLocked && !isProcessing && adminPassword
                ? { scale: 0.98 }
                : undefined
            }
          >
            {isProcessing ? (
              <span className='flex items-center justify-center gap-1'>
                <Clock className='w-3 h-3 animate-spin' />
                처리중...
              </span>
            ) : (
              '확인'
            )}
          </motion.button>

          <motion.button
            onClick={onCancel}
            disabled={isProcessing}
            className='flex-1 px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400 disabled:opacity-50 transition-all'
            whileHover={!isProcessing ? { scale: 1.02 } : undefined}
            whileTap={!isProcessing ? { scale: 0.98 } : undefined}
          >
            취소
          </motion.button>
        </div>

        {/* 보안 안내 */}
        <div className='mt-3 pt-3 border-t border-gray-200'>
          <p className='text-xs text-gray-500'>
            🔒 보안을 위해 연속 실패 시 계정이 일시적으로 잠깁니다
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
