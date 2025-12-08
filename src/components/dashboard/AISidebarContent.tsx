'use client';

/**
 * 🤖 AI 사이드바 Content
 * 사이드바 모드에서는 "채팅"에 집중된 AIWorkspace를 직접 렌더링합니다.
 * (상태는 Global Store를 통해 전체 페이지와 공유됨)
 */

import AIWorkspace from '@/components/ai/AIWorkspace';

interface AISidebarContentProps {
  onClose?: () => void;
}

export default function AISidebarContent({ onClose }: AISidebarContentProps) {
  return (
    <div className="h-full w-full">
      <AIWorkspace mode="sidebar" onClose={onClose} />
    </div>
  );
}
