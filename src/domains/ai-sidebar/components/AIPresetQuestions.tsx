/**
 * 🎯 AI 프리셋 질문 컴포넌트 v2.0 - PresetChips 통합
 */

'use client';

import React, { type FC, useMemo } from 'react';
import { PresetChips, type PresetChip } from '../../../components/ui/PresetChips';

// Icons - PresetChips에서 사용
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  FileText,
  Globe,
  HardDrive,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: LucideIcon;
  color: string;
}

interface AIPresetQuestionsProps {
  onQuestionSelect: (question: string) => void;
  currentPage: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

// 프리셋 질문 목록 - PresetChip 형식으로 확장
const PRESET_QUESTIONS: PresetChip[] = [
  {
    id: '1',
    text: '현재 서버 상태는 어떤가요?',
    category: '상태 확인',
    icon: Cpu,
    color: 'bg-blue-500',
    keywords: ['서버', '상태', '현황', '모니터링'],
  },
  {
    id: '2',
    text: 'CPU 사용률이 높은 서버를 찾아주세요',
    category: '성능 분석',
    icon: Zap,
    color: 'bg-red-500',
    keywords: ['cpu', '사용률', '높은', '성능', '부하'],
  },
  {
    id: '3',
    text: '메모리 부족 경고가 있나요?',
    category: '리소스 모니터링',
    icon: Brain,
    color: 'bg-yellow-500',
    keywords: ['메모리', '램', 'ram', '부족', '경고'],
  },
  {
    id: '4',
    text: '네트워크 지연이 발생하고 있나요?',
    category: '네트워크 진단',
    icon: Globe,
    color: 'bg-green-500',
    keywords: ['네트워크', '지연', '레이턴시', '연결', '통신'],
  },
  {
    id: '5',
    text: '최근 에러 로그를 분석해주세요',
    category: '로그 분석',
    icon: FileText,
    color: 'bg-purple-500',
    keywords: ['로그', '에러', '오류', '분석', '문제'],
  },
  {
    id: '6',
    text: '시스템 최적화 방안을 제안해주세요',
    category: '최적화',
    icon: Sparkles,
    color: 'bg-pink-500',
    keywords: ['최적화', '개선', '튜닝', '성능향상'],
  },
  {
    id: '7',
    text: '디스크 사용량이 임계치에 도달했나요?',
    category: '스토리지',
    icon: HardDrive,
    color: 'bg-indigo-500',
    keywords: ['디스크', '스토리지', '용량', '임계치', '공간'],
  },
  {
    id: '8',
    text: '데이터베이스 연결 상태를 확인해주세요',
    category: '데이터베이스',
    icon: Database,
    color: 'bg-teal-500',
    keywords: ['데이터베이스', 'db', '연결', '커넥션', '상태'],
  },
];

const PRESETS_PER_PAGE = 2; // UI 간소화를 위해 2개씩 표시
const DEFAULT_VISIBLE_PRESETS = 2;

export const AIPresetQuestions: FC<AIPresetQuestionsProps> = ({
  onQuestionSelect,
  currentPage,
  onPageChange,
  className = '',
}) => {
  // PresetChips 사용으로 페이지 관리 로직 간소화
  const presetChips = useMemo(() => PRESET_QUESTIONS, []);

  return (
    <div className={`border-t border-gray-200 bg-white p-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">💡 빠른 질문</h4>
        <span className="text-xs text-gray-500">
          검색 또는 클릭으로 선택
        </span>
      </div>

      {/* PresetChips 통합 */}
      <PresetChips
        presets={presetChips}
        onChipSelect={onQuestionSelect}
        maxVisible={4}
        showSearch={true}
        showCategories={false}
        className="min-h-[120px]"
      />
    </div>
  );
};
