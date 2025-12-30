/**
 * 🎨 서버 상태별 테마 설정
 *
 * 상태에 따른 그라데이션, 색상, 아이콘 반환
 *
 * @refactored 2025-12-30 - EnhancedServerCard.tsx에서 분리
 */

import type { ServerStatus as CommonServerStatus } from '@/types/server';

export interface StatusTheme {
  gradient: string;
  border: string;
  hoverBorder: string;
  statusBg: string;
  statusText: string;
  statusIcon: string;
  label: string;
  glow: string;
  accent: string;
  iconBg: string;
  pulse: string;
}

/**
 * 서버 상태에 따른 테마 반환
 * ServerStatus: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown'
 */
export function getStatusTheme(status: CommonServerStatus): StatusTheme {
  switch (status) {
    case 'online':
      return {
        gradient: 'from-emerald-50/80 via-green-50/60 to-teal-50/40',
        border: 'border-emerald-200/60',
        hoverBorder: 'hover:border-emerald-300/80',
        statusBg: 'bg-emerald-100/80',
        statusText: 'text-emerald-800',
        statusIcon: '✅',
        label: '정상',
        glow: 'shadow-emerald-100/50',
        accent: 'text-emerald-600',
        iconBg: 'bg-emerald-100/90',
        pulse: 'bg-emerald-400',
      };
    case 'warning':
      return {
        gradient: 'from-amber-50/80 via-yellow-50/60 to-orange-50/40',
        border: 'border-amber-200/60',
        hoverBorder: 'hover:border-amber-300/80',
        statusBg: 'bg-amber-100/80',
        statusText: 'text-amber-800',
        statusIcon: '⚠️',
        label: '경고',
        glow: 'shadow-amber-100/50',
        accent: 'text-amber-600',
        iconBg: 'bg-amber-100/90',
        pulse: 'bg-amber-400',
      };
    case 'critical':
      return {
        gradient: 'from-rose-50/80 via-red-50/60 to-pink-50/40',
        border: 'border-rose-200/60',
        hoverBorder: 'hover:border-rose-300/80',
        statusBg: 'bg-rose-100/80',
        statusText: 'text-rose-800',
        statusIcon: '🚨',
        label: '위험',
        glow: 'shadow-rose-100/50',
        accent: 'text-rose-600',
        iconBg: 'bg-rose-100/90',
        pulse: 'bg-rose-400',
      };
    case 'maintenance':
      return {
        gradient: 'from-indigo-50/80 via-blue-50/60 to-cyan-50/40',
        border: 'border-indigo-200/60',
        hoverBorder: 'hover:border-indigo-300/80',
        statusBg: 'bg-indigo-100/80',
        statusText: 'text-indigo-800',
        statusIcon: '🔧',
        label: '유지보수',
        glow: 'shadow-indigo-100/50',
        accent: 'text-indigo-600',
        iconBg: 'bg-indigo-100/90',
        pulse: 'bg-indigo-400',
      };
    case 'offline':
      return {
        gradient: 'from-slate-50/80 via-gray-50/60 to-zinc-50/40',
        border: 'border-slate-200/60',
        hoverBorder: 'hover:border-slate-300/80',
        statusBg: 'bg-slate-100/80',
        statusText: 'text-slate-700',
        statusIcon: '⚪',
        label: '오프라인',
        glow: 'shadow-slate-100/50',
        accent: 'text-slate-600',
        iconBg: 'bg-slate-100/90',
        pulse: 'bg-slate-400',
      };
    default:
      // Handles: 'unknown', 'offline' fallback, and any unexpected status
      return {
        gradient: 'from-violet-50/80 via-purple-50/60 to-fuchsia-50/40',
        border: 'border-violet-200/60',
        hoverBorder: 'hover:border-violet-300/80',
        statusBg: 'bg-violet-100/80',
        statusText: 'text-violet-700',
        statusIcon: '❔',
        label: '알 수 없음',
        glow: 'shadow-violet-100/50',
        accent: 'text-violet-600',
        iconBg: 'bg-violet-100/90',
        pulse: 'bg-violet-400',
      };
  }
}

export default getStatusTheme;
