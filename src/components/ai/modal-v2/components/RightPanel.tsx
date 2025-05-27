'use client';

import { useState } from 'react';
import FunctionCards from './FunctionCards';
import FunctionContent from './FunctionContent';
import HistoryModal from './HistoryModal';
import { FunctionType, HistoryItem } from '../types';

interface RightPanelProps {
  selectedFunction: FunctionType;
  functionData: Record<FunctionType, any>;
  selectFunction: (functionType: FunctionType) => void;
  isMobile: boolean;
  historyItems: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export default function RightPanel({
  selectedFunction,
  functionData,
  selectFunction,
  isMobile,
  historyItems = [],
  onSelectHistoryItem = () => {}
}: RightPanelProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  return (
    <div className={`
      flex flex-col
      ${isMobile ? 'w-full' : 'w-2/5'}
      h-full bg-gray-50
    `}>
      {/* 패널 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-700">AI 기능 패널</h3>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
        >
          <i className="fas fa-history"></i>
          <span>히스토리</span>
        </button>
      </div>
      
      {/* 기능 카드 영역 */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <FunctionCards
          selectedFunction={selectedFunction}
          selectFunction={selectFunction}
          layout="desktop"
        />
      </div>

      {/* 선택된 기능 내용 표시 영역 - 개선된 스크롤 */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain'
      }}>
        <FunctionContent
          functionType={selectedFunction}
          data={functionData[selectedFunction] || []}
        />
      </div>
      
      {/* 히스토리 모달 */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onSelectItem={onSelectHistoryItem}
      />
    </div>
  );
} 