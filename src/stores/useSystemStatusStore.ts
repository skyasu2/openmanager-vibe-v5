import { create } from 'zustand';

/**
 * 시스템 상태 관리 스토어
 *
 * @description
 * - Props Drilling 문제 해결을 위한 중앙 상태 관리
 * - DashboardClient에서 useSystemAutoShutdown 값을 스토어에 동기화
 * - UnifiedProfileHeader가 직접 스토어에서 읽어서 사용
 * - DashboardHeader는 단순 전달 역할 제거
 *
 * @example
 * ```tsx
 * // DashboardClient.tsx
 * const { setActive, setRemainingTime } = useSystemStatusStore();
 * useEffect(() => {
 *   setActive(isSystemActive);
 *   setRemainingTime(systemRemainingTime);
 * }, [isSystemActive, systemRemainingTime]);
 *
 * // UnifiedProfileHeader.tsx
 * const { isActive, remainingTime, stop } = useSystemStatusStore();
 * ```
 */
interface SystemStatusState {
  /** 시스템 활성 상태 */
  isActive: boolean;
  /** 남은 시간 (밀리초) */
  remainingTime: number;
  /** 시스템 종료 핸들러 (DashboardClient의 stopSystem을 저장) */
  stop: (() => void) | null;
  /** 활성 상태 업데이트 */
  setActive: (active: boolean) => void;
  /** 남은 시간 업데이트 */
  setRemainingTime: (time: number) => void;
  /** 종료 핸들러 등록 */
  setStopHandler: (handler: () => void) => void;
}

export const useSystemStatusStore = create<SystemStatusState>((set) => ({
  isActive: true,
  remainingTime: 0,
  stop: null,
  setActive: (active) => set({ isActive: active }),
  setRemainingTime: (time) => set({ remainingTime: time }),
  setStopHandler: (handler) => set({ stop: handler }),
}));
