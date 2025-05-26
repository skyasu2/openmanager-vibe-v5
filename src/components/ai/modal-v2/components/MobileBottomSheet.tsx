'use client';

import { useRef, useEffect } from 'react';
import { BottomSheetState, FunctionType } from '../types';
import FunctionCards from './FunctionCards';
import FunctionContent from './FunctionContent';

interface MobileBottomSheetProps {
  state: BottomSheetState;
  setState: (state: BottomSheetState) => void;
  selectedFunction: FunctionType;
  selectFunction: (type: FunctionType) => void;
  functionData: Record<FunctionType, any>;
}

export default function MobileBottomSheet({
  state,
  setState,
  selectedFunction,
  selectFunction,
  functionData
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // 바텀시트 높이 계산
  const getSheetHeight = () => {
    switch (state) {
      case 'hidden':
        return '0px';
      case 'peek':
        return '180px';
      case 'expanded':
        return '70vh';
      default:
        return '0px';
    }
  };
  
  // 드래그 시작 핸들러
  const handleDragStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  
  // 드래그 중 핸들러
  const handleDrag = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // 드래그 거리에 따라 바텀시트 상태 변경
    if (deltaY > 50) {
      // 아래로 드래그
      if (state === 'expanded') {
        setState('peek');
      } else if (state === 'peek') {
        setState('hidden');
      }
      startY.current = currentY.current;
    } else if (deltaY < -50) {
      // 위로 드래그
      if (state === 'hidden') {
        setState('peek');
      } else if (state === 'peek') {
        setState('expanded');
      }
      startY.current = currentY.current;
    }
  };
  
  // 외부 클릭 핸들러
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        if (state === 'peek' || state === 'expanded') {
          setState('hidden');
        }
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [state, setState]);
  
  // 바텀시트가 숨겨진 상태면 플로팅 버튼만 렌더링
  if (state === 'hidden') {
    return (
      <button
        onClick={() => setState('peek')}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white"
      >
        <i className="fas fa-bolt text-xl"></i>
      </button>
    );
  }
  
  return (
    <>
      {/* 오버레이 - expanded 상태일 때만 */}
      {state === 'expanded' && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/30"
          onClick={() => setState('peek')}
        />
      )}
      
      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg transition-all duration-300 ease-in-out"
        style={{ height: getSheetHeight() }}
      >
        {/* 드래그 핸들 */}
        <div 
          className="h-6 w-full flex items-center justify-center cursor-grab"
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* 바텀시트 내용 */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 24px)' }}>
          {/* 기능 카드 */}
          <div className="mb-4">
            <FunctionCards
              selectedFunction={selectedFunction}
              selectFunction={selectFunction}
              layout="mobile"
            />
          </div>
          
          {/* 기능 내용 - expanded 상태일 때만 */}
          {state === 'expanded' && (
            <div className="pt-4 border-t border-gray-200">
              <FunctionContent
                functionType={selectedFunction}
                data={functionData[selectedFunction] || []}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
} 