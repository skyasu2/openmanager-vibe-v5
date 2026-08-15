'use client';

/**
 * 재생성(regenerate) 쿨다운 상태 훅
 *
 * `useAIChatCore`에서 자기완결적인 부수 관심사(타이머 + 남은 시간 계산)만 분리한 훅이다.
 * AI provider 요청 과다를 막기 위해 재생성 직후 고정 시간 동안 재시도를 차단한다.
 * 동작은 분리 이전과 동일하다 — 쿨다운 시작 시 기존 타이머를 대체하고,
 * 만료/세션 초기화/언마운트 시 타이머를 정리한다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const REGENERATE_COOLDOWN_MS = 5_000;

export interface UseRegenerateCooldownReturn {
  /** 쿨다운 만료 시각(epoch ms). 쿨다운이 없으면 0 */
  cooldownUntilMs: number;
  /** 남은 쿨다운 초(올림). 쿨다운이 없으면 0 */
  cooldownSeconds: number;
  startCooldown: () => void;
  clearCooldown: () => void;
}

export function useRegenerateCooldown(): UseRegenerateCooldownReturn {
  const [cooldownUntilMs, setCooldownUntilMs] = useState(0);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remainingMs = Math.max(0, cooldownUntilMs - Date.now());
  const cooldownSeconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;

  const clearCooldown = useCallback(() => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }
    setCooldownUntilMs(0);
  }, []);

  const startCooldown = useCallback(() => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }

    setCooldownUntilMs(Date.now() + REGENERATE_COOLDOWN_MS);
    cooldownTimeoutRef.current = setTimeout(() => {
      cooldownTimeoutRef.current = null;
      setCooldownUntilMs(0);
    }, REGENERATE_COOLDOWN_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  return {
    cooldownUntilMs,
    cooldownSeconds,
    startCooldown,
    clearCooldown,
  };
}
