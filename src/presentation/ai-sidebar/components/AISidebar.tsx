/**
 * 🎨 AI Sidebar Presentation Component v2.0 - 도메인 분리 아키텍처
 *
 * ✅ CSS 타이핑 효과 적용 (Vercel 안정형)
 * ✅ 도메인 주도 설계(DDD) 적용
 * ✅ 비즈니스 로직과 UI 로직 완전 분리
 * ✅ 성능 최적화 및 메모리 효율성
 * ✅ 타입 안전성 보장
 */

'use client';

import React from 'react';
import { AISidebarV2 } from '@/domains/ai-sidebar/components/AISidebarV2';

// 빠른 질문 템플릿
const QUICK_QUESTIONS = [
  '서버 상태는 어떤가요?',
  '시스템 로그 수집',
  '데이터 패턴 분석',
  'AI가 생각하고 있습니다...',
];

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * 🎨 AI 사이드바 래퍼 컴포넌트
 *
 * 기존 인터페이스 호환성을 유지하면서 새로운 도메인 분리 아키텍처 적용
 */
export default function AISidebar({
  isOpen,
  onClose,
  className = '',
}: AISidebarProps) {
  return (
    <AISidebarV2 isOpen={isOpen} onClose={onClose} className={className} />
  );
}
