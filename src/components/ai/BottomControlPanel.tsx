'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings, History, FileText, AlertCircle } from 'lucide-react';
import AdvancedAnalysisPanel from './panels/AdvancedAnalysisPanel';
import ConversationHistory from './panels/ConversationHistory';

interface ControlButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  component?: React.ComponentType;
  implemented: boolean;
}

interface BottomControlPanelProps {
  onExpand: (height: number) => void;
  isExpanded: boolean;
}

export default function BottomControlPanel({ onExpand, isExpanded }: BottomControlPanelProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const controls: ControlButton[] = [
    {
      id: 'analysis',
      icon: <Sparkles className="w-4 h-4" />,
      label: '고급 분석',
      component: AdvancedAnalysisPanel,
      implemented: true
    },
    {
      id: 'history',
      icon: <History className="w-4 h-4" />,
      label: '대화 기록',
      component: ConversationHistory,
      implemented: true
    },
    {
      id: 'reports',
      icon: <FileText className="w-4 h-4" />,
      label: '보고서',
      component: undefined,
      implemented: false
    },
    {
      id: 'settings',
      icon: <Settings className="w-4 h-4" />,
      label: 'AI 설정',
      component: undefined,
      implemented: false
    }
  ];

  const handleButtonClick = (control: ControlButton) => {
    if (!control.implemented) {
      alert('이 기능은 현재 개발 중입니다.');
      return;
    }

    if (activePanel === control.id) {
      setActivePanel(null);
      onExpand(40); // 기본 높이로
    } else {
      setActivePanel(control.id);
      onExpand(70); // 확장 높이
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 버튼 그룹 */}
      <div className="p-3 flex gap-2 flex-wrap border-b bg-gray-50">
        {controls.map((control) => (
          <motion.button
            key={control.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleButtonClick(control)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
              ${activePanel === control.id 
                ? 'bg-purple-500 text-white shadow-md' 
                : 'bg-white border hover:bg-purple-50 hover:border-purple-200'
              }
              ${!control.implemented ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm'}
            `}
          >
            {control.icon}
            <span>{control.label}</span>
            {!control.implemented && (
              <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                준비중
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* 활성 패널 콘텐츠 */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 overflow-y-auto bg-white"
          >
            {(() => {
              const control = controls.find(c => c.id === activePanel);
              if (control?.component) {
                const Component = control.component;
                return (
                  <div className="p-4">
                    <Component />
                  </div>
                );
              }
              return (
                <div className="p-4 text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>이 기능은 현재 개발 중입니다.</p>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상태 표시 */}
      {!activePanel && (
        <div className="p-3 text-center text-gray-500">
          <p className="text-xs">위 버튼을 클릭하여 추가 기능을 사용하세요</p>
        </div>
      )}
    </div>
  );
} 