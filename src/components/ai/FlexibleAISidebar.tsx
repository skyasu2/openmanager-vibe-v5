'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, MessageSquare, Brain, Sparkles, Settings, History, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatSection from './ChatSection';

interface FlexibleAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  serverMetrics?: any;
}

interface QuickActionButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}

export default function FlexibleAISidebar({ isOpen, onClose, serverMetrics }: FlexibleAISidebarProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return null;
  }

  const quickActions: QuickActionButton[] = [
    {
      id: 'analysis',
      icon: <Sparkles className="w-4 h-4" />,
      label: '고급 분석',
      path: '/admin/ai-analysis',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'history',
      icon: <History className="w-4 h-4" />,
      label: '대화 기록',
      path: '/admin/ai-agent',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'reports',
      icon: <FileText className="w-4 h-4" />,
      label: '보고서',
      path: '/admin/charts',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'servers',
      icon: <Brain className="w-4 h-4" />,
      label: '가상 서버',
      path: '/admin/virtual-servers',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const handleQuickAction = (action: QuickActionButton) => {
    router.push(action.path);
    onClose(); // 사이드바 닫기
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 투명 오버레이 */}
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-20 z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 메인 사이드바 컨테이너 */}
          <motion.div
            className="fixed top-0 right-0 h-screen bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] 
                       z-[1000] border-l border-gray-200 w-[600px] max-w-[90vw]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            <div className="relative h-full flex flex-col bg-white">
              {/* 메인 채팅 영역 */}
              <div className="flex-1 overflow-hidden">
                <ChatSection serverMetrics={serverMetrics} onClose={onClose} />
              </div>

              {/* 하단 빠른 액션 버튼들 */}
              <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">빠른 액션</h3>
                  <span className="text-xs text-gray-500">페이지로 이동</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAction(action)}
                      className={`
                        ${action.color} text-white p-3 rounded-lg 
                        shadow-sm transition-all duration-200
                        flex items-center gap-2 text-sm font-medium
                        hover:shadow-md
                      `}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-400">
                    💡 각 버튼을 클릭하면 전용 페이지로 이동합니다
                  </p>
                </div>
              </div>
            </div>

            {/* 오른쪽 모서리 빠른 액션 버튼들 */}
            <div className="absolute right-[-60px] top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
              {quickActions.map((action, index) => (
                <motion.button
                  key={`quick-${action.id}`}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuickAction(action)}
                  className={`
                    ${action.color} text-white p-2 rounded-full 
                    shadow-lg hover:shadow-xl transition-all duration-200
                    w-10 h-10 flex items-center justify-center
                  `}
                  title={action.label}
                >
                  {action.icon}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 