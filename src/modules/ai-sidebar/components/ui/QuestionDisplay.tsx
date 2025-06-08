/**
 * ❓ 질문 표시 컴포넌트
 * 
 * Component Composition: 질문 표시 기능을 독립적인 컴포넌트로 분리
 * Single Responsibility: 질문 렌더링만 담당
 */

'use client';

import React from 'react';
import { QuestionDisplayProps } from '../types/AIResponseTypes';

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
}) => {
  return (
    <div className='bg-blue-50 p-4 rounded-lg mb-4'>
      <div className='flex items-start gap-3'>
        <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
          <span className='text-white text-sm font-medium'>Q</span>
        </div>
        <div className='flex-1'>
          <p className='text-blue-900 font-medium mb-1'>질문</p>
          <p className='text-blue-700 text-sm'>
            {(question && typeof question === 'string' && question.trim()) ||
              '질문 정보 없음'}
          </p>
        </div>
      </div>
    </div>
  );
}; 