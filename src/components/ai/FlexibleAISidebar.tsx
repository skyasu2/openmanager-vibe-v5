'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, MessageSquare, Brain, Sparkles, Settings, History, FileText } from 'lucide-react';
import ChatSection from './ChatSection';
import BottomControlPanel from './BottomControlPanel';

interface FlexibleAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  serverMetrics?: any;
}

export default function FlexibleAISidebar({ isOpen, onClose, serverMetrics }: FlexibleAISidebarProps) {
  const [expandedBottom, setExpandedBottom] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(40); // 40% 기본값
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return null;
  }

  const handleExpand = (height: number) => {
    setBottomHeight(height);
    setExpandedBottom(height > 40);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 투명 오버레이 */}
          <motion.div 
            className="fixed inset-0 bg-transparent z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 메인 사이드바 컨테이너 */}
          <motion.div
            className="fixed top-0 right-0 h-screen bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)] 
                       z-[1000] border-l border-gray-200 w-[600px] max-w-[90vw]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            <div className="relative h-full flex flex-col bg-white shadow-lg">
              {/* 상단 영역 - 동적 높이 */}
              <motion.div 
                className="flex flex-col overflow-hidden"
                animate={{ height: `${100 - bottomHeight}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ChatSection serverMetrics={serverMetrics} onClose={onClose} />
              </motion.div>

              {/* 하단 영역 - 확장 가능 */}
              <motion.div
                className="border-t bg-gray-50"
                animate={{ height: `${bottomHeight}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <BottomControlPanel 
                  onExpand={handleExpand}
                  isExpanded={expandedBottom}
                />
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 