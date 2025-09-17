'use client';

import { memo, Fragment, type KeyboardEvent } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { Lock, AlertTriangle, Clock } from 'lucide-react';
import type { AdminAuthProps } from '../types/profile.types';

/**
 * 관리자 인증 모달 컴포넌트
 * 보안 강화된 관리자 비밀번호 입력
 */
export const AdminAuthModal = memo(function AdminAuthModal({
  isLocked,
  failedAttempts,
  remainingLockTime,
  isProcessing,
  adminPassword,
  onPasswordChange,
  onSubmit,
  onCancel,
}: AdminAuthProps) {
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
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
    <Fragment>
      <div
        className="border-t border-gray-100 bg-gray-50 px-4 py-3"
      >
        {/* 보안 상태 표시 */}
        {(failedAttempts > 0 || isLocked) && (
          <div
            className={`mb-2 flex items-center gap-2 rounded p-2 text-xs ${
              isLocked
                ? 'border border-red-200 bg-red-100 text-red-700'
                : 'border border-yellow-200 bg-yellow-100 text-yellow-700'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="h-3 w-3" />
                <span>잠금됨: {formatRemainingTime()} 남음</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                <span>실패 {failedAttempts}/5회 (3회 실패 시 5분 잠금)</span>
              </>
            )}
          </div>
        )}

        {/* 비밀번호 입력 필드 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            관리자 비밀번호
          </label>
          <input
            type="password"
            placeholder={isLocked ? '잠금 상태' : '비밀번호 입력'}
            value={adminPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full rounded-md border px-3 py-2 text-sm transition-all focus:outline-none ${
              isLocked
                ? 'cursor-not-allowed border-red-300 bg-red-50'
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
            disabled={isLocked || isProcessing}
            autoFocus={!isLocked}
            maxLength={4}
            aria-label="관리자 비밀번호"
            aria-invalid={failedAttempts > 0}
            aria-describedby={failedAttempts > 0 ? 'auth-error' : undefined}
          />

          {/* 힌트 텍스트 */}
          {!isLocked && failedAttempts === 0 && (
            <p className="text-xs text-gray-500">4자리 숫자를 입력하세요</p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onSubmit}
            disabled={isLocked || isProcessing || !adminPassword}
            data-testid="admin-auth-confirm-button"
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              isLocked || isProcessing || !adminPassword
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 animate-spin" />
                처리중...
              </span>
            ) : (
              '확인'
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isProcessing}
            data-testid="admin-auth-cancel-button"
            className="flex-1 rounded-md bg-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-400 disabled:opacity-50"
          >
            취소
          </button>
        </div>

        {/* 보안 안내 */}
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            🔒 보안을 위해 연속 실패 시 계정이 일시적으로 잠깁니다
          </p>
        </div>
      </div>
    </Fragment>
  );
});
