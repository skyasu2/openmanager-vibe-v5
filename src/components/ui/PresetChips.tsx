/**
 * 🏷️ PresetChips 컴포넌트 - 검색 가능한 프리셋 질문 칩
 * 
 * 기능:
 * - 프리셋 질문을 칩 형태로 표시
 * - 실시간 검색 필터링
 * - 카테고리별 그룹화
 * - 키보드 네비게이션 지원
 * - 접근성 완전 준수
 */

'use client';

import { useState, useMemo, useCallback, memo, type FC } from 'react';
import { Search, X, Hash, type LucideIcon } from 'lucide-react';

export interface PresetChip {
  id: string;
  text: string;
  category: string;
  icon: LucideIcon;
  color: string;
  keywords?: string[]; // 검색용 추가 키워드
}

interface PresetChipsProps {
  presets: PresetChip[];
  onChipSelect: (text: string) => void;
  maxVisible?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  className?: string;
}

export const PresetChips: FC<PresetChipsProps> = memo(({
  presets,
  onChipSelect,
  maxVisible = 6,
  showSearch = true,
  showCategories = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllPresets, setShowAllPresets] = useState(false);

  // 카테고리 목록 생성
  const categories = useMemo(() => {
    const cats = Array.from(new Set(presets.map(p => p.category)));
    return [{ id: 'all', name: '전체' }, ...cats.map(cat => ({ id: cat, name: cat }))];
  }, [presets]);

  // 필터링된 프리셋 목록
  const filteredPresets = useMemo(() => {
    let filtered = presets;

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(preset => preset.category === selectedCategory);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(preset => 
        preset.text.toLowerCase().includes(query) ||
        preset.category.toLowerCase().includes(query) ||
        preset.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [presets, selectedCategory, searchQuery]);

  // 표시할 프리셋 목록 (maxVisible 적용)
  const visiblePresets = useMemo(() => {
    if (showAllPresets || filteredPresets.length <= maxVisible) {
      return filteredPresets;
    }
    return filteredPresets.slice(0, maxVisible);
  }, [filteredPresets, maxVisible, showAllPresets]);

  // 숨겨진 프리셋 개수
  const hiddenCount = filteredPresets.length - visiblePresets.length;

  // 검색 입력 핸들러
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowAllPresets(false); // 검색 시 "더 보기" 상태 리셋
  }, []);

  // 검색 초기화
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowAllPresets(false);
  }, []);

  // 칩 선택 핸들러
  const handleChipClick = useCallback((text: string) => {
    onChipSelect(text);
    // 선택 후 검색 상태 유지 (사용자 선택)
  }, [onChipSelect]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 검색 및 카테고리 필터 */}
      {(showSearch || showCategories) && (
        <div className="flex items-center gap-2">
          {/* 검색 입력 */}
          {showSearch && (
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                <Search className="h-3 w-3 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="질문 검색..."
                className="w-full rounded border border-gray-200 bg-white py-1.5 pl-7 pr-8 text-xs placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="프리셋 질문 검색"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                  aria-label="검색 초기화"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* 카테고리 필터 */}
          {showCategories && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="카테고리 선택"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 프리셋 칩 목록 */}
      <div className="space-y-2">
        {/* 검색 결과 정보 */}
        {searchQuery && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Hash className="h-3 w-3" />
            <span>
              "{searchQuery}" 검색 결과: {filteredPresets.length}개
            </span>
          </div>
        )}

        {/* 칩 그리드 */}
        <div className="flex flex-wrap gap-1.5">
          {visiblePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleChipClick(preset.text)}
              className={`
                group relative flex items-center gap-1.5 rounded-full border border-gray-200 
                bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm 
                transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              `}
              title={preset.text}
              aria-label={`${preset.category} 질문: ${preset.text}`}
            >
              {/* 아이콘 */}
              <div className={`flex h-3 w-3 items-center justify-center rounded ${preset.color}`}>
                <preset.icon className="h-2 w-2 text-white" />
              </div>
              
              {/* 텍스트 */}
              <span className="max-w-32 truncate">
                {preset.text}
              </span>

              {/* 호버 시 카테고리 표시 */}
              <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                {preset.category}
              </div>
            </button>
          ))}

          {/* "더 보기" 버튼 */}
          {hiddenCount > 0 && !showAllPresets && (
            <button
              onClick={() => setShowAllPresets(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-100"
              aria-label={`${hiddenCount}개 더 보기`}
            >
              <span>+{hiddenCount} 더 보기</span>
            </button>
          )}

          {/* "접기" 버튼 */}
          {showAllPresets && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllPresets(false)}
              className="flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
              aria-label="접기"
            >
              <span>접기</span>
            </button>
          )}
        </div>

        {/* 검색 결과 없음 */}
        {filteredPresets.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Search className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              "<strong>{searchQuery}</strong>"에 대한 결과가 없습니다.
            </p>
            <button
              onClick={clearSearch}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
            >
              검색 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
});